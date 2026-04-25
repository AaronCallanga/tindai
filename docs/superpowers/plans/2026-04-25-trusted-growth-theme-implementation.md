# Trusted Growth Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved Trusted Growth brand pass to the Expo client without changing app flow or screen structure.

**Architecture:** Centralize the palette rewrite in the shared color tokens, then retune the shared UI shells that determine most of the app’s visual identity. Finish with tab/navigation and screen-level cleanup so no active UI falls back to the previous orange-led or red-led styles.

**Tech Stack:** Expo, React Native, TypeScript, Vitest, react-test-renderer

---

### Task 1: Lock the Brand Tokens With Tests

**Files:**
- Create: `client/src/navigation/colors.test.ts`
- Modify: `client/src/navigation/colors.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { colors } from '@/navigation/colors';

describe('colors', () => {
  it('exports the Trusted Growth palette tokens', () => {
    expect(colors.primary).toBe('#1F7A63');
    expect(colors.secondary).toBe('#F2C94C');
    expect(colors.accent).toBe('#F2994A');
    expect(colors.background).toBe('#FFF8E7');
    expect(colors.text).toBe('#2F2F2F');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npm test -- src/navigation/colors.test.ts`
Expected: FAIL because the current tokens still use the old orange-led palette.

- [ ] **Step 3: Write minimal implementation**

Replace the token values in `client/src/navigation/colors.ts` with the approved brand palette and add any missing supporting token such as `secondary`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npm test -- src/navigation/colors.test.ts`
Expected: PASS

### Task 2: Retune Shared Controls and Shells

**Files:**
- Modify: `client/src/components/PrimaryButton.tsx`
- Modify: `client/src/components/AuthField.tsx`
- Modify: `client/src/components/AuthLayout.tsx`
- Modify: `client/src/components/OnboardingLayout.tsx`
- Modify: `client/src/components/ClientTabLayout.tsx`

- [ ] **Step 1: Write the failing test**

Add a new test file:

```ts
import { describe, expect, it } from 'vitest';

import { colors } from '@/navigation/colors';

describe('Trusted Growth shared UI contract', () => {
  it('keeps green-led primary actions and removes red-led destructive tokens', () => {
    expect(colors.primary).toBe('#1F7A63');
    expect(colors.accent).toBe('#F2994A');
    expect('danger' in colors).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npm test -- src/navigation/colors.test.ts`
Expected: FAIL because the current token object still includes `danger`.

- [ ] **Step 3: Write minimal implementation**

Update the shared components so:

- `PrimaryButton` uses firmer green-led solid styling and cream ghost styling
- `AuthField` uses warmer cream surfaces and clearer borders
- `AuthLayout` replaces orange-heavy gradients/glows with restrained green/cream/yellow layers
- `OnboardingLayout` uses green as the anchor state with yellow/orange support
- `ClientTabLayout` uses clearer layered cream/green surfaces

- [ ] **Step 4: Run targeted tests**

Run: `cd client && npm test -- src/navigation/colors.test.ts App.test.tsx`
Expected: PASS

### Task 3: Retune Tabs and Profile State Styling

**Files:**
- Modify: `client/src/screens/HomeTabs.tsx`
- Modify: `client/src/screens/tabs/ProfileScreen.tsx`

- [ ] **Step 1: Write the failing test**

Extend `client/src/navigation/colors.test.ts` with:

```ts
it('does not expose a red danger token in the brand system', () => {
  expect('danger' in colors).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npm test -- src/navigation/colors.test.ts`
Expected: FAIL while `danger` still exists or active state colors still depend on the old palette.

- [ ] **Step 3: Write minimal implementation**

Update:

- `HomeTabs` to use green-led active states, calmer inactive states, and cream/green navigation surfaces
- `ProfileScreen` sign-out styling to use orange-led attention styling instead of red-led danger styling

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npm test -- src/navigation/colors.test.ts`
Expected: PASS

### Task 4: Verify the Full Client Theme Pass

**Files:**
- Verify only

- [ ] **Step 1: Run the full client test suite**

Run: `cd client && npm test`
Expected: PASS with all tests green

- [ ] **Step 2: Run typecheck**

Run: `cd client && npm run typecheck`
Expected: PASS with no TypeScript errors

- [ ] **Step 3: Manual visual review**

Run: `cd client && npm run start`
Expected: Auth, onboarding, tabs, and profile all reflect the Trusted Growth palette with no leftover red-led state styling.
