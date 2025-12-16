# Visual Query Builder

The Visual Query Builder provides an intuitive interface for constructing complex graph queries without writing code. It supports relationship patterns, entity filtering, and multi-ontology selection.

## Features

### 1. Ontology Selection

Switch between different ontologies (Dragons, LinkedIn) to query different data domains.

**Location**: Research tab, top of the page

**How to use**:
1. Navigate to the Research tab
2. Use the "Ontology" dropdown at the top to select between available ontologies
3. The query builder will automatically update to show fields and relationships from the selected ontology

![Ontology Selector](images/ontology-selector.png)
*Screenshot should show: The Research page with the ontology dropdown expanded, showing "Dragons" and "LinkedIn" options*

---

### 2. Building Queries

#### Entity Selection

Select entities (Person, Dragon, Guild, etc.) to begin building your query.

**Steps**:
1. Click "+ Rule" to add a new query rule
2. In the "Field" dropdown, select an entity type (e.g., "Person")
3. The operator dropdown will show available relationships for that entity

![Entity Selection](images/query-entity-selection.png)
*Screenshot should show: A query rule with the Field dropdown open, displaying entity types like "Person", "Dragon", "Horse"*

#### Relationship Operators

When an entity is selected, relationship operators replace standard comparison operators.

**Example**:
- Select "Person" as the field
- Operator dropdown shows relationship types: "Own", "MemberOf"
- Value dropdown shows target entities: "Dragon", "Guild"

![Relationship Operators](images/query-relationship-operators.png)
*Screenshot should show: A rule with "Person" selected, operator dropdown showing "Own", "MemberOf", and value dropdown showing "Dragon"*

#### Property Filters

Add filters on entity properties (name, color, age, etc.).

**Steps**:
1. Click "+ Rule"
2. Select an entity property (e.g., "Person > firstName")
3. Choose a comparison operator (=, !=, contains, etc.)
4. Enter the filter value

![Property Filters](images/query-property-filters.png)
*Screenshot should show: A rule filtering "Person.firstName" with operator "contains" and value "John"*

#### Relationship Expansion

Expand relationships to query properties of connected entities.

**Steps**:
1. Create a relationship rule (e.g., Person -[Own]-> Dragon)
2. Click the **+** button next to the relationship rule
3. A nested subgroup appears, indented to the right
4. Add rules to filter the target entity (e.g., Dragon.color = "Red")

![Relationship Expansion - Before](images/query-expansion-before.png)
*Screenshot should show: A relationship rule "Person -[Own]-> Dragon" with a pink "+" button visible next to the remove "×" button*

![Relationship Expansion - After](images/query-expansion-after.png)
*Screenshot should show: The same rule expanded into a nested structure with:
- Person -[Own]-> Dragon (parent rule)
- Indented subgroup (with pink left border) containing:
  - Dragon (entity selector with relationship operators)*

**Visual indicators**:
- Nested subgroups have a pink left border and light pink background
- Indentation shows the query hierarchy
- The "+" button disappears after expansion (marked with `_expanded: true`)

---

### 3. Query Preview

View the generated query in multiple formats before execution.

**Supported formats**:
- **JSON**: Raw query builder structure
- **GraphQL**: GraphQL query format
- **Cypher**: Neo4j Cypher query format

**How to use**:
1. Build your query using the visual interface
2. Click "Show Preview" button
3. Select desired format from the dropdown (JSON/GraphQL/Cypher)
4. Review the generated query with syntax highlighting

![Query Preview](images/query-preview.png)
*Screenshot should show: The query preview panel with:
- Header showing "Query Preview:" and language selector dropdown
- Code panel with syntax-highlighted Cypher query showing MATCH patterns and WHERE clauses
- Example query like:*
```cypher
MATCH (person:Person)-[own:OWN]->(dragon:Dragon)
WHERE dragon.color = 'Red' AND person.firstName CONTAINS 'John'
RETURN person, own, dragon
```

---

### 4. Complex Query Patterns

#### Nested Groups

Combine multiple conditions with AND/OR logic.

**Steps**:
1. Click "+ Group" to add a nested condition group
2. Choose "AND" or "OR" combinator
3. Add multiple rules within the group

![Nested Groups](images/query-nested-groups.png)
*Screenshot should show: A complex query with nested AND/OR groups*

#### Multi-level Relationships

Chain relationship patterns to query across multiple hops.

**Example pattern**:
```
Person -[MemberOf]-> Guild
  └─> Guild -[Located]-> Kingdom
      └─> Kingdom.name = "Seven Kingdoms"
```

![Multi-level Relationships](images/query-multi-level.png)
*Screenshot should show: Three levels of nested subgroups, each indented further right with pink borders*

---

## Query Execution

1. Build your query using the visual interface
2. Review the query preview (optional)
3. Click "Run Query" button
4. Results appear in the Results panel below

---

## Tips and Best Practices

### Query Construction
- Start with entity selection to see available relationships
- Use the "+" button to explore relationship targets
- Combine entity filters with relationship patterns for precise queries

### Performance
- Add property filters early to reduce result set size
- Use specific entity types rather than broad patterns
- Limit deeply nested relationship chains

### Ontology Switching
- Switching ontologies clears the current query
- Each ontology has different entities and relationships
- Preview queries before execution when switching ontologies

---

## Keyboard Shortcuts

- **Tab**: Move to next field
- **Enter**: In text fields, applies the value
- **Escape**: Cancel current operation

---

## Troubleshooting

### Issue: "+" button doesn't appear
- **Solution**: Ensure you've selected a relationship operator (not a property filter)
- **Note**: The button only appears for entity-to-entity relationships

### Issue: Input field loses focus after typing one character
- **Solution**: This was fixed in the latest version. Ensure you're running the updated code.

### Issue: Query preview shows empty
- **Solution**: Add at least one rule to the query. Empty queries have no preview.

---

## Related Documentation

- [Schema Viewer](SCHEMA_VIEWER.md) - View and edit GraphQL schemas
- [Relationship Patterns](../RELATIONSHIP_PATTERNS.md) - Understanding relationship patterns in the ontology
- [API Integration](API_INTEGRATION.md) - Connect custom data sources
