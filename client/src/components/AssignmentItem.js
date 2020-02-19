import React from "react";
import { resultsToTree, getPreviousPath } from "../helpers";
import { hierarchy, path, linkHorizontal, tree } from "d3";
import useD3 from "../hooks/useD3";
import styles from "./AssignmentItem.module.css";

const dx = 10;
const dy = 80;
const diagonal = linkHorizontal()
  .x(d => d.y)
  .y(d => d.x);

const treeLayout = tree().nodeSize([dx, dy]);
const margin = { top: 10, right: 120, bottom: 10, left: 40 };

export default function AssignmentItem({ data }) {
  const ref = useD3(svg => {
    const { width, height } = svg.node().getBoundingClientRect();
    const treeData = data;
    const root = hierarchy(treeData);
    const linkWrapper = svg
      .selectAll(`.${styles.linkWrapper}`)
      .data([null])
      .enter()
      .append("g")
      .attr("class", styles.linkWrapper);

    const nodeWrapper = svg
      .selectAll(`.${styles.nodeWrapper}`)
      .data([null])
      .enter()
      .append("g")
      .attr("class", styles.nodeWrapper);

    function restart(source) {
      const nodes = root.descendants().reverse();
      const links = root.links();

      treeLayout(root);

      let minY = root;
      let maxY = root;
      let maxX = root;
      root.eachBefore(node => {
        if (node.x < minY.x) minY = node;
        if (node.x > maxY.x) maxY = node;
        if (node.y > maxX.y) maxX = node;
      });
      const height = maxY.x - minY.x + margin.top + margin.bottom;
      const width = maxX.y + margin.left + margin.right;

      svg.attr("viewBox", [-margin.left, minY.x - margin.top, width, height]);

      const node = nodeWrapper.selectAll("g").data(nodes, d => d.id);

      node.join(enter => {
        const group = enter
          .append("g")
          .attr("transform", d => `translate(${d.y},${d.x})`);
        group
          .append("circle")
          .attr("r", 2.5)
          .attr("class", styles.node);
        group
          .append("text")
          .attr("class", styles.nodeLabel)
          .attr("dy", "0.31em")
          .attr("x", d => (d.children ? -6 : 6))
          .attr("text-anchor", d => (d.children ? "end" : "start"))
          .text(d => `${d.data.name} (${d.data.alias})`);
        return group;
      });

      const link = linkWrapper
        .selectAll(`.${styles.linkGroup}`)
        .data(links, d => d.target.id);
      link.join(enter => {
        const group = enter.append("g").attr("class", styles.linkGroup);
        group
          .append("path")
          .attr("d", diagonal)
          .attr("class", styles.link)
          .attr("id", d => d.target.data.name);
        group
          .append("text")
          .attr("dy", "-1px")
          .append("textPath")
          .attr("class", styles.rLabel)
          .attr("startOffset", "50%")
          .attr("href", d => `#${d.target.data.name}`)
          .text(function(d) {
            return d.target.data.link.type;
          });
        return group;
      });
    }
    restart(root);
  });
  return (
    <li className={styles.item}>
      <svg ref={ref} />
    </li>
  );
}
