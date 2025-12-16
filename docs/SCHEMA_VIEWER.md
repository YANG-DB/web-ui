# Schema Viewer

The Schema Viewer provides a GraphQL schema editor for viewing and modifying ontology definitions. It supports multiple ontologies and real-time schema visualization.

## Features

### 1. Ontology Selection

Switch between different ontologies to view their GraphQL schemas.

**Location**: Schema tab, top menu bar

**How to use**:
1. Navigate to the Schema tab
2. Use the "Ontology" dropdown in the top menu bar
3. Select between available ontologies (Dragons, LinkedIn)
4. The schema will automatically load and display

![Schema Ontology Selector](images/schema-ontology-selector.png)
*Screenshot should show: The Schema page header with "Ontology:" dropdown showing "Dragons" and "LinkedIn" options*

---

### 2. GraphQL Schema Display

View the complete GraphQL schema generated from the ontology.

**Features**:
- Syntax highlighting for GraphQL types
- Auto-generated types from ontology entities
- Relationship definitions
- Property type mappings

![GraphQL Schema View](images/schema-graphql-view.png)
*Screenshot should show: The GraphQL editor displaying a schema with types like:*
```graphql
type Person {
  id: ID!
  firstName: String
  lastName: String
  age: Int
  own: [Dragon]
  memberOf: [Guild]
}

type Dragon {
  id: ID!
  name: String
  color: String
  age: Int
  fire: [Dragon]
  freeze: [Dragon]
}

type Guild {
  id: ID!
  name: String
  description: String
  established: String
}
```

---

### 3. Ontology Structure

### Dragons Ontology

**Entity Types**:
- Person: firstName, lastName, age, gender
- Dragon: name, color, age, gender
- Horse: name, distance, maxSpeed, weight
- Guild: name, description, iconId, url, established
- Kingdom: name, king, queen, independenceDay, funds

**Relationship Types**:
- Person -[Own]-> Dragon
- Person -[Own]-> Horse
- Dragon -[Fire]-> Dragon
- Dragon -[Freeze]-> Dragon
- Person -[MemberOf]-> Guild
- Guild -[RegisteredIn]-> Kingdom

![Dragons Ontology Graph](images/schema-dragons-ontology.png)
*Screenshot should show: A visual graph representation of the Dragons ontology with nodes for each entity type and edges showing relationships*

### LinkedIn Ontology

**Entity Types**:
- Person: firstName, lastName, email, headline, location, profileUrl
- Company: name, industry, size, location, website
- Position: title, startDate, endDate, description
- School: name, location, website
- Education: degree, fieldOfStudy, startDate, endDate
- Skill: name, category
- Post: title, content, publishDate, likes, comments
- Group: name, description, memberCount

**Relationship Types**:
- Person -[WorksAt]-> Company
- Person -[HasPosition]-> Position
- Person -[ConnectedTo]-> Person
- Person -[Follows]-> Person
- Person -[StudiedAt]-> School
- Person -[HasEducation]-> Education
- Person -[HasSkill]-> Skill
- Person -[Endorses]-> Person (for skills)
- Person -[Published]-> Post
- Person -[Liked]-> Post
- Person -[Commented]-> Post
- Person -[MemberOf]-> Group
- Person -[Recommends]-> Person

![LinkedIn Ontology Graph](images/schema-linkedin-ontology.png)
*Screenshot should show: A visual graph representation of the LinkedIn ontology showing professional network relationships*

---

### 4. Schema Actions

**Available Actions** (top-right menu):
- **Share**: Share the current schema
- **Export**: Export schema to file
- **Import**: Import schema from file

![Schema Actions](images/schema-actions.png)
*Screenshot should show: The actions menu in the Schema page header*

---

## Schema Loading Process

When you select an ontology:

1. **API Request**: Fetches ontology data from `/api/ontology?type={ontologyType}`
2. **Conversion**: Converts ontology JSON to GraphQL schema format
3. **Display**: Renders the schema in the GraphQL editor
4. **Validation**: Validates schema structure

Loading indicator appears during this process.

![Schema Loading](images/schema-loading.png)
*Screenshot should show: "Loading ontology..." message displayed while schema loads*

---

## Ontology File Structure

Ontologies are stored in `/mocks/ontology/{ontologyType}/`:

```
/mocks/ontology/
├── dragons/
│   └── ontology.json
└── linkedin/
    └── ontology.json
```

### Ontology JSON Format

```json
{
  "data": [{
    "ontology": "Dragons",
    "entityTypes": [
      {
        "eType": "Person",
        "name": "Person",
        "properties": ["firstName", "lastName", "age", "gender"]
      }
    ],
    "relationshipTypes": [
      {
        "rType": "Own",
        "name": "Own",
        "ePairs": [
          { "eTypeA": "Person", "eTypeB": "Dragon" },
          { "eTypeA": "Person", "eTypeB": "Horse" }
        ]
      }
    ],
    "properties": [
      {
        "pType": "firstName",
        "type": "string"
      }
    ]
  }]
}
```

---

## Type Mappings

The schema converter maps ontology property types to GraphQL types:

| Ontology Type | GraphQL Type |
|---------------|--------------|
| string        | String       |
| text          | String       |
| int           | Int          |
| float         | Float        |
| date          | String       |
| datetime      | String       |
| geo_point     | String       |
| array         | [String]     |

---

## Schema Validation

The GraphQL editor automatically validates:
- Type syntax
- Field definitions
- Relationship consistency
- Property types

Validation errors appear in the editor with red underlines and error messages.

---

## Editing Schemas

**Note**: Currently, the schema viewer is read-only. Ontology modifications should be made by editing the ontology JSON files directly.

To modify an ontology:
1. Edit the file at `/mocks/ontology/{ontologyType}/ontology.json`
2. Restart the server
3. Refresh the Schema page
4. The new schema will be automatically generated

---

## Integration with Query Builder

The schema defines what's available in the Visual Query Builder:
- **Entity Types** → Field dropdown options
- **Relationship Types** → Operator dropdown for entities
- **Properties** → Entity property filters

When you switch ontologies in the Research tab, it loads the corresponding schema to populate the query builder options.

---

## API Endpoints

### Get Ontology
```
GET /api/ontology?type={ontologyType}
```

Returns the ontology data for the specified type.

### List Ontologies
```
GET /api/ontologies
```

Returns all available ontologies:
```json
{
  "ontologies": [
    {
      "id": "dragons",
      "name": "Dragons",
      "description": "Dragons fantasy ontology with guilds and kingdoms"
    },
    {
      "id": "linkedin",
      "name": "LinkedIn",
      "description": "LinkedIn professional network ontology"
    }
  ]
}
```

---

## Troubleshooting

### Issue: Schema shows "ERROR Cannot read properties of null (reading 'libraries')"
- **Cause**: GraphQLEditor expects both `code` and `libraries` properties
- **Solution**: This was fixed - schemas now include `libraries: ''`

### Issue: Schema appears empty after switching ontologies
- **Solution**: Check browser console for errors. Verify ontology file exists and is valid JSON

### Issue: Custom ontology not appearing in dropdown
- **Solution**:
  1. Ensure ontology file is in `/mocks/ontology/{name}/ontology.json`
  2. Add entry to `/api/ontologies` endpoint in `server.js`
  3. Restart server

---

## Best Practices

### Ontology Design
- Keep entity types focused and specific
- Define clear relationship semantics
- Use consistent property naming conventions
- Document relationship direction (A → B)

### Schema Organization
- Group related entity types together
- Use descriptive names for types and fields
- Include description fields for complex types
- Validate against GraphQL specifications

### Performance
- Limit relationship depth to 3-4 levels
- Use property filters to narrow queries
- Index frequently queried properties

---

## Related Documentation

- [Visual Query Builder](VISUAL_QUERY_BUILDER.md) - Build queries using the ontology
- [Relationship Patterns](../RELATIONSHIP_PATTERNS.md) - Understanding ontology relationships
- [API Reference](API_REFERENCE.md) - Complete API documentation
