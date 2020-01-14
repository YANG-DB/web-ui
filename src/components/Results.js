import React from "react";
import styles from "./Results.module.css";

export default function Results() {
  return (
    <div className={styles.results}>
      <div className={styles.aggregates}>
        <div className={styles.summary}></div>
        <div className={styles.trends}></div>
      </div>
      <div className={styles.tabs}></div>
    </div>
  );
}
