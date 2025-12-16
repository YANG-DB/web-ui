# Screenshots Guide

This directory contains screenshots for the web-ui documentation. Follow this guide to capture and add missing screenshots.

## Screenshot Requirements

### General Guidelines
- **Resolution**: Minimum 1920x1080 for desktop screenshots
- **Format**: PNG for UI screenshots, JPG for photos
- **Naming**: Use kebab-case (lowercase with hyphens)
- **Browser**: Chrome or Firefox with developer tools closed
- **Theme**: Use the application's dark theme
- **Zoom**: 100% browser zoom level

### Annotation Guidelines
- Use red arrows/boxes to highlight important UI elements
- Keep annotations minimal and clear
- Use consistent annotation style across all screenshots

---

## Visual Query Builder Screenshots

### 1. visual-query-builder.png
**Overview of the query builder interface**

**What to capture**:
- Research tab with query builder visible
- At least 2-3 rules added to show functionality
- Query preview panel visible (optional)
- Ontology selector at top

**Example query**:
```
AND:
  Person -[Own]-> Dragon
    └─> Dragon.color = "Red"
  Person.age >= 18
```

**Annotations**:
- Highlight the "+ Rule" and "+ Group" buttons
- Point to the ontology selector
- Indicate the query preview button

---

### 2. ontology-selector.png
**Ontology dropdown with Dragons/LinkedIn options**

**What to capture**:
- Research page header with ontology dropdown OPEN
- Both "Dragons" and "LinkedIn" options visible
- Current selection highlighted

**Steps**:
1. Navigate to Research tab
2. Click ontology dropdown
3. Capture screenshot while dropdown is open

**Annotations**:
- Red box around dropdown
- Arrow pointing to selected option

---

### 3. query-entity-selection.png
**Entity selection dropdown**

**What to capture**:
- Field dropdown OPEN showing entity types
- Options like "Person", "Dragon", "Horse", "Guild", "Kingdom"
- Also show entity properties like "Person > firstName"

**Steps**:
1. Click "+ Rule"
2. Click field dropdown
3. Capture while dropdown is open

**Annotations**:
- Highlight difference between entities and entity properties

---

### 4. query-relationship-operators.png
**Relationship operator selection**

**What to capture**:
- Rule with "Person" selected as field
- Operator dropdown OPEN showing relationships
- Options: "Own", "MemberOf"
- Value dropdown OPEN showing "Dragon", "Horse"

**Steps**:
1. Select "Person" as field
2. Click operator dropdown to show relationships
3. Take first screenshot
4. Select a relationship, then open value dropdown
5. Take second screenshot

**Annotations**:
- Label showing "Relationship operators" vs "Property operators"
- Arrow pointing to relationship names

---

### 5. query-property-filters.png
**Property filter interface**

**What to capture**:
- Rule with entity property selected (e.g., "Person > firstName")
- Operator dropdown showing comparison operators (=, !=, contains, etc.)
- Text input with example value

**Example**:
```
Person.firstName contains "John"
```

**Annotations**:
- Highlight the property selector
- Point to operator options
- Show value input field

---

### 6. query-expansion-before.png
**Relationship rule with "+" button**

**What to capture**:
- Single relationship rule: Person -[Own]-> Dragon
- Pink "+" button visible next to "×" button
- Mouse cursor hovering over "+" button (optional)

**Steps**:
1. Create relationship rule
2. Ensure "+ button is visible
3. Capture screenshot

**Annotations**:
- Red circle around "+" button
- Tooltip text: "Click to expand relationship"

---

### 7. query-expansion-after.png
**Expanded nested subgroup**

**What to capture**:
- Expanded relationship showing nested structure
- Parent rule: Person -[Own]-> Dragon
- Indented subgroup with pink left border
- Target entity rule: Dragon (with relationship operators visible)

**Structure**:
```
AND:
  Person -[Own]-> Dragon
    └─> AND (nested subgroup with pink border):
        Dragon [operator dropdown]
```

**Annotations**:
- Highlight pink left border of nested subgroup
- Show indentation with dotted line
- Label "Nested subgroup for target entity"

---

### 8. query-preview.png
**Query preview panel with syntax highlighting**

**What to capture**:
- Query preview panel open
- Language selector showing "Cypher" selected
- Syntax-highlighted Cypher query visible
- Example query showing MATCH, WHERE, RETURN

**Example preview**:
```cypher
MATCH (person:Person)-[own:OWN]->(dragon:Dragon)
WHERE dragon.color = 'Red' AND person.age >= 18
RETURN person, own, dragon
```

**Annotations**:
- Highlight language dropdown
- Point to syntax highlighting colors
- Show "Show/Hide Preview" button

---

### 9. query-nested-groups.png
**Complex nested AND/OR groups**

**What to capture**:
- Multiple levels of nested groups
- Mix of AND and OR combinators
- At least 3 levels deep

**Example structure**:
```
AND:
  Person.age >= 18
  OR:
    Dragon.color = "Red"
    Dragon.color = "Blue"
  Person -[MemberOf]-> Guild
```

**Annotations**:
- Number each nesting level
- Highlight combinators (AND/OR)
- Show group boundaries

---

### 10. query-multi-level.png
**Multi-level relationship chains**

**What to capture**:
- Chain of expanded relationships
- 3 levels: Person → Guild → Kingdom
- Each level indented further right
- Pink borders showing relationship nesting

**Example structure**:
```
Person -[MemberOf]-> Guild
  └─> Guild -[RegisteredIn]-> Kingdom
      └─> Kingdom.name = "Seven Kingdoms"
```

**Annotations**:
- Draw connection lines between levels
- Label each relationship type
- Show indentation hierarchy

---

## Schema Viewer Screenshots

### 11. schema-viewer.png
**Overview of schema viewer**

**What to capture**:
- Schema tab with GraphQL schema displayed
- Ontology selector in header
- Syntax highlighting visible
- Actions menu (Share, Export buttons)

**Annotations**:
- Highlight main components
- Point to ontology selector
- Show actions menu

---

### 12. schema-ontology-selector.png
**Ontology selector in Schema tab**

**What to capture**:
- Schema page header
- Ontology dropdown OPEN
- Dragons and LinkedIn options visible

**Steps**:
1. Navigate to Schema tab
2. Click ontology dropdown
3. Capture while open

**Annotations**:
- Red box around selector
- Highlight current selection

---

### 13. schema-graphql-view.png
**GraphQL schema display**

**What to capture**:
- Full GraphQL schema for Dragons ontology
- Multiple type definitions visible
- Syntax highlighting active
- Show Person, Dragon, Guild types

**Example content**:
```graphql
type Person {
  id: ID!
  firstName: String
  lastName: String
  own: [Dragon]
  memberOf: [Guild]
}
```

**Annotations**:
- Highlight type definitions
- Point to relationship fields
- Show property types

---

### 14. schema-dragons-ontology.png
**Visual graph of Dragons ontology**

**What to capture**:
- Node-link diagram showing all entities
- Nodes: Person, Dragon, Horse, Guild, Kingdom
- Edges: Own, Fire, Freeze, MemberOf, RegisteredIn
- Labels on relationships

**Creation**:
- Use a graph visualization tool (like draw.io, Lucidchart)
- Or screenshot from a graph database viewer
- Nodes should be circles/rectangles with entity names
- Edges should be arrows with relationship names

**Annotations**:
- Color code entity types
- Label all relationships
- Add legend

---

### 15. schema-linkedin-ontology.png
**Visual graph of LinkedIn ontology**

**What to capture**:
- Node-link diagram for LinkedIn entities
- Central Person node with connections to Company, School, Skill, etc.
- Show relationship types on edges

**Same creation process as Dragons ontology**

**Annotations**:
- Highlight professional relationships
- Group related entities
- Add legend

---

### 16. schema-actions.png
**Schema actions menu**

**What to capture**:
- Top-right actions section
- "share" and possibly other action buttons visible
- Hover state on one button

**Annotations**:
- Label each action button
- Show tooltip if visible

---

### 17. schema-loading.png
**Loading state**

**What to capture**:
- Schema page showing "Loading ontology..." message
- No schema content visible yet
- Loading spinner (if present)

**Steps**:
1. Clear browser cache
2. Navigate to Schema tab
3. Quickly capture during load time

---

## Additional Screenshots

### dashboard-overview.png (Already exists)
✓ This screenshot already exists in the directory

---

## Screenshot Capture Tools

### Recommended Tools
- **Windows**: Snipping Tool, Greenshot
- **macOS**: Cmd+Shift+4 (native), CleanShot X
- **Linux**: Flameshot, GNOME Screenshot
- **Browser Extensions**: Awesome Screenshot, Nimbus Screenshot

### Editing Tools
- **Simple annotations**: Snagit, Greenshot
- **Professional**: Adobe Photoshop, GIMP
- **Quick edits**: Preview (macOS), Paint.NET (Windows)

---

## After Capturing

1. **Optimize file size**:
   - Use PNG compression (TinyPNG, ImageOptim)
   - Target < 500KB per screenshot
   - Don't sacrifice clarity for size

2. **Verify screenshots**:
   - Check that highlighted elements are visible
   - Ensure text is readable
   - Confirm annotations are clear

3. **Update documentation**:
   - Verify image paths in markdown files
   - Test that images load correctly
   - Update this README if adding new screenshots

---

## Screenshot Checklist

Use this checklist when capturing screenshots:

- [ ] Browser window maximized or consistent size
- [ ] Dark theme enabled
- [ ] No personal/sensitive data visible
- [ ] UI elements clearly visible
- [ ] Annotations added (if specified)
- [ ] File named correctly
- [ ] File size optimized
- [ ] Screenshot added to `/docs/images/`
- [ ] Referenced in documentation
- [ ] Tested in documentation preview

---

## Questions?

If you need clarification on any screenshot requirements, refer to:
- [Visual Query Builder Documentation](../VISUAL_QUERY_BUILDER.md)
- [Schema Viewer Documentation](../SCHEMA_VIEWER.md)
- [Main README](../../README.md)
