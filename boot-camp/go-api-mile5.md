<ProgressBar />

# API Documentation and Versioning <Label text="M5" type="milestone" />

::: tip
This milestone adds OpenAPI documentation and versioning so the API is easier to consume and can evolve without breaking existing clients.
:::

## Introduction

We extend the API from [Milestone 4](/boot-camp/go-api-mile4) by:

- **API documentation** — OpenAPI (Swagger) spec and UI so developers can discover and try endpoints.
- **API versioning** — supporting multiple versions (e.g. `/v1/`, `/v2/`) so changes don't break old clients.

---

## Why Document Your API?

| Benefit | Description |
|---------|-------------|
| **Clear usage** | Developers see methods, paths, request/response shapes, and status codes. |
| **Consistency** | Documentation doubles as a contract; code and docs stay in sync when generated or maintained together. |
| **Testing** | OpenAPI enables generated clients and automated contract tests. |

---

## OpenAPI and Swagger

- **OpenAPI** is a standard for describing REST APIs (paths, methods, parameters, bodies, responses).
- **Swagger** is a set of tools built on OpenAPI: **Swagger UI** renders docs in the browser; **Swagger Codegen** can generate clients and servers.

::: info
You can write the spec by hand (YAML/JSON) or generate it from Go code using annotations and a library. Both are valid; hand-written specs give you full control; code-first can stay in sync with implementation.
:::

### Option A: Hand-written OpenAPI spec

Create `openapi.yaml` in the project root:

```yaml
openapi: 3.0.3
info:
  title: Product API
  description: Product catalog API
  version: 1.0.0
paths:
  /api/products:
    get:
      summary: List products
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Product'
    post:
      summary: Create product
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductInput'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/Product'
        '400':
          description: Bad request
  /api/products/{id}:
    get:
      summary: Get product by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/Product'
        '404':
          description: Not found
components:
  schemas:
    Product:
      type: object
      properties:
        id: { type: integer }
        name: { type: string }
        description: { type: string }
        price: { type: number }
    ProductInput:
      type: object
      required: [name, price]
      properties:
        name: { type: string }
        description: { type: string }
        price: { type: number }
```

Serve this file and Swagger UI from your app, or host them in a separate docs site.

### Option B: Serve Swagger UI in Go

Use a library that serves Swagger UI and your spec. For example, with **swaggo/gin-swagger** or **goswagger**, you can:

1. Add a route like `/docs` or `/swagger/` that serves the UI.
2. Point the UI at `/openapi.yaml` or an in-memory spec.

Example wiring (conceptually):

```go
// Serve OpenAPI spec and UI
r.Handle("/openapi.yaml", http.FileServer(http.Dir(".")))
// Or use a library that embeds Swagger UI and serves it at /docs
```

::: tip
Pick one approach and stick to it: either maintain `openapi.yaml` by hand and serve it, or use a code-first generator and regenerate the spec on each change.
:::

---

## API Versioning

Versioning lets you change the API over time without breaking existing clients.

### Common strategies

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| **URI** | `/api/v1/products` | Simple, visible in URL | URL changes per version |
| **Header** | `Accept: application/vnd.api+json;version=1` | Same URL for all versions | Clients must send header |
| **Query** | `/api/products?version=1` | Easy to add | Pollutes query string, less standard |

### URI versioning (recommended for learning)

Use a path prefix for the version:

```go
r.PathPrefix("/api/v1").Handler(v1Router)
// v1Router defines /products, /products/{id}, etc.
```

So:

- `GET /api/v1/products` — list products (v1)
- `GET /api/v2/products` — list products (v2) when you add v2 later

Keep v1 stable; new behavior goes in v2. Deprecate v1 only when you're ready to retire it.

### Header versioning (optional)

Read a custom header, e.g. `API-Version: 1`, and dispatch to the right handler or adapter. Same route, different behavior by version. Useful when you want to avoid changing URLs.

::: tip
Document your versioning policy: how long old versions are supported, how you announce deprecation, and how clients can migrate.
:::

---

## Summary

In this milestone we:

- **Introduced OpenAPI** and showed a minimal hand-written `openapi.yaml` for the product API.
- **Described two ways to expose docs** — serving the spec + Swagger UI from the app, or maintaining the spec in the repo and hosting docs elsewhere.
- **Compared versioning strategies** (URI, header, query) and recommended **URI versioning** (`/api/v1/...`) for clarity and tooling.
- **Wired a v1 path prefix** so all product routes live under `/api/v1` and v2 can be added later.

::: tip Next step
In [Milestone 6 — Filtering, pagination, and sorting](/boot-camp/go-api-mile6) we add query parameters and paginated list responses.
:::

[View API Spec](/boot-camp/go-api-spec-v1)

<TextToSpeech />
