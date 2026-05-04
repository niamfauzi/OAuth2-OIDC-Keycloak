package main

import (
	"bufio"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	_ "github.com/jackc/pgx/v5/stdlib"
)

type transaction struct {
	ID         int64  `json:"id"`
	ProductID  int64  `json:"product_id"`
	Qty        int    `json:"qty"`
	TotalPrice int    `json:"total_price"`
	CreatedBy  string `json:"created_by"`
}

type transactionRequest struct {
	ProductID  int64 `json:"product_id"`
	Qty        int   `json:"qty"`
	TotalPrice int   `json:"total_price"`
}

type jwtPayload struct {
	Sub string `json:"sub"`
}

func main() {
	loadEnvFile()

	port := envOrDefault("TRANSACTION_API_PORT", "7013")
	webPort := envOrDefault("WEB_PORT", "7011")
	webOrigin := "http://localhost:" + webPort

	db, err := sql.Open("pgx", buildDatabaseURL())
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", withCORS(webOrigin, healthHandler))
	mux.HandleFunc("/transactions", withCORS(webOrigin, transactionsHandler(db)))

	log.Printf("transaction-api running at http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.NotFound(w, r)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"service": "transaction-api",
	})
}

func transactionsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := extractUserID(r.Header.Get("Authorization"))
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"message": "unauthorized",
			})
			return
		}

		switch r.Method {
		case http.MethodGet:
			items, err := listTransactions(db)
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, map[string]string{
					"message": "internal server error",
				})
				return
			}

			writeJSON(w, http.StatusOK, map[string]any{
				"items": items,
			})
		case http.MethodPost:
			var request transactionRequest
			if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
				writeJSON(w, http.StatusBadRequest, map[string]string{
					"message": "bad request",
				})
				return
			}

			if request.ProductID <= 0 || request.Qty <= 0 || request.TotalPrice <= 0 {
				writeJSON(w, http.StatusBadRequest, map[string]string{
					"message": "bad request",
				})
				return
			}

			item, err := insertTransaction(db, request, userID)
			if err != nil {
				var pgError *pgconn.PgError
				if errors.As(err, &pgError) && pgError.Code == "23503" {
					writeJSON(w, http.StatusBadRequest, map[string]string{
						"message": "bad request",
					})
					return
				}

				writeJSON(w, http.StatusInternalServerError, map[string]string{
					"message": "internal server error",
				})
				return
			}

			writeJSON(w, http.StatusCreated, map[string]any{
				"message": "ok",
				"data":    item,
			})
		default:
			http.NotFound(w, r)
		}
	}
}

func listTransactions(db *sql.DB) ([]transaction, error) {
	rows, err := db.Query(`
		SELECT id, product_id, qty, total_price, created_by
		FROM transactions
		ORDER BY id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]transaction, 0)
	for rows.Next() {
		item, err := scanTransaction(rows)
		if err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func insertTransaction(db *sql.DB, request transactionRequest, userID string) (transaction, error) {
	row := db.QueryRow(`
		INSERT INTO transactions (product_id, qty, total_price, created_by)
		VALUES ($1, $2, $3, $4)
		RETURNING id, product_id, qty, total_price, created_by
	`, request.ProductID, request.Qty, request.TotalPrice, userID)

	return scanTransaction(row)
}

type transactionScanner interface {
	Scan(dest ...any) error
}

func scanTransaction(scanner transactionScanner) (transaction, error) {
	var item transaction

	err := scanner.Scan(
		&item.ID,
		&item.ProductID,
		&item.Qty,
		&item.TotalPrice,
		&item.CreatedBy,
	)
	if err != nil {
		return transaction{}, err
	}

	return item, nil
}

func withCORS(origin string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r)
	}
}

func extractUserID(authorization string) (string, error) {
	if !strings.HasPrefix(authorization, "Bearer ") {
		return "", errors.New("missing bearer token")
	}

	token := strings.TrimSpace(strings.TrimPrefix(authorization, "Bearer "))
	payload, err := decodeJWT(token)
	if err != nil {
		return "", err
	}

	if payload.Sub == "" {
		return "", errors.New("sub claim is empty")
	}

	return payload.Sub, nil
}

func decodeJWT(token string) (*jwtPayload, error) {
	parts := strings.Split(token, ".")
	if len(parts) < 2 {
		return nil, errors.New("invalid token format")
	}

	decodedPayload, err := decodeBase64URL(parts[1])
	if err != nil {
		return nil, err
	}

	var payload jwtPayload
	if err := json.Unmarshal(decodedPayload, &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

func decodeBase64URL(value string) ([]byte, error) {
	normalized := strings.ReplaceAll(value, "-", "+")
	normalized = strings.ReplaceAll(normalized, "_", "/")

	for len(normalized)%4 != 0 {
		normalized += "="
	}

	return base64.StdEncoding.DecodeString(normalized)
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func buildDatabaseURL() string {
	host := envOrDefault("POSTGRES_HOST", "localhost")
	port := envOrDefault("POSTGRES_PORT", "5432")
	database := envOrDefault("POSTGRES_DB", "app_db")
	username := envOrDefault("POSTGRES_USER", "app_user")
	password := envOrDefault("POSTGRES_PASSWORD", "app_password")
	sslMode := envOrDefault("POSTGRES_SSLMODE", "disable")

	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		url.QueryEscape(username),
		url.QueryEscape(password),
		host,
		port,
		url.PathEscape(database),
		url.QueryEscape(sslMode),
	)
}

func envOrDefault(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	return value
}

func loadEnvFile() {
	workingDirectory, err := os.Getwd()
	if err != nil {
		return
	}

	envPath := filepath.Join(workingDirectory, "../../.env")
	file, err := os.Open(envPath)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, found := strings.Cut(line, "=")
		if !found {
			continue
		}

		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)

		if key == "" {
			continue
		}

		if _, exists := os.LookupEnv(key); exists {
			continue
		}

		os.Setenv(key, value)
	}
}

func init() {
	log.SetFlags(0)
	log.SetPrefix("")
}
