import React from "react";
import { AssignmentItem } from "../components";
import styles from "./List.module.css";
import { resultsToTree } from "../helpers";

export default function List({
  results,
  pattern,
  isMenu,
  onHover,
  hoveredIndex
}) {
  return (
    <ul className={styles.list}>
      {results.map((assignment, i) => (
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
  );
}
