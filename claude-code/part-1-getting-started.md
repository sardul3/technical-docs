# Claude Code on a Real Codebase, Part 1: Getting Started the Right Way

> Install, setup, verification, the commands that matter, and the plan-first habits that keep an AI agent useful on legacy code.

---

Most Claude Code demos show a greenfield todo app. That tells you very little. The real test is a five-year-old Spring Boot service with three generations of conventions, a flaky integration suite, and a README nobody has touched since the last reorg.

I've spent six-plus years on Java/Spring Boot backends and React/Angular frontends, and lately a lot of production Python AI work: multi-agent systems on Google ADK, LLM enrichment pipelines, and the evaluation framework that keeps them honest. That background shapes how I use coding agents. I don't treat Claude Code as autocomplete. I treat it as a very fast junior-to-mid engineer who never gets tired and needs clear guardrails and a clear definition of done.

This is Part 1 of a four-part series. It covers getting started properly: install, auth, settings, permissions, verification, the commands I actually use, CLAUDE.md, and the plan-first workflow. Everything here was checked against the official docs as of October 2026.

## In This Series

| Part | Topic |
|------|-------|
| **Part 1** | Getting Started the Right Way (this article) |
| [Part 2](/claude-code/part-2-power-user-setup) | The Power-User Setup |
| [Part 3](/claude-code/part-3-onboarding) | Onboarding a New Engineer |
| [Part 4](/claude-code/part-4-guardrails-and-value) | Guardrails, Rollout, and Value |

---

## Install: Pick the Path That Updates Itself

### Native Installer (Recommended)

The native installer is the recommended path, and it auto-updates in the background.

::: code-group

```bash [macOS / Linux / WSL]
curl -fsSL https://claude.ai/install.sh | bash
```

```powershell [Windows PowerShell]
irm https://claude.ai/install.ps1 | iex
```

```batch [Windows CMD]
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

:::

You can pin a channel or version at install time: `bash -s stable` or `bash -s 2.1.89` on the shell installer. The `stable` channel is typically about a week behind `latest` and skips releases with major regressions.

### Homebrew, WinGet, npm

::: code-group

```bash [Homebrew]
brew install --cask claude-code          # stable channel
brew install --cask claude-code@latest   # latest channel
```

```bash [WinGet]
winget install Anthropic.ClaudeCode
```

```bash [npm (deprecated)]
npm install -g @anthropic-ai/claude-code
```

:::

::: tip Important Notes
- Homebrew and WinGet installs **do not auto-update**. Run `brew upgrade claude-code` or `winget upgrade Anthropic.ClaudeCode` yourself, or set `CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE=1` to have Claude Code run the upgrade for you.
- The GitHub README now labels the npm install as deprecated. The npm package still works; it installs the same native binary and needs Node.js 22+ as of v2.1.198. Never use `sudo npm install -g`.
- Signed apt, dnf, and apk repositories also exist if your platform team wants packages managed through normal system upgrades.
:::

### Windows and WSL

You can run natively on Windows or inside WSL. My rule of thumb: if your toolchain is Linux-flavored (Maven wrappers, Docker, bash scripts), use **WSL 2**. It is the only Windows option that supports sandboxing. On native Windows, Git for Windows is optional but recommended so Claude Code gets a Bash tool via Git Bash. Without it, Claude Code uses PowerShell as its shell tool. In WSL, install and run `claude` inside the WSL terminal, not from PowerShell.

### Updating

```bash
claude update            # apply an update now
claude install stable    # reinstall/switch the native binary to a channel or version
```

To pin a release channel in settings:

```json
{
  "autoUpdatesChannel": "stable",
  "minimumVersion": "2.1.100"
}
```

`minimumVersion` is a floor so moving to `stable` doesn't downgrade you. To turn off background updates, set `DISABLE_AUTOUPDATER` to `"1"` in the `env` block. `DISABLE_UPDATES` blocks every update path, manual ones included.

### `claude doctor`

```bash
claude --version
claude doctor
```

`claude doctor` prints read-only install and settings diagnostics without starting a session: install health, settings-file validation errors, the result of the last auto-update, and warnings with suggested fixes. Inside a session, `/doctor` is a bundled skill that goes further. It finds duplicate installs, `PATH` problems, and unused skills or MCP servers, and it can fix them. `/doctor prompt-audit` reviews your CLAUDE.md, rules, and skills for stale or conflicting instructions (v2.1.283+).

---

## Authentication

Claude Code needs a Pro, Max, Team, Enterprise, or Console account. The free claude.ai plan doesn't include it. The first time you run `claude`, a browser login opens. You can also drive auth from the shell:

```bash
claude auth login              # subscription login
claude auth login --console    # Console (API usage billing)
claude auth status --text      # human-readable status
```

### Authentication Precedence

The part that bites people is **authentication precedence**. In order, Claude Code uses:

| Priority | Source |
|----------|--------|
| 1 | Cloud provider credentials (`CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, or `CLAUDE_CODE_USE_FOUNDRY`) |
| 2 | `ANTHROPIC_AUTH_TOKEN` (bearer token, for LLM gateways) |
| 3 | `ANTHROPIC_API_KEY` (Console key) |
| 4 | `apiKeyHelper` script output |
| 5 | `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`, for CI) |
| 6 | Anthropic profile/federation credentials |
| 7 | Subscription OAuth from `/login` |

So if you have a Max subscription but also a stale `ANTHROPIC_API_KEY` exported in your `.zshrc`, the key wins once you approve it. Run `unset ANTHROPIC_API_KEY` and check `/status`.

::: info Bedrock and Vertex
For Bedrock, set `CLAUDE_CODE_USE_BEDROCK=1` and optionally `AWS_REGION`. Google's docs now call Vertex AI "Google Cloud's Agent Platform". For it, set `CLAUDE_CODE_USE_VERTEX=1`, `CLOUD_ML_REGION`, and `ANTHROPIC_VERTEX_PROJECT_ID`. Both have guided setup at first login under "3rd-party platform". Model aliases resolve to different versions per provider, so pin with `ANTHROPIC_DEFAULT_OPUS_MODEL` / `ANTHROPIC_DEFAULT_SONNET_MODEL` if your team needs consistency.
:::

---

## The Settings Hierarchy

This is the most important thing to understand before a team rollout. From highest to lowest precedence:

| Precedence | Scope | File | Who it affects |
|------------|-------|------|----------------|
| 1 | Managed | `managed-settings.json`, MDM, or server-managed settings | Everyone the org deploys to |
| 2 | Command line | `claude --settings <file-or-json>` | You, this session |
| 3 | Project local | `.claude/settings.local.json` | You, this project |
| 4 | Shared project | `.claude/settings.json` | Everyone who clones the repo |
| 5 | User | `~/.claude/settings.json` | You, every project |

There's also `~/.claude.json`, which Claude Code writes for itself. It holds your login, MCP server configs for local and user scopes, and per-project trust state. You rarely need to edit it.

::: tip Two Details That Matter
- When you pick "Yes, and don't ask again" on a prompt, Claude Code writes an `allow` rule to `.claude/settings.local.json` and adds that file to your global git excludes.
- Allow rules in a committed `.claude/settings.json` only take effect after each teammate **trusts the folder**. Deny and ask rules apply immediately, trusted or not. That's the right default.
:::

Add `"$schema": "https://json.schemastore.org/claude-code-settings.json"` to get editor autocomplete.

---

## Permission Rules

Rules live under `permissions.allow`, `permissions.ask`, and `permissions.deny`. They're evaluated **deny, then ask, then allow**, and the first match wins. Specificity doesn't change that order, and deny rules from any scope beat allow rules from any other scope.

Here's a trimmed version of what I commit to a Spring Boot repo:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(./mvnw *)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ],
    "ask": [
      "Bash(git push *)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Bash(curl *)"
    ]
  }
}
```

::: warning Know the Limits
Rules match commands **as written**. `Bash(git push *)` does not match `git -C . push`. A `Read(./.env)` deny stops the file tools and commands that name the file, but not a `grep -r` over the directory. The docs pair deny rules with the sandbox to close that gap, and I do the same.
:::

---

## Permission Modes

Cycle with `Shift+Tab` or start with `--permission-mode`:

| Mode | Runs without asking |
|------|---------------------|
| `default` (shown as "Manual") | Reads only |
| `acceptEdits` | Reads, file edits, common filesystem commands |
| `plan` | Reads (research only, no edits) |
| `auto` | Everything, with a background classifier checking actions |
| `dontAsk` | Only pre-approved tools; everything else is denied |
| `bypassPermissions` | Everything. Isolated containers and VMs only |

`auto` and `bypassPermissions` can't be set as `defaultMode` from project or local settings. That's a good thing: a cloned repo can't silently put you into YOLO mode.

---

## Model Selection

Aliases: `sonnet`, `opus`, `haiku`, `fable`, `best`, `opusplan`, plus `[1m]` variants such as `opus[1m]`. `default` clears any override. From highest priority down: `/model` in-session, `--model` at launch, `ANTHROPIC_MODEL`, the `model` setting, then `ANTHROPIC_DEFAULT_MODEL`.

My default is `sonnet` for day-to-day work. I switch to `opus` or `fable` for gnarly cross-module refactors and root-cause work, and use `opusplan` when I want Opus in plan mode and Sonnet for execution. Use `/effort` to trade reasoning depth for speed and cost.

---

## Testing the Connection

Three checks before I trust a new machine or CI runner:

```bash
claude -p "Reply with the single word: pong"
claude auth status --text
claude doctor
```

Then inside a session, `/status` opens the Status tab: version, model, account, connectivity, and a `Setting sources` line showing which managed source applies. If something is off, `/status` usually tells you why faster than anything else.

---

## The Commands and Flags I Actually Use

### CLI Flags

```bash
claude                                  # interactive session
claude "explain the order service"      # interactive with an initial prompt
claude -p "query"                       # print/headless mode, then exit
cat build.log | claude -p "root cause?" # pipe content in
claude -c                               # continue most recent session in this dir
claude -r "auth-refactor" "finish it"   # resume by ID or name
claude -n auth-refactor                 # name a session
claude --resume abc123 --fork-session   # branch off a prior session
claude --permission-mode plan           # start read-only
claude --model opus                     # choose a model for this launch
claude -w feature-auth                  # isolated git worktree session
claude --add-dir ../shared-lib          # grant access to another directory
```

### Headless-Specific Flags

```bash
claude -p "Summarize this project" --output-format json | jq -r '.result'
claude -p "..." --output-format stream-json --verbose --include-partial-messages
claude -p "..." --max-turns 10 --max-budget-usd 2.00
claude -p "..." --allowedTools "Read,Edit,Bash(./mvnw test *)"
claude -p "..." --disallowedTools "Bash(git push *)"
claude --bare -p "..."   # skip hooks, skills, MCP, CLAUDE.md discovery for fast scripted calls
```

`--output-format` accepts `text`, `json`, or `stream-json`. The JSON payload includes `total_cost_usd`, which is handy for CI budgets. `--json-schema` gets you validated structured output.

### Slash Commands

| Command | What I use it for |
|---------|-------------------|
| `/init` | Generate a starter `CLAUDE.md` |
| `/clear` | Fresh context between unrelated tasks |
| `/compact [focus]` | Summarize the conversation, optionally telling it what to keep |
| `/context` | See what's eating the context window |
| `/model` | Switch model (saves as default; press `s` for session-only) |
| `/effort` | Adjust reasoning effort |
| `/permissions` | View and edit allow/ask/deny rules by scope |
| `/config` | Settings UI, or `/config key=value` |
| `/memory` | Edit CLAUDE.md files and manage auto memory |
| `/mcp` | Manage MCP connections and OAuth |
| `/hooks` | Browse configured hooks by event |
| `/agents` | Since v2.1.198 it only prints a reminder; create subagents by asking Claude or editing `.claude/agents/` |
| `/skills` | List skills and their token cost |
| `/plan [task]` | Jump into plan mode |
| `/rewind` | Roll back conversation and/or code to a checkpoint |
| `/resume` | Session picker |
| `/usage` | Session cost and plan limits (`/cost` is an alias) |
| `/statusline` | Generate or configure a status line |
| `/sandbox` | Toggle the Bash sandbox |
| `/review`, `/security-review` | Review the current diff |

Two input shortcuts I use constantly: `@path` to reference a file with autocomplete, and a leading `!` to run a shell command and feed its output to Claude.

---

## Starting on a Real Repo

### `/init` and CLAUDE.md

The first thing I do on any repo is run `/init`, then **delete half of what it generates**. CLAUDE.md is loaded into every session, and the docs say plainly that bloated files reduce adherence. Aim for under 200 lines. For every line, ask: *would removing this cause Claude to make mistakes?*

**What belongs there:**
- Build/test commands Claude can't guess (`./mvnw -pl order-service test -Dtest=...`)
- Conventions that differ from defaults
- Architectural decisions and module boundaries
- Environment quirks (required env vars, local Docker dependencies)
- Repo etiquette: branch naming, commit format, PR checklist

**What doesn't belong:** anything readable from the code, generic advice like "write clean code", long tutorials, or file-by-file tours.

### Example CLAUDE.md

```markdown
# Order Platform

## Build & test
- Build: `./mvnw -q -DskipTests package`
- Unit tests for one module: `./mvnw -pl order-service test`
- Single test: `./mvnw -pl order-service test -Dtest=OrderServiceTest#rejectsExpiredCoupon`
- Integration tests need Docker running (Testcontainers).

## Conventions
- Controllers stay thin; business logic lives in `*Service` classes.
- DTOs are Java records in `api/dto`; never expose JPA entities from controllers.
- Use constructor injection only. No field `@Autowired`.
- Schema changes go through Flyway migrations in `src/main/resources/db/migration`.

## Workflow
- Write or update a failing test before changing behavior.
- Run the module's tests before declaring a task done.

## References
- API error format: @docs/error-contract.md

# Compact instructions
When compacting, keep test output, failing test names, and the current plan.
```

### Where the Files Live

- `./CLAUDE.md` or `./.claude/CLAUDE.md` for the team
- `./CLAUDE.local.md` for personal notes (gitignore it)
- `~/.claude/CLAUDE.md` for you everywhere
- A managed-policy location for org-wide rules

### Nesting

Claude Code loads CLAUDE.md from the working directory and every parent. Files in subdirectories load lazily, when Claude reads files there. In a multi-module Maven repo I keep a short root file and a module-level `CLAUDE.md` for modules with unusual rules.

### Imports and Path-Scoped Rules

`@path/to/file` imports another file, resolved relative to the importing file, up to four hops deep. Imports help with organization but **don't save context**, because imported files load at launch. For guidance that only applies to part of the codebase, use `.claude/rules/` with `paths:` frontmatter so it loads only when matching files are touched:

```markdown
---
paths:
  - "src/main/java/**/api/**/*.java"
---
# API rules
- Every endpoint validates input with Bean Validation annotations.
- Errors use the ProblemDetail format described in docs/error-contract.md.
```

If your repo already has an `AGENTS.md` and no CLAUDE.md, Claude Code reads it. If you have both, it reads CLAUDE.md only, unless your CLAUDE.md imports `AGENTS.md`.

---

## Explore, Plan, Code, Commit

This is the official recommended loop, and it matches how I'd run a human engineer on unfamiliar code:

1. **Explore** in plan mode (`Shift+Tab` until plan mode is on, or `claude --permission-mode plan`). "Read the order and pricing modules and explain how coupons are applied."
2. **Plan.** "I want to support stacked coupons. What changes, in which files, and what are the risks?" Press `Ctrl+G` to edit the plan in your editor before approving.
3. **Implement** against the plan, with tests.
4. **Commit** with a descriptive message and open a PR.

Skip planning when you could describe the diff in one sentence. Planning pays off when the change spans multiple files or you don't know the code.

---

## Test-First Loop

The single highest-leverage habit: **give Claude a way to verify its own work**. My prompt shape for behavior changes:

> Write a failing test in `OrderServiceTest` that captures stacked coupons. Run it and show me it fails. Then implement the minimum change to pass. Then run the whole `order-service` module's tests. Don't modify existing tests without asking.

That last sentence matters. Agents will "fix" a failing test by weakening the assertion if you let them. Watch for this pattern: if a test suddenly passes without the implementation changing, check the assertion.

---

## Parallel Sessions with Worktrees

```bash
claude --worktree feature-stacked-coupons
claude -w "#1234"            # worktree from a PR number
```

Each worktree lives at `<repo>/.claude/worktrees/<name>`, so parallel sessions don't trample each other's files. Worktrees are fresh checkouts, so gitignored files like `.env` aren't there. List them in a `.worktreeinclude` file at the repo root to have them copied in. You can also use plain `git worktree add ../project-feature-a -b feature-a` and start `claude` inside it.

My limit is about as many parallel sessions as I can actually **review**. Past that, you're just generating unreviewed diffs faster.

---

## What's Next

Getting started well comes down to three habits: know which settings and credentials win, keep CLAUDE.md short and specific, and make Claude plan and prove its work with tests.

**Official docs:** [https://code.claude.com/docs/en/setup](https://code.claude.com/docs/en/setup) and [https://code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)

---

**Next:** [Part 2: The Power-User Setup](/claude-code/part-2-power-user-setup) — Statusline, skills, hooks, subagents, MCP, and running Claude Code headless in CI.
