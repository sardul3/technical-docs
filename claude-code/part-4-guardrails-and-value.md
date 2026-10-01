# Claude Code on a Real Codebase, Part 4: A Staff Engineer's Take on Guardrails, Rollout, and Value

> Where AI coding agents shine, where they fail, the guardrails I insist on, and how to prove they're worth it.

---

Every team adopting an AI coding agent hits the same fork in the road. One path: individuals install it, get excited, and ship plausible diffs faster than anyone can review them. The other: the team treats the agent like any other production system, with configuration in version control, explicit boundaries, and honest measurement.

I've spent six-plus years on Java/Spring Boot and React/Angular, and more recently production Python AI work: Google ADK multi-agent systems, LLM enrichment pipelines, and the eval framework that keeps them honest. That last part makes me allergic to vibes-based productivity claims. This is Part 4 of my series on using Claude Code on a real codebase. It stands on its own, and it's the most opinionated part. Feature details were checked against the official docs as of October 2026.

## In This Series

| Part | Topic |
|------|-------|
| [Part 1](/claude-code/part-1-getting-started) | Getting Started the Right Way |
| [Part 2](/claude-code/part-2-power-user-setup) | The Power-User Setup |
| [Part 3](/claude-code/part-3-onboarding) | Onboarding a New Engineer |
| **Part 4** | Guardrails, Rollout, and Value (this article) |

---

## Where It Shines

### Codebase Archaeology

"How does a coupon flow from the API to the database?" asked in plan mode beats an hour of grepping, and the answer comes with file paths you can check. This is the most underrated use, and the safest, because nothing changes.

### Well-Specified, Test-Anchored Changes

When a failing test defines "done," the agent's speed turns straight into throughput. The spec does the steering, not the model's guesses.

### Mechanical Breadth

Migrations, API version bumps, dependency upgrades, and consistent refactors across dozens of files, done in separate worktrees and reviewed in chunks. This is work humans do badly because it's boring, and agents do well because it's pattern-shaped.

### Glue Work

Scripts, CI tweaks, test scaffolding, and docs written from code. The stuff that never makes a sprint but always slows you down.

### First Pass on Reviews

`/review` and `/security-review` make a useful pre-pass on the current diff before a human looks. They don't replace the human; they make the human's time go further.

---

## Where It Fails

| Failure Mode | Why It Happens |
|--------------|----------------|
| **Ambiguous requirements** | It will confidently build the wrong thing. Strictly speaking, that's a spec problem, but you pay for it all the same. The fix is plan mode and a written plan you actually read. |
| **Implicit invariants** | "This field must never be null because a batch job in another repo depends on it." If it isn't in code, tests, CLAUDE.md, or an ADR, it doesn't exist for the agent. |
| **Long, drifting sessions** | Quality drops as context fills with failed attempts. A fresh session with a better prompt beats a heroic session every time. The docs put it bluntly: after two failed corrections, clear and start over with what you learned. |
| **Tests as the goal instead of the evidence** | Without guardrails, an agent will adjust assertions to match wrong behavior. My prompts always say "don't modify existing tests without asking." |
| **Performance and concurrency** | The code looks right and falls over under load, or races under contention. Measure it; don't trust it. |

Watch for these patterns on your own projects and add guardrails when you see them.

---

## The Guardrails I Insist On

### 1. A Committed Settings File

`.claude/settings.json` holds the team's permission rules:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ],
    "ask": [
      "Bash(git push *)"
    ],
    "allow": [
      "Bash(./mvnw *)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ]
  }
}
```

Rules are evaluated deny, then ask, then allow, and a deny from any scope beats an allow from any other. Committed allow rules only take effect once each teammate trusts the folder, while deny and ask rules apply immediately.

### 2. A Hook for Destructive Commands, Plus the Sandbox

A `PreToolUse` hook that exits with code 2 blocks the action and tells Claude why. It's a seatbelt, not a boundary, because string matching can be bypassed by rewording.

The real boundary is the sandbox. `/sandbox` turns on OS-level filesystem and network isolation for shell commands on macOS, Linux, and WSL2. Configure `sandbox.filesystem.allowWrite` and `sandbox.network.allowedDomains` in settings.

### 3. Test-First Prompts for Behavior Changes

Every behavior change prompt follows this shape:

> Write a failing test that captures [the new behavior]. Run it and show it fails. Implement the minimum change to pass. Run the whole module's tests. Don't modify existing tests without asking.

### 4. Small PRs

If I can't review it in one sitting, the agent should have split it.

### 5. Humans Own Every Merge

Agent-assisted PRs get the same review bar as anyone's, and the author of record is the person who prompted it. "Claude wrote it" is never an explanation in review.

---

## Security: What I Actually Worry About

### Secrets in Context

Deny rules on `.env` files and secrets folders keep the file tools out, but a broad shell command can still read them. That's why the sandbox matters. Keep long-lived credentials off developer laptops where you can, and use `apiKeyHelper` for rotating keys.

### Prompt Injection

Anything Claude reads (an issue body, a web page, a log line, MCP tool output) can contain instructions. By default, network commands like `curl` aren't auto-approved. Keep it that way, and be deliberate about which MCP servers you connect and with what scopes.

### Permission Modes

| Mode | Notes |
|------|-------|
| `bypassPermissions` | Only in throwaway containers or VMs. Deny rules still apply even there. |
| `auto` | Project settings can't make this the default, so a cloned repo can't silently put you into it. |
| `dontAsk` | Use in CI with explicit `--allowedTools`. Anything not pre-approved is denied, not prompted. |

### CI Specifics

- `claude -p` runs load project MCP servers **without asking**, so review `.mcp.json` like code
- Always cap runs with `--max-turns` and, where it makes sense, `--max-budget-usd`
- Keep keys in secrets, never in the repo

---

## Team Rollout: Configuration Is Code

### What I Check In

```
.claude/
  settings.json          # permissions, hooks, sandbox settings
  hooks/                  # the scripts those hooks call
  skills/                 # team procedures
  agents/                 # team subagents
  rules/                  # path-scoped guidance
CLAUDE.md
.mcp.json                 # shared MCP servers
.worktreeinclude
```

### What Stays Personal

- `.claude/settings.local.json`
- `CLAUDE.local.md`
- `~/.claude/*`

### Review Discipline

Changes to `.claude/` get code review like production code, with a CODEOWNERS entry:

```
/.claude/   @platform-leads
/CLAUDE.md  @platform-leads
/.mcp.json  @platform-leads @security
```

::: tip Why This Matters
A hook is a script that runs on every developer's machine. A skill changes how every agent session behaves. An MCP server is a new data flow. Treat all three accordingly.
:::

Org-wide non-negotiables go in managed settings, where nothing can override them: blocked tools, a forced sandbox, login restrictions, a minimum version. Leave taste to the repo.

---

## Rolling It Out to People

| Step | Details |
|------|---------|
| **1. Start with 2–3 volunteers** | On one repo. Build CLAUDE.md, settings, and one or two skills together. |
| **2. Write down the playbook** | Explore-plan-code-commit, test-first prompts, when to `/clear`, how to review agent diffs. |
| **3. Pair on sessions** | Watching someone else steer an agent teaches more than any doc. |
| **4. Promote patterns into config** | When someone pastes the same prompt a third time, it becomes a skill in a reviewed PR. |
| **5. Enforce non-negotiables centrally** | Leave the rest to each repo. |
| **6. Revisit monthly** | Prune CLAUDE.md, run `/doctor prompt-audit` to catch stale or conflicting instructions, retire unused skills and MCP servers. |

---

## Measuring Value Without Fooling Yourself

Measure these signals before and after rollout, on comparable work:

| Metric | How to Collect |
|--------|----------------|
| **Cycle time** | From ticket start to merged PR |
| **Review rework** | Comment count and follow-up commits per PR |
| **Escaped defects and revert rate** | Compare agent-assisted PRs with the rest |
| **Spend per merged PR** | From `/usage`, the cost field in `--output-format json`, or your org's usage dashboards |
| **Developer-reported friction** | Where people give up and do it by hand |

### Read Metrics Together

If agent-assisted PRs merge faster but get reverted more, you haven't gained anything. You've moved the cost downstream, to on-call and to your users.

If spend climbs while cycle time stays flat, look at session hygiene first: bloated CLAUDE.md files, kitchen-sink sessions, and verbose work that should have gone to a subagent.

---

## Conclusion

Claude Code on a real codebase isn't about clever prompts. It's the discipline you'd use to onboard a very fast new hire:

- Clear docs in CLAUDE.md
- Codified procedures in skills
- Hard limits in permissions, hooks, and the sandbox
- Tight feedback loops through tests
- Honest measurement

Get those right and the agent turns into real leverage. Skip them and you get plausible diffs faster than you can review them.

**Start small:**

1. Run `/init` and cut the result in half
2. Commit a settings file with sensible deny rules
3. Write one skill for the thing you explain most often
4. Put context usage in your status line
5. Then measure whether any of it helps

---

## Official Docs

- [Security](https://code.claude.com/docs/en/security)
- [Permissions](https://code.claude.com/docs/en/permissions)
- [Sandboxing](https://code.claude.com/docs/en/sandboxing)

---

**Previous:** [Part 3: Onboarding a New Engineer](/claude-code/part-3-onboarding)

---

## About the Series

This is Part 4 of 4, the end of the series. If you missed them:

- [Part 1](/claude-code/part-1-getting-started) covers getting started
- [Part 2](/claude-code/part-2-power-user-setup) covers the power-user setup
- [Part 3](/claude-code/part-3-onboarding) covers onboarding a new engineer with Claude Code
