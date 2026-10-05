# Prompting Modes: Zero-Shot, One-Shot, Multi-Shot

This page explains the three prompting modes. You will learn when to give examples and how many. Examples help the model produce the exact output shape you need.

## The three modes

Separate from how you word a prompt is how many worked examples you give the model inside it.

| Mode | Examples | Description |
|------|----------|-------------|
| **Zero-shot** | None | You describe the task and ask for the result |
| **One-shot** | One | You add one example of input paired with desired output |
| **Multi-shot** | Several | You include multiple input-output pairs (also called few-shot) |

The examples are not training data. They sit in the prompt. They show the model the exact shape of the answer you want.

A description alone often fails to pin down the output shape. Examples make the expected format concrete.

## The cost and quality trade-off

Each example you add costs tokens on every call. Each example consumes context budget.

The choice trades quality against cost:

- Use **zero-shot** when the task is simple and the output shape is obvious
- Use **one-shot** or **multi-shot** when the output has a specific structure, casing, or edge case that a description keeps missing

Often one or two correct examples fix the issue faster than another paragraph of instructions.

### General discipline

Add the smallest amount of prompt that produces a reliable result.

## Mode choice interacts with model choice

Prompting mode and model choice are related levers.

A more capable model often succeeds zero-shot on a task where a smaller model needs a few examples to match the structure. Adding examples can let a cheaper model do the job.

Make these two decisions together:

1. Try the simplest model and the fewest examples that meet your eval
2. Add capability or examples only where the eval says you need them

This approach balances cost and quality.
