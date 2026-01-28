<ProgressBar />

# Filtering, Pagination, and Sorting <Label text="M6" type="milestone" />

::: tip
This milestone adds query parameters for filtering and sorting, and pagination so the API can handle large datasets safely and predictably.
:::

## Introduction

We extend the product API from [Milestone 5](/boot-camp/go-api-mile5) by:

- **Filtering** — narrow results by fields (e.g. name, price range).
- **Pagination** — return results in pages (e.g. `page` and `size` or `limit`/`offset`).
- **Sorting** — order results by one or more fields (e.g. `sort=price`, `sort=name,asc`).

These features are essential for production APIs that serve large catalogs or lists.

---

## Why Filtering, Pagination, and Sorting?

| Feature | Purpose | Example |
|---------|---------|---------|
| **Filtering** | Return only rows that match criteria | Products with price between 10 and 50 |
| **Pagination** | Split large result sets into pages | 20 products per page, page 2 |
| **Sorting** | Control the order of results | By price ascending, then by name |

Without them, a single "list all" endpoint can return too much data, use too much memory, and be slow. Filtering, pagination, and sorting keep responses bounded and predictable.

---

## Filtering

### Common filter operations

| Operator | Meaning | Example |
|----------|---------|---------|
| **eq** | Exact match | `?name=Widget` |
| **gt / gte** | Greater than (or equal) | `?minPrice=10` |
| **lt / lte** | Less than (or equal) | `?maxPrice=100` |
| **like** | Substring match (case-insensitive) | `?name=widget` |

### Query parameters for products

Keep the API simple and explicit. For example:

- `?name=...` — name contains (case-insensitive)
- `?minPrice=...` — price >= value
- `?maxPrice=...` — price <= value

### Implementing filters in the repository

Extend the repository interface and implementation to accept filter parameters:

```go
type ListParams struct {
	Name     string  // substring match
	MinPrice float64 // 0 = ignored
	MaxPrice float64 // 0 = ignored
	Limit    int     // pagination
	Offset   int     // pagination
	SortBy   string  // "price", "name", etc.
	SortAsc  bool
}

func (r *PgRepository) List(ctx context.Context, params ListParams) ([]Product, int, error) {
	// Build WHERE clause and args from params
	// Add ORDER BY from params.SortBy, params.SortAsc
	// Add LIMIT/OFFSET
	// Run COUNT(*) for total; run SELECT for slice
	// Return (products, total, err)
}
```

::: tip
Validate filter values in the handler or a small "query builder" layer: whitelist allowed fields and operators, and return 400 for invalid combinations.
:::

### Handler example

```go
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	var params product.ListParams
	if v := r.URL.Query().Get("name"); v != "" {
		params.Name = v
	}
	if v := r.URL.Query().Get("minPrice"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			params.MinPrice = f
		}
	}
	if v := r.URL.Query().Get("maxPrice"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			params.MaxPrice = f
		}
	}
	params.Limit = parseLimit(r, 20)
	params.Offset = parseOffset(r)
	params.SortBy, params.SortAsc = parseSort(r, "id", true)

	products, total, err := h.Repo.List(r.Context(), params)
	if err != nil {
		errors.RespondAPIErr(w, err)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data":  products,
		"total": total,
		"page":  params.Offset/params.Limit + 1,
		"size":  params.Limit,
	})
}
```

::: info
`parseLimit`, `parseOffset`, and `parseSort` should enforce max page size (e.g. 100) and whitelist sort fields to avoid abuse and SQL injection.
:::

---

## Pagination

### Strategies

| Strategy | Parameters | Pros | Cons |
|----------|------------|------|------|
| **Offset / limit** | `?offset=0&limit=20` | Simple, arbitrary page jumps | Slower on large offsets |
| **Page / size** | `?page=1&size=20` | Intuitive for UIs | Same as offset under the hood |
| **Cursor** | `?cursor=abc123&limit=20` | Stable under inserts/deletes | Harder to "jump to page N" |

For a product catalog, **page/size** or **limit/offset** is usually enough. Use cursor-based pagination when you have very high write rates or need stable "next page" across changes.

### Implementing limit/offset

- Read `limit` and `offset` (or `page` and `size`) from query params.
- Enforce a **maximum page size** (e.g. 100) to protect the server.
- In the repository, run `SELECT ... LIMIT $1 OFFSET $2` and a separate `COUNT(*)` (or window function) for total count.

Include in the response:

- `data` — slice of products
- `total` — total number of rows matching the filter
- `page` (or `offset`) and `size` (or `limit`) so the client can build "next/previous" links

::: tip
Return `Link` headers or a `links` object with `first`, `prev`, `self`, `next`, `last` URLs so clients can navigate without recalculating.
:::

---

## Sorting

### Query parameter shape

Common pattern: `?sort=field1,asc&sort=field2,desc` or a single `?sort=price,-name` (minus = desc).

Keep it simple for this API:

- `?sort=price` — sort by price ascending
- `?sort=price,desc` — sort by price descending
- Whitelist allowed fields: `id`, `name`, `price`, `created_at`, etc.

### Implementing sort in the repository

Build `ORDER BY` from the parsed sort param. **Never** interpolate user input into SQL; use a whitelist:

```go
var allowedSort = map[string]string{
	"id": "id", "name": "name", "price": "price",
}

func buildOrderBy(sortBy string, asc bool) string {
	col, ok := allowedSort[sortBy]
	if !ok {
		col = "id"
	}
	dir := "ASC"
	if !asc {
		dir = "DESC"
	}
	return col + " " + dir
}
```

Use this string only for the column name and direction, not for raw user input.

::: warning
Always whitelist sort columns. Using user input directly in `ORDER BY` can lead to SQL injection or invalid queries.
:::

---

## Response format for list endpoint

Return a predictable shape for list + pagination + sort:

```json
{
  "data": [
    { "id": 1, "name": "Widget", "description": "...", "price": 19.99 }
  ],
  "total": 42,
  "page": 1,
  "size": 20
}
```

Optionally add `links` or `Link` headers for first/prev/self/next/last.

---

## Testing the list endpoint

### Filtering

```bash
# By name (contains)
curl "http://localhost:8080/api/v1/products?name=widget"

# By price range
curl "http://localhost:8080/api/v1/products?minPrice=10&maxPrice=50"

# Combined
curl "http://localhost:8080/api/v1/products?name=phone&maxPrice=500"
```

### Pagination

```bash
# First page, 10 per page
curl "http://localhost:8080/api/v1/products?page=1&size=10"

# Second page
curl "http://localhost:8080/api/v1/products?page=2&size=10"
```

### Sorting

```bash
# By price ascending
curl "http://localhost:8080/api/v1/products?sort=price"

# By price descending
curl "http://localhost:8080/api/v1/products?sort=price,desc"
```

### Combined

```bash
curl "http://localhost:8080/api/v1/products?name=phone&minPrice=100&sort=price,desc&page=1&size=10"
```

---

## Summary

In this milestone we:

- **Added filtering** via query params (`name`, `minPrice`, `maxPrice`) and passed them into the repository.
- **Implemented pagination** with limit/offset (or page/size), a max page size, and a total count in the response.
- **Added sorting** with a whitelist of columns and optional direction (asc/desc).
- **Returned a list envelope** with `data`, `total`, `page`, and `size`.
- **Tested** filtering, pagination, and sorting with curl.

You now have a product API that can handle large catalogs, filter by name and price, and support pagination and sorting in a safe, predictable way.

::: tip You're done
You've built a complete Go API from scratch: in-memory CRUD → database → errors and middleware → content negotiation and envelopes → documentation and versioning → filtering, pagination, and sorting. Use this as a base for your own projects and add auth, caching, or more advanced querying as needed.
:::

<TextToSpeech />
