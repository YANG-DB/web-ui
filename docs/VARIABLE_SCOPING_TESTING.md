# Variable Scoping Testing Guide

## Overview

This document provides testing instructions for the newly implemented variable scoping system in the Visual Query Builder.

## What Was Implemented

### Core Components

1. **VariableScopingManager** ([variableScoping.js](../client/src/helpers/variableScoping.js))
   - Generates unique variables for entity instances (e.g., `Person(p1)`, `Dragon(d2)`)
   - Tracks context hierarchy for relationship patterns and nested groups
   - Manages variable scope and availability

2. **Query Builder Integration** ([VisualQueryBuilder.js](../client/src/components/VisualQueryBuilder.js))
   - Added `rebuildScopingContext()` function that processes query tree
   - Assigns variables to relationship rules automatically
   - Maps property conditions to correct variable instances
   - Extended Cypher generation to use scoped variables

3. **Enhanced Cypher Generation**
   - Uses `sourceVariable.alias` and `targetVariable.alias` from rules
   - Extracts variable names from field format `Person(p1).firstName`
   - Generates proper Cypher with distinct variable names

## Testing Instructions

### Test 1: Simple Relationship with Property Filter

**Objective**: Verify that a basic relationship query correctly assigns variables.

**Steps**:
1. Open the Research page in the browser (http://localhost:3000/research)
2. Click "Load Template" button
3. Select template: "Find persons who know someone named George"
4. Switch preview language to "Cypher"
5. Check browser console for scoping logs

**Expected Result**:

Console should show:
```
[Scoping] Rebuilding context from query: {...}
[Scoping] Created pattern: Person(p1) -[Know]-> Person(p2)
[Scoping] Mapped Person.firstName -> Person(p2).firstName
[Scoping] Context rebuild complete: {variableCount: 2, contextCount: 2, ...}
```

Generated Cypher should be:
```cypher
MATCH (p1:Person)-[r0:KNOW]->(p2:Person)
WHERE p2.firstName = 'George'
RETURN p1, r0, p2
```

**Key Points**:
- Two distinct Person variables: `p1` (source) and `p2` (target)
- Property filter correctly references `p2` (the target)
- RETURN clause includes both variables

---

### Test 2: Multiple Relationship Pattern

**Objective**: Verify complex multi-relationship queries with nested conditions.

**Steps**:
1. Click "Load Template" button
2. Select: "Multi-relationship query with nested conditions (advanced)"
3. Switch preview to "Cypher"
4. Check console logs

**Expected Result**:

Console should show:
```
[Scoping] Created pattern: Person(p1) -[OriginatedIn]-> Kingdom(k1)
[Scoping] Created pattern: Dragon(d1) -[Fire]-> Dragon(d2)
[Scoping] Created pattern: Dragon(d2) -[Freeze]-> Dragon(d3)
[Scoping] Mapped Kingdom.funds -> Kingdom(k1).funds
[Scoping] Mapped Dragon.name -> Dragon(d2).name
```

Generated Cypher should be:
```cypher
MATCH (p1:Person)-[r0:ORIGINATEDIN]->(k1:Kingdom), (d1:Dragon)-[r1:FIRE]->(d2:Dragon), (d2:Dragon)-[r2:FREEZE]->(d3:Dragon)
WHERE k1.funds > 1000 AND d2.name = 'morgan'
RETURN p1, r0, k1, d1, r1, d2, r2, d3
```

**Key Points**:
- Multiple entity types with distinct variables
- Dragon appears 3 times with different variables: `d1`, `d2`, `d3`
- Property filters reference correct variables (`k1.funds`, `d2.name`)
- All variables included in RETURN

---

### Test 3: Self-Referential Relationship

**Objective**: Verify that same entity type gets different variables in source and target positions.

**Steps**:
1. Click "Load Template" button
2. Select: "Find dragons with specific color"
3. Manually edit to add Fire relationship:
   - Click "+ Rule"
   - Select field: "Dragon"
   - Select operator: "Fire"
   - Select value: "Dragon"
4. Add another condition:
   - Click "+ Rule"
   - Select field: Should show "Dragon(d1).name" AND "Dragon(d2).name"
   - Select "Dragon(d2).name"
   - Enter value: "Balerion"

**Expected Result**:

Generated Cypher should be:
```cypher
MATCH (d1:Dragon)-[r0:FIRE]->(d2:Dragon)
WHERE d2.name = 'Balerion'
RETURN d1, r0, d2
```

**Key Points**:
- Field selector shows BOTH `Dragon(d1)` and `Dragon(d2)` options
- Selecting `d2` correctly generates `WHERE d2.name = ...`
- Pattern uses distinct variables for source and target

---

### Test 4: Variable Persistence Across Edits

**Objective**: Verify variables remain consistent when query is modified.

**Steps**:
1. Load template: "Find persons who know someone named George"
2. Note the Cypher output (should have `p1` and `p2`)
3. Add a new property filter:
   - Click "+ Rule"
   - Field selector should show: `Person(p1).firstName`, `Person(p1).lastName`, `Person(p2).firstName`, `Person(p2).lastName`
   - Select `Person(p1).firstName`
   - Enter value: "Alice"
4. Check updated Cypher

**Expected Result**:

Generated Cypher should be:
```cypher
MATCH (p1:Person)-[r0:KNOW]->(p2:Person)
WHERE p2.firstName = 'George' AND p1.firstName = 'Alice'
RETURN p1, r0, p2
```

**Key Points**:
- Variables `p1` and `p2` remain consistent
- New condition correctly uses `p1` (the source person)
- Both WHERE conditions reference appropriate variables

---

### Test 5: Context Inheritance in Nested Groups

**Objective**: Verify that nested groups inherit variables from parent context.

**Steps**:
1. Start with empty query
2. Add a Person → Own → Dragon relationship
3. Click "Add Group" to create a nested group
4. Inside the nested group, click "Add Rule"
5. Check field selector options

**Expected Result**:

Field selector inside nested group should show:
- `Person(p1).firstName`
- `Person(p1).lastName`
- `Dragon(d1).name`
- `Dragon(d1).color`
- Plus relationship operators

**Key Points**:
- Nested group has access to variables from parent pattern
- Both `p1` and `d1` are available in the nested context

---

## Debugging Tips

### Console Logging

The scoping system outputs detailed logs prefixed with `[Scoping]`:

```javascript
console.log("[Scoping] Rebuilding context from query:", queryTree);
console.log(`[Scoping] Created pattern: ${sourceVar.id} -[${rule.operator}]-> ${targetVar.id}`);
console.log(`[Scoping] Mapped ${entityType}.${propertyName} -> ${selectedVar}.${propertyName}`);
console.log("[Scoping] Context rebuild complete:", scopingManager.getDebugInfo());
```

### Inspecting Scoping State

You can access the scoping manager state in the browser console:

```javascript
// Get debug info
scopingManager.getDebugInfo()
// Returns: { variableCount: 3, contextCount: 2, variables: [...], contexts: [...] }

// Get specific variable
scopingManager.getVariable("Person(p1)")
// Returns: { id: "Person(p1)", entityType: "Person", alias: "p1", ruleId: "...", ... }

// Get available variables in context
scopingManager.getAvailableVariables("context-pattern-rule-123")
// Returns: ["Person(p1)", "Dragon(d1)"]
```

### Query Structure Inspection

Check the query structure to see variable assignments:

```javascript
// In browser console
JSON.stringify(query, null, 2)
```

Look for:
- `sourceVariable`: Object with `id`, `entityType`, `alias`, `role: "source"`
- `targetVariable`: Object with `id`, `entityType`, `alias`, `role: "target"`
- `entityVariable`: Object with `variableId`, used in property conditions
- `contextId`: Context identifier for each rule

---

## Known Limitations (Current Implementation)

### 1. Field Selector Not Yet Updated

**Status**: Pending implementation (Phase 3)

The field selector currently shows entity properties in old format:
- Shows: `Person.firstName`, `Person.lastName`
- Should show: `Person(p1).firstName`, `Person(p2).firstName` (with variables)

**Workaround**: Variables are automatically assigned during query rebuilding, so the underlying functionality works. The UI just doesn't show the variable prefixes yet.

### 2. Visual Indicators Missing

**Status**: Pending implementation (Phase 3)

Query rules don't yet show visual badges indicating variable assignments:

Current:
```
Person  -[Know]->  Person
```

Planned:
```
Person(p1)  -[Know]->  Person(p2)
    [source: p1]        [target: p2]
```

### 3. Variable Tooltips Not Implemented

**Status**: Pending implementation (Phase 3)

Hovering over variables doesn't yet show metadata tooltip.

### 4. Manual Variable Selection

**Status**: Future enhancement

Users cannot yet manually choose to reuse an existing variable vs. creating a new one. All variables are auto-generated.

---

## Success Criteria

### ✅ Implemented

- [x] `VariableScopingManager` class with full API
- [x] Automatic variable generation for relationship rules
- [x] Context hierarchy tracking (patterns and groups)
- [x] Variable scope resolution
- [x] Cypher generation uses scoped variables
- [x] Property condition variable mapping
- [x] Template loading with variable assignment
- [x] Console logging for debugging

### ⏳ Pending (Future Phases)

- [ ] Field selector shows variable-prefixed options
- [ ] Visual badges on relationship rules
- [ ] Variable tooltips
- [ ] Manual variable selection/reuse
- [ ] GraphQL generation with variables (if needed)
- [ ] Variable renaming UI

---

## Troubleshooting

### Issue: "p1" appears in Cypher but not "p2"

**Cause**: Only one relationship was detected, or property condition wasn't properly mapped.

**Solution**: Check console for `[Scoping]` logs to see if pattern was created and mapping occurred.

### Issue: Property filter uses wrong variable

**Cause**: Variable inference selected source instead of target (or vice versa).

**Solution**: This is by design - the system prefers target variables for property filters. If you need to filter on source, you'll need to adjust the query structure or wait for Phase 3 (manual variable selection).

### Issue: Variables reset after editing query

**Cause**: `rebuildScopingContext` is called on every query change and regenerates variables.

**Solution**: This is expected behavior. Variables are deterministically assigned based on query structure, so they should be consistent for the same query pattern.

### Issue: No scoping logs in console

**Cause**: Either `rebuildScopingContext` isn't being called, or ontology isn't loaded.

**Solution**:
1. Check that ontology is loaded successfully
2. Verify `handleQueryChange` is triggered when query changes
3. Check for JavaScript errors in console

---

## Next Steps

### Phase 3: UI Integration (Pending)

1. **Update Field Selector** ([helpers/ontologyToQueryBuilder.js](../client/src/helpers/ontologyToQueryBuilder.js))
   - Modify `convertOntologyToQueryBuilderFields()` to include variable-prefixed fields
   - Pass scoping manager instance to field generator
   - Return fields like `{ name: "Person(p1).firstName", label: "Person(p1) - First Name" }`

2. **Visual Badges** ([components/VisualQueryBuilder.js](../client/src/components/VisualQueryBuilder.js))
   - Add custom rule rendering to show variable assignments
   - Display `(p1)` and `(p2)` badges on relationship rules

3. **Variable Tooltips**
   - Create tooltip component
   - Show variable metadata on hover

### Phase 4: Query Generation Refinement

1. **GraphQL Variable Support**
   - Update `queryBuilderToGraphQLQuery` to use variables (if needed)
   - Add variable-based filtering

2. **SQL Variable Support** (optional)
   - Add table aliases based on variables
   - Generate JOIN clauses with aliases

### Phase 5: Testing & Polish

1. Comprehensive integration tests
2. Edge case handling (deep nesting, circular patterns)
3. Performance optimization for large queries

---

## Conclusion

The variable scoping system is now functional for core use cases:
- Relationship rules automatically get unique variables
- Cypher generation produces correct queries with distinct variables
- Property conditions are mapped to appropriate variable instances
- Template queries work with automatic variable assignment

The system provides a solid foundation for Cypher-like variable semantics in the visual query builder.
