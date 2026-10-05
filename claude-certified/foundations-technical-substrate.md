# The Technical Substrate

This page explains how a developer reaches Claude. You will learn about the SDK, streaming, and async patterns. Choose the right pattern for your workload.

## How a developer reaches Claude: SDK versus raw REST

At its core, Claude is reached over an HTTP REST API. Your code sends a request to an endpoint with your API key and a JSON body. It reads a JSON response back.

### Raw REST

You can call the endpoint directly with any HTTP client.

### SDK

More commonly you use an official SDK. Anthropic provides SDKs for Python, TypeScript, and other languages.

The SDK is a thin convenience layer over the same REST API. It handles:

- Authentication
- Request construction
- Retries
- Response parsing

You write less boilerplate.

### Which to choose

The SDK and raw REST reach the same API and the same model. The SDK saves you from assembling requests by hand.

## Synchronous, streaming, and real-time responses

### Synchronous

A **synchronous** request is the simplest pattern. You send the request. You wait for the complete response to come back in one piece. Then you act on it.

Synchronous is fine for:

- Short responses
- Backend jobs where no one is waiting

### Streaming

When a response is long or a user is watching, **streaming** sends the response in pieces as the model generates it. Output appears immediately rather than after a blank-screen wait.

Your code reassembles the pieces into the final message. Claude exposes streaming over the same HTTP connection using server-sent events.

Streaming helps when:

- The response is long
- A user is watching the output
- You want to show progress immediately

When a stream is interrupted, your code must recover. Handle partial responses.

## Asynchronous patterns for high-volume work

Two patterns address high-volume work. They solve different problems.

### Async client (non-blocking)

The Python SDK exposes an async client (`AsyncAnthropic`). It uses non-blocking async/await to make API calls without tying up your application thread.

In the TypeScript SDK the standard `Anthropic` client is Promise-based. You await calls directly. There is no separate async client class.

Either way the request still returns in real time. But your application can handle other work while it waits.

Use the async client when you need concurrency without blocking.

### Message Batches API (bulk offline)

The Message Batches API is a separate pattern for bulk offline workloads.

You submit a large set of requests in one call. You receive an identifier. You poll for completion.

Batch jobs can take up to 24 hours to complete. They run at a lower per-token cost in exchange for that latency.

Use batch processing for:

- Offline pipelines
- Evaluation runs
- Bulk jobs where no user is waiting on each result
- Cost-sensitive workloads where turnaround time is not critical

See the [Message Batches API documentation](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing) for details.
