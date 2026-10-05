# How LLMs Behave

**For staff engineers**: Understanding tokens and the context window helps you estimate costs and prevent production failures. Sampling explains why the same prompt can return different text. Non-determinism changes how you test Claude features.

## Tokens: the unit of input, output, and cost

Claude does not read characters or words directly. It reads **tokens**. A token is the smallest unit the model processes.

The number of characters per token depends on the tokenizer. Different model generations use different tokenizers. Do not assume a fixed character-to-token ratio. Check the current tokenizer behavior when you build.

The API counts everything in tokens:

- Your prompt
- The conversation history
- Tool definitions
- Tool results
- The model's response

Tokens are the unit of pricing. Tokens are the unit of budget. When you estimate cost or check if input fits, count tokens. Do not count words.

A useful habit is to think in tokens. The API bills in tokens. The context window measures in tokens.

## The context window: a fixed budget

The **context window** is the total number of tokens the model can take in for a single request. It holds everything at once:

- The system prompt
- The full conversation so far
- Any documents you inject
- Every tool result
- The model output

The context window is a fixed budget. It has two edge behaviors.

### Input too large

The API rejects a request whose input is larger than the window. It returns a validation error before generation starts.

### Output reaches the ceiling

A request that fits on input can still reach the ceiling during generation. Current models then stop and return the output generated so far. The response has a `model_context_window_exceeded` stop reason. The API does not raise an error in this case.

### Managing history

Either way, keeping a long session running requires your application to trim or summarize history before each call. In development, the window rarely fills because test inputs are short. In production, longer inputs and more turns fill the window faster.

## Sampling: why the same prompt can give different answers

A language model does not pick one fixed next token. At each step it produces a probability distribution over possible next tokens. It then **samples** from that distribution.

### Temperature

Settings such as temperature shape the distribution:

- A lower temperature concentrates probability on the most likely tokens. Output is more repeatable.
- A higher temperature spreads probability out. Output is more varied.

Because the choice is sampled, the same prompt run twice can return different wording. Both answers can be correct.

### Sampling controls on current models

Sampling controls are model-dependent. The newest Claude models do not accept non-default sampling parameters.

Setting `temperature`, `top_p`, or `top_k` to a non-default value returns a 400 error on the newest models. On these models, you steer behavior with the prompt instead.

Even on models that accept temperature, `temperature: 0` makes outputs more repeatable. It does not guarantee identical outputs across calls.

Check the [API reference](https://docs.anthropic.com/en/api/messages) for current parameter support.

## Non-determinism: what it means for testing

**Non-determinism** is the primary consequence of sampling. Identical inputs do not guarantee identical outputs. This changes how you test a Claude feature.

### Do not assert on exact text

A test that asserts the exact text of a response will be inconsistent. The model can express the same correct answer many ways.

### Assert on properties

Instead, assert on the property that must hold:

- A required field is present
- A value is in range
- The structure parses

### Use evals for meaning

When you need to judge meaning rather than structure, use an eval with a model-graded judge. Evals are the standard for knowing a feature is correct.
