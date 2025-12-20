import { useState, useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import extractResults from "../helpers/extractResults";
import apiService from "../services/api";
import styles from "./Force.module.css";

const LINK_DISTANCE = 200;
const CHARGE_STRENGTH = 800;

// Enhanced color scheme for different entity types
const entityColors = {
  Person: "#FF6B9D",
  Dragon: "#C44569",
  Horse: "#FFA502",
  Guild: "#6A89CC",
  Kingdom: "#4A69BD",
  Company: "#00D2D3",
  Position: "#1ABC9C",
  School: "#8E44AD",
  Skill: "#E74C3C",
  Post: "#F39C12",
  Group: "#16A085",
  default: "#98abc5"
};

// Color gradient for connectivity (Turbo-inspired)
const connectivityColors = [
  "#30123B", "#4662D7", "#36AAF9", "#1AE4B6", "#72FE5E",
  "#C8EF34", "#FABA39", "#F66B19", "#C82912", "#7A0403"
];

function getConnectivityColor(degree, maxDegree) {
  if (maxDegree === 0) return connectivityColors[0];
  const normalizedDegree = degree / maxDegree;
  const index = Math.floor(normalizedDegree * (connectivityColors.length - 1));
  return connectivityColors[Math.min(index, connectivityColors.length - 1)];
}

export default function Force({ results, hoveredIndex }) {
  const [linkDistance, setLinkDistance] = useState(LINK_DISTANCE);
  const [chargeStrength, setChargeStrength] = useState(CHARGE_STRENGTH);
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  console.log("🔄 Force component render - results:", results);
  const r = extractResults(results);
  console.log("📊 Extracted results - entities:", r.entities.length, "relationships:", r.relationships.length);

  useEffect(() => {
    console.log("🎨 Force useEffect triggered - containerRef exists:", !!containerRef.current);
    if (!containerRef.current) return;

    // Process entities and relationships
    let entities = r.entities.map(e => ({
      ...e,
      id: e.eID,
      fromQuery: true
    }));

    let relationships = r.relationships.map(rel => ({
      ...rel,
      id: rel.rID,
      source: rel.eID1,
      target: rel.eID2
    }));

    console.log("🔧 Processed for Cytoscape - entities:", entities.length, "relationships:", relationships.length);
    if (entities.length > 0) {
      console.log("  Sample entity:", entities[0]);
    }
    if (relationships.length > 0) {
      console.log("  Sample relationship:", relationships[0]);
    }

    // Calculate degree (number of connections) for each node
    const degreeMap = new Map();
    relationships.forEach(rel => {
      degreeMap.set(rel.source, (degreeMap.get(rel.source) || 0) + 1);
      degreeMap.set(rel.target, (degreeMap.get(rel.target) || 0) + 1);
    });

    const maxDegree = Math.max(...Array.from(degreeMap.values()), 1);

    // Create Cytoscape elements
    const elements = [
      ...entities.map(e => ({
        data: {
          id: e.id,
          label: e.id,
          eType: e.eType,
          eTag: e.eTag,
          degree: degreeMap.get(e.id) || 0,
          fromQuery: e.fromQuery,
          assignments: e.assignments || [],
          maxDegree: maxDegree
        }
      })),
      ...relationships.map(rel => ({
        data: {
          id: rel.id,
          source: rel.source,
          target: rel.target,
          label: rel.rType,
          rType: rel.rType,
          directional: rel.directional,
          assignments: rel.assignments || []
        }
      }))
    ];

    // Initialize Cytoscape
    console.log("🚀 Initializing Cytoscape with", elements.length, "elements");
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': function(ele) {
              const degree = ele.data('degree');
              const eType = ele.data('eType');
              if (degree > 0) {
                return getConnectivityColor(degree, maxDegree);
              }
              return entityColors[eType] || entityColors.default;
            },
            'width': function(ele) {
              const degree = ele.data('degree');
              const normalizedDegree = Math.sqrt(degree / maxDegree);
              const baseRadius = 20 + normalizedDegree * 40; // 20-60px diameter
              return baseRadius * 2;
            },
            'height': function(ele) {
              const degree = ele.data('degree');
              const normalizedDegree = Math.sqrt(degree / maxDegree);
              const baseRadius = 20 + normalizedDegree * 40;
              return baseRadius * 2;
            },
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'right',
            'text-margin-x': 8,
            'color': '#ffffff',
            'text-outline-color': '#000000',
            'text-outline-width': 2,
            'font-size': '12px',
            'border-width': 2,
            'border-color': 'rgba(255, 255, 255, 0.3)',
            'opacity': 0.7
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': 'rgba(255, 255, 255, 0.8)',
            'border-width': 3
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'opacity': 1,
            'z-index': 999
          }
        },
        {
          selector: 'node.dimmed',
          style: {
            'opacity': 0.2
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#00b1f2',
            'target-arrow-color': '#00b1f2',
            'target-arrow-shape': function(ele) {
              return ele.data('directional') ? 'triangle' : 'none';
            },
            'curve-style': 'bezier',
            'label': 'data(label)',
            'text-rotation': 'autorotate',
            'text-margin-y': -10,
            'color': '#ffffff',
            'text-outline-color': '#000000',
            'text-outline-width': 1,
            'font-size': '10px',
            'text-transform': 'uppercase',
            'opacity': 0.7
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'width': 3,
            'opacity': 1,
            'line-style': 'solid',
            'z-index': 999
          }
        },
        {
          selector: 'edge.dimmed',
          style: {
            'opacity': 0.2,
            'line-style': 'dashed'
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 1000,
        idealEdgeLength: linkDistance,
        nodeRepulsion: chargeStrength * 10,
        nodeOverlap: 20,
        gravity: 0.1,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      }
    });

    cyRef.current = cy;
    console.log("✅ Cytoscape instance created and stored in ref");
    console.log("  - Nodes count:", cy.nodes().length);
    console.log("  - Edges count:", cy.edges().length);

    // Add click handler for expand/collapse
    cy.on('tap', 'node', function(evt) {
      const node = evt.target;
      const nodeId = node.data('id');
      const fromQuery = node.data('fromQuery');

      if (fromQuery) {
        if (expandedNodes.has(nodeId)) {
          // Collapse: remove expanded nodes and edges
          cy.remove(`node[parent="${nodeId}"]`);
          cy.remove(`edge[parent="${nodeId}"]`);
          setExpandedNodes(prev => {
            const next = new Set(prev);
            next.delete(nodeId);
            return next;
          });
        } else {
          // Expand: fetch and add new nodes
          apiService.updateResult(nodeId).then(results => {
            let newResults = extractResults(results);

            const existingIds = new Set(cy.nodes().map(n => n.data('id')));

            let newEntities = newResults.entities
              .filter(e => !existingIds.has(e.eID))
              .map(e => ({
                data: {
                  id: e.eID,
                  label: e.eID,
                  eType: e.eType,
                  eTag: e.eTag,
                  degree: 0,
                  fromQuery: false,
                  parent: nodeId,
                  assignments: e.assignments || []
                }
              }));

            let newRelationships = newResults.relationships
              .filter(r => {
                const edgeId = `${r.eID1}-${r.eID2}`;
                return !cy.getElementById(edgeId).length;
              })
              .map(r => ({
                data: {
                  id: `${r.eID1}-${r.eID2}`,
                  source: r.eID1,
                  target: r.eID2,
                  label: r.rType,
                  rType: r.rType,
                  directional: r.directional,
                  parent: nodeId,
                  assignments: r.assignments || []
                }
              }));

            cy.add([...newEntities, ...newRelationships]);

            // Re-run layout for new nodes
            cy.layout({
              name: 'cose',
              animate: true,
              animationDuration: 500,
              idealEdgeLength: linkDistance,
              nodeRepulsion: chargeStrength * 10,
              fit: false,
              randomize: false
            }).run();

            setExpandedNodes(prev => new Set([...prev, nodeId]));
          });
        }
      }
    });

    // Cleanup
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [results]);

  // Update highlighting based on hoveredIndex
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;

    if (typeof hoveredIndex === 'number') {
      // Remove previous highlights
      cy.elements().removeClass('highlighted dimmed');

      // Find elements that include this hoveredIndex in assignments
      const highlightedNodes = cy.nodes().filter(node => {
        const assignments = node.data('assignments') || [];
        return assignments.includes(hoveredIndex);
      });

      const highlightedEdges = cy.edges().filter(edge => {
        const assignments = edge.data('assignments') || [];
        return assignments.includes(hoveredIndex);
      });

      if (highlightedNodes.length > 0 || highlightedEdges.length > 0) {
        // Dim everything
        cy.elements().addClass('dimmed');

        // Highlight specific elements
        highlightedNodes.addClass('highlighted').removeClass('dimmed');
        highlightedEdges.addClass('highlighted').removeClass('dimmed');

        // Scale highlighted nodes
        highlightedNodes.style({
          'width': function(ele) {
            const degree = ele.data('degree');
            const maxDegree = ele.data('maxDegree') || 1;
            const normalizedDegree = Math.sqrt(degree / maxDegree);
            const baseRadius = 20 + normalizedDegree * 40;
            return baseRadius * 2 * 1.3; // 30% larger
          },
          'height': function(ele) {
            const degree = ele.data('degree');
            const maxDegree = ele.data('maxDegree') || 1;
            const normalizedDegree = Math.sqrt(degree / maxDegree);
            const baseRadius = 20 + normalizedDegree * 40;
            return baseRadius * 2 * 1.3;
          }
        });
      }
    } else {
      // Reset all highlighting
      cy.elements().removeClass('highlighted dimmed');
      cy.nodes().style({
        'width': function(ele) {
          const degree = ele.data('degree');
          const maxDegree = ele.data('maxDegree') || 1;
          const normalizedDegree = Math.sqrt(degree / maxDegree);
          const baseRadius = 20 + normalizedDegree * 40;
          return baseRadius * 2;
        },
        'height': function(ele) {
          const degree = ele.data('degree');
          const maxDegree = ele.data('maxDegree') || 1;
          const normalizedDegree = Math.sqrt(degree / maxDegree);
          const baseRadius = 20 + normalizedDegree * 40;
          return baseRadius * 2;
        }
      });
    }
  }, [hoveredIndex]);

  // Update layout parameters when sliders change
  const handleLinkDistanceChange = (e) => {
    const newDistance = Number(e.target.value);
    setLinkDistance(newDistance);

    if (cyRef.current) {
      cyRef.current.layout({
        name: 'cose',
        animate: true,
        animationDuration: 500,
        idealEdgeLength: newDistance,
        nodeRepulsion: chargeStrength * 10,
        fit: false,
        randomize: false
      }).run();
    }
  };

  const handleChargeStrengthChange = (e) => {
    const newStrength = Number(e.target.value);
    setChargeStrength(newStrength);

    if (cyRef.current) {
      cyRef.current.layout({
        name: 'cose',
        animate: true,
        animationDuration: 500,
        idealEdgeLength: linkDistance,
        nodeRepulsion: newStrength * 10,
        fit: false,
        randomize: false
      }).run();
    }
  };

  const handleCenterView = () => {
    if (cyRef.current) {
      cyRef.current.fit(null, 50); // Fit all elements with 50px padding
      cyRef.current.center(); // Center the view
    }
  };

  return (
    <div className={styles.forceContainer}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Edge Length: {linkDistance}
            <input
              type="range"
              min="50"
              max="400"
              value={linkDistance}
              onChange={handleLinkDistanceChange}
              className={styles.slider}
            />
          </label>
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Node Repulsion: {chargeStrength}
            <input
              type="range"
              min="100"
              max="2000"
              value={chargeStrength}
              onChange={handleChargeStrengthChange}
              className={styles.slider}
            />
          </label>
        </div>
        <div className={styles.controlGroup}>
          <button onClick={handleCenterView} className={styles.centerButton}>
            Center View
          </button>
        </div>
      </div>
      <div ref={containerRef} className={styles.cytoscape}></div>
    </div>
  );
}
