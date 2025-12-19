# Network Graph Connectivity Visualization

## Overview

Enhanced the D3.js network graph visualization to make node size and color reflect their connectivity (number of connections), making it easier to identify hub nodes and understand network structure at a glance.

---

## Features

### 1. Dynamic Node Sizing Based on Connectivity

Nodes are sized proportionally to their degree (number of connections):

- **Minimum size**: 8px radius (nodes with 0-1 connections)
- **Maximum size**: 25px radius (nodes with the most connections)
- **Calculation**: Linear interpolation between min and max based on node degree

```javascript
const baseRadius = MIN_NODE_RADIUS + (d.degree / maxDegree) * (MAX_NODE_RADIUS - MIN_NODE_RADIUS);
```

**Benefits**:
- Hub nodes (highly connected) are immediately visible
- Network structure is easier to understand
- Important entities stand out visually

### 2. Connectivity-Based Color Gradient

Nodes are colored using the **Viridis** color scale, which ranges from purple (low connectivity) to yellow (high connectivity):

- **Purple/Blue**: Low connectivity (0-2 connections)
- **Green/Teal**: Medium connectivity (3-5 connections)
- **Yellow/Bright**: High connectivity (6+ connections)

```javascript
const connectivityColorScale = d3
  .scaleSequential()
  .domain([0, maxDegree])
  .interpolator(d3.interpolateViridis);
```

**Why Viridis?**
- Perceptually uniform (equal visual differences represent equal data differences)
- Colorblind-friendly
- Prints well in grayscale
- Scientifically proven effective for data visualization

### 3. Enhanced Tooltips

Node tooltips now display:
- Entity type
- Entity ID
- Entity tag (if available)
- **Number of connections**

Example:
```
Person: P001
Tag: John Doe
Connections: 5
```

### 4. Dynamic Collision Detection

Collision radius adjusts based on node size to prevent overlap:

```javascript
.force("collide", d3.forceCollide().radius(d => {
  const baseRadius = MIN_NODE_RADIUS + (d.degree / maxDegree) * (MAX_NODE_RADIUS - MIN_NODE_RADIUS);
  return baseRadius + 15; // 15px padding for better spacing
}))
```

### 5. Fully Draggable Nodes

All nodes are fully draggable with smooth, responsive behavior:
- **Drag start**: Restarts simulation with alpha=0.3 for immediate response
- **Dragging**: Updates fixed position (fx, fy) in real-time
- **Drag end**: Releases fixed position (unless menu is open)
- **Responsive**: Higher alpha value ensures nodes move smoothly when dragged

### 6. Enhanced Node Spacing

Nodes are spread further apart for better visibility and interaction:
- **Link distance**: 200px (doubled from 100px)
- **Charge strength**: -800 (increased repulsion from -300)
- **Collision padding**: 15px around each node
- **Result**: Clearer network structure with less overlap

---

## Implementation Details

### Degree Calculation

The degree of each node is calculated by counting incoming and outgoing relationships:

```javascript
const degreeMap = new Map();
relationships.forEach(rel => {
  degreeMap.set(rel.source, (degreeMap.get(rel.source) || 0) + 1);
  degreeMap.set(rel.target, (degreeMap.get(rel.target) || 0) + 1);
});
entities.forEach(e => {
  e.degree = degreeMap.get(e.id) || 0;
});
```

### Dynamic Updates on Node Expansion

When a node is expanded (more relationships loaded):
1. New entities and relationships are added
2. Degrees are recalculated for all nodes
3. Color scale domain is updated to reflect new max degree
4. Graph re-renders with updated sizes and colors

```javascript
// Recalculate degrees after expansion
const degreeMap = new Map();
relationships.forEach(rel => {
  const sourceId = typeof rel.source === 'object' ? rel.source.id : rel.source;
  const targetId = typeof rel.target === 'object' ? rel.target.id : rel.target;
  degreeMap.set(sourceId, (degreeMap.get(sourceId) || 0) + 1);
  degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
});
entities.forEach(e => {
  e.degree = degreeMap.get(e.id) || 0;
});

// Update color scale
const newMaxDegree = Math.max(...entities.map(e => e.degree), 1);
connectivityColorScale.domain([0, newMaxDegree]);
```

---

## Visual Examples

### Before Enhancement
- All nodes same size (10px radius)
- Color based only on entity type
- No visual indication of importance

### After Enhancement
- Node size: 8-25px radius based on connections
- Color: Purple (isolated) → Yellow (hub)
- Instant identification of network hubs
- Easy to spot important entities

---

## Usage

### Viewing the Enhanced Graph

1. Navigate to the **Research** tab
2. Build and run a query using the Visual Query Builder
3. Click the **graph** view button (third icon)
4. Observe the visualization:
   - **Larger, brighter nodes**: Highly connected (hubs)
   - **Smaller, darker nodes**: Less connected (periphery)
   - **Hover** over nodes to see connection count
   - **Drag** nodes to reposition them

### Interpreting Colors

| Color | Connectivity | Example Count |
|-------|-------------|---------------|
| Purple/Dark Blue | Very Low | 0-1 connections |
| Blue | Low | 2-3 connections |
| Cyan/Teal | Medium | 4-5 connections |
| Green | High | 6-7 connections |
| Yellow | Very High | 8+ connections |

*Note: Exact ranges depend on the maximum degree in your specific graph*

### Interacting with Nodes

- **Hover**: View tooltip with connection count
- **Click**: Open radial menu (for query nodes)
- **Drag**: Reposition node freely
- **Menu → Expand**: Load more relationships (recalculates connectivity)

---

## Technical Details

### Files Modified

| File | Lines Changed | Description |
|------|---------------|-------------|
| `client/src/components/Force.js` | ~80 | Added degree calculation, connectivity coloring, dynamic sizing |

### Key Constants

```javascript
const MIN_NODE_RADIUS = 8;        // Minimum node size
const MAX_NODE_RADIUS = 25;       // Maximum node size
const LINK_DISTANCE = 200;        // Distance between connected nodes
const CHARGE_STRENGTH = -800;     // Repulsion force between nodes
const ALPHA = 0.3;                // Simulation heating parameter for responsiveness
```

### Color Scale

- **Type**: Sequential
- **Interpolator**: d3.interpolateViridis
- **Domain**: [0, maxDegree] (dynamically updated)
- **Range**: Purple → Blue → Cyan → Green → Yellow

### Performance

- Degree calculation: O(E + V) where E = edges, V = vertices
- Scales well to graphs with hundreds of nodes
- Dynamic updates on expansion without full recalculation

---

## Future Enhancements

Potential improvements:
- [ ] Toggle between entity-type coloring and connectivity coloring
- [ ] Show connection count as text label on nodes
- [ ] Filter nodes by connection threshold
- [ ] Highlight all connections when hovering a node
- [ ] Export connectivity statistics
- [ ] Custom color scales (heatmap, cool-warm, etc.)
- [ ] Weighted degree (based on relationship types)
- [ ] Centrality metrics (betweenness, closeness, eigenvector)

---

## References

- [D3 Sequential Scales](https://github.com/d3/d3-scale#sequential-scales)
- [Viridis Color Scheme](https://bids.github.io/colormap/)
- [Graph Degree (Graph Theory)](https://en.wikipedia.org/wiki/Degree_(graph_theory))
- [Network Centrality](https://en.wikipedia.org/wiki/Centrality)

---

**Created**: 2025-12-18
**D3.js Version**: 7.9.0
**Status**: ✅ Production Ready
