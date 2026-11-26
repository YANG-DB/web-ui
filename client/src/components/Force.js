import React, { useState, useEffect, useRef, useCallback } from "react";
import cytoscape from "cytoscape";
import extractResults from "../helpers/extractResults";
import { buildTypeColors, displayName, typeBadge, nodeSize, countByType } from "../helpers/graphStyle";
import apiService from "../services/api";
import GraphLegend from "./GraphLegend";
import DetailsPanel from "./DetailsPanel";
import styles from "./Force.module.css";

const LINK_DISTANCE = 200;
const CHARGE_STRENGTH = 800;

// Layouts offered in the toolbar. Only "force" uses the edge length / repulsion settings.
const LAYOUTS = {
  force: {
    label: "Force",
    options: ({ linkDistance, chargeStrength }) => ({
      name: "cose",
      idealEdgeLength: linkDistance,
      nodeRepulsion: chargeStrength * 10,
      nodeOverlap: 20,
      gravity: 0.1,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0
    })
  },
  breadthfirst: {
    label: "Breadth-first",
    options: () => ({ name: "breadthfirst", directed: false, spacingFactor: 1.1, avoidOverlap: true })
  },
  concentric: {
    label: "Concentric",
    options: () => ({
      name: "concentric",
      concentric: node => node.degree(),
      levelWidth: () => 2,
      minNodeSpacing: 24,
      avoidOverlap: true
    })
  },
  grid: {
    label: "Grid",
    options: () => ({ name: "grid", avoidOverlap: true, avoidOverlapPadding: 20 })
  }
};

// Edge labels are hidden while their rendered size is below this (i.e. until zoomed in to
// about 1.5x), unless the edge is hovered or touches the selected node.
const EDGE_LABEL_MIN_ZOOMED_SIZE = 15;

const STYLE = [
  {
    selector: "node",
    style: {
      "background-color": "data(color)",
      "background-image": "data(badge)",
      "background-width": "86%",
      "background-height": "86%",
      width: "data(size)",
      height: "data(size)",
      label: "data(label)",
      "text-valign": "bottom",
      "text-halign": "center",
      "text-margin-y": 4,
      "text-wrap": "ellipsis",
      "text-max-width": 140,
      color: "#ffffff",
      "text-outline-color": "#0b0e1a",
      "text-outline-width": 2,
      "font-size": 11,
      "min-zoomed-font-size": 7,
      "border-width": 2,
      "border-color": "rgba(255, 255, 255, 0.35)"
    }
  },
  {
    selector: "node:selected",
    style: { "border-color": "#ffffff", "border-width": 4 }
  },
  {
    selector: "edge",
    style: {
      width: 1.2,
      "line-color": "rgba(120, 180, 255, 0.45)",
      "target-arrow-color": "rgba(120, 180, 255, 0.6)",
      "target-arrow-shape": ele => (ele.data("directional") ? "triangle" : "none"),
      "curve-style": "bezier",
      label: "data(label)",
      "font-size": 10,
      "min-zoomed-font-size": EDGE_LABEL_MIN_ZOOMED_SIZE,
      "text-rotation": "autorotate",
      color: "#d6ecff",
      "text-background-color": "#0b0e1a",
      "text-background-opacity": 0.75,
      "text-background-padding": 2,
      // Widens the click/tap target of thin edges (Cytoscape hit-tests width + overlay padding).
      "overlay-padding": 6
    }
  },
  {
    selector: "edge.show-label",
    style: {
      "min-zoomed-font-size": 0,
      width: 2,
      "line-color": "#7fc8ff",
      "target-arrow-color": "#7fc8ff"
    }
  },
  {
    selector: "edge:selected",
    style: { "min-zoomed-font-size": 0, width: 3, "line-color": "#ffffff", "target-arrow-color": "#ffffff" }
  },
  { selector: ".type-hidden", style: { display: "none" } },
  { selector: ".element-hidden", style: { display: "none" } },
  { selector: ".highlighted", style: { opacity: 1, "z-index": 999, "border-width": 4, width: 3 } },
  { selector: ".dimmed", style: { opacity: 0.2 } }
];

function nodeData(entity, { colors, degree, maxDegree, fromQuery, parent }) {
  return {
    id: entity.eID,
    label: displayName(entity),
    eType: entity.eType,
    eTag: entity.eTag,
    rawId: entity.id != null ? entity.id : entity.eID,
    properties: entity.properties || [],
    color: colors[entity.eType],
    badge: typeBadge(entity.eType),
    size: nodeSize(degree, maxDegree),
    degree,
    fromQuery,
    parent: parent || undefined,
    assignments: entity.assignments || []
  };
}

function edgeData(rel, parent) {
  return {
    id: rel.rID || `${rel.eID1}-${rel.rType}-${rel.eID2}`,
    source: rel.eID1,
    target: rel.eID2,
    label: rel.rType,
    rType: rel.rType,
    directional: rel.directional,
    properties: rel.properties || [],
    parent: parent || undefined,
    assignments: rel.assignments || []
  };
}

// What the details panel shows for the element with this id, or null when it is gone or
// hidden.
function describe(cy, id, expanded) {
  if (!cy || !id) return null;
  const ele = cy.getElementById(id);
  if (!ele.length || !ele.visible()) return null;
  const data = ele.data();
  if (ele.isNode()) {
    return {
      kind: "node",
      id,
      type: data.eType,
      name: data.label,
      color: data.color,
      rawId: data.rawId,
      degree: ele.connectedEdges().length,
      expanded: expanded.has(id),
      properties: data.properties
    };
  }
  const source = ele.source().data();
  const target = ele.target().data();
  return {
    kind: "edge",
    id,
    type: data.rType,
    name: `${source.label} ${data.directional ? "→" : "–"} ${target.label}`,
    source: { id: source.id, name: source.label },
    target: { id: target.id, name: target.label },
    directional: data.directional,
    properties: data.properties
  };
}

// Runs a layout and keeps it in `active` until it stops, so it can be stopped early.
function runTrackedLayout(active, cy, options) {
  const layout = cy.layout(options);
  active.add(layout);
  layout.one("layoutstop", () => active.delete(layout));
  layout.run();
  return layout;
}

const defaultExpandNode = node => apiService.updateResult(node.id);

export default function Force({ results, hoveredIndex, onExpandNode = defaultExpandNode }) {
  const [linkDistance, setLinkDistance] = useState(LINK_DISTANCE);
  const [chargeStrength, setChargeStrength] = useState(CHARGE_STRENGTH);
  const [layoutName, setLayoutName] = useState("force");
  const [showSettings, setShowSettings] = useState(false);
  const [legendItems, setLegendItems] = useState([]);
  const [hiddenTypes, setHiddenTypes] = useState(new Set());
  const [expandError, setExpandError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [expandingId, setExpandingId] = useState(null);
  const [hiddenCount, setHiddenCount] = useState(0);
  // Bumped when the graph changes in ways React does not see (expand, collapse), so the
  // details panel re-reads it.
  const [graphVersion, setGraphVersion] = useState(0);
  const expandRef = useRef(null);

  const cyRef = useRef(null);
  const containerRef = useRef(null);
  // Layouts still animating. They must be stopped before the graph is destroyed, or their
  // next animation frame touches the destroyed graph ("reading 'notify'" of null).
  const layoutsRef = useRef(new Set());
  const colorsRef = useRef({});
  const expandedRef = useRef(new Set());
  // The latest values, for handlers registered once per result.
  const latest = useRef({});
  latest.current = { linkDistance, chargeStrength, layoutName, onExpandNode, hiddenTypes };

  const r = extractResults(results);

  const refreshLegend = useCallback(cy => {
    const entities = cy.nodes().map(n => ({ eType: n.data("eType") }));
    setLegendItems(
      countByType(entities).map(item => ({ ...item, color: colorsRef.current[item.type] }))
    );
  }, []);

  const layoutOptions = useCallback(
    (name, extra = {}) => ({
      ...LAYOUTS[name].options(latest.current),
      animate: true,
      animationDuration: 600,
      ...extra
    }),
    []
  );

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const degreeMap = new Map();
    r.relationships.forEach(rel => {
      degreeMap.set(rel.eID1, (degreeMap.get(rel.eID1) || 0) + 1);
      degreeMap.set(rel.eID2, (degreeMap.get(rel.eID2) || 0) + 1);
    });
    const maxDegree = Math.max(...Array.from(degreeMap.values()), 1);
    colorsRef.current = buildTypeColors(r.entities.map(e => e.eType));
    expandedRef.current = new Set();

    const elements = [
      ...r.entities.map(e => ({
        data: nodeData(e, {
          colors: colorsRef.current,
          degree: degreeMap.get(e.eID) || 0,
          maxDegree,
          fromQuery: true
        })
      })),
      ...r.relationships.map(rel => ({ data: edgeData(rel) }))
    ];

    const activeLayouts = layoutsRef.current;
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: STYLE,
      // The real layout runs below through runTrackedLayout, so it can be stopped on cleanup.
      layout: { name: "preset" },
      boxSelectionEnabled: false
    });
    cyRef.current = cy;
    setHiddenTypes(new Set());
    setExpandError(null);
    setSelectedId(null);
    setExpandingId(null);
    setHiddenCount(0);
    refreshLegend(cy);

    // Nodes start without positions ('preset' above), so a force layout spreads them first.
    runTrackedLayout(activeLayouts, cy, layoutOptions(latest.current.layoutName, { randomize: true, animationDuration: 1000 }));

    // Edge labels: on hover, and on the edges of the selected node.
    const touchesSelected = edge => edge.connectedNodes().some(n => n.selected());
    cy.on("mouseover", "edge", evt => evt.target.addClass("show-label"));
    cy.on("mouseout", "edge", evt => {
      if (!touchesSelected(evt.target)) evt.target.removeClass("show-label");
    });
    cy.on("select", "node", evt => evt.target.connectedEdges().addClass("show-label"));
    cy.on("unselect", "node", evt =>
      evt.target.connectedEdges().filter(e => !touchesSelected(e)).removeClass("show-label")
    );

    // Expands a node's neighbors, or removes them when already expanded. Used by double-tap
    // and by the details panel.
    const expand = node => {
      const nodeId = node.id();

      if (expandedRef.current.has(nodeId)) {
        cy.remove(cy.elements().filter(el => el.data("parent") === nodeId));
        expandedRef.current.delete(nodeId);
        refreshLegend(cy);
        setGraphVersion(v => v + 1);
        return Promise.resolve();
      }

      setExpandError(null);
      setExpandingId(nodeId);
      return Promise.resolve(latest.current.onExpandNode(node.data()))
        .then(expansion => {
          if (cy.destroyed() || !expansion) return;
          const found = extractResults(expansion);
          const existing = new Set(cy.nodes().map(n => n.id()));
          colorsRef.current = {
            ...buildTypeColors([...Object.keys(colorsRef.current), ...found.entities.map(e => e.eType)]),
            ...colorsRef.current
          };
          const newNodes = found.entities
            .filter(e => !existing.has(e.eID))
            .map(e => ({
              data: nodeData(e, { colors: colorsRef.current, degree: 0, maxDegree, fromQuery: false, parent: nodeId }),
              position: { ...node.position() }
            }));
          const allIds = new Set([...existing, ...newNodes.map(n => n.data.id)]);
          const newEdges = found.relationships
            .map(rel => edgeData(rel, nodeId))
            .filter(d => !cy.getElementById(d.id).length && allIds.has(d.source) && allIds.has(d.target))
            .map(d => ({ data: d }));

          const added = cy.add([...newNodes, ...newEdges]);
          const hidden = latest.current.hiddenTypes;
          added.nodes().forEach(n => n.toggleClass("type-hidden", hidden.has(n.data("eType"))));
          expandedRef.current.add(nodeId);
          refreshLegend(cy);
          runTrackedLayout(activeLayouts, cy, layoutOptions(latest.current.layoutName, { fit: false, randomize: false }));
        })
        .catch(error => {
          if (!cy.destroyed()) setExpandError(`Could not expand ${node.data("label")}: ${error.message}`);
        })
        .finally(() => {
          if (!cy.destroyed()) {
            setExpandingId(null);
            setGraphVersion(v => v + 1);
          }
        });
    };
    expandRef.current = expand;

    // A tap selects a node or edge and opens its details; a tap on the background closes them.
    cy.on("tap", "node, edge", evt => setSelectedId(evt.target.id()));
    cy.on("tap", evt => {
      if (evt.target === cy) setSelectedId(null);
    });
    // Double-tap expands a node's neighbors.
    cy.on("dbltap", "node", evt => expand(evt.target));

    return () => {
      activeLayouts.forEach(layout => layout.stop());
      activeLayouts.clear();
      cy.destroy();
      if (cyRef.current === cy) cyRef.current = null;
    };
    // The graph is rebuilt only when the results change; everything else is read from `latest`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  // Hide or show types from the legend.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().forEach(n => n.toggleClass("type-hidden", hiddenTypes.has(n.data("eType"))));
  }, [hiddenTypes]);

  // Highlight the elements of a hovered assignment (ForceMenu).
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass("highlighted dimmed");
    if (typeof hoveredIndex !== "number") return;
    const inAssignment = el => (el.data("assignments") || []).includes(hoveredIndex);
    const highlighted = cy.elements().filter(inAssignment);
    if (highlighted.length > 0) {
      cy.elements().addClass("dimmed");
      highlighted.addClass("highlighted").removeClass("dimmed");
    }
  }, [hoveredIndex]);

  // The graph narrows when the panel opens; Cytoscape has to re-measure its container.
  const panelOpen = selectedId !== null;
  useEffect(() => {
    if (cyRef.current) cyRef.current.resize();
  }, [panelOpen]);

  const details = describe(cyRef.current, selectedId, expandedRef.current);
  // graphVersion is read so a re-render after expand/collapse refreshes the panel.
  void graphVersion;

  const closeDetails = useCallback(() => {
    if (cyRef.current) cyRef.current.elements(":selected").unselect();
    setSelectedId(null);
  }, []);

  const selectNode = useCallback(id => {
    const cy = cyRef.current;
    if (!cy) return;
    const node = cy.getElementById(id);
    if (!node.length) return;
    cy.elements(":selected").unselect();
    node.select();
    cy.animate({ center: { eles: node } }, { duration: 300 });
    setSelectedId(id);
  }, []);

  const expandSelected = () => {
    const cy = cyRef.current;
    if (cy && selectedId && expandRef.current) expandRef.current(cy.getElementById(selectedId));
  };

  const hideSelected = () => {
    const cy = cyRef.current;
    if (!cy || !selectedId) return;
    cy.getElementById(selectedId).unselect().addClass("element-hidden");
    setHiddenCount(cy.elements(".element-hidden").length);
    setSelectedId(null);
  };

  const showHidden = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements(".element-hidden").removeClass("element-hidden");
    setHiddenCount(0);
  };

  const relayout = useCallback(
    (name, extra) => {
      if (cyRef.current) runTrackedLayout(layoutsRef.current, cyRef.current, layoutOptions(name, extra));
    },
    [layoutOptions]
  );

  const changeLayout = e => {
    const name = e.target.value;
    setLayoutName(name);
    latest.current.layoutName = name;
    relayout(name, { fit: true });
  };

  const changeLinkDistance = e => {
    const value = Number(e.target.value);
    setLinkDistance(value);
    latest.current.linkDistance = value;
    if (layoutName === "force") relayout("force", { fit: false, randomize: false, animationDuration: 400 });
  };

  const changeChargeStrength = e => {
    const value = Number(e.target.value);
    setChargeStrength(value);
    latest.current.chargeStrength = value;
    if (layoutName === "force") relayout("force", { fit: false, randomize: false, animationDuration: 400 });
  };

  const fit = () => {
    if (cyRef.current) cyRef.current.animate({ fit: { eles: cyRef.current.elements(":visible"), padding: 40 } }, { duration: 300 });
  };

  const toggleType = type =>
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  return (
    <div className={styles.forceContainer}>
      <div className={styles.graphArea}>
      <div className={styles.toolbar}>
        <label className={styles.toolbarLabel}>
          Layout
          <select value={layoutName} onChange={changeLayout} className={styles.toolbarSelect} aria-label="Graph layout">
            {Object.entries(LAYOUTS).map(([name, { label }]) => (
              <option key={name} value={name}>{label}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={fit} className={styles.toolbarButton} title="Fit the graph to the view">
          Fit
        </button>
        {hiddenCount > 0 && (
          <button type="button" onClick={showHidden} className={styles.toolbarButton} title="Show the elements you hid">
            Show hidden ({hiddenCount})
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowSettings(s => !s)}
          className={styles.toolbarButton}
          aria-expanded={showSettings}
          aria-controls="graph-layout-settings"
          title="Layout settings"
        >
          ⚙
        </button>
        {showSettings && (
          <div id="graph-layout-settings" className={styles.settings} role="group" aria-label="Force layout settings">
            <label className={styles.controlLabel}>
              Edge length: {linkDistance}
              <input
                type="range"
                min="50"
                max="400"
                value={linkDistance}
                onChange={changeLinkDistance}
                className={styles.slider}
                disabled={layoutName !== "force"}
              />
            </label>
            <label className={styles.controlLabel}>
              Node repulsion: {chargeStrength}
              <input
                type="range"
                min="100"
                max="2000"
                value={chargeStrength}
                onChange={changeChargeStrength}
                className={styles.slider}
                disabled={layoutName !== "force"}
              />
            </label>
            {layoutName !== "force" && <p className={styles.settingsNote}>These apply to the Force layout.</p>}
          </div>
        )}
      </div>
      <GraphLegend items={legendItems} hidden={hiddenTypes} onToggle={toggleType} />
      {expandError && !(details && details.kind === "node") && (
        <div className={styles.graphError} role="alert">{expandError}</div>
      )}
      <div className={styles.hint}>Tap a node or edge for details · double-tap to expand · scroll to zoom</div>
      <div ref={containerRef} className={styles.cytoscape}></div>
      </div>
      <DetailsPanel
        details={details}
        expanding={details !== null && expandingId === details.id}
        error={details && details.kind === "node" ? expandError : null}
        onClose={closeDetails}
        onExpand={expandSelected}
        onHide={hideSelected}
        onSelectNode={selectNode}
      />
    </div>
  );
}
