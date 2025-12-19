import { useState } from "react";
import * as d3 from "d3";
import cn from "classnames";
import useD3 from "../hooks/useD3";
import extractResults from "../helpers/extractResults";
import apiService from "../services/api";
import eyeOn from "../assets/eye.svg";
import eyeOff from "../assets/eye-off.svg";
import styles from "./Force.module.css";

const IMAGE_HEIGHT = 20;
const IMAGE_WIDTH = 20;
const NODE_RADIUS = 10;
const MIN_NODE_RADIUS = 10;  // Increased from 8 to make even small nodes more visible
const MAX_NODE_RADIUS = 30;  // Increased from 25 to make hub nodes even more prominent
const ALPHA = 0.3;  // Increased from 0.01 for more responsive dragging
const UNHOVERED_OPACITY = 0.7;
const LINK_DISTANCE = 200;  // Increased from 100 to spread nodes further
const CHARGE_STRENGTH = -800;  // Increased repulsion from -300 to push nodes apart

const menuItems = ["toggleExpand", "functionTwo", "functionThree"];

const arc = d3
  .arc()
  .innerRadius(20)
  .outerRadius(50);
const createMenu = d3.pie().value(() => 1);

const color = d3
  .scaleOrdinal()
  .domain([0, 1, 2, 3, 4])
  .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"]);

// Enhanced color scheme for different entity types
const entityColorScale = d3
  .scaleOrdinal()
  .domain(["Person", "Dragon", "Horse", "Guild", "Kingdom", "Company", "Position", "School", "Skill", "Post", "Group"])
  .range(["#FF6B9D", "#C44569", "#FFA502", "#6A89CC", "#4A69BD", "#00D2D3", "#1ABC9C", "#8E44AD", "#E74C3C", "#F39C12", "#16A085"]);

// Color scale for node connectivity (from low to high connectivity)
// Using Turbo for more vibrant, distinguishable colors
const connectivityColorScale = d3
  .scaleSequential()
  .domain([0, 10])  // Will be updated dynamically based on max degree
  .interpolator(d3.interpolateTurbo);

function scale(source, target, scaleFactor) {
  let factor = scaleFactor;
  const x = target.x - source.x;
  const y = target.y - source.y;
  const ln = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  if (typeof factor === "undefined") {
    const r = 10;
    factor = r / ln;
  }
  return {
    offset: {
      x: factor * x,
      y: factor * y
    }
  };
}

function drawLine(source, target) {
  let offsetX, offsetY;
  const { x, y } = scale(source, target).offset;
  offsetX = x;
  offsetY = y;
  return d3
    .line()
    .x(function(d, i) {
      return i === 0 ? d.x + offsetX : d.x - offsetX;
    })
    .y(function(d, i) {
      return i === 0 ? d.y + offsetY : d.y - offsetY;
    })([source, target]);
}

export default function Force({ results, hoveredIndex }) {
  const r = extractResults(results);
  let entities = r.entities.map(e => ({
    ...e,
    id: e.eID,
    fromQuery: true,
    expanded: false,
    menuOpen: false,
    degree: 0  // Will be calculated below
  }));
  let relationships = r.relationships.map(r => ({
    ...r,
    id: r.rID,
    source: r.eID1,
    target: r.eID2
  }));

  // Calculate degree (number of connections) for each node
  const degreeMap = new Map();
  relationships.forEach(rel => {
    degreeMap.set(rel.source, (degreeMap.get(rel.source) || 0) + 1);
    degreeMap.set(rel.target, (degreeMap.get(rel.target) || 0) + 1);
  });
  entities.forEach(e => {
    e.degree = degreeMap.get(e.id) || 0;
  });

  // Update connectivity color scale domain based on actual max degree
  const maxDegree = Math.max(...entities.map(e => e.degree), 1);
  connectivityColorScale.domain([0, maxDegree]);
  const [simulation] = useState(
    d3
      .forceSimulation(entities)
      .force(
        "link",
        d3.forceLink(relationships)
          .id(function(d) {
            return d.id;
          })
          .distance(LINK_DISTANCE)
      )
      .force("charge", d3.forceManyBody().strength(CHARGE_STRENGTH))
      .force("collide", d3.forceCollide().radius(d => {
        // Dynamic collision radius based on node size (using square root scale)
        const normalizedDegree = Math.sqrt(d.degree / maxDegree);
        const baseRadius = MIN_NODE_RADIUS + normalizedDegree * (MAX_NODE_RADIUS - MIN_NODE_RADIUS);
        return baseRadius + 15; // Increased padding from 5px to 15px for better spacing
      }))
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .alphaDecay(0.2)
  );
  const ref = useD3(svg => {
    const { width, height } = svg.node().getBoundingClientRect();
    svg.attr("width", width);
    svg.attr("height", height);

    // ---------------------------------- Translate data ---------------------------------- //

    // ------------------------------- Initialise simulation ------------------------------ //

    simulation.on("tick", ticked);

    // --------------------------------- Define callbacks --------------------------------- //

    function dragstarted(event, d) {
      if (!event.active) simulation.alpha(ALPHA).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      // setting fx/fy serves to override the x and y values provided by the simulation
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alpha(ALPHA);
      if (!d.menuOpen) {
        d.fx = null;
        d.fy = null;
      }
    }

    function openMenu(node) {
      node.menuOpen = true;
      node.fx = node.x;
      node.fy = node.y;
      restart();
    }

    function closeMenu(node) {
      node.menuOpen = false;
      node.fx = null;
      node.fy = null;
      restart();
    }

    function collapse(node) {
      entities = entities.filter(e => e.parent !== node.id);
      relationships = relationships.filter(r => r.parent !== node.id);
      node.expanded = false;
      restart();
    }

    function expand(node) {
      const { id } = node;
      apiService.updateResult(id).then(results => {
        let newResults = extractResults(results);
        let newEntities = newResults.entities
          .filter(e => !entities.some(en => en.id === e.eID))
          .map(e => ({
            ...e,
            id: e.eID,
            fromQuery: false,
            parent: id,
            menuOpen: false,
            degree: 0
          }));
        let newRelationships = newResults.relationships
          .filter(r => !relationships.some(rn => rn.id === r.rID))
          .map(r => ({
            ...r,
            id: r.rID,
            source: r.eID1,
            target: r.eID2,
            parent: id
          }));
        relationships = relationships.concat(newRelationships);
        entities = entities.concat(newEntities);

        // Recalculate degrees for all entities after expansion
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

        // Update connectivity color scale domain
        const newMaxDegree = Math.max(...entities.map(e => e.degree), 1);
        connectivityColorScale.domain([0, newMaxDegree]);

        node.expanded = true;
        restart();
      });
    }

    // ----- Add the svg definitions for arrowheads used for directional relationships ---- //

    const defs = svg
      .selectAll("defs")
      .data([null])
      .enter()
      .append("svg:defs");

    defs
      .append("svg:marker")
      .attr("id", "arrow-end")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("class", styles.marker);

    // ---------------------- Create references to wrapper selections --------------------- //

    var linkWrapper = svg
      .selectAll(".links")
      .data([null])
      .join("g")
      .attr("class", "links");

    var nodeWrapper = svg
      .selectAll(".nodes")
      .data([null])
      .join("g")
      .attr("class", "nodes");

    var link = linkWrapper.selectAll(".linkGroup");
    var node = nodeWrapper.selectAll(`.${styles.nodeGroup}`);

    function ticked() {
      // keep track of bounding nodes
      var minX = Infinity;
      var minY = Infinity;
      var maxX = -Infinity;
      var maxY = -Infinity;

      link.select("path").attr("d", d => drawLine(d.source, d.target));
      node.attr("transform", d => {
        if (d.x < minX) {
          minX = d.x;
        }
        if (d.x > maxX) {
          maxX = d.x;
        }
        if (d.y < minY) {
          minY = d.y;
        }
        if (d.y > maxY) {
          maxY = d.y;
        }
        return `translate(${d.x} ${d.y})`;
      });

      // ensure that all nodes are visible
      svg.attr("viewBox", [
        minX - NODE_RADIUS,
        minY - NODE_RADIUS,
        maxX - minX + NODE_RADIUS * 2,
        maxY - minY + NODE_RADIUS * 2
      ]);
    }

    function restart() {
      // ------------------------------ Create nodes (entities) ----------------------------- //
      node = node
        .data(entities, function(d) {
          return d.id;
        })
        .join(enter => {
          const group = enter
            .append("g")
            .attr("class", styles.nodeGroup)
            .call(
              d3
                .drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
            );

          group
            .append("circle")
            .on("click", d => {
              if (d.fromQuery) {
                if (!d.menuOpen) {
                  openMenu(d);
                } else {
                  closeMenu(d);
                }
              }
            })
            .append("title")
            .text(d => `${d.eType || 'Entity'}: ${d.id}\n${d.eTag ? `Tag: ${d.eTag}` : ''}\nConnections: ${d.degree}`);

          group
            .append("text")
            .text(function(d) {
              return d.id;
            })
            .attr("class", styles.text)
            .append("title")
            .text(d => `${d.eType || 'Entity'}: ${d.id}`);

          return group;
        })
        .call(merged => {
          merged
            .select("circle")
            .transition()
            .attr("r", d => {
              // Calculate base radius based on degree (connectivity)
              // Use square root scale to make differences more visible for low-degree nodes
              const normalizedDegree = Math.sqrt(d.degree / maxDegree);
              const baseRadius = MIN_NODE_RADIUS + normalizedDegree * (MAX_NODE_RADIUS - MIN_NODE_RADIUS);

              if (d.assignments.includes(hoveredIndex)) {
                return baseRadius * 1.3;
              }
              return baseRadius;
            })
            .attr("opacity", d => {
              if (typeof hoveredIndex === "number") {
                if (d.assignments.includes(hoveredIndex)) {
                  return 1;
                }
                return 0.2;
              }

              return UNHOVERED_OPACITY;
            })
            .attr("fill", d => {
              // Use connectivity-based color if node has connections, otherwise use entity type color
              if (d.degree > 0) {
                return connectivityColorScale(d.degree);
              }
              return entityColorScale(d.eType || "default");
            })
            .attr("class", d => {
              return cn(
                styles.node,
                !d.fromQuery && styles.cannotExpand,
                d.expanded && styles.expanded
              );
            });
          merged
            .select("text")
            .transition()
            .attr("opacity", d => {
              if (typeof hoveredIndex === "number") {
                if (d.assignments.includes(hoveredIndex)) {
                  return 1;
                }
                return 0.2;
              }

              return UNHOVERED_OPACITY;
            });
        });

      // --------------------------------- Create menu items -------------------------------- //

      node
        .selectAll(`.${styles.menuItem}`)
        .data(d => {
          return d.menuOpen
            ? createMenu(menuItems).map(i => ({ node: d, ...i }))
            : [];
        })
        .join(enter => {
          const menuItem = enter.append("svg:g").attr("class", styles.menuItem);
          menuItem
            .append("path")
            .attr(
              "d",
              d3
                .arc()
                .innerRadius(0)
                .outerRadius(20)
            )
            .attr("fill", function(_d, i) {
              return color(i);
            })
            .attr("class", styles.menuItemPath)
            .on("click", d => {
              switch (d.data) {
                case "toggleExpand": {
                  if (d.node.expanded) {
                    collapse(d.node);
                  } else {
                    expand(d.node);
                  }
                  break;
                }
                default:
                  return null;
              }
            })
            .transition()
            .attr("d", arc);

          menuItem
            .append("svg:image")
            .attr("width", "20")
            .attr("x", 0)
            .attr("y", 0)
            .attr("class", styles.menuIcon)
            .attr("width", IMAGE_WIDTH)
            .attr("height", IMAGE_HEIGHT)
            .call(selection =>
              selection
                .transition()
                .attr()
                .attr("x", d => arc.centroid(d)[0] - IMAGE_WIDTH / 2)
                .attr("y", d => arc.centroid(d)[1] - IMAGE_HEIGHT / 2)
            );

          return menuItem;
        })
        .select(`.${styles.menuIcon}`)
        .attr("xlink:href", d => {
          switch (d.data) {
            case "toggleExpand": {
              if (d.node.expanded) {
                return eyeOff;
              } else {
                return eyeOn;
              }
            }
            default:
              return null;
          }
        });

      // --------------------------- Create links (relationships) --------------------------- //

      link = link
        .data(relationships, function(d) {
          return d.source.id + "-" + d.target.id;
        })
        .join(enter => {
          const group = enter.append("g").attr("class", "linkGroup");
          group
            .append("path")
            .attr("class", styles.line)
            .attr("id", d => d.id)
            .attr("marker-end", d => d.directional && "url(#arrow-end)")
            .append("title")
            .text(d => `${d.rType}: ${d.source.id} → ${d.target.id}`);
          group
            .append("text")
            .append("textPath")
            .attr("class", styles.rLabel)
            .attr("startOffset", "50%")
            .attr("href", d => `#${d.id}`)
            .text(function(d) {
              return d.rType;
            })
            .append("title")
            .text(d => `Relationship: ${d.rType}`);
          return group;
        })
        .call(selection => {
          selection
            .transition()
            .attr("stroke-width", d => {
              if (d.assignments.includes(hoveredIndex)) {
                return "3px";
              }
              return "1px";
            })
            .attr("stroke-dasharray", d => {
              if (d.assignments.includes(hoveredIndex)) {
                return "none";
              }
              return "5px";
            })
            .attr("opacity", d => {
              if (typeof hoveredIndex === "number") {
                if (d.assignments.includes(hoveredIndex)) {
                  return 1;
                }
                return 0.2;
              }

              return UNHOVERED_OPACITY;
            });
        });
    }

    // -------------------------------- Setup zoom handlers ------------------------------- //

    var zoom_handler = d3.zoom().on("zoom", zoom_actions);
    function zoom_actions(event) {
      linkWrapper.attr("transform", event.transform);
      nodeWrapper.attr("transform", event.transform);
    }
    zoom_handler(svg);
    restart();
  }, []);
  return <svg ref={ref} className={styles.svg}></svg>;
}
