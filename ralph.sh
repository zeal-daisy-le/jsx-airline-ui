#!/usr/bin/env bash
# ralph.sh — Autonomous agent that picks up and implements one issue at a time.
#
# Each run picks the highest-priority unblocked child issue from the PRD parent,
# implements it, commits, pushes, and logs progress. No PR is created.
#
# Usage:
#   ./ralph.sh              # Pick up and implement the next issue
#
# Progress is tracked in:
#   .ralph/progress/        # Per-issue markdown files + STATUS.md index
#
# Requirements:
#   - gh CLI authenticated (gh auth status)
#   - claude CLI available (claude --version)
#   - git working tree clean before starting

set -euo pipefail

REPO="zeal-daisy-le/jsx-airline-ui"
PRD_ISSUE=35
BRANCH="ralph/prd-${PRD_ISSUE}"
PROGRESS_DIR=".ralph/progress"
STATUS_FILE="${PROGRESS_DIR}/STATUS.md"

# ── Setup ─────────────────────────────────────────────────────────────────────
mkdir -p "$PROGRESS_DIR"

if [ ! -f "$STATUS_FILE" ]; then
  cat > "$STATUS_FILE" <<'EOF'
# Ralph Progress — PRD #35

| Issue | Title | Status | Date | Notes |
|-------|-------|--------|------|-------|
EOF
fi

# ── Build progress context from existing issue files ─────────────────────────
PROGRESS_CONTEXT=""
for f in "$PROGRESS_DIR"/issue-*.md; do
  [ -f "$f" ] || continue
  PROGRESS_CONTEXT="${PROGRESS_CONTEXT}$(cat "$f")
---
"
done

if [ -z "$PROGRESS_CONTEXT" ]; then
  PROGRESS_CONTEXT="No issues implemented yet."
fi

# ── Run one issue ────────────────────────────────────────────────────────────
echo "==============================="
echo "[ralph] Picking up next issue..."
echo "==============================="

result=$(claude --permission-mode acceptEdits -p \
"You are Ralph, an autonomous development agent for the JSX Airline UI project.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROGRESS SO FAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${PROGRESS_CONTEXT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Read all PRD files in docs/prd/ to find tasks. Each PRD contains a ## Tasks section with numbered tasks and acceptance criteria. Find the highest-priority task that has no unmet blockers and does not already have a progress file in ${PROGRESS_DIR}.
2. Ensure you are on the main branch and pull the latest from origin/main.
3. Check out branch '${BRANCH}', creating it from origin/main if it does not yet exist locally or remotely.
4. Implement the chosen task completely — every acceptance criterion must be met. Include unit tests where required. Use /tdd (red-green-refactor) for all implementation work.
5. Run 'npm test' and confirm all tests pass before committing.
6. Update CLAUDE.md if any architectural decisions were made that a future agent should know about.
7. Write a progress file at '${PROGRESS_DIR}/prd-<prd-slug>-task-<NUMBER>.md' with this format:

   # PRD <prd-slug> — Task <NUMBER>: <Title>
   **Date:** <YYYY-MM-DD>
   **Status:** done
   **Type:** AFK | HITL

   ## Summary
   <One paragraph describing what was implemented.>

   ## Files changed
   <Bulleted list of key files added or modified.>

   ## Tests
   <How many tests were added. Total test count after this task.>

8. Commit all changes with a message referencing the PRD and task number, then push to origin/${BRANCH}.

IMPORTANT RULES:
- Implement exactly ONE task, then stop.
- Do NOT open a pull request. PRs are handled separately.
- Do NOT modify ${STATUS_FILE} — that is updated by this script after you finish.
- Skip tasks marked as HITL (human-in-the-loop) — only pick up AFK tasks.
- Check ${PROGRESS_DIR} for existing progress files to determine which tasks are already done.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIGMA DESIGN SYSTEM — MANDATORY FOR ALL UI WORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Figma file key: 8TPHDvgnAX08HgIZlja3jK
Full URL: https://www.figma.com/design/8TPHDvgnAX08HgIZlja3jK/JSX-UI-Design

For ANY issue that involves building or modifying a UI component, page, or visual element:
1. Call mcp__plugin_figma_figma__get_metadata with the fileKey to list pages.
2. Call mcp__plugin_figma_figma__get_design_context or get_screenshot on the relevant node.
3. Match colours, spacing, typography, border-radius, and component structure exactly.
4. Use Tailwind utility classes — do not hardcode hex values; map to design tokens in tailwind.config.ts.

For non-UI issues (store logic, BFF endpoints, tests, config) the Figma MCP is not required.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURE (locked in)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Framework:      Next.js 14 Pages Router (TypeScript)
- Styling:        Tailwind CSS + shadcn/ui (Radix primitives)
- Animation:      Framer Motion (hero entrance + micro-interactions only)
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SIGNALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
At the very end of your output, include exactly ONE of these signals:

If the task was implemented successfully:
  <signal>DONE:<PRD-SLUG>:T<NUMBER>:<TITLE></signal>

If ALL tasks across all PRDs are complete:
  <signal>COMPLETE</signal>

If you need additional permissions:
  <signal>NEED_PERMISSIONS</signal>
followed by the specific permissions required.")

echo "$result"
echo ""

# ── Update STATUS.md based on signal ─────────────────────────────────────────
if [[ "$result" == *"<signal>COMPLETE</signal>"* ]]; then
  echo "[ralph] All tasks complete. Ralph is done."
  exit 0
fi

if [[ "$result" == *"<signal>NEED_PERMISSIONS</signal>"* ]]; then
  echo "[ralph] Additional permissions required — check output above."
  exit 1
fi

if [[ "$result" =~ \<signal\>DONE:([^:]+):T([0-9]+):(.+)\</signal\> ]]; then
  PRD_SLUG="${BASH_REMATCH[1]}"
  TASK_NUM="${BASH_REMATCH[2]}"
  TASK_TITLE="${BASH_REMATCH[3]}"
  TODAY=$(date +%Y-%m-%d)

  echo "| PRD-${PRD_SLUG}-T${TASK_NUM} | ${TASK_TITLE} | done | ${TODAY} | [details](prd-${PRD_SLUG}-task-${TASK_NUM}.md) |" >> "$STATUS_FILE"

  echo ""
  echo "[ralph] Task ${TASK_NUM} (${PRD_SLUG}) complete. Progress logged."
  echo "[ralph] Run ./ralph.sh again to pick up the next task."
else
  echo "[ralph] Could not parse completion signal. Check output above."
  exit 1
fi
