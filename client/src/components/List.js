import React, { useState } from "react";
import Toggle from "react-toggle";
import { AssignmentItem } from "../components";
import styles from "./List.module.css";
import { resultsToTree } from "../helpers";
import "react-toggle/style.css";

export default function List({
  results,
  pattern,
  isMenu,
  onHover,
  hoveredIndex
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={styles.listWrapper}>
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
