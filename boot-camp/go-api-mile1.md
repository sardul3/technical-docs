<ProgressBar />

# Your First Go API <Label text="M1" type="milestone" />

::: tip
This guide teaches the basics of API development in Go. We build a simple REST service that manages a product catalog in memory.
:::

## Introduction

In this milestone we build a **REST API** in Go that lets clients create, read, update, and delete **products**. We use only the standard library and in-memory storage so you can focus on:

- How HTTP handlers work in Go
- Using the right HTTP methods and status codes
- Structuring a small Go project

We add a database and better structure in later milestones.

::: info
We build on this API in each new milestone until we have a solid, production-style service you can extend further.
:::

---

## How APIs Work (Quick Recap)

| Step | What happens |
|------|----------------|
| 1 | The client sends an HTTP request to an API path (e.g. `GET /api/products`). |
| 2 | The server matches the path and method, runs your handler, and may talk to a "service" or database. |
| 3 | The server sends back an HTTP response (status code + optional body, e.g. JSON). |
| 4 | The client reads the response and uses the data. |

---

## HTTP Methods and Status Codes

Using the right methods and status codes makes your API predictable and easier to use.

### HTTP Methods

| Method | Purpose | Example | Good practice |
|--------|---------|---------|---------------|
| GET | Read a resource | `GET /api/products/1` | Idempotent, no body |
| POST | Create a resource | `POST /api/products` | Return the created resource or its ID |
| PUT | Replace a resource | `PUT /api/products/1` | Idempotent |
| PATCH | Partial update | `PATCH /api/products/1` | Use when only some fields change |
| DELETE | Remove a resource | `DELETE /api/products/1` | Idempotent |

::: tip Idempotent
Repeating the same request has the same effect as doing it once. GET, PUT, and DELETE should be idempotent.
:::

### HTTP Status Codes

| Code | Name | When to use |
|------|------|--------------|
| 200 | OK | Successful GET, PUT, PATCH, or DELETE that returns a body |
| 201 | Created | Successful POST that creates a resource |
| 204 | No Content | Successful DELETE (or other op) with nothing to return |
| 400 | Bad Request | Invalid body or query (e.g. validation failed) |
| 404 | Not Found | Requested resource does not exist |
| 500 | Internal Server Error | Unhandled server error; avoid exposing internals |

::: tip
Use 2xx for success, 4xx for client mistakes, 5xx for server-side failures. Be consistent across your API.
:::

---

## Project Setup

### 1. Create the project directory

```bash
mkdir -p product-api-go
cd product-api-go
go mod init product-api-go
```

### 2. Project layout

Use a simple layout so handlers, models, and "services" are easy to find:

```
product-api-go/
├── cmd/
│   └── server/
│       └── main.go      # entrypoint
├── internal/
│   └── product/
│       ├── model.go     # Product struct
│       ├── store.go     # in-memory "database"
│       └── handler.go   # HTTP handlers
├── go.mod
└── go.sum
```

::: info
`internal/` is a special Go directory: code here is only importable by this module, not by other projects.
:::

---

## Implementing CRUD for Products

We add four pieces: **model**, **in-memory store**, **handlers**, and **main**.

### 1. Product model

Create `internal/product/model.go`:

```go
package product

// Product is the in-memory representation of a product.
type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
}
```

The `json` tags tell the encoder/decoder how to map struct fields to JSON keys.

### 2. In-memory store

Create `internal/product/store.go`:

```go
package product

import "sync"

// Store holds products in memory. Safe for concurrent use.
type Store struct {
	mu       sync.RWMutex
	products []Product
	nextID   int
}

func NewStore() *Store {
	return &Store{products: []Product{}, nextID: 1}
}

func (s *Store) List() []Product {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]Product, len(s.products))
	copy(out, s.products)
	return out
}

func (s *Store) Get(id int) (Product, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, p := range s.products {
		if p.ID == id {
			return p, true
		}
	}
	return Product{}, false
}

func (s *Store) Create(p Product) Product {
	s.mu.Lock()
	defer s.mu.Unlock()
	p.ID = s.nextID
	s.nextID++
	s.products = append(s.products, p)
	return p
}

func (s *Store) Update(id int, p Product) (Product, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.products {
		if s.products[i].ID == id {
			p.ID = id
			s.products[i] = p
			return p, true
		}
	}
	return Product{}, false
}

func (s *Store) Delete(id int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, p := range s.products {
		if p.ID == id {
			s.products = append(s.products[:i], s.products[i+1:]...)
			return true
		}
	}
	return false
}
```

::: tip
We use a mutex so multiple HTTP requests can call the store at the same time without corrupting the slice.
:::

### 3. HTTP handlers

Create `internal/product/handler.go`:

```go
package product

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// Handler holds dependencies and implements HTTP handlers.
type Handler struct {
	Store *Store
}

func NewHandler(store *Store) *Handler {
	return &Handler{Store: store}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	products := h.Store.List()
	respondJSON(w, http.StatusOK, products)
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	p, ok := h.Store.Get(id)
	if !ok {
		http.Error(w, "product not found", http.StatusNotFound)
		return
	}
	respondJSON(w, http.StatusOK, p)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var p Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	created := h.Store.Create(p)
	respondJSON(w, http.StatusCreated, created)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	var p Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	updated, ok := h.Store.Update(id, p)
	if !ok {
		http.Error(w, "product not found", http.StatusNotFound)
		return
	}
	respondJSON(w, http.StatusOK, updated)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	if !h.Store.Delete(id) {
		http.Error(w, "product not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
```

We use **gorilla/mux** for path parameters (`/api/products/{id}`). Run:

```bash
go get github.com/gorilla/mux
```

::: info
Handlers are thin: they parse the request, call the store, and send a response. Business rules can move into a "service" layer in Milestone 2.
:::

### 4. Main and router

Create `cmd/server/main.go`:

```go
package main

import (
	"log"
	"net/http"

	"product-api-go/internal/product"

	"github.com/gorilla/mux"
)

func main() {
	store := product.NewStore()
	h := product.NewHandler(store)

	r := mux.NewRouter()
	r.HandleFunc("/api/products", h.List).Methods("GET")
	r.HandleFunc("/api/products", h.Create).Methods("POST")
	r.HandleFunc("/api/products/{id}", h.Get).Methods("GET")
	r.HandleFunc("/api/products/{id}", h.Update).Methods("PUT")
	r.HandleFunc("/api/products/{id}", h.Delete).Methods("DELETE")

	log.Println("Listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
```

Update the import path in the snippet above to match your `go.mod` module (e.g. `product-api-go` or `github.com/you/product-api-go`).

---

## Testing the API

1. Start the server:

```bash
go run ./cmd/server
```

2. Use curl (or Postman) to exercise the endpoints:

**Create a product**

```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget","description":"A useful widget","price":19.99}'
```

**List products**

```bash
curl http://localhost:8080/api/products
```

**Get one product** (use the `id` from the create response)

```bash
curl http://localhost:8080/api/products/1
```

**Update**

```bash
curl -X PUT http://localhost:8080/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Widget","description":"Improved","price":24.99}'
```

**Delete**

```bash
curl -X DELETE http://localhost:8080/api/products/1
```

::: warning
With this in-memory setup, all data is lost when the process stops. In [Milestone 2](/boot-camp/go-api-mile2) we add a real database.
:::

---

## Summary

In this milestone we:

- Chose the right **HTTP methods** (GET, POST, PUT, DELETE) and **status codes** (200, 201, 204, 400, 404).
- Set up a small **Go project** with `cmd/server` and `internal/product`.
- Defined a **Product** model and an **in-memory store** safe for concurrent use.
- Wrote **HTTP handlers** that decode JSON, call the store, and return JSON.
- Wired routes with **gorilla/mux** and tested the API with **curl**.

::: tip Next step
In [Milestone 2 — Database and structure](/boot-camp/go-api-mile2) we add PostgreSQL, configuration, and a repository layer.
:::

<TextToSpeech />
