# Trusted Growth Theme Design

## Summary

Apply a full brand pass to the Expo client using the approved "Trusted Growth" palette:

- Primary: `#1F7A63`
- Secondary: `#F2C94C`
- Accent: `#F2994A`
- Background: `#FFF8E7`
- Text: `#2F2F2F`

This is not a layout rewrite. The app should keep its current navigation and content structure while moving from its current orange-led startup styling to a more stable finance-oriented visual system. The goal is to make the product feel trustworthy, practical, and locally grounded rather than generic fintech or generic startup.

## Design Direction

The visual tone should feel like finance + stability + everyday negosyo. Green should carry trust and primary action. Cream should keep the interface approachable and warm. Yellow and orange should be present as supporting highlights and emphasis colors, not the dominant base identity.

The UI should feel more deliberate and grounded:

- less translucent white wash
- fewer orange-heavy hero effects
- stronger surface definition
- more controlled emphasis states
- clearer component hierarchy

All visual states should stay within the brand family. Do not introduce a separate red danger system. Warning, destructive, and attention states should be expressed through stronger orange, ochre, contrast, and tone shifts within the approved palette.

## Token System

Refactor the shared color token file in `client/src/navigation/colors.ts` into a finance-stable brand system.

Expected token intent:

- `background`: cream-first global app background
- `surface`: primary card and panel surface
- `surfaceAlt`: alternate highlight surface for selected chips, icon wraps, and emphasis panels
- `card`: elevated card tone distinct from the page background
- `text`: charcoal primary text
- `muted`: softened text for supporting copy
- `primary`: trusted green for main actions
- `primaryDeep`: darker green for emphasis, active states, or headers
- `secondary`: warm yellow for guided highlights
- `accent`: soft orange for attention and branded state emphasis
- `border`: subtle green-tinted or charcoal-soft border tone

If more tokens are required during implementation, they should stay aligned to these roles and not reintroduce the old orange-led palette.

## Component Changes

### Buttons

Retune shared button styling in `PrimaryButton`:

- Primary buttons use deep green fills with cream or very light text
- Ghost and secondary buttons use cream surfaces with green borders and charcoal/green text
- Accent-styled buttons, if needed, use yellow or orange sparingly for progression and emphasis
- Button styling should feel firmer and more intentional than the current soft startup treatment

### Inputs

Retune `AuthField` to sit on warmer cream surfaces with clearer borders and text contrast. Inputs should feel dependable and legible, not glassy or washed out.

### Cards and Panels

Shared card shells should move away from translucent white overlays and into layered cream surfaces with subtle green-led borders. Cards should feel stable, readable, and slightly more structured.

### Status Styling

All stateful styling must stay in-brand:

- positive state: green-led
- caution state: yellow-led
- destructive/attention state: orange-led

No separate red token family should remain in active UI styling.

## Screen-Level Changes

### Auth Flow

Retune `AuthLayout` and auth screens to use restrained green-led gradients or layered cream backgrounds instead of the current orange-heavy visual treatment. The auth experience should feel welcoming but trustworthy, with strong readability and less glow.

### Onboarding Flow

Retune `OnboardingLayout` so step indicators, badges, and guided actions reflect green as the anchor brand color, with yellow/orange reserved for highlights and progress moments. Background decoration should support the brand without overpowering the content.

### Home Tabs

Update `HomeTabs` so the navigation bar, active icons, icon wraps, headers, and selected states align with the new token system. Active navigation should feel clearly anchored in green. Inactive tabs should stay muted and calm.

### Tab Screens

Apply the updated surfaces and typography treatment to tab content screens, especially `ProfileScreen` and any shared tab layout wrappers, so screen internals match the new shell styling.

## Implementation Sequence

Recommended order:

1. Rewrite shared color tokens in `client/src/navigation/colors.ts`
2. Update shared components:
   - `PrimaryButton`
   - `AuthField`
   - `AuthLayout`
   - `OnboardingLayout`
   - any shared tab/card layout components
3. Update `HomeTabs`
4. Sweep auth, onboarding, and tab screens for remaining old palette usage
5. Run typecheck and tests

This order minimizes mixed-theme states during the implementation pass.

## Acceptance Criteria

The theme pass is complete when:

- the client no longer visually depends on the old orange-led palette
- primary actions consistently use green-led styling
- yellow and orange appear as supporting highlights rather than dominant surfaces
- auth, onboarding, tabs, and shared controls feel visually coherent
- no active red-based state styling remains
- the app still uses the current navigation/content structure without regressions

## Testing Notes

Verification should include:

- client typecheck
- client test suite
- manual visual review in Expo for auth, onboarding, and tab flows
- manual check that active/inactive tab states, buttons, and card surfaces all reflect the new tokens consistently

## Assumptions

- This pass is limited to the existing client app
- No navigation flow changes are included
- No content rewrite is included
- No server changes are required
- The approved palette is final for this implementation pass
