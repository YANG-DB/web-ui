import React from "react";
import * as d3 from "d3";
import cn from "classnames";
import useD3 from "../hooks/useD3";
import extractResults from "../helpers/extractResults";
import apiService from "../services/api";
import eyeOn from "../assets/eye.svg";
import eyeOff from "../assets/eye-off.svg";
import styles from "./Force.module.css";
import { min } from "d3";

const NODE_RADIUS = 10;
const menuItems = ["toggleExpand", "functionTwo", "functionThree"];
var pie = d3.pie().value(() => 1);
var color = d3
  .scaleOrdinal()
  .domain([0, 1, 2, 3, 4])
  .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"]);

export default function Force({ results }) {
  const ref = useD3(svg => {
    const { width, height } = svg.node().getBoundingClientRect();
    let entities = results.entities.map(e => ({
      ...e,
      id: e.eID,
      fromQuery: true,
      expanded: false,
      menuOpen: false
    }));
    let relationships = results.relationships.map(r => ({
      ...r,
      id: r.rID,
      source: r.eID1,
      target: r.eID2
    }));

    const simulation = d3
      .forceSimulation(entities)
      .force(
        "link",
        d3.forceLink(relationships).id(function(d) {
          return d.id;
        })
      )
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .alphaDecay(0.04)
      .on("tick", ticked);

    svg.attr("width", width);
    svg.attr("height", height);

    function dragstarted(d) {
      if (!d3.event.active) simulation.alpha(0.01).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alpha(0.01);
      if (!d.menuOpen) {
        d.fx = null;
        d.fy = null;
      }
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
      .attr("refX", 10)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("class", styles.marker);

    var gLink = svg
      .selectAll(".links")
      .data([null])
      .join("g")
      .attr("class", "links");

    var link = gLink.selectAll(".linkGroup");

    var gNode = svg
      .selectAll(".nodes")
      .data([null])
      .join("g")
      .attr("class", "nodes");

    var node = gNode.selectAll(`.${styles.nodeGroup}`);

    var menu = node.select(`.${styles.menu}`);
    var circle = node.select("circle");
    var labels = node.select("text");
    var path = link.select("path");
    var linkLabels = link.select("text");

    restart();

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
      var minX = Infinity;
      var minY = Infinity;
      var maxX = -Infinity;
      var maxY = -Infinity;
      path
        .attr("d", d => lineFunction(d.source, d.target))
        .attr("marker-end", d => d.directional && "url(#arrow-end)");

      linkLabels
        .attr("x", function(d) {
          return d.source.x;
        })
        .attr("y", function(d) {
          return d.source.y;
        });

      menu.attr("transform", d => `translate(${d.x} ${d.y})`);

      circle
        .attr("cx", function(d) {
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

      svg.attr("viewBox", [
        minX - NODE_RADIUS,
        minY - NODE_RADIUS,
        maxX - minX + NODE_RADIUS * 2,
        maxY - minY + NODE_RADIUS * 2
      ]); // ensures that all nodes are visible on load
    }

    function restart() {
      // create menu
      const IMAGE_HEIGHT = 20;
      const IMAGE_WIDTH = 20;
      menu = menu.data(
        entities.filter(e => e.menuOpen),
        function(d) {
          return d.id;
        }
      );
      menu.exit().remove();
      var menuEnter = menu
        .enter()
        .append("svg:g")
        .attr("class", styles.menu);
      menu = menuEnter.merge(menu);
      var menuItem = menu
        .selectAll("path")
        .data(d => pie(menuItems).map(i => ({ node: d, ...i })))
        .enter()
        .append("path")
        .attr(
          "d",
          d3
            .arc()
            .innerRadius(0)
            .outerRadius(20)
        )
        .attr("fill", function(d, i) {
          return color(i);
        })
        .attr("class", styles.menuItem)
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
        });
      var arc = d3
        .arc()
        .innerRadius(20)
        .outerRadius(50);
      var menuIcon = menu
        .selectAll(`.${styles.menuIcon}`)
        .data(d => pie(menuItems).map(i => ({ node: d, ...i })));
      menuIcon.exit().remove();
      menuIcon = menuIcon
        .enter()
        .append("svg:image")
        .attr("width", "20")
        .attr("x", d => 0)
        .attr("y", d => 0)
        .attr("class", styles.menuIcon)
        .attr("width", IMAGE_WIDTH)
        .attr("height", IMAGE_HEIGHT)
        .call(selection =>
          selection
            .transition()
            .attr()
            .attr("x", d => arc.centroid(d)[0] - IMAGE_WIDTH / 2)
            .attr("y", d => arc.centroid(d)[1] - IMAGE_HEIGHT / 2)
        )
        .merge(menuIcon);
      menuItem.transition().attr("d", arc);
      menuIcon.attr("xlink:href", d => {
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

      // update nodes
      node = node.data(entities, function(d) {
        return d.id;
      });
      node.exit().remove();
      var nodeEnter = node
        .enter()
        .append("g")
        .attr("class", styles.nodeGroup);
      node = nodeEnter.merge(node);

      circle = nodeEnter
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
        .call(
          d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        )
        .merge(circle)
        .attr("r", NODE_RADIUS)
        .attr("class", d => {
          return cn(
            styles.node,
            !d.fromQuery && styles.cannotExpand,
            d.expanded && styles.expanded
          );
        });

      labels = nodeEnter
        .append("text")
        .text(function(d) {
          return d.id;
        })
        .attr("class", styles.text)
        .merge(labels);

      // update links
      link = link.data(relationships, function(d) {
        return d.source.id + "-" + d.target.id;
      });
      link.exit().remove();
      var linkEnter = link
        .enter()
        .append("g")
        .attr("class", "linkGroup");

      path = linkEnter
        .append("path")
        .attr("class", styles.line)
        .attr("id", d => d.id)
        .merge(path);

      linkLabels = linkEnter
        .append("text")
        .append("textPath")
        .attr("class", styles.rLabel)
        .attr("startOffset", "50%")
        .attr("href", d => `#${d.id}`)
        .text(function(d) {
          return d.rType;
        })
        .merge(linkLabels);

      link = linkEnter.merge(link);

      // Update and restart the simulation.
      simulation.nodes(entities);
      simulation
        .force(
          "link",
          d3
            .forceLink(relationships)
            .id(function(d) {
              return d.id;
            })
            .distance(200)
        )
        .force("collide", d3.forceCollide(75));
      simulation.alpha(0.01).restart();
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
            menuOpen: false
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
        node.expanded = true;
        restart();
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
