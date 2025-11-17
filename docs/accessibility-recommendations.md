# Accessibility recommendations

These suggestions capture future improvements that would help Haricot welcome more users with diverse needs.

## Input and focus management

- Add visible focus outlines that meet WCAG contrast thresholds for all interactive elements on web builds.
- Provide larger tap targets (minimum 44×44pt) for critical controls like list items, recipe actions, and form buttons.
- Announce dynamic updates from inventory and task lists via `aria-live` regions or React Native accessibility events so screen readers describe the changes.

## Content alternatives

- Expand imagery with descriptive `accessibilityLabel` text, especially for featured recipes and pantry items that rely on photography.
- Offer captions or transcripts for any instructional videos embedded in future learning modules.
- Include language-level summaries at the top of lengthy recipe steps to benefit people who skim or use screen readers.

## Motion and feedback

- Audit existing animations (sheet transitions, list reorders, loading indicators) to respect the new reduced-motion preference exposed by the theme context.
- Provide haptic feedback alternatives for critical alerts so vibration is optional and not the only notification channel.
- Ensure timed messages such as snackbars remain visible until dismissed when a user enables reduced motion or other assistive settings.

## Assistive technology support

- Test navigation flows with VoiceOver and TalkBack to verify custom components expose names, roles, and states correctly.
- Add keyboard shortcuts for frequent actions on web and desktop builds, including quick search and task creation.
- Document accessibility behaviors in the design system so that new components start with baseline support instead of retrofits.
