# web-ui

[![CI](https://github.com/YANG-DB/web-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/YANG-DB/web-ui/actions/workflows/ci.yml)

User interface for graph database interaction and ontology management, for
[YangDB (Fuse)](https://github.com/YANG-DB/yang-db).

**New here? Start with [Getting started](docs/tutorials/GETTING_STARTED.md)**: a step-by-step guide with
screenshots, from installing Docker to your first graph queries. No experience needed.

## Quick Start

**With Docker only** (nothing else to install): the graph, the Dragons sample data and web-ui in one command.

```bash
git clone https://github.com/YANG-DB/web-ui.git && cd web-ui
docker compose up -d     # first run: downloads and builds, a few minutes
# open http://localhost:3000
docker compose down      # stop and remove everything
```

**From source** (to change the code; needs Node.js 20+ and Yarn):

```bash
yarn                                       # install (root and client)
docker compose up -d fuse dragons-loader   # or scripts/fuse-up.sh: Fuse with the Dragons sample
yarn start                                 # mock server on 5001, app on http://localhost:3000
```

On the **Research** page, the app uses Fuse when it answers (green dot next to **Backend**), and mock data otherwise.

![Research page with results from Fuse](docs/images/research-fuse-results.png)

### Backends

The CRA dev server proxies two backends (see `client/src/setupProxy.js`):

| Path | Goes to | Override |
|---|---|---|
| `/api` | Mock Express server (`server.js`, port 5001), started by `yarn start` | `MOCK_PROXY_TARGET` |
| `/fuse` | YangDB (Fuse), `http://localhost:8888` | `FUSE_PROXY_TARGET` |

The Fuse client (`client/src/services/fuse.js`) calls `/fuse` by default. Set `REACT_APP_FUSE_URL`
(for example `http://localhost:8888/fuse`) to call Fuse directly instead; CORS is open on Fuse.

To run Fuse locally with the Dragons sample, run `scripts/fuse-up.sh` (Docker: OpenSearch 2.19.7 and
`ghcr.io/yang-db/yang.db:0.9.1`, then loads the data); `scripts/fuse-down.sh` removes them. From a
[yang-db](https://github.com/YANG-DB/yang-db) checkout, its `docker/docker-compose-os.yml` works too; load the data with
`curl -X POST http://localhost:8888/fuse/dragons/tutorial/load`.

On the Research page, **Backend** picks Fuse, the mock server or generated sample data, and **Language** picks how
queries go to Fuse: Cypher, or V1 (Fuse's native JSON query language, which also supports text matching).

## Features Overview

The YangDB user interface provides a comprehensive platform for graph database interaction, visual query building, and schema management.

### 🔍 Visual Query Builder

Build complex graph queries without writing code using an intuitive drag-and-drop interface.

**Key Features**:
- **Multi-Ontology Support**: Switch between Dragons and LinkedIn ontologies
- **Query Templates**: Pre-built query examples for common patterns (9 Dragons, 10 LinkedIn templates)
- **Relationship-Based Querying**: Select entities and traverse relationships visually
- **Nested Query Patterns**: Build multi-level relationship queries with visual nesting
- **Variable Scoping**: Cypher-like variable system that distinguishes between different instances of the same entity type (e.g., `Person(p1)` vs `Person(p2)`)
- **Query Preview**: View generated queries in JSON, GraphQL, or Cypher format with proper variable scoping
- **Property Filtering**: Add conditions on entity properties with automatic variable inference
- **Relationship Expansion**: Click "+" to explore relationship targets
- **Mock Data Mode**: Test queries with generated sample data when backend is unavailable
- **Collapsible Panels**: Minimize query builder or results to maximize workspace

![Visual Query Builder](docs/images/research-visual-query-builder.png)
*Query builder with template selector and mock data toggle*

![Query Templates](docs/images/research-template-queries.png)
*Pre-built query templates with visual preview*

![Researech Query Response Graph Results](docs/images/schema-graph-results-details.png)
*Detailed graph visualization with entity connections*
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
- **Graph Visualization**: Interactive entity relationship diagrams

![Schema Person View](docs/images/schema-person.png)
*Entity type viewer showing Person attributes and relationships*

![Schema Fields](docs/images/schema-fields.png)
*Detailed field definitions for entity types*

![Schema Graph](docs/images/schema-person-graph.png)
*Visual graph representation of entity relationships*


📖 [Full Documentation](docs/SCHEMA_VIEWER.md)

---

### 📊 Results Visualization

View query results in multiple interactive formats with rich visualization options.

**View Modes**:
- **Graph View**: Interactive network visualization using Cytoscape.js
  - Colour per entity type, with the type inside the node and its name below it
  - Legend with a count per type; click a type to hide or show it
  - Node size based on connectivity
  - Edge labels on hover, on the selected node's edges, or when zoomed in
  - Tap a node or edge for a details panel: type, id, all properties, Expand neighbors, Hide
  - Optional table of the visible nodes under the graph, with a filter per column (text or `> 2`) and selection
    synced both ways
  - Double-tap a node to expand its neighbors (from Fuse, or the mock server)
  - Layouts: Force, Breadth-first, Concentric, Grid, plus Fit; edge length and repulsion in the ⚙ popover
  - Full-screen mode for detailed exploration

![Readable graph: names, types, legend](docs/images/research-graph-readable.png)
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

![Research Results](docs/images/research-results.png)
*Complete research interface showing query builder, results visualization, and multiple view modes*

---

### 📡 API Documentation

Interactive API documentation with a Swagger-like interface for exploring and testing endpoints.

**Key Features**:
- **Endpoint Browser**: List of all available API endpoints
- **HTTP Method Color Coding**: Visual distinction for GET, POST, PUT, DELETE
- **Parameter Documentation**: Detailed parameter definitions with types and requirements
- **Request/Response Examples**: Sample JSON payloads for each endpoint
- **Try It Out**: Interactive testing directly from the documentation
- **Real-time Execution**: Test API calls and view responses inline

**Available Endpoints**:
- `GET /api/ontologies` - List available ontologies
- `GET /api/ontology?type={type}` - Get ontology data
- `POST /api/results` - Execute queries
- `POST /api/update` - Expand results for specific nodes
- `GET /api/schema` - List saved schemas
- `GET /api/schema/:id` - Get specific schema
- `POST /api/schema` - Save new schema
- `GET /api/structure` - Get database structure

![API Documentation](docs/images/api-swagger.png)
*Swagger-like API documentation interface with interactive endpoint testing*

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
- **Pages**: Schema, Research, API, Analytics, Report, Monitoring, Management
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

### Exploring API Documentation

1. Navigate to **API** tab
2. Browse the list of available endpoints on the left
3. Click any endpoint to view details:
   - HTTP method and path
   - Parameter definitions and requirements
   - Example request body (for POST requests)
   - Example response structure
4. Use "Try It Out" to test endpoints:
   - Edit the request body JSON for POST requests
   - Click "Execute" to send the request
   - View the response status and data inline

---

## Documentation

### User Guides
- [Getting started](docs/tutorials/GETTING_STARTED.md) - Step by step with screenshots, for beginners
- [Dragons tutorial](docs/tutorials/DRAGONS.md) - Run Fuse, load the Dragons sample, query it in Cypher and V1
- [Visual Query Builder Guide](docs/VISUAL_QUERY_BUILDER.md) - Complete query building documentation
- [Schema Viewer Guide](docs/SCHEMA_VIEWER.md) - Schema management and ontology structure
- [Results Visualization Guide](docs/RESULTS_VISUALIZATION.md) - Using graph, table, list, and JSON views
- [Query Templates Guide](docs/QUERY_TEMPLATES.md) - Pre-built query examples and patterns

### Technical Documentation
- [Cytoscape.js Integration](docs/CYTOSCAPE_INTEGRATION.md) - Network graph visualization with Cytoscape.js
- [Mock Data Generators](docs/MOCK_DATA.md) - Client-side data generation for testing
- [Connectivity Visualization](docs/CONNECTIVITY_VISUALIZATION.md) - Node sizing and coloring based on connections
- [Relationship Patterns](RELATIONSHIP_PATTERNS.md) - Understanding relationship patterns
- [Variable Scoping System](docs/VARIABLE_SCOPING_SUMMARY.md) - Cypher-like variable scoping for query builder
  - [Implementation Design](docs/VARIABLE_SCOPING_DESIGN.md) - Complete architectural design
  - [Testing Guide](docs/VARIABLE_SCOPING_TESTING.md) - Testing instructions and examples

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

Root:
- `yarn start` - Start the mock server and the development app
- `yarn test` - Mock server tests (with a 70% coverage gate)
- `scripts/fuse-up.sh` / `scripts/fuse-down.sh` - Start / remove Fuse and OpenSearch in Docker

In `client/`:
- `yarn test` - Unit tests (watch mode; `--watchAll=false` for one run)
- `yarn test:fuse` - Live checks against Fuse (`FUSE_URL`, default `http://localhost:8888`)
- `yarn build` - Build for production
- `yarn lint` - Lint code

CI (`.github/workflows/ci.yml`) runs all three test suites on every pull request; the Fuse suite runs against a fresh
Fuse started by `scripts/fuse-up.sh`. Releases: see [docs/RELEASING.md](docs/RELEASING.md) and
[CHANGELOG.md](CHANGELOG.md).

---

## Contributing

When adding new features:
1. Update relevant documentation in `/docs`
2. Add screenshots to `/docs/images`
3. Update this README if needed
4. Ensure tests pass
5. Follow existing code style

---

## Screenshots

All screenshots are available in `/docs/images`:

### Research Page
- `research-fuse-results.png` - Results from Fuse: backend selector, connection dot, language, result count
- `research-fuse-v1.png` - V1 query preview and its result
- `research-fuse-error.png` - A Fuse error shown in the results panel
- `research-graph-readable.png` - Graph with type colours, names, type badges, edge labels and the legend
- `research-details-panel.png` - Details panel for a selected node
- `research-graph-table.png` - Graph and table together, with the selection synced
- `research-visual-query-builder.png` - Query builder interface with ontology selector and controls
- `research-template-queries.png` - Pre-built query templates modal
- `research-results.png` - Complete research interface with query builder and results visualization

### Schema Viewer
- `schema-person.png` - Entity type viewer showing Person attributes and relationships
- `schema-fields.png` - Detailed field definitions for entity types
- `schema-person-graph.png` - Visual graph representation of entity relationships
- `schema-graph-results-details.png` - Detailed graph visualization with entity connections

### API Documentation
- `api-swagger.png` - Swagger-like API documentation interface

### Dashboard
- `dashboard-overview.png` - Main analytics dashboard overview

---

## License

[Add your license information here]
