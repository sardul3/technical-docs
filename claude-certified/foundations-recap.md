# Recap: Five Takeaways

This page summarizes the five key takeaways from the Foundations module. Keep these points in mind when you build with Claude.

## 1. Tokens are the unit of input, output, and cost

Think and budget in tokens rather than words. The API meters in tokens. The context window measures in tokens.

## 2. The context window is a fixed token budget

The context window holds the whole request at once:

- System prompt
- Conversation history
- Documents
- Tool definitions and results
- Model output

An oversized input errors before generation. Hitting the ceiling mid-generation returns truncated output with a `model_context_window_exceeded` stop reason.

Managing history is the application's job.

## 3. Sampling makes generation non-deterministic

The same prompt can return different wording on each run. Testing on exact text is unreliable.

Use evals to test meaning and behavior. Evals are the standard for knowing a feature is correct.

## 4. Model choice and reasoning mode are separate, composable levers

Pick the smallest model and the simplest reasoning and prompting that meet your eval. Add capability only where the eval says you need it.

These levers compose:

- Model choice picks the family member
- Reasoning mode is configured per request
- Prompting mode determines how many examples you include

## 5. A developer reaches Claude over a REST API, usually through an SDK

Choose between synchronous, streaming, async/await, or batch based on:

- Whether a user is waiting
- Whether the workload is real-time or bulk offline

The SDK handles authentication, retries, and response parsing. It saves you from assembling requests by hand.
