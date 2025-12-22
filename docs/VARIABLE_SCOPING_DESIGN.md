# Variable Scoping Implementation Design

## Executive Summary

This design document outlines the implementation of a Cypher-like variable scoping system for the Visual Query Builder. The system will assign unique variable names to entity instances when relationship rules are created, track context per relationship pattern, and extend context for nested groups.

## Problem Statement

Currently, the query builder cannot distinguish between different instances of the same entity type. For example, in a query like "Find persons who know another person named George," both Person instances are treated as the same variable, making it impossible to express conditions on different instances.

**Current Limitation:**
```javascript
// Query builder sees both as "Person"
Person -> Know -> Person
Person.firstName = "George"
// Which Person's firstName? The source or target?
```

**Desired Behavior:**
```javascript
// Query builder with variable scoping
Person(p1) -> Know -> Person(p2)
Person(p2).firstName = "George"
// Clear: we're filtering the target Person
```

**Generated Cypher:**
```cypher
MATCH (p1:Person)-[:KNOW]->(p2:Person)
WHERE p2.firstName = 'George'
RETURN p1, p2
```

## Core Concepts

### 1. Entity Instance Variables

Each time an entity appears in a relationship rule, it gets assigned a unique variable identifier:

- **Variable Generation Rule**: `{EntityType}({alias})`
  - First Person → `Person(p1)`
  - Second Person → `Person(p2)`
  - First Dragon → `Dragon(d1)`
  - Second Dragon → `Dragon(d2)`

- **Counter Management**: Global counter per entity type, incremented for each new instance

### 2. Pattern Context

A **pattern** is a relationship rule that connects two entities. Each pattern creates a context that tracks:

```javascript
{
  id: "pattern-uuid-123",
  sourceEntity: "Person",
  sourceVariable: "p1",
  relationship: "Know",
  targetEntity: "Person",
  targetVariable: "p2",
  availableVariables: {
    "Person(p1)": { type: "Person", alias: "p1", role: "source" },
    "Person(p2)": { type: "Person", alias: "p2", role: "target" }
  }
}
```

### 3. Context Extension for Nested Groups

When a nested group is created within a relationship pattern, the context is extended:

```javascript
// Parent pattern context
Pattern: Person(p1) -> OriginatedIn -> Kingdom(k1)
Context: { "Person(p1)": {...}, "Kingdom(k1)": {...} }

// Nested group created inside this pattern
Nested Group:
  - Dragon(d1) -> Fire -> Dragon(d2)
  - Dragon(d2).name = "morgan"

// Extended context for nested group
{
  inheritedVariables: { "Person(p1)": {...}, "Kingdom(k1)": {...} },
  localVariables: { "Dragon(d1)": {...}, "Dragon(d2)": {...} },
  availableVariables: {
    // All variables from parent + local
    "Person(p1)": {...},
    "Kingdom(k1)": {...},
    "Dragon(d1)": {...},
    "Dragon(d2)": {...}
  }
}
```

### 4. Variable Scope Hierarchy

```
Root Context (Global)
  │
  ├─ Pattern Context 1: Person(p1) -> OriginatedIn -> Kingdom(k1)
  │    │
  │    └─ Nested Group 1.1
  │         ├─ Pattern Context 1.1.1: Dragon(d1) -> Fire -> Dragon(d2)
  │         │    └─ Property: Dragon(d2).name = "morgan"
  │         │
  │         └─ Nested Group 1.1.2
  │              └─ Pattern Context 1.1.2.1: Dragon(d2) -> Freeze -> Dragon(d3)
  │
  └─ Pattern Context 2: Company(c1) -> LocatedIn -> Country(cn1)
```

**Scoping Rules:**
1. Variables are visible in their own context and all descendant contexts
2. Sibling contexts cannot see each other's variables
3. Property conditions can only reference variables available in their context

## Data Model Design

### 1. Enhanced Query Structure

```javascript
{
  id: "root",
  combinator: "and",
  rules: [
    {
      id: "rule-1",
      type: "relationship",
      field: "Person",
      operator: "OriginatedIn",
      value: "Kingdom",

      // NEW: Variable tracking
      sourceVariable: {
        entityType: "Person",
        alias: "p1",
        variableId: "Person(p1)"
      },
      targetVariable: {
        entityType: "Kingdom",
        alias: "k1",
        variableId: "Kingdom(k1)"
      },

      // NEW: Context for this pattern
      context: {
        id: "context-pattern-1",
        availableVariables: {
          "Person(p1)": { type: "Person", alias: "p1", role: "source" },
          "Kingdom(k1)": { type: "Kingdom", alias: "k1", role: "target" }
        }
      }
    },
    {
      id: "rule-2",
      type: "property",
      field: "Kingdom.funds",
      operator: ">",
      value: "1000",

      // NEW: Variable reference
      entityVariable: {
        variableId: "Kingdom(k1)",
        entityType: "Kingdom",
        alias: "k1"
      }
    },
    {
      id: "group-1",
      type: "group",
      combinator: "and",

      // NEW: Context extension
      context: {
        id: "context-group-1",
        parentContextId: "root",
        inheritedVariables: {
          "Person(p1)": { type: "Person", alias: "p1" },
          "Kingdom(k1)": { type: "Kingdom", alias: "k1" }
        },
        localVariables: {},
        availableVariables: {
          "Person(p1)": { type: "Person", alias: "p1" },
          "Kingdom(k1)": { type: "Kingdom", alias: "k1" }
        }
      },

      rules: [
        {
          id: "rule-3",
          type: "relationship",
          field: "Dragon",
          operator: "Fire",
          value: "Dragon",

          sourceVariable: {
            entityType: "Dragon",
            alias: "d1",
            variableId: "Dragon(d1)"
          },
          targetVariable: {
            entityType: "Dragon",
            alias: "d2",
            variableId: "Dragon(d2)"
          },

          context: {
            id: "context-pattern-3",
            parentContextId: "context-group-1",
            availableVariables: {
              // Inherited from parent
              "Person(p1)": { type: "Person", alias: "p1" },
              "Kingdom(k1)": { type: "Kingdom", alias: "k1" },
              // Local to this pattern
              "Dragon(d1)": { type: "Dragon", alias: "d1", role: "source" },
              "Dragon(d2)": { type: "Dragon", alias: "d2", role: "target" }
            }
          }
        }
      ]
    }
  ]
}
```

### 2. Variable Registry

Global state to track all entity variables across the query:

```javascript
{
  variableCounters: {
    "Person": 2,    // Next Person will be p3
    "Dragon": 2,    // Next Dragon will be d3
    "Kingdom": 1,   // Next Kingdom will be k2
    "Guild": 0      // Next Guild will be g1
  },

  variableRegistry: {
    "Person(p1)": {
      id: "Person(p1)",
      entityType: "Person",
      alias: "p1",
      ruleId: "rule-1",
      contextId: "context-pattern-1",
      role: "source",
      usages: [
        { ruleId: "rule-1", role: "source" },
        { ruleId: "rule-4", role: "filter-reference" }
      ]
    },
    "Person(p2)": {
      id: "Person(p2)",
      entityType: "Person",
      alias: "p2",
      ruleId: "rule-1",
      contextId: "context-pattern-1",
      role: "target",
      usages: [
        { ruleId: "rule-1", role: "target" },
        { ruleId: "rule-5", role: "filter-reference" }
      ]
    },
    // ... more variables
  },

  contextHierarchy: {
    "root": {
      id: "root",
      parentId: null,
      localVariables: [],
      inheritedVariables: [],
      children: ["context-pattern-1", "context-group-1"]
    },
    "context-pattern-1": {
      id: "context-pattern-1",
      parentId: "root",
      localVariables: ["Person(p1)", "Kingdom(k1)"],
      inheritedVariables: [],
      children: []
    },
    "context-group-1": {
      id: "context-group-1",
      parentId: "root",
      localVariables: [],
      inheritedVariables: ["Person(p1)", "Kingdom(k1)"],
      children: ["context-pattern-3"]
    },
    "context-pattern-3": {
      id: "context-pattern-3",
      parentId: "context-group-1",
      localVariables: ["Dragon(d1)", "Dragon(d2)"],
      inheritedVariables: ["Person(p1)", "Kingdom(k1)"],
      children: []
    }
  }
}
```

## Component Architecture

### 1. New Utility Module: `variableScoping.js`

```javascript
// /Users/liorperry/projects/web-ui/client/src/helpers/variableScoping.js

/**
 * Variable Scoping Manager
 * Handles entity variable generation, context tracking, and scope resolution
 */

class VariableScopingManager {
  constructor() {
    this.variableCounters = {};
    this.variableRegistry = {};
    this.contextHierarchy = {
      root: {
        id: 'root',
        parentId: null,
        localVariables: [],
        inheritedVariables: [],
        children: []
      }
    };
  }

  /**
   * Generate a new variable for an entity type
   * @param {string} entityType - e.g., "Person", "Dragon"
   * @param {string} ruleId - ID of the rule creating this variable
   * @param {string} contextId - ID of the context
   * @param {string} role - "source" or "target"
   * @returns {Object} Variable metadata
   */
  generateVariable(entityType, ruleId, contextId, role) {
    // Increment counter for this entity type
    if (!this.variableCounters[entityType]) {
      this.variableCounters[entityType] = 0;
    }
    this.variableCounters[entityType]++;

    // Generate alias (e.g., "p1", "d2")
    const prefix = entityType.charAt(0).toLowerCase();
    const alias = `${prefix}${this.variableCounters[entityType]}`;
    const variableId = `${entityType}(${alias})`;

    // Register variable
    const variable = {
      id: variableId,
      entityType,
      alias,
      ruleId,
      contextId,
      role,
      usages: [{ ruleId, role }]
    };

    this.variableRegistry[variableId] = variable;

    return variable;
  }

  /**
   * Create a new context for a relationship pattern
   * @param {string} contextId - Unique context ID
   * @param {string} parentContextId - Parent context ID
   * @param {Object} sourceVariable - Source entity variable
   * @param {Object} targetVariable - Target entity variable
   */
  createPatternContext(contextId, parentContextId, sourceVariable, targetVariable) {
    const localVariables = [sourceVariable.id, targetVariable.id];
    const inheritedVariables = this.getInheritedVariables(parentContextId);

    this.contextHierarchy[contextId] = {
      id: contextId,
      parentId: parentContextId,
      localVariables,
      inheritedVariables,
      children: []
    };

    // Update parent's children
    if (parentContextId && this.contextHierarchy[parentContextId]) {
      this.contextHierarchy[parentContextId].children.push(contextId);
    }
  }

  /**
   * Create a new context for a nested group
   * @param {string} contextId - Unique context ID
   * @param {string} parentContextId - Parent context ID
   */
  createGroupContext(contextId, parentContextId) {
    const inheritedVariables = this.getAvailableVariables(parentContextId);

    this.contextHierarchy[contextId] = {
      id: contextId,
      parentId: parentContextId,
      localVariables: [],
      inheritedVariables,
      children: []
    };

    // Update parent's children
    if (parentContextId && this.contextHierarchy[parentContextId]) {
      this.contextHierarchy[parentContextId].children.push(contextId);
    }
  }

  /**
   * Get all variables available in a given context
   * Includes inherited + local variables
   * @param {string} contextId - Context ID
   * @returns {Array<string>} Array of variable IDs
   */
  getAvailableVariables(contextId) {
    if (!contextId || !this.contextHierarchy[contextId]) {
      return [];
    }

    const context = this.contextHierarchy[contextId];
    const inherited = context.inheritedVariables || [];
    const local = context.localVariables || [];

    return [...inherited, ...local];
  }

  /**
   * Get inherited variables from parent contexts
   * @param {string} contextId - Context ID
   * @returns {Array<string>} Array of variable IDs
   */
  getInheritedVariables(contextId) {
    if (!contextId || contextId === 'root') {
      return [];
    }

    return this.getAvailableVariables(contextId);
  }

  /**
   * Get variable metadata by ID
   * @param {string} variableId - e.g., "Person(p1)"
   * @returns {Object} Variable metadata
   */
  getVariable(variableId) {
    return this.variableRegistry[variableId];
  }

  /**
   * Record a usage of a variable (e.g., in a property condition)
   * @param {string} variableId - Variable ID
   * @param {string} ruleId - Rule ID using this variable
   * @param {string} usageType - "filter-reference", "return", etc.
   */
  recordVariableUsage(variableId, ruleId, usageType) {
    if (this.variableRegistry[variableId]) {
      this.variableRegistry[variableId].usages.push({
        ruleId,
        role: usageType
      });
    }
  }

  /**
   * Reset the entire scoping state
   */
  reset() {
    this.variableCounters = {};
    this.variableRegistry = {};
    this.contextHierarchy = {
      root: {
        id: 'root',
        parentId: null,
        localVariables: [],
        inheritedVariables: [],
        children: []
      }
    };
  }
}

export default VariableScopingManager;
```

### 2. Updates to `VisualQueryBuilder.js`

```javascript
// Key changes to integrate variable scoping

import VariableScopingManager from '../helpers/variableScoping';

const VisualQueryBuilder = () => {
  const [query, setQuery] = useState(initialQuery);
  const [scopingManager] = useState(() => new VariableScopingManager());

  // Enhanced field selector that shows variables
  const renderFieldSelector = (props) => {
    const { rule, handleOnChange } = props;
    const contextId = rule.contextId || 'root';
    const availableVariableIds = scopingManager.getAvailableVariables(contextId);

    // Build field options with variables
    const fieldOptions = [];

    // Add entity.property fields for each available variable
    availableVariableIds.forEach(variableId => {
      const variable = scopingManager.getVariable(variableId);
      const entityType = variable.entityType;
      const entityProperties = getPropertiesForEntity(entityType);

      entityProperties.forEach(prop => {
        fieldOptions.push({
          name: `${variableId}.${prop.name}`,
          label: `${variableId}.${prop.label}`,
          inputType: prop.inputType,
          variableId: variableId,
          entityType: entityType,
          propertyName: prop.name
        });
      });
    });

    // Add relationship fields
    const relationshipFields = getRelationshipFields();
    fieldOptions.push(...relationshipFields);

    return (
      <select
        value={props.value}
        onChange={(e) => handleOnChange(e.target.value)}
      >
        <option value="">Select field...</option>
        {fieldOptions.map(field => (
          <option key={field.name} value={field.name}>
            {field.label}
          </option>
        ))}
      </select>
    );
  };

  // Enhanced rule change handler
  const handleQueryChange = (newQuery) => {
    // Rebuild scoping state when query changes
    rebuildScopingContext(newQuery);
    setQuery(newQuery);
  };

  const rebuildScopingContext = (queryTree, parentContextId = 'root') => {
    // Reset scoping manager
    scopingManager.reset();

    // Traverse query tree and rebuild variable assignments
    traverseAndBuildScoping(queryTree, parentContextId);
  };

  const traverseAndBuildScoping = (node, parentContextId) => {
    if (!node.rules) return;

    node.rules.forEach(rule => {
      if (rule.combinator) {
        // It's a group - create group context
        const groupContextId = `context-group-${rule.id}`;
        scopingManager.createGroupContext(groupContextId, parentContextId);

        // Recursively process nested rules
        traverseAndBuildScoping(rule, groupContextId);
      } else if (isRelationshipRule(rule)) {
        // It's a relationship rule - create pattern context and variables
        const patternContextId = `context-pattern-${rule.id}`;

        // Generate or retrieve variables
        let sourceVar = rule.sourceVariable;
        let targetVar = rule.targetVariable;

        if (!sourceVar) {
          sourceVar = scopingManager.generateVariable(
            rule.field,
            rule.id,
            patternContextId,
            'source'
          );
        }

        if (!targetVar) {
          targetVar = scopingManager.generateVariable(
            rule.value,
            rule.id,
            patternContextId,
            'target'
          );
        }

        // Create pattern context
        scopingManager.createPatternContext(
          patternContextId,
          parentContextId,
          sourceVar,
          targetVar
        );

        // Update rule with variable info
        rule.sourceVariable = sourceVar;
        rule.targetVariable = targetVar;
        rule.contextId = patternContextId;
      } else {
        // It's a property rule - extract variable reference from field
        const fieldParts = rule.field.split('.');
        if (fieldParts.length === 2) {
          // Format: "Person(p1).firstName"
          const variableId = fieldParts[0];
          if (scopingManager.getVariable(variableId)) {
            rule.entityVariable = {
              variableId,
              ...scopingManager.getVariable(variableId)
            };
            scopingManager.recordVariableUsage(variableId, rule.id, 'filter-reference');
          }
        } else if (fieldParts.length === 1 && fieldParts[0].includes('(')) {
          // Format: "Person(p1)" - existence check
          const variableId = fieldParts[0];
          if (scopingManager.getVariable(variableId)) {
            rule.entityVariable = {
              variableId,
              ...scopingManager.getVariable(variableId)
            };
            scopingManager.recordVariableUsage(variableId, rule.id, 'filter-reference');
          }
        }

        rule.contextId = parentContextId;
      }
    });
  };

  // Rest of component...
};
```

### 3. Updates to `ontologyToQueryBuilder.js`

```javascript
// Enhanced query generation with variable awareness

export function convertQueryToGraphQL(query, ontologyData) {
  const ontology = ontologyData.data[0];

  // Extract variable information from query
  const variableMap = extractVariableMap(query);

  // Rest of existing logic...

  // When generating property conditions, use variable context
  const generatePropertyCondition = (rule) => {
    if (rule.entityVariable) {
      const { variableId, alias, entityType } = rule.entityVariable;
      const propertyName = rule.field.split('.')[1];

      // Generate condition with variable context
      return {
        variable: alias,
        entityType,
        property: propertyName,
        operator: rule.operator,
        value: rule.value
      };
    }

    // Fallback to legacy behavior
    const [entityType, propertyName] = rule.field.split('.');
    return {
      entityType,
      property: propertyName,
      operator: rule.operator,
      value: rule.value
    };
  };

  // Rest of implementation...
}

export function convertQueryToCypher(query, ontologyData) {
  const ontology = ontologyData.data[0];

  // Extract variable information
  const variableMap = extractVariableMap(query);
  const relationships = extractRelationships(query);

  // Build MATCH clauses with variables
  const matchClauses = relationships.map(rel => {
    const sourceVar = rel.sourceVariable?.alias || 'n';
    const targetVar = rel.targetVariable?.alias || 'm';
    const sourceType = rel.sourceVariable?.entityType || rel.field;
    const targetType = rel.targetVariable?.entityType || rel.value;
    const relType = rel.operator;

    return `(${sourceVar}:${sourceType})-[r_${sourceVar}_${targetVar}:${relType.toUpperCase()}]->(${targetVar}:${targetType})`;
  });

  // Build WHERE clauses with variable references
  const propertyConditions = extractPropertyConditions(query);
  const whereClauses = propertyConditions.map(cond => {
    const variable = cond.entityVariable?.alias || 'n';
    const property = cond.field.split('.')[1];
    const operator = mapOperatorToCypher(cond.operator);
    const value = formatValue(cond.value, cond.operator);

    return `${variable}.${property} ${operator} ${value}`;
  });

  // Build RETURN clause with all variables
  const returnVars = Object.keys(variableMap).map(varId => {
    const variable = variableMap[varId];
    return variable.alias;
  }).join(', ');

  let cypherQuery = `MATCH ${matchClauses.join(', ')}\n`;
  if (whereClauses.length > 0) {
    cypherQuery += `WHERE ${whereClauses.join(' AND ')}\n`;
  }
  cypherQuery += `RETURN ${returnVars}`;

  return cypherQuery;
}

// Helper: Extract variable map from query
function extractVariableMap(query) {
  const variableMap = {};

  const traverse = (node) => {
    if (!node.rules) return;

    node.rules.forEach(rule => {
      if (rule.combinator) {
        traverse(rule);
      } else if (rule.sourceVariable && rule.targetVariable) {
        variableMap[rule.sourceVariable.id] = rule.sourceVariable;
        variableMap[rule.targetVariable.id] = rule.targetVariable;
      } else if (rule.entityVariable) {
        variableMap[rule.entityVariable.variableId] = rule.entityVariable;
      }
    });
  };

  traverse(query);
  return variableMap;
}
```

## UI/UX Design

### 1. Field Selector Enhancement

**Current Behavior:**
```
[Dropdown: Select field...]
  ├─ Person
  ├─ Dragon
  ├─ Kingdom
  ├─ Person.firstName
  ├─ Person.lastName
  ├─ Dragon.name
  ├─ Dragon.color
  └─ Kingdom.funds
```

**New Behavior with Variables:**
```
[Dropdown: Select field...]
  ├─── Entities ───
  ├─ Person(p1)
  ├─ Kingdom(k1)
  ├─ Dragon(d1)
  ├─ Dragon(d2)
  ├─── Properties ───
  ├─ Person(p1).firstName
  ├─ Person(p1).lastName
  ├─ Kingdom(k1).name
  ├─ Kingdom(k1).funds
  ├─ Dragon(d1).name
  ├─ Dragon(d1).color
  ├─ Dragon(d2).name
  ├─ Dragon(d2).color
  ├─── Relationships ───
  ├─ Person -> OriginatedIn -> Kingdom
  ├─ Dragon -> Fire -> Dragon
  └─ Dragon -> Freeze -> Dragon
```

### 2. Visual Indicators

Add visual badges/tags to indicate variable context:

```
┌─────────────────────────────────────────────────────────────┐
│ Rule: Person(p1) ──OriginatedIn──> Kingdom(k1)            │
│                     [source: p1]    [target: k1]           │
└─────────────────────────────────────────────────────────────┘
  │
  └─ [+] Where Kingdom(k1).funds > 1000
      │
      └─ [Group: AND]
           │
           ├─ Rule: Dragon(d1) ──Fire──> Dragon(d2)
           │                  [source: d1] [target: d2]
           │
           └─ [+] Where Dragon(d2).name = "morgan"
                   │
                   └─ [Group: AND]
                        │
                        └─ Rule: Dragon(d2) ──Freeze──> Dragon(d3)
                                          [source: d2] [target: d3]
```

### 3. Variable Tooltip/Hover

When hovering over a variable reference, show:
```
┌──────────────────────────────┐
│ Variable: Dragon(d2)         │
│ ────────────────────────     │
│ Type: Dragon                 │
│ Alias: d2                    │
│ Defined in: Pattern #3       │
│ Role: Target of Fire         │
│                              │
│ Used in:                     │
│ • Fire relationship (target) │
│ • Property filter (name)     │
│ • Freeze relationship (src)  │
└──────────────────────────────┘
```

## Implementation Phases

### Phase 1: Core Variable Management (Week 1-2)

**Objectives:**
- Implement `VariableScopingManager` class
- Add variable generation logic
- Add context hierarchy tracking

**Deliverables:**
- `variableScoping.js` utility module
- Unit tests for variable generation
- Unit tests for context management

**Success Criteria:**
- Can generate unique variables for entity instances
- Can track parent-child context relationships
- Can retrieve available variables for a given context

### Phase 2: Query Model Integration (Week 2-3)

**Objectives:**
- Update query data model to include variable metadata
- Implement `rebuildScopingContext` logic in `VisualQueryBuilder`
- Add variable tracking to relationship rules

**Deliverables:**
- Enhanced query structure with `sourceVariable`, `targetVariable`, `contextId`
- `rebuildScopingContext` function
- `traverseAndBuildScoping` function

**Success Criteria:**
- Query tree maintains variable assignments across edits
- Adding/removing rules updates scoping correctly
- Context hierarchy reflects query structure

### Phase 3: UI Integration (Week 3-4)

**Objectives:**
- Update field selector to show variable-prefixed fields
- Add visual indicators for variable context
- Implement variable tooltips/hover states

**Deliverables:**
- Enhanced `renderFieldSelector` component
- Visual badges showing variable aliases
- Tooltip component for variable metadata

**Success Criteria:**
- Field selector shows `Person(p1).firstName` and `Person(p2).firstName` separately
- Users can distinguish between different entity instances
- Hovering over variables shows metadata

### Phase 4: Query Generation (Week 4-5)

**Objectives:**
- Update Cypher generation to use variables
- Update GraphQL generation (where applicable)
- Add variable-aware WHERE clause generation

**Deliverables:**
- Enhanced `convertQueryToCypher` with variable mapping
- Enhanced `convertQueryToGraphQL` (if applicable)
- `extractVariableMap` helper function

**Success Criteria:**
- Generated Cypher uses assigned variable names
- WHERE clauses reference correct variable instances
- RETURN clause includes all variables

### Phase 5: Testing & Refinement (Week 5-6)

**Objectives:**
- Comprehensive testing of variable scoping
- Edge case handling (variable reuse, orphaned variables)
- Performance optimization

**Deliverables:**
- Integration tests for complex queries
- Edge case test suite
- Performance benchmarks

**Success Criteria:**
- All test templates generate correct queries with variables
- No variable naming conflicts
- Query builder remains responsive with deep nesting

## Edge Cases & Considerations

### 1. Variable Reuse

**Scenario:** User wants to reference the same entity instance in multiple places.

**Example:**
```
Person(p1) -> Know -> Person(p2)
Person(p1) -> Own -> Dragon(d1)
```

**Solution:** When adding a second relationship starting from Person, offer option to:
- Create new variable: `Person(p3)`
- Reuse existing variable: `Person(p1)`

**UI:**
```
┌─────────────────────────────────────────┐
│ Select source entity:                   │
│  ○ New Person instance → Person(p3)     │
│  ○ Existing Person(p1)                  │
│  ○ Existing Person(p2)                  │
└─────────────────────────────────────────┘
```

### 2. Orphaned Variables

**Scenario:** User deletes a relationship rule, leaving property conditions that reference orphaned variables.

**Example:**
```
// Before deletion:
Person(p1) -> Know -> Person(p2)
Person(p2).firstName = "George"

// User deletes relationship rule
// Now Person(p2).firstName is orphaned
```

**Solution:**
- Detect orphaned variable references when rule is deleted
- Show warning modal: "Deleting this rule will orphan 2 property conditions"
- Option 1: Delete orphaned conditions automatically
- Option 2: Cancel deletion
- Option 3: Keep conditions (show as errors)

### 3. Variable Naming Conflicts

**Scenario:** Variable counter increments past reasonable limits (e.g., `p99`).

**Solution:**
- Reuse lowest available number when variables are deleted
- Example: Delete `Person(p2)` → next Person becomes `p2`, not `p4`

### 4. Copy/Paste with Variables

**Scenario:** User copies a rule with variables and pastes it.

**Solution:**
- Option 1: Generate new variables for pasted rules
- Option 2: Allow user to choose: "Keep variables" vs "Generate new"

### 5. Template Loading with Variables

**Scenario:** Templates don't have pre-assigned variables (backward compatibility).

**Solution:**
- Templates continue to use simple entity names: `Person`, `Dragon`
- When template is loaded, `rebuildScopingContext` assigns variables
- Variable assignment is deterministic (same template always gets same variables)

## Backward Compatibility

### Migration Strategy

**Existing Queries:**
Old query format without variables will continue to work:

```javascript
// Old format (no variables)
{
  field: "Person",
  operator: "Know",
  value: "Person"
}

// Automatic migration on load:
{
  field: "Person",
  operator: "Know",
  value: "Person",
  sourceVariable: { entityType: "Person", alias: "p1", variableId: "Person(p1)" },
  targetVariable: { entityType: "Person", alias: "p2", variableId: "Person(p2)" }
}
```

**Templates:**
Templates in `QueryTemplates.js` remain unchanged. Variables are assigned when template is selected:

```javascript
// Template definition (unchanged)
{
  description: "Find persons who know someone named George",
  query: {
    combinator: "and",
    rules: [
      { field: "Person", operator: "Know", value: "Person" },
      { field: "Person.firstName", operator: "=", value: "George" }
    ]
  }
}

// After loading (variables added automatically)
{
  description: "Find persons who know someone named George",
  query: {
    combinator: "and",
    rules: [
      {
        field: "Person",
        operator: "Know",
        value: "Person",
        sourceVariable: { entityType: "Person", alias: "p1", variableId: "Person(p1)" },
        targetVariable: { entityType: "Person", alias: "p2", variableId: "Person(p2)" }
      },
      {
        field: "Person(p2).firstName",  // Auto-mapped to target
        operator: "=",
        value: "George",
        entityVariable: { variableId: "Person(p2)", entityType: "Person", alias: "p2" }
      }
    ]
  }
}
```

## Example: Complete Flow

### User Action Sequence

1. **User loads template: "Find persons who know someone named George"**

   Query Builder receives:
   ```javascript
   {
     combinator: "and",
     rules: [
       { field: "Person", operator: "Know", value: "Person" },
       { field: "Person.firstName", operator: "=", value: "George" }
     ]
   }
   ```

2. **System runs `rebuildScopingContext`**

   - Creates `Person(p1)` for source of Know relationship
   - Creates `Person(p2)` for target of Know relationship
   - Creates pattern context for Know rule
   - Maps `Person.firstName` → `Person(p2).firstName` (target inference)

   Updated query:
   ```javascript
   {
     combinator: "and",
     rules: [
       {
         id: "rule-1",
         field: "Person",
         operator: "Know",
         value: "Person",
         sourceVariable: { entityType: "Person", alias: "p1", variableId: "Person(p1)" },
         targetVariable: { entityType: "Person", alias: "p2", variableId: "Person(p2)" },
         contextId: "context-pattern-rule-1"
       },
       {
         id: "rule-2",
         field: "Person(p2).firstName",
         operator: "=",
         value: "George",
         entityVariable: { variableId: "Person(p2)", entityType: "Person", alias: "p2" },
         contextId: "root"
       }
     ]
   }
   ```

3. **User views query in UI**

   Visual display:
   ```
   Rule 1: Person(p1) ──Know──> Person(p2)
           └─ Property: Person(p2).firstName = "George"
   ```

4. **User clicks "Add Property Condition"**

   Field selector shows:
   ```
   [Dropdown: Select field...]
     ├─── Properties ───
     ├─ Person(p1).firstName
     ├─ Person(p1).lastName
     ├─ Person(p1).gender
     ├─ Person(p2).firstName  ← Already used
     ├─ Person(p2).lastName
     ├─ Person(p2).gender
   ```

   User selects: `Person(p1).firstName`

5. **User enters value: "Alice"**

   Updated query:
   ```javascript
   {
     combinator: "and",
     rules: [
       {
         id: "rule-1",
         field: "Person",
         operator: "Know",
         value: "Person",
         sourceVariable: { entityType: "Person", alias: "p1", variableId: "Person(p1)" },
         targetVariable: { entityType: "Person", alias: "p2", variableId: "Person(p2)" },
         contextId: "context-pattern-rule-1"
       },
       {
         id: "rule-2",
         field: "Person(p2).firstName",
         operator: "=",
         value: "George",
         entityVariable: { variableId: "Person(p2)", entityType: "Person", alias: "p2" },
         contextId: "root"
       },
       {
         id: "rule-3",
         field: "Person(p1).firstName",
         operator: "=",
         value: "Alice",
         entityVariable: { variableId: "Person(p1)", entityType: "Person", alias: "p1" },
         contextId: "root"
       }
     ]
   }
   ```

6. **User clicks "Generate Cypher"**

   System calls `convertQueryToCypher`:
   ```cypher
   MATCH (p1:Person)-[r_p1_p2:KNOW]->(p2:Person)
   WHERE p2.firstName = 'George' AND p1.firstName = 'Alice'
   RETURN p1, p2, r_p1_p2
   ```

   Result: **Correct query with distinct variables!**

## Testing Strategy

### Unit Tests

1. **Variable Generation**
   - Test unique variable generation for same entity type
   - Test variable counter management
   - Test variable registry updates

2. **Context Management**
   - Test pattern context creation
   - Test group context creation
   - Test context hierarchy traversal
   - Test inherited variable resolution

3. **Scope Resolution**
   - Test `getAvailableVariables` for various contexts
   - Test variable visibility in nested groups
   - Test sibling context isolation

### Integration Tests

1. **Query Builder Integration**
   - Test `rebuildScopingContext` with complex queries
   - Test variable assignment on rule addition
   - Test variable cleanup on rule deletion
   - Test variable preservation across query edits

2. **Field Selector**
   - Test field options include all available variables
   - Test property fields show variable prefixes
   - Test relationship fields remain unprefixed

3. **Query Generation**
   - Test Cypher generation with multiple variables
   - Test WHERE clause variable references
   - Test RETURN clause includes all variables

### End-to-End Tests

1. **Template Loading**
   - Load each template and verify variable assignment
   - Verify generated Cypher matches expected output
   - Verify GraphQL generation (if applicable)

2. **Complex Scenarios**
   - Multi-level nested groups with variables
   - Multiple instances of same entity type
   - Correlated multi-relationship queries with variables

3. **Edge Cases**
   - Orphaned variable detection
   - Variable reuse scenarios
   - Deep nesting (5+ levels)

## Performance Considerations

### Optimization Strategies

1. **Lazy Variable Generation**
   - Only generate variables when relationship rules are created
   - Defer context building until query is rendered or generated

2. **Memoization**
   - Cache `getAvailableVariables` results per context
   - Invalidate cache only when context hierarchy changes

3. **Incremental Updates**
   - When a single rule is added/removed, update only affected contexts
   - Avoid full `rebuildScopingContext` on every change

4. **Field Selector Optimization**
   - Pre-compute field options when context changes
   - Use virtual scrolling for large field lists

### Benchmarks

Target performance metrics:
- Variable generation: < 1ms per variable
- Context creation: < 5ms per context
- `getAvailableVariables`: < 10ms for deep nesting (10 levels)
- Field selector render: < 50ms for 100+ fields
- Full `rebuildScopingContext`: < 100ms for complex queries (50+ rules)

## Future Enhancements

### 1. Variable Renaming

Allow users to rename variables for better readability:
```
Person(p1) → Person(alice)
Person(p2) → Person(george)
```

### 2. Variable Constraints

Add UI for specifying variable constraints:
```
Person(p1) ≠ Person(p2)  // Ensure different instances
Dragon(d1) = Dragon(d2)  // Ensure same instance
```

### 3. Visual Graph View

Show query as a visual graph with variable labels on nodes:
```
   (p1:Person) ──KNOW──> (p2:Person)
       │                     │
   firstName="Alice"    firstName="George"
```

### 4. Variable Auto-Completion

Smart suggestions when adding rules:
```
User types: "Person(p"
Autocomplete:
  ├─ Person(p1) - existing
  ├─ Person(p2) - existing
  └─ Person(p3) - new
```

### 5. Export with Variable Names

When exporting queries, preserve variable names in JSON:
```json
{
  "variables": {
    "alice": { "type": "Person", "alias": "p1" },
    "george": { "type": "Person", "alias": "p2" }
  },
  "pattern": "alice-[:KNOW]->george"
}
```

## Conclusion

This implementation design provides a comprehensive roadmap for adding Cypher-like variable scoping to the Visual Query Builder. The phased approach ensures incremental progress with testable milestones, while the detailed architecture provides clear guidance for developers.

**Key Benefits:**
- Eliminates ambiguity in multi-instance queries
- Provides visual clarity through variable labels
- Generates semantically correct Cypher queries
- Maintains backward compatibility with existing queries and templates
- Extensible foundation for future enhancements

**Next Steps:**
1. Review and approve this design document
2. Create implementation tasks for Phase 1
3. Set up development branch and testing infrastructure
4. Begin implementation of `VariableScopingManager`
