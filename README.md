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
- **Query Templates**: Pre-built query examples for common patterns (9 Dragons, 10 LinkedIn templates)
- **Relationship-Based Querying**: Select entities and traverse relationships visually
- **Nested Query Patterns**: Build multi-level relationship queries with visual nesting
- **Query Preview**: View generated queries in JSON, GraphQL, or Cypher format
- **Property Filtering**: Add conditions on entity properties
- **Relationship Expansion**: Click "+" to explore relationship targets
- **Mock Data Mode**: Test queries with generated sample data when backend is unavailable
- **Collapsible Panels**: Minimize query builder or results to maximize workspace

![Visual Query Builder](docs/images/visual-query-builder.png)
*Query builder with template selector and mock data toggle*

![Query Templates](docs/images/query-templates.png)
*Pre-built query templates with visual preview*

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

### 📊 Results Visualization

View query results in multiple interactive formats with rich visualization options.

**View Modes**:
- **Graph View**: Interactive network visualization using Cytoscape.js
  - Node size based on connectivity
  - Color gradient showing relationship density
  - Click to expand/collapse nodes
  - Adjustable edge length and node repulsion
  - Center view button for easy navigation
  - Full-screen mode for detailed exploration
- **Table View**: Tabular display grouped by entity type
  - Columns for all entity properties
  - Sortable and filterable data
  - Grouped by entity type with counts
- **List View**: Card-based layout with entity details
  - Scrollable entity cards
  - Properties displayed in grid format
  - Grouped by entity type
  - Color-coded value types
- **JSON View**: Raw data inspection
  - Collapsible/expandable tree structure
  - Syntax highlighting by data type
  - Copy to clipboard
  - Download as JSON file
  - Expand/collapse all controls

**Interactive Controls**:
- **Collapse Panels**: Minimize query builder or results for focused work
- **View Switcher**: Quick toggle between graph/table/list/JSON views
- **Graph Controls**: Adjust layout parameters in real-time
- **Maximize Graph**: Full-screen graph view with menu overlay

![Graph View](docs/images/results-graph-view.png)
*Cytoscape.js network visualization with connectivity-based node sizing*

![Table View](docs/images/results-table-view.png)
*Tabular results grouped by entity type*

![List View](docs/images/results-list-view.png)
*Card-based entity list with property details*

![JSON View](docs/images/results-json-view.png)
*Raw JSON data with syntax highlighting and export options*

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
- **Components**:
  - `VisualQueryBuilder` - Query building interface with templates
  - `Results` - Multi-view results display
  - `Force` - Cytoscape.js graph visualization
  - `Table` - Tabular entity data display
  - `EntityList` - Card-based entity list
  - `JsonView` - Interactive JSON tree viewer
  - `QueryTemplates` - Pre-built query template modal
  - `GraphQLEditor` - Schema editor
- **State Management**: Redux for query history and results
- **Styling**: CSS Modules with custom theming
- **Visualization**: Cytoscape.js for network graphs
- **Mock Data**: Client-side graph data generators for offline testing

### Backend (Node.js/Express)
- **API Endpoints**:
  - `/api/ontology?type={type}` - Get ontology data
  - `/api/ontologies` - List available ontologies
  - `/api/results` - Execute queries
  - `/api/schema` - Manage schemas
- **Data Storage**: Mock data in `/mocks/ontology/` directory

### Key Technologies
- **React 18** - UI framework
- **Redux** - State management
- **Cytoscape.js** - Graph visualization (replaced D3.js)
- **react-querybuilder v8** - Visual query builder
- **re-resizable** - Resizable panels
- **CSS Modules** - Scoped styling

---

## Key Workflows

### Building a Query

1. Navigate to **Research** tab
2. Select an ontology from the dropdown (Dragons or LinkedIn)
3. **Option A - Use Template**:
   - Click **Templates** button
   - Browse pre-built query examples
   - Select a template to load it into the builder
4. **Option B - Build Custom Query**:
   - Click **+ Rule** to add query conditions
   - Select entity → relationship → target entity
   - Click **+** button to expand relationships
   - Add property filters as needed
5. Click **Show Preview** to view generated query
6. Toggle **Use Mock Data** to test with sample data
7. Click **Run Query** to execute

### Viewing Results

1. After executing a query, results appear in the lower panel
2. Choose from 4 view modes using the toolbar:
   - **Graph** (default): Interactive network visualization
     - Drag nodes to rearrange layout
     - Adjust **Edge Length** and **Node Repulsion** sliders
     - Click **Center View** to fit all nodes
     - Click maximize button for full-screen view
   - **Table**: Spreadsheet-style view grouped by entity type
   - **List**: Scrollable cards showing entity details
   - **JSON**: Raw data with syntax highlighting
3. **Collapse panels** to maximize workspace:
   - Click ▲ on query builder to collapse upward
   - Click ▼ on results to collapse downward
4. Export data using JSON view controls

### Viewing Schema

1. Navigate to **Schema** tab
2. Select an ontology from the dropdown
3. View the auto-generated GraphQL schema
4. Explore entity types and relationships
5. Use actions menu to export/share

---

## Documentation

### User Guides
- [Visual Query Builder Guide](docs/VISUAL_QUERY_BUILDER.md) - Complete query building documentation
- [Schema Viewer Guide](docs/SCHEMA_VIEWER.md) - Schema management and ontology structure
- [Results Visualization Guide](docs/RESULTS_VISUALIZATION.md) - Using graph, table, list, and JSON views
- [Query Templates Guide](docs/QUERY_TEMPLATES.md) - Pre-built query examples and patterns

### Technical Documentation
- [Cytoscape.js Integration](docs/CYTOSCAPE_INTEGRATION.md) - Network graph visualization with Cytoscape.js
- [Mock Data Generators](docs/MOCK_DATA.md) - Client-side data generation for testing
- [Connectivity Visualization](docs/CONNECTIVITY_VISUALIZATION.md) - Node sizing and coloring based on connections
- [Relationship Patterns](RELATIONSHIP_PATTERNS.md) - Understanding relationship patterns

### Development
- [GitHub Actions Setup](GITHUB_ACTIONS_SETUP.md) - CI/CD configuration
- [Workflows Summary](WORKFLOWS_SUMMARY.md) - Automation workflows
- [Component Architecture](docs/COMPONENTS.md) - React component structure and patterns

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
- `visual-query-builder.png` - Overview of the query builder interface with ontology selector
- `query-templates.png` - Query templates modal showing pre-built examples
- `query-templates-dragons.png` - Dragons ontology templates (9 examples)
- `query-templates-linkedin.png` - LinkedIn ontology templates (10 examples)
- `query-entity-selection.png` - Entity selection dropdown
- `query-relationship-operators.png` - Relationship operator selection
- `query-property-filters.png` - Property filter interface
- `query-expansion-before.png` - Relationship rule with "+" button
- `query-expansion-after.png` - Expanded nested subgroup
- `query-preview.png` - Query preview panel with syntax highlighting
- `query-nested-groups.png` - Complex nested AND/OR groups
- `query-multi-level.png` - Multi-level relationship chains
- `mock-data-toggle.png` - Mock data checkbox enabled

### Results Visualization
- `results-graph-view.png` - Cytoscape.js network graph with controls
- `results-graph-controls.png` - Edge length and node repulsion sliders
- `results-graph-fullscreen.png` - Maximized graph view
- `results-table-view.png` - Table view showing entity properties in columns
- `results-list-view.png` - Card-based list view with entity details
- `results-json-view.png` - JSON view with syntax highlighting
- `results-json-collapsed.png` - JSON view with collapsed sections
- `results-json-export.png` - JSON export controls (copy/download)
- `results-view-switcher.png` - View mode buttons (table/list/graph/json)
- `results-connectivity-gradient.png` - Nodes colored by connectivity

### Panel Management
- `panel-collapse-query.png` - Query builder collapsed, results expanded
- `panel-collapse-results.png` - Results collapsed, query builder expanded
- `panel-both-expanded.png` - Both panels visible with resize handle

### Schema Viewer
- `schema-viewer.png` - Overview of schema viewer
- `schema-ontology-selector.png` - Ontology selector in Schema tab
- `schema-graphql-view.png` - GraphQL schema display
- `schema-dragons-ontology.png` - Visual graph of Dragons ontology
- `schema-linkedin-ontology.png` - Visual graph of LinkedIn ontology
- `schema-actions.png` - Schema actions menu

---

## License

[Add your license information here]
