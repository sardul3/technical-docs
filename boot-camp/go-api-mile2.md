<ProgressBar />

# Database and Structure <Label text="M2" type="milestone" />

::: tip
This milestone adds a real database, configuration, and a repository layer so the API persists data and is easier to run in different environments.
:::

## Introduction

We extend the product API from [Milestone 1](/boot-camp/go-api-mile1) by:

- **Choosing and wiring a database** (PostgreSQL via pgx)
- **Loading configuration** from environment variables
- **Introducing a repository layer** so handlers talk to a store interface, not raw SQL

We keep the same HTTP surface; only the storage and wiring change.

---

## Choosing a Database

| Factor | What to think about |
|--------|----------------------|
| **Data shape** | Relational vs. document/key-value |
| **Scale** | How much data and how many reads/writes |
| **Queries** | Joins, aggregations, full-text search |
| **Consistency** | Strong consistency vs. eventual consistency |

### Relational (e.g. PostgreSQL)

Good when you have:

- Structured, related data (products, orders, customers)
- Need for joins, transactions, and constraints
- Strong consistency and ACID

### Our choice: PostgreSQL

We use **PostgreSQL** with the **pgx** driver because:

- It fits a product catalog with relations (products, categories, etc.)
- SQL is familiar and testable
- pgx is fast and idiomatic in Go
- You can run Postgres locally via Docker or a cloud service

::: info
If you prefer SQLite for learning, you can swap the driver and connection string; the repository pattern below still applies.
:::

---

## Project Layout After This Milestone

```
product-api-go/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go         # load env / config
│   ├── product/
│   │   ├── model.go
│   │   ├── repository.go     # interface + PostgreSQL impl
│   │   ├── handler.go
│   │   └── service.go        # optional; orchestration
│   └── db/
│       └── pool.go           # pgx connection pool
├── migrations/               # optional; schema versioning
├── go.mod
└── go.sum
```

---

## Configuration

### 1. Config struct and loader

Create `internal/config/config.go`:

```go
package config

import "os"

type Config struct {
	HTTPPort string
	DBURL    string
}

func Load() (Config, error) {
	port := os.Getenv("HTTP_PORT")
	if port == "" {
		port = "8080"
	}
	dbURL := os.Getenv("DB_DSN")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/productdb?sslmode=disable"
	}
	return Config{
		HTTPPort: port,
		DBURL:    dbURL,
	}, nil
}
```

::: tip
Use environment variables (or a config file) so you can change ports and database per environment without recompiling.
:::

### 2. Database connection pool

Add pgx:

```bash
go get github.com/jackc/pgx/v5
go get github.com/jackc/pgx/v5/pgxpool
```

Create `internal/db/pool.go`:

```go
package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool(ctx context.Context, connString string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, err
	}
	cfg.MaxConns = 25
	return pgxpool.NewWithConfig(ctx, cfg)
}
```

The pool is created **once** at startup and reused by all handlers. Handlers never create new connections per request.

---

## Repository Pattern

Instead of handlers calling SQL or a concrete store directly, we introduce a **repository interface**. The handler depends on the interface; in `main` we pass a PostgreSQL implementation.

### 1. Repository interface

In `internal/product/repository.go`:

```go
package product

import "context"

type Repository interface {
	List(ctx context.Context) ([]Product, error)
	Get(ctx context.Context, id int) (Product, bool, error)
	Create(ctx context.Context, p Product) (Product, error)
	Update(ctx context.Context, id int, p Product) (Product, bool, error)
	Delete(ctx context.Context, id int) (bool, error)
}
```

### 2. PostgreSQL implementation

Same file or `repository_pg.go`:

```go
package product

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PgRepository struct {
	pool *pgxpool.Pool
}

func NewPgRepository(pool *pgxpool.Pool) *PgRepository {
	return &PgRepository{pool: pool}
}

func (r *PgRepository) List(ctx context.Context) ([]Product, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, name, description, price FROM products ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Price); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r *PgRepository) Get(ctx context.Context, id int) (Product, bool, error) {
	var p Product
	err := r.pool.QueryRow(ctx,
		`SELECT id, name, description, price FROM products WHERE id = $1`, id).
		Scan(&p.ID, &p.Name, &p.Description, &p.Price)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Product{}, false, nil
		}
		return Product{}, false, err
	}
	return p, true, nil
}

func (r *PgRepository) Create(ctx context.Context, p Product) (Product, error) {
	var id int
	err := r.pool.QueryRow(ctx,
		`INSERT INTO products (name, description, price) VALUES ($1,$2,$3) RETURNING id`,
		p.Name, p.Description, p.Price).Scan(&id)
	if err != nil {
		return Product{}, err
	}
	p.ID = id
	return p, nil
}

func (r *PgRepository) Update(ctx context.Context, id int, p Product) (Product, bool, error) {
	cmd, err := r.pool.Exec(ctx,
		`UPDATE products SET name=$1, description=$2, price=$3 WHERE id=$4`,
		p.Name, p.Description, p.Price, id)
	if err != nil {
		return Product{}, false, err
	}
	if cmd.RowsAffected() == 0 {
		return Product{}, false, nil
	}
	p.ID = id
	return p, true, nil
}

func (r *PgRepository) Delete(ctx context.Context, id int) (bool, error) {
	cmd, err := r.pool.Exec(ctx, `DELETE FROM products WHERE id = $1`, id)
	if err != nil {
		return false, err
	}
	return cmd.RowsAffected() > 0, nil
}
```

### 3. Schema

Create the table (e.g. via a migration or one-off SQL):

```sql
CREATE TABLE IF NOT EXISTS products (
	id    SERIAL PRIMARY KEY,
	name  TEXT NOT NULL,
	description TEXT,
	price DECIMAL(10,2) NOT NULL
);
```

::: info
In production you'd use migrations (e.g. golang-migrate, goose) to version schema changes. For this milestone, running the `CREATE TABLE` once is enough.
:::

---

## Wiring in main

Update `cmd/server/main.go` so it:

1. Loads config
2. Creates the DB pool
3. Creates the product repository and handler
4. Starts the HTTP server

```go
package main

import (
	"context"
	"log"
	"net/http"

	"product-api-go/internal/config"
	"product-api-go/internal/db"
	"product-api-go/internal/product"

	"github.com/gorilla/mux"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("config:", err)
	}

	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DBURL)
	if err != nil {
		log.Fatal("db:", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatal("db ping:", err)
	}
	log.Println("Database connected")

	repo := product.NewPgRepository(pool)
	h := product.NewHandler(repo)

	r := mux.NewRouter()
	r.HandleFunc("/api/products", h.List).Methods("GET")
	r.HandleFunc("/api/products", h.Create).Methods("POST")
	r.HandleFunc("/api/products/{id}", h.Get).Methods("GET")
	r.HandleFunc("/api/products/{id}", h.Update).Methods("PUT")
	r.HandleFunc("/api/products/{id}", h.Delete).Methods("DELETE")

	log.Println("Listening on :" + cfg.HTTPPort)
	log.Fatal(http.ListenAndServe(":"+cfg.HTTPPort, r))
}
```

Your handler type must accept the **repository interface**, not the in-memory store. For example:

```go
type Handler struct {
	Repo product.Repository
}
```

Then in each handler, call `h.Repo.List(ctx)` (or Get/Create/Update/Delete) and handle errors. Use `r.Context()` as the `context.Context` for every call.

::: tip
Passing `r.Context()` ensures requests are cancelled when the client disconnects, and you can add timeouts or tracing to that context later.
:::

---

## Input Validation (Optional This Milestone)

You can add simple validation before calling the repository:

- Non-empty `Name`
- `Price > 0`
- Reasonable length for `Description`

Return `400 Bad Request` and a clear message when validation fails. In [Milestone 3](/boot-camp/go-api-mile3) we'll centralize error handling and response shapes.

---

## Testing the API

1. Start PostgreSQL (e.g. `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`).
2. Create the database: `createdb productdb` (or equivalent).
3. Run the `CREATE TABLE` SQL.
4. Set env if needed: `export DB_DSN="postgres://postgres:postgres@localhost:5432/productdb?sslmode=disable"`.
5. Run: `go run ./cmd/server`.
6. Use the same curl commands as in Milestone 1; data will persist across restarts.

::: warning
Never commit real credentials. Use environment variables or a secret manager; keep defaults only for local development.
:::

---

## Summary

In this milestone we:

- **Loaded configuration** from the environment (e.g. `HTTP_PORT`, `DB_DSN`).
- **Introduced a DB connection pool** (pgx) created once at startup.
- **Defined a product Repository interface** and a **PostgreSQL implementation**.
- **Wired repo and handler in main** and used `r.Context()` in handlers.
- **Persisted data** in PostgreSQL so it survives restarts.

::: tip Next step
In [Milestone 3 — Errors and middleware](/boot-camp/go-api-mile3) we add structured error handling, logging, and middleware.
:::

<TextToSpeech />
