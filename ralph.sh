#!/usr/bin/env bash
# ralph.sh — Autonomous agent loop for jsx-airline-ui
#
# Ralph picks up the next unblocked AFK GitHub issue, spawns a Claude Code
# agent to implement it, commits the work on a feature branch, opens a PR,
# and loops until no unblocked tasks remain.
#
# Usage:
#   ./ralph.sh              # Run one iteration (pick up one issue and implement it)
#   ./ralph.sh --loop       # Keep looping until no unblocked tasks remain
#   ./ralph.sh --issue 14   # Force-pick a specific issue number
#
# Requirements:
#   - gh CLI authenticated (gh auth status)
#   - claude CLI available (claude --version)
#   - git working tree clean before starting

set -euo pipefail

REPO="zeal-daisy-le/jsx-airline-ui"
PRD_PATH="$(dirname "$0")/PRD.md"
LOOP=false
FORCE_ISSUE=""

# ── Argument parsing ──────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --loop)     LOOP=true ;;
    --issue=*)  FORCE_ISSUE="${arg#*=}" ;;
    --issue)    shift; FORCE_ISSUE="$1" ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────────

log()  { echo "[ralph] $*"; }
info() { echo "[ralph] ✅ $*"; }
warn() { echo "[ralph] ⚠️  $*"; }
fail() { echo "[ralph] ❌ $*" >&2; exit 1; }

# Returns exit code 0 if the issue has no open blockers, 1 otherwise.
is_unblocked() {
  local issue_number="$1"
  local body
  body=$(gh issue view "$issue_number" --repo "$REPO" --json body --jq '.body' 2>/dev/null)

  # Extract issue numbers from the "## Blocked by" section.
  # Handles both "#N" references and full GitHub issue URLs.
  local blockers
  blockers=$(echo "$body" \
    | awk '/^## Blocked by/,/^## /' \
    | grep -oE '#[0-9]+' \
    | grep -oE '[0-9]+' || true)

  if [[ -z "$blockers" ]]; then
    return 0
  fi

  for blocker in $blockers; do
    local state
    state=$(gh issue view "$blocker" --repo "$REPO" --json state --jq '.state' 2>/dev/null || echo "OPEN")
    if [[ "$state" != "CLOSED" ]]; then
      return 1
    fi
  done

  return 0
}

# Prints the issue number of the next unblocked AFK issue, or nothing.
find_next_issue() {
  local issues
  issues=$(gh issue list \
    --repo "$REPO" \
    --label "AFK" \
    --state open \
    --json number \
    --jq 'sort_by(.number) | .[].number')

  for number in $issues; do
    # Skip issues already claimed or completed by Ralph.
    local labels
    labels=$(gh issue view "$number" --repo "$REPO" --json labels --jq '[.labels[].name] | join(",")' 2>/dev/null || echo "")
    if echo "$labels" | grep -qE "in-progress|ralph-done"; then
      continue
    fi

    if is_unblocked "$number"; then
      echo "$number"
      return
    fi
  done
}

# Sanitises a string into a valid git branch name segment.
slugify() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9]/-/g' \
    | sed 's/--*/-/g' \
    | sed 's/^-//;s/-$//' \
    | cut -c1-50
}

# ── Core: run one issue ───────────────────────────────────────────────────────

run_issue() {
  local issue_number="$1"

  local issue_json
  issue_json=$(gh issue view "$issue_number" --repo "$REPO" --json title,body,labels)

  local title body
  title=$(echo "$issue_json" | jq -r '.title')
  body=$(echo  "$issue_json" | jq -r '.body')

  log "Picked up issue #$issue_number: $title"

  # Claim the issue before doing any work.
  gh issue edit "$issue_number" --repo "$REPO" --add-label "in-progress" >/dev/null
  gh issue comment "$issue_number" --repo "$REPO" \
    --body "Ralph is starting work on this issue." >/dev/null

  # Create a feature branch (prune worktrees and delete local copy first if it already exists).
  local branch="ralph/issue-${issue_number}-$(slugify "$title")"
  git fetch origin main --quiet
  git worktree prune 2>/dev/null || true
  git branch -D "$branch" 2>/dev/null || true
  git checkout -b "$branch" origin/main

  # Build the agent prompt.
  local prd_context=""
  if [[ -f "$PRD_PATH" ]]; then
    prd_context=$(cat "$PRD_PATH")
  fi

  local prompt
  prompt=$(cat <<AGENT_PROMPT
You are Ralph, an autonomous development agent for the JSX Airline UI project.

Your job is to implement the following GitHub issue completely and correctly.
Satisfy every acceptance criterion. Write tests where the issue requires them.
Commit your work with a message referencing the issue number.

Do NOT open a PR — that is handled by the calling script.
Do NOT close the issue — that is handled by the calling script.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISSUE #${issue_number}: ${title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${body}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT CONTEXT (PRD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${prd_context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIGMA DESIGN SYSTEM — MANDATORY FOR ALL UI WORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The official JSX UI designs live in Figma. For ANY issue that involves
building or modifying a UI component, page, or visual element, you MUST:

1. Use the Figma MCP tool \`mcp__plugin_figma_figma__get_screenshot\` or
   \`mcp__plugin_figma_figma__get_design_context\` to fetch the relevant
   design before writing any JSX/TSX.

2. Figma file key: 8TPHDvgnAX08HgIZlja3jK
   Full URL: https://www.figma.com/design/8TPHDvgnAX08HgIZlja3jK/JSX-UI-Design

3. Start by calling \`mcp__plugin_figma_figma__get_metadata\` with just the
   fileKey to list all pages, then drill into the relevant node.

4. Match colours, spacing, typography, border-radius, and component
   structure exactly to the Figma spec. Use Tailwind utility classes —
   do not hardcode hex values; map them to the design tokens in
   tailwind.config.ts.

5. If a specific node ID is not known, use get_metadata to browse the
   file tree and identify the correct frame before implementing.

6. For non-UI issues (BFF endpoints, store logic, tests, config) the
   Figma MCP is not required — skip it and focus on the logic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURE DECISIONS (locked in)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Framework:      Next.js 14 Pages Router (TypeScript)
- Styling:        Tailwind CSS + shadcn/ui (Radix primitives)
- Animation:      Framer Motion (one hero entrance + micro-interactions only)
- State:          Zustand + sessionStorage (guests) / BFF sync (logged-in)
- Routing:        Step-based URLs (/booking/[step]) + Zustand store
- Forms:          React Hook Form + Zod
- BFF:            Next.js API Routes (proxy to Navitaire, never expose credentials)
- Auth:           Guest checkout allowed; optional JWT via httpOnly cookie
- Deployment:     Vercel
- Analytics:      GA4 + Sentry
- Rate limiting:  Upstash Redis
- Testing:        Vitest + MSW + Playwright + axe-core
- Accessibility:  WCAG 2.1 AA mandatory on every component
AGENT_PROMPT
)

  # Invoke Claude Code in non-interactive (print) mode.
  log "Invoking Claude Code agent..."
  claude --print "$prompt"

  # Verify something was committed.
  if git diff --quiet origin/main; then
    warn "No changes committed for issue #$issue_number — marking for human review."
    gh issue edit "$issue_number" --repo "$REPO" \
      --remove-label "in-progress" --add-label "HITL" >/dev/null
    gh issue comment "$issue_number" --repo "$REPO" \
      --body "Ralph completed without committing any changes. Flagging for human review." >/dev/null
    git checkout main
    git branch -D "$branch"
    return
  fi

  # Push and open a PR.
  git push -u origin "$branch"

  local pr_url
  pr_url=$(gh pr create \
    --repo "$REPO" \
    --title "Ralph: $title (#$issue_number)" \
    --body "$(cat <<PR_BODY
## Summary

Implements #${issue_number} — ${title}.

Closes #${issue_number}

---
🤖 Implemented autonomously by Ralph.
PR_BODY
)" \
    --head "$branch" \
    --base main)

  # Update labels and leave a breadcrumb comment.
  gh issue edit "$issue_number" --repo "$REPO" \
    --remove-label "in-progress" --add-label "ralph-done" >/dev/null

  gh issue comment "$issue_number" --repo "$REPO" \
    --body "Ralph has opened a PR for this issue: $pr_url — awaiting human review before merge." >/dev/null

  info "Issue #$issue_number done. PR: $pr_url"

  # Return to main for the next iteration.
  git checkout main
}

# ── Entry point ───────────────────────────────────────────────────────────────

# Ensure working tree is clean before starting.
if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Working tree has uncommitted changes. Commit or stash before running Ralph."
fi

if [[ -n "$FORCE_ISSUE" ]]; then
  run_issue "$FORCE_ISSUE"
  exit 0
fi

if $LOOP; then
  log "Starting loop mode. Ralph will run until no unblocked tasks remain."
  while true; do
    NEXT=$(find_next_issue)
    if [[ -z "$NEXT" ]]; then
      info "No unblocked AFK issues remaining. Ralph is done."
      break
    fi
    run_issue "$NEXT"
  done
else
  # Single-shot mode: pick up one issue and exit.
  NEXT=$(find_next_issue)
  if [[ -z "$NEXT" ]]; then
    info "No unblocked AFK issues found."
    exit 0
  fi
  run_issue "$NEXT"
fi
