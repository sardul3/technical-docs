# Model Options and Reasoning Modes

**For staff engineers**: Model choice and reasoning mode are separate levers you can tune independently. This separation lets you optimize cost, latency, and quality per endpoint. Start with the simplest configuration that meets your eval and add capability only where needed.

## The Claude model family

Claude is a family of models. It currently spans four tiers:

| Tier | Description |
|------|-------------|
| **Fable** | The most capable tier for the most demanding reasoning, coding, and agentic work |
| **Opus** | Handles demanding work above the Sonnet envelope |
| **Sonnet** | The balanced default for most production workloads |
| **Haiku** | Built for speed and cost efficiency on tasks that fit its capability |

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

The newest models omit thinking content from responses by default. Request summarized display when you need to show it.

### When reasoning helps

Reasoning earns its cost on hard, multi-step problems. It is wasted on lookups and classification.

### Per-model defaults

Per-model defaults differ. Some newest models think adaptively by default or always. Check the current thinking defaults for your model when you build.

## How the two work together

Model choice and reasoning mode are independent. You can set each one separately. Model choice picks the family member. You configure the reasoning mode per request.

| Configuration | Behavior |
|--------------|----------|
| Capable model with reasoning off | Fast and direct |
| Smaller model with reasoning on | Spends more tokens to think |
| Capable model with higher effort | Handles the most demanding tasks |

The decision of which model to run depends on cost, latency, and quality. Pair these decisions with evals.
