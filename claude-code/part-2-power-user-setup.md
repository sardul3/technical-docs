# Claude Code on a Real Codebase, Part 2: The Power-User Setup

> Statusline, skills, hooks, subagents, MCP, and headless CI: turning an AI agent into a repeatable part of your engineering system.

---

Once Claude Code is installed and your CLAUDE.md is lean, most people stop there. That's where the real leverage starts. The difference between "I chat with an agent" and "my team has an agent-shaped workflow" is a handful of files checked into the repo: a statusline, a few skills, a couple of hooks, a subagent or two, and a small MCP config.

I've spent six-plus years on Java/Spring Boot and React/Angular, and more recently production Python AI work: Google ADK multi-agent systems, LLM enrichment pipelines, and eval frameworks. This is Part 2 of a four-part series. It stands on its own, but if you haven't set up auth, settings, and permissions yet, start with Part 1. Everything below was checked against the official docs as of October 2026.

## In This Series

| Part | Topic |
|------|-------|
| [Part 1](/claude-code/part-1-getting-started) | Getting Started the Right Way |
| **Part 2** | The Power-User Setup (this article) |
| [Part 3](/claude-code/part-3-onboarding) | Onboarding a New Engineer |
| Part 4 | Guardrails, Rollout, and Value (coming next) |

---

## The Statusline: One Number That Changes Behavior

The status line is a bar at the bottom of Claude Code that runs any script you configure. The script gets session JSON on stdin and Claude Code displays whatever it prints. It runs locally and costs no tokens. The quickest setup is to run `/statusline` and describe what you want, for example "show model, folder, git branch, context percentage and cost." Claude Code writes the script and updates your settings for you.

### Configuration

Configure it yourself in `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 1
  }
}
```

### Available JSON Fields

Fields I use from the JSON input:

| Field | Description |
|-------|-------------|
| `model.display_name` | Current model name |
| `workspace.current_dir`, `workspace.project_dir` | Working directories |
| `cost.total_cost_usd` | Client-side estimate at list price, not your bill |
| `context_window.used_percentage` | Can be `null` early in a session |
| `session_id` | Stable per session, useful for cache files |
| `worktree.name` | Present only in a worktree session |
| `rate_limits.five_hour.used_percentage` | Pro/Max only, may be absent |

### Example Script

```bash
#!/usr/bin/env bash
# ~/.claude/statusline.sh
input=$(cat)

MODEL=$(echo "$input" | jq -r '.model.display_name // "?"')
DIR=$(echo "$input"   | jq -r '.workspace.current_dir // .cwd')
COST=$(echo "$input"  | jq -r '.cost.total_cost_usd // 0')
PCT=$(echo "$input"   | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
WT=$(echo "$input"    | jq -r '.worktree.name // empty')
FIVE_H=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')

BRANCH=""
if git -C "$DIR" rev-parse --git-dir >/dev/null 2>&1; then
  BRANCH=$(git -C "$DIR" branch --show-current 2>/dev/null)
fi

GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'; RESET='\033[0m'
if   [ "$PCT" -ge 80 ]; then C="$RED"
elif [ "$PCT" -ge 50 ]; then C="$YELLOW"
else C="$GREEN"; fi

LINE="[$MODEL] ${DIR##*/}"
[ -n "$BRANCH" ] && LINE="$LINE | ⎇ $BRANCH"
[ -n "$WT" ]     && LINE="$LINE (wt:$WT)"
LINE="$LINE | ${C}ctx ${PCT}%${RESET} | \$$(printf '%.2f' "$COST")"
[ -n "$FIVE_H" ] && LINE="$LINE | 5h $(printf '%.0f' "$FIVE_H")%"

echo -e "$LINE"
```

Test it locally:

```bash
chmod +x ~/.claude/statusline.sh
echo '{"model":{"display_name":"Sonnet"},"workspace":{"current_dir":"'"$PWD"'"},"context_window":{"used_percentage":42},"cost":{"total_cost_usd":0.37},"session_id":"t"}' | ~/.claude/statusline.sh
```

::: tip Keep It Fast
If `git` is slow in a big monorepo, cache the result in a temp file keyed on `session_id`. If the line stays blank, check that the script is executable, that the folder is trusted (status lines follow the same workspace trust rule as hooks), and run `claude --debug`.
:::

**Context percentage in the status line is the most useful number on my screen.** When it turns yellow, I decide deliberately between `/compact <focus>` and `/clear`, instead of letting auto-compaction decide for me.

---

## Skills: Codify the Procedures You Keep Re-Explaining

### What They Are

A skill is a directory with a `SKILL.md` file: YAML frontmatter that says what it does and when to use it, followed by Markdown instructions. Claude Code skills follow the open **Agent Skills** standard, with extensions for invocation control, subagent execution, and dynamic context injection.

The key property is **progressive loading**. Only the skill's description sits in context by default. The full body loads when you invoke it with `/skill-name` or when Claude decides it's relevant. Long reference material costs almost nothing until it's needed.

### Where Skills Live

| Location | Path | Loads in |
|----------|------|----------|
| Personal | `~/.claude/skills/<name>/SKILL.md` | All your projects on this machine |
| Project | `.claude/skills/<name>/SKILL.md` | This repo; commit it for the team |
| Nested | `<subdir>/.claude/skills/<name>/SKILL.md` | When working in that subdirectory |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | As `/plugin-name:skill-name` |
| Enterprise | Managed settings directory | Org-wide |

If two skills share a name: enterprise beats personal, and personal beats project.

### Frontmatter That Matters

All fields are optional. `description` is strongly recommended.

| Field | Purpose |
|-------|---------|
| `name` | Command name (defaults to the directory name) |
| `description` | What it does and when to use it. Put the key use case first |
| `when_to_use` | Extra trigger phrases |
| `argument-hint`, `arguments` | Argument UX and `$name` substitution |
| `disable-model-invocation: true` | Only you can trigger it (deploys, commits) |
| `user-invocable: false` | Only Claude can load it (background knowledge) |
| `allowed-tools` | Tools pre-approved for the turn that invokes the skill |
| `paths` | Globs that limit automatic activation |
| `model`, `effort` | Per-skill overrides |
| `context: fork` (+ `agent`) | Run in a forked subagent context |
| `hooks` | Hooks registered when the skill is invoked |

In the body you can use `$ARGUMENTS`, `$0`/`$1`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_PROJECT_DIR}`, and `` !`command` `` lines. Those run before Claude sees the content and inline the output. Keep `SKILL.md` under 500 lines and push detail into sibling files like `reference.md` or `scripts/`.

### My Heuristics for When to Create One

1. **I've pasted the same instructions into chat three times.** That's the signal.
2. **The procedure has a definition of done** I can write down: files touched, tests run, output format.
3. **It encodes team knowledge the code doesn't show**: conventions, sequencing, "we tried X and it broke Y".
4. **It's too long or too situational for CLAUDE.md.**
5. **Side effects mean I want manual triggering.** Then it gets `disable-model-invocation: true`.

Don't create skills for things the model already does well without help, or for rules that must never be broken. Use permissions or hooks for those.

### Worked Example: A Spring Boot Endpoint Skill

`.claude/skills/add-rest-endpoint/SKILL.md`:

```markdown
---
name: add-rest-endpoint
description: Adds a new REST endpoint to a Spring Boot module following this repo's controller/service/DTO conventions, with tests. Use when asked to add or expose an API endpoint.
when_to_use: "add an endpoint", "expose X over REST", "new GET/POST route"
argument-hint: "[module] [HTTP method] [path]"
arguments: module method path
allowed-tools:
  - "Bash(./mvnw *)"
  - "Bash(git status *)"
paths:
  - "**/src/main/java/**"
---

# Add a REST endpoint

Target: module `$module`, `$method $path`.

## Current state
!`git status --short`

## Steps
1. Find the existing controller for this resource in `$module`. Reuse it if present; create a new `@RestController` only if none fits.
2. Define request/response DTOs as Java records in the module's `api/dto` package. Never return JPA entities.
3. Add Bean Validation annotations to request DTOs and `@Valid` on the controller parameter.
4. Put business logic in the matching `*Service`. The controller maps DTOs and delegates; nothing else.
5. Errors: throw the domain exceptions handled by the module's `@RestControllerAdvice`. Follow [error-contract.md](error-contract.md).
6. Tests, written BEFORE the implementation:
   - `@WebMvcTest` slice test for the controller: happy path, validation failure (400), not found (404).
   - Unit test for the service method.
7. Run `./mvnw -pl $module test` and fix failures. Do not weaken existing assertions.

## Done means
- New tests fail before the change and pass after.
- `./mvnw -pl $module test` is green.
- Summarize: files changed, endpoint signature, and any follow-ups (OpenAPI docs, security config).
```

Put `error-contract.md` next to it, with your ProblemDetail shape and examples. Invoke it as `/add-rest-endpoint order-service POST /orders/{id}/coupons`, or just ask "add an endpoint to apply a coupon to an order" and let Claude load it. Start with the procedure you explain most often—that's usually the one with the highest payoff.

---

## How the Pieces Differ

People mix these up constantly, so here's my mental model:

| Piece | What it is | When it loads |
|-------|------------|---------------|
| **CLAUDE.md** | Always-on facts and rules | At session start |
| **Skill** | An on-demand procedure | When invoked or relevant |
| **Subagent** | Separate worker with own context/tools/model | When spawned |
| **Hook** | Deterministic code on lifecycle events | On the event |

**Composition rules:**
- A skill can *run in* a subagent (`context: fork`)
- A subagent can *preload* skills (`skills:` frontmatter)
- A skill can register its own hooks
- CLAUDE.md guidance applies to subagents too

**Rule of thumb:** If it must happen every time, it's a hook. If it's a procedure, it's a skill. If it's noisy work you want out of your main context, it's a subagent.

---

## Hooks: Guardrails That Don't Depend on the Model Listening

Hooks are deterministic, which makes them the right place for anything that must happen every time. Events include `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `SessionStart`, `Stop`, `PreCompact`, and more. A command hook that exits with **code 2** blocks the action, and its stderr goes back to Claude as feedback. A blocking hook also takes precedence over allow rules.

### Hook Configuration

`.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/format-java.sh" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous.sh" }
        ]
      }
    ]
  }
}
```

### Auto-Format Hook

`.claude/hooks/format-java.sh` (assumes `google-java-format` is on your PATH; swap in your formatter):

```bash
#!/usr/bin/env bash
FILE=$(jq -r '.tool_input.file_path // empty')
[[ "$FILE" == *.java ]] || exit 0
command -v google-java-format >/dev/null || exit 0
google-java-format -i "$FILE"
```

### Dangerous-Command Blocking Hook

`.claude/hooks/block-dangerous.sh`:

```bash
#!/usr/bin/env bash
CMD=$(jq -r '.tool_input.command // empty')
PATTERNS=('rm -rf /' 'git push --force' 'git push -f' 'git reset --hard' 'DROP TABLE' 'flyway clean')
for p in "${PATTERNS[@]}"; do
  if [[ "$CMD" == *"$p"* ]]; then
    echo "Blocked by team policy: command contains '$p'. Ask the user to run it manually." >&2
    exit 2
  fi
done
exit 0
```

Make both executable with `chmod +x`. The `if` field (for example `"if": "Bash(git *)"`) lets a hook spawn only for matching tool calls. `/hooks` shows what's configured.

::: warning String Matching is a Seatbelt
String matching is best-effort, so treat this hook as a seatbelt, not a security boundary. The real boundary is deny rules plus the sandbox.
:::

---

## Subagents: Keep Noisy Work Out of Your Context

Subagents are Markdown files with frontmatter in `.claude/agents/` (project) or `~/.claude/agents/` (personal). Built-ins include **Explore** (read-only search), **Plan** (research during plan mode), and **general-purpose**. Their big win is **context isolation**: verbose work happens in another context window and only a summary comes back.

### Example Subagent

```markdown
---
name: test-runner
description: Runs Maven test suites and reports only failing tests with the relevant stack trace lines. Use after code changes.
tools: Bash, Read, Grep
model: haiku
---
Run the requested Maven tests. Report failing test names, the assertion message,
and the top application frames of each stack trace. Do not edit files.
```

### Other Useful Fields

| Field | Purpose |
|-------|---------|
| `disallowedTools` | Block specific tools |
| `permissionMode` | Set the mode for this agent |
| `skills` | Preload specific skills |
| `hooks` | Custom hooks for this agent |
| `maxTurns` | Limit execution length |
| `effort` | Reasoning depth |
| `memory` | Enable/disable memory |
| `isolation: worktree` | Give the agent its own checkout |

---

## MCP Servers

```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
claude mcp add --transport http shared-docs --scope project https://example.com/mcp
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub
claude mcp list
claude mcp get sentry
claude mcp remove sentry
claude mcp login sentry
```

### Scopes

| Scope | Where stored | Who sees it |
|-------|--------------|-------------|
| **local** (default) | `~/.claude.json` | You, this project |
| **project** | `.mcp.json` at repo root | Everyone who clones |
| **user** | `~/.claude.json` | You, all projects |

For stdio servers, everything after `--` goes to the server command. Claude Code asks for approval before using project-scoped servers in interactive sessions. Note that `claude -p` runs load them **without asking**, which matters in CI.

::: tip Prefer CLIs Over MCP When Both Exist
The docs note CLIs (`gh`, `aws`, `gcloud`) are more context-efficient. Use `/mcp` to disable servers you aren't using.
:::

---

## Custom Slash Commands

Since commands merged into skills, my "commands" are just skills with `disable-model-invocation: true`. `/release-notes` or `/prep-pr` are things I trigger on purpose, not things I want the model deciding to run.

---

## Headless and CI

```bash
# Build-script lint step
git diff main | claude -p "Report typos in this diff as file:line then the issue. Nothing else."

# Structured output for a pipeline
claude -p "List modules touched by this diff" --output-format json | jq -r '.result'
```

### GitHub Actions

For GitHub, run `/install-github-app` for guided setup (github.com only), or add the action manually:

```yaml
# .github/workflows/claude-code.yml
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: # Use GitHub secrets syntax: secrets.ANTHROPIC_API_KEY
```

With a subscription, use `claude_code_oauth_token` with your `CLAUDE_CODE_OAUTH_TOKEN` secret (generated by `claude setup-token`). Pass CLI flags through `claude_args`, for example `--model` and `--allowedTools`. With a `prompt` input, the action runs in automation mode on any event, including cron. 

::: warning CI Rules
In CI I always set `--max-turns`, explicit `--allowedTools`, and a `dontAsk` or tightly scoped permission setup. Never commit keys; use GitHub Secrets.
:::

---

## Context and Cost Management

| Habit | Why |
|-------|-----|
| `/clear` between unrelated tasks | The docs call the mixed-task session the "kitchen sink" anti-pattern |
| After two failed corrections, `/clear` and rewrite the prompt | Fresh context beats heroic sessions |
| `/compact Focus on the failing tests and current plan` | When you need to keep going |
| `/context` to find bloat; `/usage` for cost and plan limits | Know what you're spending |
| Push verbose work to subagents, optionally on `haiku` | Context isolation |
| Move situational CLAUDE.md content into skills or path-scoped rules | Reduce baseline load |
| Lower `/effort` for mechanical tasks | Speed vs depth tradeoff |
| In scripts, cap spend with `--max-budget-usd` and `--max-turns` | Hard limits for automation |

---

## Security Summary

- **Permissions first.** Deny secrets reads, `ask` on pushes, and allow only what you've reviewed.
- **Sandbox.** `/sandbox` enables OS-level filesystem and network isolation for Bash (macOS, Linux, WSL2; not native Windows). Configure `sandbox.filesystem.allowWrite` and `sandbox.network.allowedDomains` in settings. This is what actually closes the gaps that string-matched rules leave.
- **Secrets.** Keep them out of the repo and out of context. Use deny rules on `.env*` and `secrets/**`, and `apiKeyHelper` for rotating credentials.
- **Prompt injection.** Anything Claude reads (issues, web pages, logs, MCP output) can contain instructions. Network commands like `curl` aren't auto-approved by default. Keep it that way.
- **`bypassPermissions` only in throwaway containers or VMs.** Deny rules still apply even there.

---

## What's Next

Power-user setup isn't about collecting features. It's about moving repeatable knowledge into the right mechanism: facts into CLAUDE.md, procedures into skills, guarantees into hooks and permissions, and noise into subagents.

**Official docs:** [https://code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills), [https://code.claude.com/docs/en/hooks-guide](https://code.claude.com/docs/en/hooks-guide), and [https://code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents)

---

**Previous:** [Part 1: Getting Started the Right Way](/claude-code/part-1-getting-started)

**Next:** [Part 3: Onboarding a New Engineer](/claude-code/part-3-onboarding) — Using Claude Code to accelerate onboarding without replacing mentorship.
