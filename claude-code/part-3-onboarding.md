# Claude Code on a Real Codebase, Part 3: Onboarding a New Engineer

> How to make an AI coding agent a tour guide for new hires, not a replacement for their mentors, with the configs to back it up.

---

Most "AI for onboarding" advice comes down to "let the new hire ask the chatbot." That produces someone who can ship diffs in week one and still can't explain the system in month three.

I want the reverse. The agent handles the low-value parts of onboarding: finding files, decoding jargon, digging through history, getting the environment running. That frees humans for the high-value parts: judgment, context, taste, and relationships.

This is Part 3 of my four-part series, and it stands alone. Part 2 covers the mechanics of skills, hooks, and subagents.

**My design principle: Claude Code is the tour guide, not the mentor.** Every idea below either speeds up a newcomer's understanding or gets them to a human faster.

The Claude Code features I rely on were checked against the official docs as of October 2026. The file names, layouts, and scripts are my own designs. Treat them as examples to adapt.

## In This Series

| Part | Topic |
|------|-------|
| [Part 1](/claude-code/part-1-getting-started) | Getting Started the Right Way |
| [Part 2](/claude-code/part-2-power-user-setup) | The Power-User Setup |
| **Part 3** | Onboarding a New Engineer (this article) |
| Part 4 | Guardrails, Rollout, and Value (coming next) |

---

## Put the Onboarding Kit in the Repo

Onboarding material rots when it lives in a wiki nobody owns. I keep it next to the code, reviewed like code, with owners in CODEOWNERS:

```
.claude/
  profiles/
    newcomer.json               # newcomer permission profile + nudge hooks
  hooks/
    newcomer-session.sh         # SessionStart: "you're in newcomer mode"
    ownership-guard.sh          # PreToolUse: CODEOWNERS-aware ask/deny
    remind-tests.sh             # Stop: nudge to run tests before finishing
    log-question.sh             # UserPromptSubmit: opt-in docs-debt log
  agents/
    onboarding-buddy.md         # read-only, cites paths, names humans
  skills/
    onboard/SKILL.md            # guided tour driven by tour.yaml
    why-is-it-like-this/SKILL.md
    capture-decision/SKILL.md
    explain-pr/SKILL.md
    rehearse-runbook/SKILL.md
    docs-debt/SKILL.md
docs/
  onboarding/
    tour.yaml                   # the checked-in tour map
    glossary.md                 # domain glossary (imported by CLAUDE.md)
    packs/                      # generated starter-issue context packs
  adr/                          # architecture decision records
CODEOWNERS
```

The `.claude/agents` and `.claude/skills` locations are the documented ones. The `profiles/` folder and everything under `docs/onboarding/` are my conventions.

---

## 1. A Newcomer-Safe Permission Profile

A new engineer shouldn't be one approval away from production in week one. Rather than have them hand-edit settings, I ship a separate, reviewed settings file and an alias that loads it with the `--settings` flag, which sits above project and user settings in precedence. Deny rules merge across scopes, so the profile only adds restrictions.

### What the Profile Does

| Category | Configuration |
|----------|---------------|
| **Default mode** | `plan` — pushes the newcomer to read before editing |
| **Allow** | Test runs and read-only git (`log`, `blame`, `diff`) |
| **Ask** | Before commits and before edits to database migrations |
| **Deny** | `git push`, deploy scripts, `kubectl`, `helm`, `terraform apply`, reads of `.env` files, cloud credentials, kubeconfig |

### Example Profile

`.claude/profiles/newcomer.json`:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "defaultMode": "plan",
    "allow": [
      "Bash(./mvnw test *)",
      "Bash(./mvnw -pl * test *)",
      "Bash(git log *)",
      "Bash(git blame *)",
      "Bash(git diff *)",
      "Bash(gh pr view *)",
      "Bash(gh pr diff *)"
    ],
    "ask": [
      "Bash(git commit *)",
      "Edit(./src/main/resources/db/migration/**)"
    ],
    "deny": [
      "Bash(git push *)",
      "Bash(./deploy*)",
      "Bash(kubectl *)",
      "Bash(helm *)",
      "Bash(terraform apply *)",
      "Bash(aws * --profile prod*)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(~/.aws/credentials)",
      "Read(~/.kube/config)",
      "Read(./secrets/**)"
    ]
  },
  "hooks": {
    "SessionStart": [
      { "matcher": "startup", "hooks": [
        { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/newcomer-session.sh" } ] }
    ],
    "PreToolUse": [
      { "matcher": "Edit|Write", "hooks": [
        { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/ownership-guard.sh" } ] }
    ],
    "Stop": [
      { "hooks": [
        { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/remind-tests.sh" } ] }
    ]
  }
}
```

### Usage

```bash
# in the onboarding doc
alias claude-new='claude --settings .claude/profiles/newcomer.json'
```

::: warning Rules Are a Seatbelt, Not a Boundary
A `*` can sit anywhere in a Bash rule and matches any text, so keep middle wildcards like `./mvnw -pl * test *` narrow. Rules match commands as written, so real protection still comes from not handing a week-one laptop prod credentials, plus the sandbox.
:::

A shared profile is easier to reason about than per-person local settings. When the newcomer "graduates," they just stop using the alias. Nothing to uninstall.

---

## 2. A Guided Tour with `/onboard`

I check a `tour.yaml` into the repo. Each stop has a title, the real files involved, a checkpoint question the newcomer should be able to answer afterward, and an owning team.

### Example Tour Map

`docs/onboarding/tour.yaml`:

```yaml
- id: request-lifecycle
  title: "How an order request flows"
  files:
    - order-service/src/main/java/com/acme/order/api/OrderController.java
    - order-service/src/main/java/com/acme/order/service/OrderService.java
  checkpoint: "Where is the coupon validated, and what happens if it's expired?"
  owner: "@team-orders"
  
- id: persistence
  title: "Schema and migrations"
  files:
    - order-service/src/main/resources/db/migration/
  checkpoint: "Why do we never edit an applied Flyway migration?"
  owner: "@team-platform"
```

### The `/onboard` Skill

`.claude/skills/onboard/SKILL.md`:

```markdown
---
name: onboard
description: Guided codebase tour for new team members, driven by docs/onboarding/tour.yaml. Use only when the user runs /onboard.
disable-model-invocation: true
argument-hint: "[stop-id | next | list]"
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Codebase tour

## Tour map
!`cat docs/onboarding/tour.yaml`

## Rules
- Argument: $ARGUMENTS. If empty or `list`, show the stops with titles. If `next`, pick the first stop the user hasn't completed in this session.
- For a stop: read ONLY the listed files first. Explain the flow in under 250 words, citing `path:line` for every claim.
- Then ask the stop's checkpoint question and WAIT. Do not answer it for the user.
- After their answer, correct misconceptions, citing files. Suggest the owner for deeper questions.
- If a listed file no longer exists, say so plainly and suggest updating tour.yaml. Never invent a replacement path.
- Never edit code during the tour.
```

::: tip Key Design Decisions
- `disable-model-invocation: true` keeps the tour from starting uninvited
- Checkpoint-and-wait makes the newcomer think
- The missing-file rule turns tour rot into a visible signal
:::

---

## 3. The Domain Glossary

Every business domain has words that mean something specific. I keep one glossary file and import it into CLAUDE.md:

```markdown
<!-- CLAUDE.md -->
## Domain language
@docs/onboarding/glossary.md
```

`docs/onboarding/glossary.md`:

```markdown
- **Order** — a customer's intent to buy; NOT a shipment. Shipments are `Fulfillment`s.
- **Hold** — a soft inventory reservation that expires after the TTL in `InventoryProperties`.
- **Legacy SKU** — pre-2021 identifier format; only `LegacySkuMapper` may parse it.
```

Imports load at launch, so keep the glossary tight: definitions and the one class that owns each concept. The payoff runs both ways: the agent uses the team's vocabulary, and the newcomer picks it up from its answers.

---

## 4. The Onboarding Buddy Subagent

This is a read-only subagent whose whole job is to answer "where/what/how does X work here" from the repo itself, show its sources, and say **who to ask** when the repo doesn't answer the question.

`.claude/agents/onboarding-buddy.md`:

```markdown
---
name: onboarding-buddy
description: Answers a new team member's questions about this codebase using only repository files and docs, with file-path citations. Use for "where is", "how does", "what does X mean here" questions from newcomers.
tools: Read, Grep, Glob
model: sonnet
permissionMode: plan
color: green
---
You help a new engineer understand this repository.

Rules:
1. Answer ONLY from files in this repo. Cite every claim as `path:line` or `path`.
2. If the repo doesn't answer the question, say "The repo doesn't document this." Then look up the closest matching path in CODEOWNERS and say who to ask. Never guess at business rules.
3. Prefer docs/adr/, docs/onboarding/, and module README files over inferring from code.
4. Separate "what the code does" (verifiable) from "why" (only if an ADR or comment says so).
5. End with one follow-up question the newcomer should be able to answer themselves.
6. Keep answers under 300 words unless asked for more.
```

::: tip The CODEOWNERS Rule
The CODEOWNERS rule is the one I'd defend hardest. It makes the agent a router *into* the human network instead of a substitute for it.
:::

The newcomer can run it as the main session with `claude --agent onboarding-buddy`. Because custom subagents load CLAUDE.md, the buddy gets the glossary for free.

---

## 5. "Why Is It Like This?" History Mining

The question newcomers most want answered, and are least likely to ask, is *why* something odd exists. The answer is usually in git history, a PR discussion, or an ADR.

`.claude/skills/why-is-it-like-this/SKILL.md`:

```markdown
---
name: why-is-it-like-this
description: Explains the history behind a file, class, or code region by mining git log, git blame, linked PRs, and ADRs. Use when the user asks why code is written a certain way or when something looks odd or legacy.
argument-hint: "[path] [optional: symbol or line range]"
allowed-tools:
  - "Bash(git log *)"
  - "Bash(git blame *)"
  - "Bash(git show *)"
  - "Bash(gh pr view *)"
  - Read
  - Grep
---

# Why is it like this?

Target: $ARGUMENTS

1. Run `git log --follow --format='%h %ad %an %s' --date=short -- <path>` and pick the commits that changed the relevant region (use `git log -L` for a line range or function).
2. `git blame` the region. For the 3 most relevant commits, `git show --stat` them.
3. If commit messages reference PR numbers, run `gh pr view <n> --comments` and extract the reasoning.
4. Search `docs/adr/` for the module or concept.
5. Report as:
   - **What it does today** (cite path:line)
   - **Timeline**: dated bullets, each with a commit hash or PR number
   - **Stated reasons**: only reasons found in commits, PRs, or ADRs, quoted briefly
   - **Unknowns**: what the history doesn't explain, plus who to ask (from CODEOWNERS or the most frequent recent author)
6. Never present a guess as the historical reason. Label inferences as "Inference:".
```

When "Unknowns" keeps coming back with the same gap, that's an ADR someone should write.

---

## 6. Capturing Tribal Knowledge as ADRs

Staff engineers carry a lot of undocumented "we tried that in 2023" knowledge. This skill turns a PR discussion or a pasted chat thread into a draft ADR for a human to review.

`.claude/skills/capture-decision/SKILL.md`:

```markdown
---
name: capture-decision
description: Drafts an Architecture Decision Record from a PR discussion or a pasted chat thread. Only run when the user invokes /capture-decision.
disable-model-invocation: true
argument-hint: "[PR number, or paste the thread after the command]"
allowed-tools:
  - "Bash(gh pr view *)"
  - "Bash(ls docs/adr*)"
  - Read
  - "Edit(./docs/adr/**)"
---

# Capture a decision

Source: $ARGUMENTS
If the source is a number, run `gh pr view <number> --comments`. Otherwise use the pasted text.

Write `docs/adr/NNNN-<kebab-title>.md`, where NNNN is the next number after the highest existing ADR, using:

## Status
Proposed (drafted by Claude from <source>; needs human review)
## Context
## Decision
## Alternatives considered
## Consequences
## People involved   (names/handles from the source only)
## Open questions

Rules: attribute every claim to the discussion. Do not add reasoning nobody stated; list gaps under Open questions.
Remove secrets, customer data, and anything that looks like a credential. Print the file path when done.
```

::: warning ADD YOUR STORY
A decision that lived only in someone's head until it was written down, and what it cost before it was.
:::

---

## 7. Context Packs for Starter Issues

"Good first issue" labels are usually a lie: the issue is small, but finding the context isn't. I run a headless pass that pre-scopes labeled issues into **context packs**: relevant files, similar past PRs, tests to extend, risks, and the human to ask.

`scripts/onboarding/build-context-packs.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
mkdir -p docs/onboarding/packs

gh issue list --label "good-first-issue" --state open --json number,title,body --limit 20 |
jq -c '.[]' | while read -r issue; do
  n=$(jq -r '.number' <<<"$issue")
  claude -p "You are preparing a context pack for a new engineer. Issue JSON: $issue
Produce Markdown with sections: Summary, Relevant files (path + why), Similar past changes (git log evidence),
Tests to extend, Risks / things not to touch, Suggested first step, Who to ask (from CODEOWNERS).
Estimate size as S/M/L with a one-line justification. If the issue is not newcomer-appropriate, say so first." \
    --permission-mode dontAsk \
    --allowedTools "Read,Grep,Glob,Bash(git log *)" \
    --max-turns 15 \
    --output-format json | jq -r '.result' > "docs/onboarding/packs/issue-$n.md"
done
```

::: tip Design Choices
- `dontAsk` plus explicit `--allowedTools` means anything not pre-approved is denied
- `--max-turns` bounds each run
- The script writes local files and never comments on issues
- Publishing a pack is a human decision
:::

---

## 8. Nudge Hooks That Teach

These hooks live in the newcomer profile, so experienced engineers don't pay for them.

### Ownership Guard

A `PreToolUse` hook that returns a JSON `permissionDecision`:

```bash
#!/usr/bin/env bash
# .claude/hooks/ownership-guard.sh
INPUT=$(cat)
FILE=$(jq -r '.tool_input.file_path // empty' <<<"$INPUT")
REL="${FILE#"$CLAUDE_PROJECT_DIR"/}"

case "$REL" in
  */target/*|*/generated/*|*/build/generated-sources/*)
    jq -n --arg r "$REL is generated. Change the source (OpenAPI spec / proto) and regenerate instead." \
      '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
    exit 0 ;;
esac

OWNER=""
while read -r pattern owners; do
  [[ -z "$pattern" || "$pattern" == \#* ]] && continue
  p="${pattern#/}"
  [[ "$REL" == $p* ]] && OWNER="$owners"   # last match wins, as in CODEOWNERS
done < "$CLAUDE_PROJECT_DIR/CODEOWNERS"

if [[ -n "$OWNER" && "$OWNER" != *"@team-orders"* ]]; then
  jq -n --arg r "Heads up: $REL is owned by $OWNER. Loop them in before changing it." \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$r}}'
fi
exit 0
```

### Test and Explain Reminder

A `Stop` hook that returns `additionalContext`:

```bash
#!/usr/bin/env bash
# .claude/hooks/remind-tests.sh
INPUT=$(cat)
[[ "$(jq -r '.stop_hook_active' <<<"$INPUT")" == "true" ]] && exit 0
cd "$CLAUDE_PROJECT_DIR"
if git diff --name-only | grep -q '\.java$'; then
  jq -n '{hookSpecificOutput:{hookEventName:"Stop",
    additionalContext:"Java files changed. Before finishing: run the affected module tests with ./mvnw -pl <module> test and report results, and explain to the user what each change does."}}'
fi
exit 0
```

### Session Banner

A `SessionStart` hook:

```bash
#!/usr/bin/env bash
# .claude/hooks/newcomer-session.sh
jq -n '{hookSpecificOutput:{hookEventName:"SessionStart",
  additionalContext:"The user is new to this codebase. Prefer explaining over doing. Cite file paths. When a question concerns business rules or ownership, point them to CODEOWNERS and suggest asking a human. Suggest /onboard, /why-is-it-like-this, and /explain-pr when relevant."}}'
```

---

## 9. Review Shadowing with `/explain-pr`

Team review standards are the most tacit knowledge there is. This skill runs in two phases.

`.claude/skills/explain-pr/SKILL.md`:

```markdown
---
name: explain-pr
description: Review-shadowing exercise for learning this team's review standards from a merged or open PR. Only run when the user invokes /explain-pr.
disable-model-invocation: true
argument-hint: "[PR number]"
allowed-tools:
  - "Bash(gh pr view *)"
  - "Bash(gh pr diff *)"
  - Read
  - Grep
---

# Explain PR $0

Phase 1 (no spoilers):
- Run `gh pr diff $0` and `gh pr view $0` (WITHOUT comments). Explain the change: intent, files, risk areas. Cite paths.
- Ask the user: "What would you flag in review?" Then STOP and wait.

Phase 2 (after they answer):
- Run `gh pr view $0 --comments`. Compare their predictions to the actual review.
- Group reviewer comments into themes (e.g. naming, transaction boundaries, test coverage, API compatibility).
- For each theme, point to where the standard is written (CLAUDE.md, .claude/rules/, docs). If it isn't written anywhere, say "Unwritten standard" and suggest the doc it belongs in.
- End with 2 questions the user could ask the reviewer to learn more.
```

The "Unwritten standard" line is the hidden benefit. Each shadowing session also audits how much of your review culture is written down.

---

## 10. Runbook Rehearsal

Nobody should read a runbook for the first time at 3 a.m.

`.claude/skills/rehearse-runbook/SKILL.md`:

```markdown
---
name: rehearse-runbook
description: Walks a new on-call engineer through a runbook as a dry-run rehearsal against staging. Only run when the user invokes /rehearse-runbook.
disable-model-invocation: true
argument-hint: "[runbook path, e.g. docs/runbooks/order-backlog.md]"
allowed-tools:
  - Read
  - "Bash(kubectl --context staging get *)"
  - "Bash(kubectl --context staging describe *)"
  - "Bash(kubectl --context staging logs *)"
---

# Runbook rehearsal: $ARGUMENTS

- Read the runbook. For each step, ask the user what they expect the step to show BEFORE running anything.
- Only read-only commands against the `staging` context may run. For any mutating step (scale, rollout, delete, apply),
  print the command with `--dry-run=server` or describe it, and never execute it.
- After each step, compare expected vs actual output and explain the signal to look for.
- Flag runbook steps that are stale, ambiguous, or reference missing dashboards; collect them as "Runbook fixes" at the end.
```

Launch with a rehearsal profile that limits network access to staging:

```json
{
  "permissions": {
    "defaultMode": "default",
    "deny": ["Bash(kubectl --context prod*)", "Bash(kubectl * delete *)", "Bash(kubectl * apply *)"]
  },
  "sandbox": {
    "enabled": true,
    "network": { "allowedDomains": ["k8s.staging.example.internal", "logs.staging.example.internal"] }
  }
}
```

---

## 11. The Docs-Debt Loop

Every newcomer question is a free bug report against your documentation. I capture it, **opt-in and local-only**, and turn it into doc fixes.

### Question Logger Hook

```bash
#!/usr/bin/env bash
# .claude/hooks/log-question.sh (opt-in via ONBOARDING_LOG=1)
[[ "${ONBOARDING_LOG:-0}" == "1" ]] || exit 0
INPUT=$(cat)
PROMPT=$(jq -r '.prompt' <<<"$INPUT")
[[ "$PROMPT" == *\?* ]] || exit 0            # questions only
mkdir -p "$CLAUDE_PROJECT_DIR/.onboarding"
jq -nc --arg p "$PROMPT" --arg t "$(date -Iseconds)" '{t:$t, q:$p}' \
  >> "$CLAUDE_PROJECT_DIR/.onboarding/questions.jsonl"
exit 0
```

### Weekly Review Skill

```markdown
---
name: docs-debt
description: Clusters logged newcomer questions and proposes documentation fixes. Only run when the user invokes /docs-debt.
disable-model-invocation: true
allowed-tools:
  - Read
  - Grep
  - Glob
---
Read `.onboarding/questions.jsonl`. Cluster questions by topic. For each cluster:
- Check whether CLAUDE.md, docs/, tour.yaml, or glossary.md already answers it (cite if so: that's a discoverability problem).
- If not, propose the smallest doc change that would have answered it: which file, and the exact text.
Output a checklist. Do not edit files; the user will pick which fixes to make.
```

The newcomer's first PRs are often doc fixes for the confusion they just had.

---

## 12. A 30/60/90-Day Arc

The agent's role should shrink from guide to tool as the engineer grows.

### Days 1–30: Read, Ask, Rehearse

- Use `claude-new` (newcomer profile, plan mode by default)
- Work through `/onboard` stops with a mentor reviewing checkpoint answers
- Use `onboarding-buddy` and `/why-is-it-like-this` freely, and escalate to the named humans
- Shadow two or three PRs with `/explain-pr`
- First PRs: doc fixes from `/docs-debt`, then one curated starter issue with its context pack

### Days 31–60: Build with Guardrails

- Switch to the normal team settings; keep the ownership-guard hook if useful
- Explore-plan-code-commit on real tickets, test-first
- Capture one decision with `/capture-decision`
- Rehearse the on-call runbooks with `/rehearse-runbook` before joining the rotation

### Days 61–90: Contribute to the System

- Drop the newcomer profile entirely
- Improve the onboarding kit: add a tour stop, a glossary entry, or a skill for a procedure they had to learn the hard way
- Pair with the next newcomer. The best test of understanding is explaining it to someone else

---

## 13. Measuring Onboarding

::: warning ADD YOUR DATA
Onboarding signals from a real cohort, before and after. Don't publish estimates.
:::

| Signal | How I'd collect it |
|--------|-------------------|
| Time to first merged PR | Git/PR history from start date |
| Time to first non-doc PR | Same, excluding docs-only |
| Questions answered by buddy vs. escalated to humans | `questions.jsonl` + buddy "who to ask" outputs, self-reported |
| Doc fixes merged from docs-debt | PRs touching `docs/`, CLAUDE.md, tour.yaml |
| Tour checkpoint accuracy | Mentor review of `/onboard` answers |
| Newcomer confidence (self-rated, week 2/6/12) | Short survey |
| Review rework on first 5 PRs | Comment and follow-up commit counts |

::: warning Metrics Warning
"Questions deflected" is a tempting metric, but a trap if you optimize it alone. A buddy that answers everything and never escalates may be hiding misunderstandings. Read deflection together with checkpoint accuracy and review rework.
:::

---

## 14. Pitfalls: Keep Humans in the Loop

| Pitfall | Mitigation |
|---------|------------|
| **Over-trusting the agent** | Newcomers can't tell plausible from correct. Citations and labeled inferences help. Teach people to click the citation before believing the claim. |
| **Skipping the learning** | Rule: in the first 30 days, you must explain every line of your PR in review without the agent open. Reviewers ask. |
| **Isolation** | The "who to ask" rules, checkpoint reviews, and weekly docs-debt sessions create human touchpoints on purpose. |
| **Stale kit** | Tour maps, glossaries, and packs rot. Owners are in CODEOWNERS, the tour skill reports missing files, run `/doctor prompt-audit` periodically. |
| **Privacy and data policy** | Question logs are opt-in and local; pasted threads get scrubbed; tracker access is read-only. Check your company's policies. |
| **Mentor atrophy** | Seniors may assume "the agent has it covered." It doesn't. Put mentorship time on the calendar. |

::: warning ADD YOUR STORY
How this played out with a real new hire, and what you changed afterward.
:::

---

## What's Next

Done right, Claude Code makes a new engineer's first ninety days faster. More importantly, it leaves the codebase easier to learn for everyone who comes after them.

**Official docs:** [https://code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills), [https://code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents), and [https://code.claude.com/docs/en/hooks-guide](https://code.claude.com/docs/en/hooks-guide)

---

**Previous:** [Part 2: The Power-User Setup](/claude-code/part-2-power-user-setup)

**Next:** Part 4: Guardrails, Rollout, and Value — Where AI coding agents shine, where they fail, and how to prove they're worth it.
