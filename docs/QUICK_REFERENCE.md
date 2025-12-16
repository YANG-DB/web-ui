# Quick Reference Guide

## Visual Query Builder Cheat Sheet

### Basic Query Building

| Action | Steps |
|--------|-------|
| **Add Entity Rule** | Click "+ Rule" → Select entity (Person, Dragon, etc.) |
| **Add Relationship** | Select entity → Choose relationship operator (Own, MemberOf, etc.) → Select target entity |
| **Expand Relationship** | Click pink "+" button next to relationship rule |
| **Add Property Filter** | Click "+ Rule" → Select "Entity > Property" → Choose operator → Enter value |
| **Group Conditions** | Click "+ Group" → Choose AND/OR → Add rules inside group |
| **Remove Rule** | Click "×" button next to rule |

### Ontology Selection

| Location | Action |
|----------|--------|
| **Research Tab** | Top of page, "Ontology:" dropdown → Select Dragons or LinkedIn |
| **Schema Tab** | Top menu bar, "Ontology:" dropdown → Select Dragons or LinkedIn |

### Query Preview

| Format | Description |
|--------|-------------|
| **JSON** | Raw query builder structure |
| **GraphQL** | GraphQL query syntax |
| **Cypher** | Neo4j Cypher query language |

**Usage**: Click "Show Preview" → Select format from dropdown

---

## Entity Types by Ontology

### Dragons Ontology

| Entity | Properties |
|--------|-----------|
| Person | firstName, lastName, age, gender |
| Dragon | name, color, age, gender |
| Horse | name, distance, maxSpeed, weight |
| Guild | name, description, iconId, url, established |
| Kingdom | name, king, queen, independenceDay, funds |

**Relationships**:
- Person -[Own]-> Dragon, Horse
- Person -[MemberOf]-> Guild
- Dragon -[Fire/Freeze]-> Dragon
- Guild -[RegisteredIn]-> Kingdom

### LinkedIn Ontology

| Entity | Properties |
|--------|-----------|
| Person | firstName, lastName, email, headline, location, profileUrl |
| Company | name, industry, size, location, website |
| Position | title, startDate, endDate, description |
| School | name, location, website |
| Education | degree, fieldOfStudy, startDate, endDate |
| Skill | name, category |
| Post | title, content, publishDate, likes, comments |
| Group | name, description, memberCount |

**Relationships**:
- Person -[WorksAt]-> Company
- Person -[HasPosition]-> Position
- Person -[ConnectedTo/Follows]-> Person
- Person -[StudiedAt]-> School
- Person -[HasEducation]-> Education
- Person -[HasSkill]-> Skill
- Person -[Published/Liked/Commented]-> Post
- Person -[MemberOf]-> Group
- Person -[Endorses/Recommends]-> Person

---

## Operators by Property Type

| Property Type | Available Operators |
|---------------|---------------------|
| **string/text** | =, !=, contains, beginsWith, endsWith, null, notNull |
| **int/float** | =, !=, <, >, <=, >=, null, notNull |
| **date/datetime** | =, !=, <, >, <=, >=, null, notNull |
| **array** | contains, null, notNull |
| **geo_point** | =, !=, null, notNull |

---

## Common Query Patterns

### Find entities with specific property
```
Person.firstName contains "John"
```

### Find entities with relationship
```
Person -[Own]-> Dragon
```

### Find entities with relationship and target property
```
Person -[Own]-> Dragon
  └─> Dragon.color = "Red"
```

### Multi-level relationship chain
```
Person -[MemberOf]-> Guild
  └─> Guild -[RegisteredIn]-> Kingdom
      └─> Kingdom.name = "Seven Kingdoms"
```

### Combine AND conditions
```
AND Group:
  ├─ Person.age >= 18
  └─ Person -[Own]-> Dragon
```

### Combine OR conditions
```
OR Group:
  ├─ Dragon.color = "Red"
  └─ Dragon.color = "Blue"
```

---

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ontology?type={type}` | GET | Get ontology data (dragons/linkedin) |
| `/api/ontologies` | GET | List all available ontologies |
| `/api/results` | POST | Execute query and get results |
| `/api/schema` | GET | List saved schemas |
| `/api/schema/{id}` | GET | Get specific schema |
| `/api/schema` | POST | Save new schema |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Move to next field |
| Enter | Apply value in text field |
| Escape | Cancel current operation |

---

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| "+" button not appearing | Ensure relationship operator is selected, not property filter |
| Input loses focus | Update to latest version (fixed in recent commit) |
| Query preview empty | Add at least one rule to the query |
| Ontology not loading | Check browser console, verify server is running |
| Schema shows error | Restart server, clear browser cache |

---

## Color Coding

| Color | Meaning |
|-------|---------|
| **Pink border** | Nested relationship subgroup |
| **Light pink background** | Expanded relationship context |
| **Pink "+" button** | Expandable relationship |
| **Red "×" button** | Remove rule/group |
| **Blue highlight** | Syntax highlighting in preview |

---

## File Locations

| File/Folder | Purpose |
|-------------|---------|
| `/mocks/ontology/dragons/` | Dragons ontology JSON |
| `/mocks/ontology/linkedin/` | LinkedIn ontology JSON |
| `/client/src/components/VisualQueryBuilder.js` | Query builder component |
| `/client/src/pages/Schema.js` | Schema viewer page |
| `/client/src/pages/Research.js` | Research/query page |
| `/client/src/helpers/ontologyToQueryBuilder.js` | Ontology converter |

---

## Related Documentation

- [Visual Query Builder Guide](VISUAL_QUERY_BUILDER.md) - Detailed feature documentation
- [Schema Viewer Guide](SCHEMA_VIEWER.md) - Schema management guide
- [Relationship Patterns](../RELATIONSHIP_PATTERNS.md) - Understanding relationships
- [Main README](../README.md) - Project overview
