import React from "react";
import { AssignmentItem } from "../components";
import styles from "./List.module.css";
import { resultsToTree } from "../helpers";

export default function List({ results, pattern }) {
  return (
    <ul className={styles.list}>
      {results.map(assignment => (
        <AssignmentItem data={resultsToTree(assignment, pattern)} />
      ))}
    </ul>
  );
}
