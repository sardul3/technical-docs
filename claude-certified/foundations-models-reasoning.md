# Model Options and Reasoning Modes

This page explains the Claude model family and reasoning modes. You will learn how to choose a model and when to use reasoning. These are separate decisions that work together.

## The Claude model family

Claude is a family of models. It currently spans four tiers:

| Tier | Description | When to use |
|------|-------------|-------------|
| **Fable** | Most capable tier | Demanding reasoning, long-horizon agentic work |
| **Opus** | Complex work | Long-running agentic coding, enterprise work |
| **Sonnet** | Balanced default | Most production workloads |
| **Haiku** | Speed and cost | High-volume tasks that fit its capability |

Each tier has a different tradeoff across cost, latency, and capability.

### Practical default

Start with Sonnet. Move up a tier only when an eval shows the current tier missing your quality bar. Move down to Haiku only when an eval shows the quality drop is acceptable for the task.

Check [platform.claude.com/docs](https://platform.claude.com/docs/en/models/overview) for the current model lineup and identifiers. The Claude family is evolving.

## Reasoning modes are separate from model choice

Choosing which model to run is one decision. Whether the model reasons before answering is a separate decision. You make the reasoning decision per call.

### Adaptive thinking

On current models the reasoning mode is adaptive thinking. The model decides when and how much to think. You tune depth with an **effort** setting rather than a fixed token budget.

The older `budget_tokens` control is deprecated. On the newest model generations, it returns a 400 error. Use the effort parameter instead.

### Thinking content

Thinking content is omitted from responses by default on the newest models. Request summarized display when you need to show it.

### When reasoning helps

Reasoning earns its cost on hard, multi-step problems. It is wasted on lookups and classification.

### Per-model defaults

The two levers compose. Model choice picks the family member. Reasoning mode is configured per request.

Per-model defaults differ. Some newest models think adaptively by default or always. Check the current thinking defaults for your model when you build.

## How the two work together

Model choice and reasoning mode are independent. You can set each one separately.

| Configuration | Behavior |
|--------------|----------|
| Capable model with reasoning off | Fast and direct |
| Smaller model with reasoning on | Spends more tokens to think |
| Capable model with higher effort | Handles the most demanding tasks |

The decision of which model to run depends on cost, latency, and quality. Pair these decisions with evals.
