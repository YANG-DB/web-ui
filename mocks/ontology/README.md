# Ontology Datasets

This directory contains different ontology schemas for the Visual Query Builder.

## Structure

```
ontology/
├── dragons/
│   ├── ontology.json    # Dragons fantasy ontology schema
│   └── results.json     # (optional) Sample query results
└── linkedin/
    ├── ontology.json    # LinkedIn professional network ontology schema
    └── results.json     # Sample LinkedIn data
```

## Available Ontologies

### 1. Dragons
A fantasy-themed ontology featuring:
- **Entities**: Person, Dragon, Horse, Kingdom, Guild
- **Relationships**: Own, Know, MemberOf, Fire, Freeze, OriginatedIn, SubjectOf, RegisteredIn

**Use case**: Demonstrates graph relationships in a fantasy setting with medieval themes.

### 2. LinkedIn
A professional networking ontology featuring:
- **Entities**: Person, Company, Position, School, Education, Skill, Post, Group
- **Relationships**: WorksAt, HasPosition, PositionAt, ConnectedTo, Follows, StudiedAt, HasEducation, EducationAt, HasSkill, Endorses, Published, Liked, Commented, MemberOf, Recommends

**Use case**: Models professional networks, career histories, skills, and social interactions.

## Usage

### Server API

#### Get Ontology
```
GET /api/ontology?type=dragons
GET /api/ontology?type=linkedin
GET /api/ontology  (defaults to dragons)
```

#### List Available Ontologies
```
GET /api/ontologies
```

Returns:
```json
{
  "ontologies": [
    {
      "id": "dragons",
      "name": "Dragons",
      "description": "Dragons fantasy ontology..."
    },
    {
      "id": "linkedin",
      "name": "LinkedIn",
      "description": "LinkedIn professional network ontology..."
    }
  ]
}
```

### Client Usage

The Visual Query Builder automatically loads the ontology and generates appropriate fields and operators based on the schema.

## Ontology Schema Format

Each ontology JSON file follows this structure:

```json
{
  "data": [{
    "ont": "OntologyName",
    "entityTypes": [
      {
        "eType": "EntityTypeName",
        "name": "Display Name",
        "properties": ["prop1", "prop2"],
        "metadata": ["id", "type"]
      }
    ],
    "relationshipTypes": [
      {
        "rType": "RelationshipName",
        "name": "Display Name",
        "directional": true,
        "ePairs": [
          {
            "eTypeA": "SourceEntity",
            "eTypeB": "TargetEntity"
          }
        ],
        "properties": ["prop1", "prop2"],
        "metadata": ["id", "type"]
      }
    ],
    "properties": [
      {
        "pType": "propertyName",
        "name": "Display Name",
        "type": "string|text|int|float|date|datetime"
      }
    ]
  }]
}
```

## Adding New Ontologies

1. Create a new folder under `mocks/ontology/` with your ontology name
2. Add `ontology.json` with the schema following the format above
3. (Optional) Add `results.json` with sample data
4. Update `server.js` to include the new ontology:
   ```javascript
   const myOntology = require("./mocks/ontology/myontology/ontology.json");
   const ontologies = {
     dragons: dragonsOntology,
     linkedin: linkedinOntology,
     myontology: myOntology
   };
   ```
5. Update the `/api/ontologies` endpoint to list your new ontology

## Property Types

Supported property types:
- `string`: Short text values
- `text`: Long text/descriptions
- `int`: Integer numbers
- `float`: Decimal numbers
- `date`: Date values (YYYY-MM-DD)
- `datetime`: Date and time values
- `geo_point`: Geographic coordinates
- `array`: Array values

These types map to appropriate input controls and operators in the Visual Query Builder.
