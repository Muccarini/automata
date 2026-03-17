---
name: scaffold-node
description: Scaffold a new visual node with guided questions, file-ready patches, and validation checklist.
---

Create production-ready node scaffolding for the mapper using the repository registry pattern (definitions + parameters), with bilingual guided questions, concrete examples, and file-ready patch output.

## Goal

Generate a new node safely and consistently by collecting complete requirements before writing code.

Output must always include:
1. File-ready patch plan grouped by file.
2. Validation checklist (lint/build + manual behavior checks).

## Discover Existing Patterns First

Before generating code:
1. Inspect current node architecture and references:
   - src/types/graph.ts
   - src/components/nodes/registry/types.ts
   - src/components/nodes/registry/definitions/index.ts
   - src/components/nodes/registry/parameters/index.ts
   - src/store/automaGraphStore.ts
2. Read at least two concrete node implementations (one simple + one complex):
   - Simple candidates: trigger.tsx, logic.tsx, enum.tsx
   - Complex candidates: http.tsx + httpInspectorOverride.tsx, mapper.tsx + mapperInspectorOverride.tsx
3. Confirm naming conventions and pin conventions before proceeding.

## Ask Guided Questions (IT + EN)

Ask these questions in order and do not skip required sections.

### 1) Node Identity
- IT: Qual e il nodeType tecnico e quale problema risolve in una frase?
- EN: What is the technical nodeType and what problem does it solve in one sentence?
- Example:
  - nodeType: cacheHttp
  - purpose: Fetch HTTP response and cache it with TTL.

### 2) Metadata & Visual Identity
- IT: Titolo, descrizione, categoria, icona lucide-react e accentClassName?
- EN: What are title, description, category, lucide-react icon, and accentClassName?
- Example:
  - title: Cached HTTP
  - category: Integration
  - icon: Database
  - accentClassName: text-amber-400

### 3) Input Pins
- IT: Elenca tutti i pin di ingresso con id, kind, direction, side, label, valueType.
- EN: List all input pins with id, kind, direction, side, label, valueType.
- Example:
  - flow:in, flow, input, top-left, Exec, n/a
  - data:url, data, input, left, URL, string

### 4) Output Pins
- IT: Elenca tutti i pin di uscita con lo stesso schema.
- EN: List all output pins with the same schema.
- Example:
  - flow:out, flow, output, top-right, Then, n/a
  - data:payload, data, output, right, Payload, object

### 5) Editable Parameters Strategy
- IT: Vuoi inspector standard (parameters registry) o override custom?
- EN: Do you want default inspector parameters or a custom inspector override?
- Example:
  - Standard for simple text/enum/number fields.
  - Override for dynamic arrays, schema tools, advanced UI.

### 6) Node Data Shape
- IT: Quali campi devono essere inizializzati in defaultNodeData per il nuovo nodo?
- EN: Which fields must be initialized in defaultNodeData for the new node?
- Example:
  - cacheHttp: { method: "GET", url: "", ttlSeconds: 60, retries: 1 }

### 7) Output Schema Behavior
- IT: L outputSchema e statico, inferito o derivato da upstream?
- EN: Is outputSchema static, inferred, or derived from upstream?
- Example:
  - inferred from API sample response via action button.

### 8) Error Handling / Edge Cases
- IT: Cosa deve accadere con input mancanti, timeout, errore rete, schema invalido?
- EN: What should happen on missing input, timeout, network error, invalid schema?
- Example:
  - keep previous schema, show warning message, do not crash inspector.

### 9) Acceptance Criteria
- IT: Quali test funzionali rendono il nodo pronto?
- EN: Which functional checks define done?
- Example:
  - Node appears on canvas, pins connect, values persist, schema propagates.

## Validate Answers Before Code Generation

Block generation until these checks are satisfied:
1. nodeType is unique and not already present in NodeKind.
2. Pin IDs are unique and consistent with parameter pin references.
3. Parameter getter and setter target the same data path.
4. If disableDefaultInputParameters is true, renderInspectorOverride must exist.
5. outputSchema policy is explicitly defined.
6. defaultNodeData has required fields for the new node.

## File Generation Map (Step-by-Step)

Generate or update files in this order:
1. src/types/graph.ts
   - Add node kind.
2. src/components/nodes/registry/definitions/<nodeType>.tsx
   - Implement INodeDefinition.
3. src/components/nodes/registry/definitions/index.ts
   - Register new definition.
4. src/components/nodes/registry/parameters/<nodeType>.ts (if standard inspector parameters are used)
   - Add parameter descriptors.
5. src/components/nodes/registry/parameters/index.ts (if #4 exists)
   - Register parameter provider.
6. src/components/nodes/registry/definitions/<nodeType>InspectorOverride.tsx (if custom inspector is requested)
   - Implement override UI.
7. src/store/automaGraphStore.ts
   - Extend defaultNodeData with new node sub-structure.

## Output Format Requirements

Return output in exactly two sections:

### Section A: File-Ready Patch Plan
For each file, provide:
1. Why this file changes.
2. Exact code block to add or update.
3. Dependency note (which next file depends on this change).

### Section B: Verification Checklist
Always include:
1. npm run lint
2. npm run build
3. Manual checks:
   - Node creation from canvas/menu
   - Inspector editing and persistence
   - Pin compatibility and connect validation
   - Upstream/downstream schema behavior
   - No runtime crashes in drawer/canvas

## Guardrails and Common Failure Prevention

Explicitly prevent these common issues:
1. Missing registration in definitions/index.ts.
2. Missing registration in parameters/index.ts.
3. Pin ID mismatch between definition and parameters.
4. Getter/setter mismatch in InputParameterDescriptor.
5. Missing default data causing undefined access.
6. Incorrect disableDefaultInputParameters usage.
7. valueType mismatch between pin and inline renderer expectations.

## Delivery Style

1. Keep code and comments in English.
2. Keep user-facing interview prompts bilingual (IT + EN).
3. Be concise but explicit about assumptions.
4. If information is missing, ask only blocking questions, then continue.

## Completion Criteria

The skill is done when:
1. All mandatory files are covered.
2. Optional files are included only when required by answers.
3. Patch plan is actionable without ambiguity.
4. Verification checklist is complete and project-specific.
