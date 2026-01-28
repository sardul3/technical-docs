<ProgressBar />

# Error Handling and Middleware <Label text="M3" type="milestone" />

::: tip
This milestone adds structured error handling, consistent error responses, and middleware for logging and recovery.
:::

## Introduction

We improve the API from [Milestone 2](/boot-camp/go-api-mile2) by:

- **Defining custom error types** for "not found", "validation", "conflict", etc.
- **Mapping those errors to HTTP status codes and JSON bodies** in one place.
- **Adding middleware** for panic recovery, request logging, and (optionally) correlation IDs.

Clients get predictable error shapes; we keep handler code focused on the happy path.

---

## Why Structured Error Handling?

| Benefit | What it gives you |
|---------|-------------------|
| **Clear contract** | Clients always see the same error format (e.g. `code`, `message`, `details`). |
| **Correct status codes** | 404 for "not found", 400 for "bad input", 409 for "conflict", etc. |
| **Easier debugging** | Logs include error type and context; responses avoid leaking internals. |
| **Separation of concerns** | Handlers return or wrap errors; a central layer turns them into HTTP. |

---

## Custom Errors

### 1. Error types and codes

Create `internal/errors/errors.go` (or `internal/apierr/apierr.go`):

```go
package errors

import "net/http"

type Code string

const (
	CodeNotFound   Code = "NOT_FOUND"
	CodeInvalid    Code = "INVALID_INPUT"
	CodeConflict   Code = "CONFLICT"
	CodeInternal   Code = "INTERNAL_ERROR"
)

type APIError struct {
	Code    Code   `json:"code"`
	Message string `json:"message"`
	Status  int    `json:"-"` // not serialized
}

func (e *APIError) Error() string {
	return e.Message
}

func NotFound(msg string) *APIError {
	return &APIError{Code: CodeNotFound, Message: msg, Status: http.StatusNotFound}
}

func InvalidInput(msg string) *APIError {
	return &APIError{Code: CodeInvalid, Message: msg, Status: http.StatusBadRequest}
}

func Conflict(msg string) *APIError {
	return &APIError{Code: CodeConflict, Message: msg, Status: http.StatusConflict}
}

func Internal(msg string) *APIError {
	return &APIError{Code: CodeInternal, Message: msg, Status: http.StatusInternalServerError}
}
```

::: info
Handlers (or the service layer) return or wrap these errors. A middleware or helper then converts them to HTTP responses.
:::

### 2. Standard error response shape

Use a small struct so every error looks the same:

```go
type ErrorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
```

---

## Global Error Handling in Handlers

Two common styles:

1. **Helper that writes JSON and status**  
   Handlers call something like `errors.RespondAPIErr(w, err)` and return.
2. **Middleware that recovers from panic**  
   Panics are caught, logged, and turned into 500 + generic message.

### Responding to API errors

In a shared package (e.g. `internal/errors` or `internal/httputil`):

```go
func RespondAPIErr(w http.ResponseWriter, err error) {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(apiErr.Status)
		_ = json.NewEncoder(w).Encode(ErrorBody{
			Code:    string(apiErr.Code),
			Message: apiErr.Message,
		})
		return
	}
	// Unknown error — log it, return 500 and generic message
	log.Printf("unhandled error: %v", err)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	_ = json.NewEncoder(w).Encode(ErrorBody{
		Code:    string(CodeInternal),
		Message: "An unexpected error occurred",
	})
}
```

Handlers then do:

```go
p, ok, err := h.Repo.Get(r.Context(), id)
if err != nil {
	errors.RespondAPIErr(w, err)
	return
}
if !ok {
	errors.RespondAPIErr(w, errors.NotFound("product not found"))
	return
}
respondJSON(w, http.StatusOK, p)
```

::: tip
Use `errors.As` to detect your `*APIError` type and send the right status and body; everything else becomes a logged 500 with a safe message.
:::

---

## Using Custom Errors in the Repository/Service

The repository can return `nil` for "not found" and an error only for real failures. The handler (or a thin service layer) turns "not found" into `errors.NotFound(...)`.

Example in a handler:

```go
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(mux.Vars(r)["id"])
	if err != nil {
		errors.RespondAPIErr(w, errors.InvalidInput("invalid id"))
		return
	}
	p, ok, err := h.Repo.Get(r.Context(), id)
	if err != nil {
		errors.RespondAPIErr(w, err)
		return
	}
	if !ok {
		errors.RespondAPIErr(w, errors.NotFound("product not found"))
		return
	}
	respondJSON(w, http.StatusOK, p)
}
```

Validation (e.g. "name required", "price > 0") can return `errors.InvalidInput("name is required")` so clients get a consistent 400 body.

---

## Middleware

Middleware is a function that wraps an `http.Handler`, runs code before and/or after the inner handler, and can short‑circuit the request (e.g. return 401 or 500).

Signature:

```go
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// before
		next.ServeHTTP(w, r)
		// after
	})
}
```

### 1. Recovery middleware

Catches panics, logs them, and returns 500:

```go
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("panic: %v", rec)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				_ = json.NewEncoder(w).Encode(ErrorBody{
					Code:    "INTERNAL_ERROR",
					Message: "An unexpected error occurred",
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}
```

### 2. Logging middleware

Logs method, path, and maybe duration (using a small wrapper that records status code and length is better; here we keep it minimal):

```go
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}
```

### 3. Correlation ID (optional)

Generate a request ID and put it in the context and/or response header so logs and support can trace a request:

```go
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if id == "" {
			id = uuid.New().String()
		}
		w.Header().Set("X-Request-ID", id)
		ctx := context.WithValue(r.Context(), contextKeyRequestID, id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
```

::: tip
Use a type-safe context key (e.g. `type contextKey string` and `const contextKeyRequestID contextKey = "requestID"`) so you don't collide with other packages.
:::

---

## Chaining Middleware

Apply recovery first (outermost), then logging, then request ID, then the router:

```go
handler := Recovery(Logging(RequestID(r)))
log.Fatal(http.ListenAndServe(":"+cfg.HTTPPort, handler))
```

Order matters: the first middleware you add runs first on the way in and last on the way out.

---

## Summary

In this milestone we:

- **Defined custom API errors** with codes and HTTP status, and a shared **error response body**.
- **Implemented RespondAPIErr** so handlers can send consistent JSON errors and hide internal details for unknown errors.
- **Used custom errors in handlers** for not-found and validation (invalid id, invalid input).
- **Added middleware** for **panic recovery**, **request logging**, and optionally **correlation/request ID**.
- **Chained middleware** (recovery → logging → request ID → router) before passing the handler to the server.

::: tip Next step
In [Milestone 4 — Content negotiation and responses](/boot-camp/go-api-mile4) we add support for different response formats and tidy response envelopes.
:::

<TextToSpeech />
