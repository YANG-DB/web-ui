# Relationship Pattern Support in Visual Query Builder

## Overview

The Visual Query Builder now supports graph relationship patterns, allowing users to construct queries that traverse relationships between entities in the Dragons ontology.

The builder provides **two methods** for creating relationship queries:

1. **Operator-based approach** (NEW, RECOMMENDED): Select an entity, then choose a relationship operator
2. **Field-based approach** (Legacy): Select pre-built relationship pattern fields

## Features

### Method 1: Operator-Based Relationship Queries (NEW)

When you select an **entity type field** (e.g., `Person`), the operator dropdown dynamically shows:
- Standard operators: `=`, `!=`
- **Relationship operators**: `-[RelationType]->` with target entity labels

**Example Workflow**:
1. Add Rule
2. Select field: `Person`
3. Select operator: `-[MemberOf]-> Guild`
4. Value dropdown automatically shows: `Guild` (or other valid targets for this relationship)

This creates: `Person -[MemberOf]-> Guild`

**Benefits**:
- More intuitive: Operators clearly show "Person relates to Guild via MemberOf"
- Context-aware: Value dropdown only shows valid target entities for the selected relationship
- Less cluttered: No separate relationship fields needed

### Method 2: Field-Based Relationship Queries (Legacy)

**1. Relationship Existence Queries**

Users can query for the existence or non-existence of relationships between entities:

**Example**: Find all Persons who are members of a Guild
```
Field: Person -[MemberOf]-> Guild
Operator: =
Value: Exists
```

**Example**: Find all Persons who do NOT own a Dragon
```
Field: Person -[Own]-> Dragon
Operator: =
Value: Does Not Exist
```

**2. Relationship Property Filters**

Users can filter based on properties of relationships:

**Example**: Find all Persons who joined a Guild after 2020
```
Field: Person -[MemberOf]-> Guild > startDate
Operator: >=
Value: "2020-01-01"
```

## Implementation Details

### Field Generation

Relationship fields are automatically generated from the Dragons ontology in [ontologyToQueryBuilder.js](client/src/helpers/ontologyToQueryBuilder.js):

- **Existence fields**: `relationship:EntityA-[RelationType]->EntityB`
- **Property fields**: `relationship:EntityA-[RelationType]->EntityB.propertyName`

### Visual Styling

Relationship fields have distinct visual styling in the query builder:
- Blue highlight (#88ddff) for relationship rules
- Light blue background for selected relationship rules
- Clear labeling with the pattern format: `EntityA -[RelationType]-> EntityB`

### Multi-Language Preview

The preview supports multiple query languages with relationship pattern support:

#### 1. **GraphQL**
```graphql
query {
  # Pattern: Person -[MemberOf]-> Guild
  persons {
    id
    memberof {
      ... on Guild {
        id
        startDate
      }
    }
  }
}
```

#### 2. **Cypher (Neo4j)**
```cypher
MATCH (a:Person)-[r:MEMBEROF]->(b:Guild)
WHERE r.startDate >= '2020-01-01'
RETURN a, r, b
```

#### 3. **JSON**
Shows the raw query builder structure with relationship field names.

#### 4. **SQL**
Converts to JOIN-based SQL queries (simplified).

#### 5. **MongoDB**
Converts to aggregation pipeline with $lookup for relationships.

## Usage Examples

### Example 1: Simple Relationship Existence
**Query**: "Find all Dragons owned by Persons"

**Visual Query Builder**:
1. Add Rule
2. Select field: `Person -[Own]-> Dragon`
3. Operator: `=`
4. Value: `Exists`

**Generated Cypher**:
```cypher
MATCH (a:Person)-[r:OWN]->(b:Dragon)
RETURN a, r, b
```

### Example 2: Relationship Property Filter
**Query**: "Find all Persons in Guilds founded after 2015"

**Visual Query Builder**:
1. Add Rule
2. Select field: `Person -[MemberOf]-> Guild > foundedDate`
3. Operator: `>=`
4. Value: `2015-01-01`

**Generated GraphQL**:
```graphql
query {
  # Pattern: Person -[MemberOf]-> Guild
  persons {
    id
    memberof {
      ... on Guild {
        id
        foundedDate
      }
    }
  }
}
```

### Example 3: Complex Query with Multiple Relationships
**Query**: "Find all Persons who own Dragons and are members of a Guild"

**Visual Query Builder**:
1. Add Group (AND combinator)
2. Add Rule: `Person -[Own]-> Dragon = Exists`
3. Add Rule: `Person -[MemberOf]-> Guild = Exists`

## File Structure

### Modified Files

1. **[client/src/helpers/ontologyToQueryBuilder.js](client/src/helpers/ontologyToQueryBuilder.js)**
   - `convertOntologyToQueryBuilderFields()`: Generates relationship pattern fields
   - `queryBuilderToGraphQLQuery()`: Converts queries to GraphQL with relationship support

2. **[client/src/components/VisualQueryBuilder.js](client/src/components/VisualQueryBuilder.js)**
   - Enhanced preview generation for all languages
   - Added relationship field logging
   - Updated Cypher conversion for relationship patterns

3. **[client/src/components/VisualQueryBuilder.module.css](client/src/components/VisualQueryBuilder.module.css)**
   - Custom styling for relationship fields
   - Visual distinction with blue highlights

## Testing

To test the relationship pattern feature:

1. Navigate to the Research page (http://localhost:3000/research)
2. Click "Add Rule" in the Visual Query Builder
3. Look for fields with the pattern `EntityA -[RelationType]-> EntityB`
4. Select a relationship field and configure the rule
5. Click "Show Preview" to see the generated query in different languages
6. Use the language selector to switch between JSON, GraphQL, SQL, MongoDB, and Cypher

## Console Logging

The implementation includes console logging for debugging:

```javascript
console.log("Generated query builder fields:", queryFields);
console.log("Relationship pattern fields:", relationshipFields);
```

Check the browser console to verify relationship fields are being generated correctly.

## Known Limitations

1. **Multiple Relationships**: The Cypher and GraphQL generators currently handle only the first relationship in complex queries with multiple relationship patterns. Future enhancements could support multiple relationship traversals.

2. **Relationship Direction**: Currently only supports unidirectional relationships (A->B). Bidirectional relationships would require additional syntax support.

3. **Nested Relationships**: Chained relationship patterns (A->B->C) are not yet supported but could be added in future versions.

## Future Enhancements

1. **Visual Relationship Graph**: Show a visual representation of the relationship pattern being built
2. **Multi-hop Traversal**: Support for chained relationships (Person->Guild->Kingdom)
3. **Relationship Property Suggestions**: Auto-suggest relationship properties based on ontology
4. **Bidirectional Patterns**: Support for (A)-[Rel]-(B) bidirectional patterns
5. **Variable-length Paths**: Support for patterns like [Rel*1..3] for variable-length paths
6. **Pattern Library**: Pre-built relationship pattern templates for common queries
