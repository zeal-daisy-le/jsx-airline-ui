#!/usr/bin/env bash
# ralph.sh — Autonomous agent loop for jsx-airline-ui
#
# Ralph reads the PRD parent issue on GitHub, picks the highest-priority
# unblocked child issue, implements it on a shared branch, runs tests,
# updates progress notes, and loops until done or the iteration cap is hit.
#
# Usage:
#   ./ralph.sh <iterations>        # Run up to N iterations (one issue per iteration)
#
# Requirements:
#   - gh CLI authenticated (gh auth status)
#   - claude CLI available (claude --version)
#   - git working tree clean before starting

set -euo pipefail

REPO="zeal-daisy-le/jsx-airline-ui"
PRD_ISSUE=35
BRANCH="ralph/prd-${PRD_ISSUE}"
PROGRESS_DIR=".ralph/progress/${BRANCH}"
PROGRESS_FILE="${PROGRESS_DIR}/progress.txt"

# ── Argument parsing ──────────────────────────────────────────────────────────
if [ -z "${1:-}" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

ITERATIONS="$1"

# ── Setup ─────────────────────────────────────────────────────────────────────
mkdir -p "$PROGRESS_DIR"

# ── Main loop ─────────────────────────────────────────────────────────────────
for ((i=1; i<=ITERATIONS; i++)); do
  echo "-------------------------"
  echo "[ralph] Iteration $i of $ITERATIONS"
  echo "-------------------------"

  PROGRESS_CONTEXT="$(cat "$PROGRESS_FILE" 2>/dev/null || echo 'No progress recorded yet.')"

  result=$(claude --permission-mode acceptEdits -p \
"You are Ralph, an autonomous development agent for the JSX Airline UI project.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROGRESS SO FAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${PROGRESS_CONTEXT}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASKS FOR THIS ITERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Read PRD parent issue #${PRD_ISSUE} and all child issues on GitHub repo ${REPO}. Find the highest-priority open child issue that has no open blockers and is not already labelled 'in-progress' or 'ralph-done'.
2. Ensure you are on the main branch and pull the latest from origin/main.
3. Check out branch '${BRANCH}', creating it from origin/main if it does not yet exist locally or remotely.
4. Implement the chosen issue completely — every acceptance criterion must be met. Include unit tests where required.
5. Run 'npm test' and confirm all tests pass before committing.
6. Update CLAUDE.md if any architectural decisions were made that a future agent should know about.
7. Append a brief one-paragraph summary of what you implemented to '${PROGRESS_FILE}'.
8. On GitHub, add label 'ralph-done' to the worked issue and post a comment summarising the implementation.
9. Commit all changes with a message referencing the issue number, then push to origin/${BRANCH}.

ONLY IMPLEMENT ONE ISSUE PER ITERATION.
Do NOT open a PR — that is handled separately.

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
If ALL child issues of #${PRD_ISSUE} are complete, output exactly:
  <promise>COMPLETE</promise>

If you need additional permissions not already in .claude/settings.json,
first verify you do not already have them, then output exactly:
  <promise>NEED_PERMISSIONS</promise>
followed by the specific permissions required.")

  echo "$result"
  echo ""

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "[ralph] All issues complete. Ralph is done."
    exit 0
  fi

  if [[ "$result" == *"<promise>NEED_PERMISSIONS</promise>"* ]]; then
    echo "[ralph] Additional permissions required — check output above and update .claude/settings.json."
    exit 1
  fi

done

exit 0
