import React from "react";
import { AssignmentItem } from "../components";
import styles from "./List.module.css";

export default function List({ results }) {
  return (
    <ul className={styles.list}>
      {results.map(assignment => (
        <AssignmentItem data={assignment} />
      ))}
    </ul>
  );
}
