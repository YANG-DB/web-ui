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

    var link = svg
      .selectAll(".links")
      .data([null])
      .enter()
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(relationships)
      .join("line")
      .attr("class", styles.line);

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

    simulation.nodes(entities).on("tick", ticked);

    simulation
      .force("link")
      .links(relationships)
      .distance(d => Math.min(height, width) - 50);

    function ticked() {
      link
        .attr("x1", function(d) {
          console.log("data point", d);
          return d.source.x;
        })
        .attr("y1", function(d) {
          return d.source.y;
        })
        .attr("x2", function(d) {
          return d.target.x;
        })
        .attr("y2", function(d) {
          return d.target.y;
        });

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
    }
  }, []);
  return <svg ref={ref} className={styles.svg}></svg>;
}

Force.defaultProps = {
  results:
    mockResult.data.cursorResourceInfos[0].pageResourceInfos[0].data
      .assignments[0]
};
