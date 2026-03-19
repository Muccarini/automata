# Copilot Instructions

- Write all code in English.
- Write all code comments in English.
- Prefer simple, direct, easy-to-read code. Add abstractions only when they are clearly necessary.
- Avoid defensive complexity for hypothetical problems. Solve the real issue with the smallest functional change, and prefer removing unnecessary code over adding new layers, helpers, or syntax-heavy patterns.
- Keep user-facing UI text in the language requested by the user unless the task says otherwise.
- After JavaScript or TypeScript changes, run `npm run lint` and `npm run build` before finishing.
- Fix errors introduced by the current changes.
- Resolve warnings introduced by the current changes when practical; if any remain, mention them clearly.

## TypeScript "Legendary Subset" - Coding Guidelines

You are an expert TypeScript developer. In this project, we enforce a strict, highly readable, Data-Oriented subset of TypeScript. Our goal is 100% compile-time safety, zero runtime type errors, and maximum readability.

DO NOT use traditional Object-Oriented patterns. Follow these absolute rules:

### 1. The `type` Keyword Is Law
- ONLY use the `type` keyword for defining data structures.
- NEVER use `interface`.
- NEVER use `class` (unless strictly required by an external framework, which should be isolated).
- NEVER use `enum` (use union of string literals instead: `type Status = "open" | "closed"`).
- AVOID intersection types (`&`) for inheritance/composition. Prefer flat, explicit types or Utility Types.
- DO NOT use Template Literal Types (for example `${A}_${B}`). We prefer explicit readability over magic strings.

### 2. Tagged Unions for Polymorphism
- Represent variation and state using Tagged Unions (Discriminated Unions).
- Every member of a union MUST have a discriminant string literal property (for example `kind`, `type`, or `status`).
- Example: `type Notification = { kind: "email", email: string } | { kind: "sms", phone: string };`

### 3. Exhaustiveness Checking
- When branching on a Tagged Union (for example via `switch`), you MUST handle all cases.
- ALWAYS include a `default` case that assigns the checked variable to the `never` type to enforce compile-time exhaustiveness.
- Example:

```typescript
default:
	const exhaustiveCheck: never = myUnion;
	return exhaustiveCheck;
```

### 4. Generics for Abstraction
- Use Generics with strict constraints (`T extends MyType`) to write reusable functions and abstractions.
- Never use `any`.

### 5. Type Guards for Boundaries
- NEVER blind-cast data coming from outside (API, LocalStorage, user input) using `as MyType`.
- ALWAYS use Type Guards (`function isMyType(obj: unknown): obj is MyType`) or a schema validation library (like Zod) to validate data at boundaries.
- Inside the application code, trust the compiler.

### 6. Lookup Types and Utility Types
- Use Lookup Types (`MyType["property"]`) and `keyof MyType` for introspection and keeping types synchronized without duplication.
- Use standard Utility Types (`Pick`, `Omit`, `Partial`, `Readonly`) to derive types cleanly.