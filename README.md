# web-ui

User interface for graph database interaction and ontology management

## Quick Start

Run `yarn` to install dependencies, followed by `yarn start`.

The application will be available at `http://localhost:3000`

## Features Overview

The YangDB user interface provides a comprehensive platform for graph database interaction, visual query building, and schema management.

### 🔍 Visual Query Builder

Build complex graph queries without writing code using an intuitive drag-and-drop interface.

**Key Features**:
- **Multi-Ontology Support**: Switch between Dragons and LinkedIn ontologies
- **Relationship-Based Querying**: Select entities and traverse relationships visually
- **Nested Query Patterns**: Build multi-level relationship queries with visual nesting
- **Query Preview**: View generated queries in JSON, GraphQL, or Cypher format
- **Property Filtering**: Add conditions on entity properties
- **Relationship Expansion**: Click "+" to explore relationship targets

![Visual Query Builder](docs/images/visual-query-builder.png)

📖 [Full Documentation](docs/VISUAL_QUERY_BUILDER.md)

---

### 📊 Schema Viewer

View and manage GraphQL schemas for different ontologies.

**Key Features**:
- **Ontology Selection**: Switch between Dragons and LinkedIn schemas
- **GraphQL Schema Display**: Syntax-highlighted schema viewer
- **Auto-Generated Types**: Entity types, relationships, and properties
- **Schema Validation**: Real-time syntax checking
- **Export/Import**: Share and backup schemas

![Schema Viewer](docs/images/schema-viewer.png)

📖 [Full Documentation](docs/SCHEMA_VIEWER.md)

---

### 📈 Analytics Dashboard

The main dashboard provides comprehensive data visualization and exploration.

**Components**:
- **Navigation Bar**: Access Schema, Research, Analytics, Report, Monitoring, and Management sections
- **Query Interface**: Tabbed interface for managing multiple queries
- **Summary View**: High-level overview of entity counts and statistics
- **History Panel**: Log of recent queries and interactions
- **Visualizations**: Graph views, timelines, and trend charts

![Dashboard Overview](docs/images/dashboard-overview.png)

---

## Ontology Support

The application supports multiple ontologies for different data domains:

### Dragons Ontology
A fantasy-themed ontology for game or storytelling applications.

**Entities**: Person, Dragon, Horse, Guild, Kingdom

**Relationships**: Own, Fire, Freeze, MemberOf, RegisteredIn

### LinkedIn Ontology
A professional networking ontology for social and business data.

**Entities**: Person, Company, Position, School, Education, Skill, Post, Group

**Relationships**: WorksAt, HasPosition, ConnectedTo, Follows, StudiedAt, HasSkill, Endorses, Published, Liked, Commented, MemberOf, Recommends

---

## Application Architecture

### Frontend (React)
- **Pages**: Schema, Research, Analytics, Report, Monitoring, Management
- **Components**: VisualQueryBuilder, Results, GraphQLEditor
- **State Management**: Redux for query history and results
- **Styling**: CSS Modules with custom theming

### Backend (Node.js/Express)
- **API Endpoints**:
  - `/api/ontology?type={type}` - Get ontology data
  - `/api/ontologies` - List available ontologies
  - `/api/results` - Execute queries
  - `/api/schema` - Manage schemas
- **Data Storage**: Mock data in `/mocks/ontology/` directory

---

## Key Workflows

### Building a Query

1. Navigate to **Research** tab
2. Select an ontology from the dropdown
3. Click **+ Rule** to add query conditions
4. Select entity → relationship → target entity
5. Click **+** button to expand relationships
6. Add property filters as needed
7. Click **Show Preview** to view generated query
8. Click **Run Query** to execute

### Viewing Schema

1. Navigate to **Schema** tab
2. Select an ontology from the dropdown
3. View the auto-generated GraphQL schema
4. Explore entity types and relationships
5. Use actions menu to export/share

---

## Documentation

- [Visual Query Builder Guide](docs/VISUAL_QUERY_BUILDER.md) - Complete query building documentation
- [Schema Viewer Guide](docs/SCHEMA_VIEWER.md) - Schema management and ontology structure
- [Relationship Patterns](RELATIONSHIP_PATTERNS.md) - Understanding relationship patterns
- [GitHub Actions Setup](GITHUB_ACTIONS_SETUP.md) - CI/CD configuration
- [Workflows Summary](WORKFLOWS_SUMMARY.md) - Automation workflows

---

## Development

### Project Structure
```
web-ui/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── helpers/      # Utility functions
│   └── public/
├── mocks/               # Mock data
│   └── ontology/        # Ontology definitions
│       ├── dragons/
│       └── linkedin/
├── server.js            # Express backend
└── docs/                # Documentation
```

### Available Scripts

- `yarn start` - Start development server
- `yarn build` - Build for production
- `yarn test` - Run test suite
- `yarn lint` - Lint code

---

## Contributing

When adding new features:
1. Update relevant documentation in `/docs`
2. Add screenshots to `/docs/images`
3. Update this README if needed
4. Ensure tests pass
5. Follow existing code style

---

## Screenshots Needed

To complete the documentation, please add the following screenshots to `/docs/images`:

### Visual Query Builder
- `visual-query-builder.png` - Overview of the query builder interface
- `ontology-selector.png` - Ontology dropdown with Dragons/LinkedIn options
- `query-entity-selection.png` - Entity selection dropdown
- `query-relationship-operators.png` - Relationship operator selection
- `query-property-filters.png` - Property filter interface
- `query-expansion-before.png` - Relationship rule with "+" button
- `query-expansion-after.png` - Expanded nested subgroup
- `query-preview.png` - Query preview panel with syntax highlighting
- `query-nested-groups.png` - Complex nested AND/OR groups
- `query-multi-level.png` - Multi-level relationship chains

### Schema Viewer
- `schema-viewer.png` - Overview of schema viewer
- `schema-ontology-selector.png` - Ontology selector in Schema tab
- `schema-graphql-view.png` - GraphQL schema display
- `schema-dragons-ontology.png` - Visual graph of Dragons ontology
- `schema-linkedin-ontology.png` - Visual graph of LinkedIn ontology
- `schema-actions.png` - Schema actions menu
- `schema-loading.png` - Loading state

---

## License

[Add your license information here]
