LOOM Phase 5 replacement skill — TDD Build Loop.

This skill replaces LOOM's default Phase 5 (Build) with a strict test-driven development loop.
It reads the exec-plan from Phase 4 and implements each step using red-green-refactor discipline.

LOOM should detect this skill at Phase 0 and delegate Phase 5 to it when available.

---

## Prerequisites

- LOOM Phase 4 exec-plan committed at `docs/exec-plans/active/[task-slug].md`
- Phase 4 approved by engineer
- All LOOM Phase 3 guardrails loaded and active

---

## Execution Loop

For each step in the exec-plan, execute this cycle:

### 1. Read the Plan Step

Read the current step from the exec-plan. Understand:
- What behavior is being added or changed
- Which files are affected
- What the acceptance criteria are for this step

### 2. RED — Write a Failing Test First

Before writing ANY implementation code:

1. Write a test that describes the **desired behavior** through the public interface
2. Run the test suite — the new test MUST fail
3. If the test passes without new code, the test is not testing new behavior — rewrite it

**Test quality rules:**
- Test describes behavior, not implementation
- Test uses public interface only (no testing private methods)
- Test would survive an internal refactor
- Mock only at system boundaries: external APIs, databases, time/randomness
- Do NOT mock internal collaborators or your own modules

### 3. GREEN — Minimal Implementation

Write the **minimum code** to make the failing test pass:

1. Implement only what the current test requires
2. Do NOT anticipate future tests or add speculative features
3. Run the full test suite — all tests (old and new) must pass
4. If any test fails, fix before proceeding

### 4. REFACTOR — Clean Up

After GREEN, look for refactor opportunities:

1. Extract duplication
2. Deepen modules (move complexity behind simple interfaces)
3. Apply SOLID principles where natural
4. Run tests after each refactor step — **never refactor while RED**

### 5. Emit LOOM-STEP Marker

After completing the step:

```markdown
<!-- LOOM-STEP -->
Step [N]/[total] complete: [step description]
Files: [files modified, comma-separated]
Tests: [N new tests added, M total passing]
Status: [done | blocked: reason]
<!-- /LOOM-STEP -->
```

### 6. Repeat

Move to the next exec-plan step. If context is heavy after 3+ steps, re-read the exec-plan to re-anchor intent.

---

## Anti-Patterns — DO NOT

- **Horizontal slicing**: Do NOT write all tests first, then all implementation. One test -> one implementation -> repeat (vertical slices).
- **Speculative implementation**: Do NOT add code "we'll need later" — only what the current test demands.
- **Silent scope expansion**: If a step requires more work than the exec-plan anticipated, STOP and flag it. Do not silently expand.
- **Skipping RED**: Every new behavior MUST start with a failing test. No exceptions.
- **Mocking internals**: Do NOT mock your own classes or internal collaborators. Mock at system boundaries only.

---

## Guardrail Enforcement

During build, enforce all LOOM Phase 3 guardrails:

- If a guardrail is contacted → **STOP immediately**. Do not proceed. Escalate per LOOM Phase 3 rules.
- If scope would change → **STOP and flag**. Do not silently expand or contract.

---

## Figma Design System (UI work only)

For any step that involves building or modifying a UI component, page, or visual element:

1. Call `mcp__plugin_figma_figma__get_metadata` with fileKey `8TPHDvgnAX08HgIZlja3jK` to list pages
2. Call `mcp__plugin_figma_figma__get_design_context` or `get_screenshot` on the relevant node
3. Match colors, spacing, typography, border-radius, and component structure exactly
4. Use Tailwind utility classes — map to design tokens in `tailwind.config.ts`, not hardcoded hex values

For non-UI steps (store logic, BFF endpoints, tests, config), the Figma MCP is not required.

---

## CI Validation

After all exec-plan steps are complete, before returning control to LOOM Phase 6:

1. Run `npm test` — all unit tests must pass
2. Run `npx tsc --noEmit` — no TypeScript errors
3. Run `npx next lint` — no lint errors

Report results in the final LOOM-STEP marker.

---

## Exit

After all exec-plan steps are implemented with passing tests, return control to LOOM Phase 6 for self-verification.
