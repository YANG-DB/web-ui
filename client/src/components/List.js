import React, { useState, useEffect } from "react";
import { collapseResults } from "../reducers/research";
import { connect } from "react-redux";
import Toggle from "react-toggle";
import { AssignmentItem } from "../components";
import styles from "./List.module.css";
import { resultsToTree } from "../helpers";
import "react-toggle/style.css";

function List({
  results,
  collapsedResults,
  pattern,
  isMenu,
  onHover,
  hoveredIndex,
  collapseResults
}) {
  const [collapsed, setCollapsed] = useState(false);
  let r;
  if (collapsed) {
    if (collapsedResults) {
      r = collapsedResults.data.assignments;
    } else {
      r = "LOADING";
    }
  } else {
    r = results;
  }
  useEffect(() => {
    if (collapsed && !collapsedResults) {
      collapseResults();
    }
  }, [collapsed]);
  return (
    <div className={styles.listWrapper}>
      {r === "LOADING" ? (
        <div>Loading...</div>
      ) : (
        <ul className={styles.list}>
          {r.map((assignment, i) => (
            <AssignmentItem
              data={resultsToTree(assignment, pattern)}
              isMenuItem={isMenu}
              key={i}
              index={i}
              hovered={i === hoveredIndex}
              onHover={isMenu && onHover ? onHover : null}
            />
          ))}
        </ul>
      )}
      {!isMenu ? (
        <div className={styles.toggle}>
          Collapse
          <Toggle
            aria-label={"Collapse"}
            checked={collapsed}
            onChange={() => setCollapsed(collapsed => !collapsed)}
          />
        </div>
      ) : null}
    </div>
  );
}

export default connect(
  state => ({
    results:
      state.research.history[state.research.history.length - 1].results.data
        .assignments,
    collapsedResults:
      state.research.history[state.research.history.length - 1].collapsedResults
  }),
  { collapseResults }
)(List);
