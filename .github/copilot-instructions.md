# Copilot Instructions

- Write all code in English.
- Write all code comments in English.
- Prefer simple, direct, easy-to-read code. Add abstractions only when they are clearly necessary.
- Avoid defensive complexity for hypothetical problems. Solve the real issue with the smallest functional change, and prefer removing unnecessary code over adding new layers, helpers, or syntax-heavy patterns.
- Keep user-facing UI text in the language requested by the user unless the task says otherwise.
- After JavaScript or TypeScript changes, run `npm run lint` and `npm run build` before finishing.
- Fix errors introduced by the current changes.
- Resolve warnings introduced by the current changes when practical; if any remain, mention them clearly.