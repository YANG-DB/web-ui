import React from "react";
import * as d3 from "d3";
import useD3 from "../hooks/useD3";
import mockResult from "../mocks/queries/Result.json";
import styles from "./Force.module.css";

export default function Force({ results }) {
  const ref = useD3(svg => {
    const { width, height } = svg.node().getBoundingClientRect();
    const entities = results.entities.map(e => ({ ...e, id: e.eID }));
    const relationships = results.relationships.map(r => ({
      ...r,
      id: r.rID,
      source: r.eID1,
      target: r.eID2
    }));

    const simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3.forceLink().id(function(d) {
          return d.id;
        })
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    const defs = svg
      .selectAll("defs")
      .data([null])
      .enter()
      .append("svg:defs");

    defs
      .append("svg:marker")
      .attr("id", "arrow-end")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10) //so that it comes towards the center.
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("class", styles.marker);

    var gLink = svg
      .selectAll(".links")
      .data([null])
      .enter()
      .append("g")
      .attr("class", "links")
      .selectAll(".linkGroup")
      .data(relationships)
      .enter()
      .append("g")
      .attr("class", "linkGroup");

    const link = gLink
      .append("path")
      .attr("class", styles.line)
      .attr("id", d => d.id);

    var gNode = svg
      .selectAll(".nodes")
      .data([null])
      .enter()
      .append("g")
      .attr("class", "nodes")
      .selectAll(`.${styles.nodeGroup}`)
      .data(entities)
      .enter()
      .append("g")
      .attr("class", styles.nodeGroup);

    var node = gNode
      .append("circle")
      .attr("class", styles.node)
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    const labels = gNode
      .append("text")
      .text(function(d) {
        return d.id;
      })
      .attr("class", styles.text);

    const linkLabels = gLink
      .append("text")
      .append("textPath")
      .attr("class", styles.rLabel)
      .attr("startOffset", "50%")
      .attr("href", d => `#${d.id}`)
      .text(function(d) {
        return d.rType;
      });

    simulation.nodes(entities).on("tick", ticked);

    simulation
      .force("link")
      .links(relationships)
      .distance(d => Math.min(height, width) - 50);

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

    function lineFunction(source, target) {
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

    function ticked() {
      link
        .attr("d", d => lineFunction(d.source, d.target))
        .attr("marker-end", d => d.directional && "url(#arrow-end)");

      node
        .attr("cx", function(d) {
          return d.x;
        })
        .attr("cy", function(d) {
          return d.y;
        });

      labels
        .attr("x", function(d) {
          return d.x;
        })
        .attr("y", function(d) {
          return d.y;
        });

      linkLabels
        .attr("x", function(d) {
          return d.source.x;
        })
        .attr("y", function(d) {
          return d.source.y;
        });
    }

    var zoom_handler = d3.zoom().on("zoom", zoom_actions);

    function zoom_actions() {
      gLink.attr("transform", d3.event.transform);
      gNode.attr("transform", d3.event.transform);
    }
    zoom_handler(svg);
  }, []);
  return <svg ref={ref} className={styles.svg}></svg>;
}

Force.defaultProps = {
  results:
    mockResult.data.cursorResourceInfos[0].pageResourceInfos[0].data
      .assignments[0]
};
