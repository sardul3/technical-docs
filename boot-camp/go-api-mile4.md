<ProgressBar />

# Content Negotiation and Response Envelopes <Label text="M4" type="milestone" />

::: tip
This milestone adds support for different response formats (JSON vs XML) and consistent response envelopes so clients always know what to expect.
:::

## Introduction

We extend the API from [Milestone 3](/boot-camp/go-api-mile3) by:

- **Content negotiation** — honoring the `Accept` header to return JSON or XML.
- **Response envelopes** — wrapping data in a standard shape (e.g. `{"data": {...}}` or HATEOAS-style links).
- **Consistent headers** — `Content-Type` and, optionally, `ETag` or `Link` headers.

We keep the same endpoints and error format; only the way we format success responses changes.

---

## Content Negotiation

Content negotiation lets clients choose the format of the response using the **Accept** header.

### Built-in behavior in Go

Go does not negotiate content by default. You:

1. Read `Accept` from `r.Header.Get("Accept")`.
2. Prefer `application/json` or `application/xml` (or both).
3. Set `Content-Type` and encode the body in that format.

::: info
For many APIs, JSON-only is enough. Adding XML (or another format) is useful when you must support legacy clients or partner systems.
:::

### Implementing content negotiation

Create a helper that picks format and encodes the payload:

```go
package httputil

import (
	"encoding/json"
	"encoding/xml"
	"net/http"
	"strings"
)

const (
	AcceptJSON = "application/json"
	AcceptXML  = "application/xml"
)

func NegotiateContentType(r *http.Request) string {
	accept := r.Header.Get("Accept")
	if strings.Contains(accept, AcceptXML) && !strings.Contains(accept, AcceptJSON) {
		return AcceptXML
	}
	return AcceptJSON // default
}

func Respond(w http.ResponseWriter, r *http.Request, status int, payload interface{}) {
	ct := NegotiateContentType(r)
	w.WriteHeader(status)
	switch ct {
	case AcceptXML:
		w.Header().Set("Content-Type", AcceptXML+"; charset=utf-8")
		_ = xml.NewEncoder(w).Encode(payload)
	default:
		w.Header().Set("Content-Type", AcceptJSON)
		_ = json.NewEncoder(w).Encode(payload)
	}
}
```

Handlers then call `httputil.Respond(w, r, http.StatusOK, p)` instead of manually calling `json.NewEncoder(w).Encode(p)`.

::: tip
If your payload is a struct, add both `json` and `xml` tags so it serializes correctly for both formats.
:::

### Example struct with JSON and XML tags

```go
type Product struct {
	ID          int     `json:"id" xml:"id"`
	Name        string  `json:"name" xml:"name"`
	Description string  `json:"description" xml:"description"`
	Price       float64 `json:"price" xml:"price"`
}
```

---

## Response Envelopes

An **envelope** is a wrapper object that always has the same top-level shape. Clients can rely on it regardless of endpoint.

### Simple data envelope

```go
type Envelope struct {
	Data interface{} `json:"data" xml:"data"`
}

// Usage in handler:
httputil.Respond(w, r, http.StatusOK, Envelope{Data: product})
```

Responses look like:

```json
{"data": {"id": 1, "name": "Widget", "description": "...", "price": 19.99}}
```

::: info
Some APIs return the resource directly (no envelope). Envelopes help when you later add metadata (e.g. `meta`, `links`) without breaking clients.
:::

### Envelope with metadata (optional)

```go
type Envelope struct {
	Data interface{} `json:"data" xml:"data"`
	Meta *Meta       `json:"meta,omitempty" xml:"meta,omitempty"`
}

type Meta struct {
	RequestID string `json:"requestId,omitempty" xml:"requestId,omitempty"`
}
```

Fill `Meta` from middleware (e.g. request ID from context) when you want traceability in the response body.

---

## HATEOAS-Style Links (Optional)

HATEOAS (Hypermedia as the Engine of Application State) means responses include **links** that tell the client what it can do next (e.g. "self", "update", "delete", "list").

### Link structure

```go
type Link struct {
	Href string `json:"href" xml:"href"`
	Rel  string `json:"rel" xml:"rel"`
}

type ProductResponse struct {
	Product
	Links []Link `json:"_links,omitempty" xml:"links,omitempty"`
}

func ProductWithLinks(p Product, baseURL string) ProductResponse {
	return ProductResponse{
		Product: p,
		Links: []Link{
			{Href: baseURL + "/api/products/" + strconv.Itoa(p.ID), Rel: "self"},
			{Href: baseURL + "/api/products", Rel: "products"},
		},
	}
}
```

Handlers then return `ProductWithLinks(p, baseURL)` so each product includes `_links`. Clients can discover "self" and "products" without hard-coding URLs.

::: tip
Use a base URL from config or from `r.URL.Scheme` and `r.Host` so links work in dev and production.
:::

---

## ETag and Caching (Optional)

For **GET** endpoints that return large or rarely changing data, you can add **ETag** and **If-None-Match** support:

1. Compute a hash (e.g. MD5 or SHA256) of the response body (or of key fields).
2. Set `ETag: "..."` on the response.
3. If the request has `If-None-Match: "..."` and it matches the current ETag, return **304 Not Modified** with no body.

This reduces bandwidth and load when data has not changed. Implementation can live in a small helper or middleware for specific routes.

---

## Summary

In this milestone we:

- **Implemented content negotiation** using the `Accept` header and chose JSON or XML.
- **Introduced a Respond helper** that sets `Content-Type` and encodes in the chosen format.
- **Used a simple data envelope** (`{"data": ...}`) so success responses have a stable shape.
- **Optionally added HATEOAS-style links** so product responses include `_links` for self and list.
- **Optionally considered ETag / If-None-Match** for caching on GET.

::: tip Next step
In [Milestone 5 — Documentation and versioning](/boot-camp/go-api-mile5) we add OpenAPI docs and API versioning.
:::

<TextToSpeech />
