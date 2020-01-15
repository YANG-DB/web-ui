import React from "react";
import cn from "classnames";
import styles from "./Results.module.css";
import globalStyles from "../App.module.css";
import placeholder from "../assets/network.png";

export default function Results() {
  return (
    <div className={cn(styles.results, globalStyles.section)}>
      <div className={cn(styles.wrapper, globalStyles.rounded)}>
        <div className={styles.aggregates}>
          <div
            className={cn(globalStyles.card, styles.summary, globalStyles.top)}
          >
            <h2>Summary</h2>
          </div>
          <div className={cn(globalStyles.card, styles.trends)}>
            <h2>Trends</h2>
          </div>
        </div>
        <div
          className={cn(
            globalStyles.card,
            styles.tabs,
            globalStyles.right,
            globalStyles.top
          )}
        >
          <h3>Table</h3>
          <h3>List</h3>
          <h3 className={globalStyles.selected}>Graph</h3>
          <div className={styles.placeholder}>
            <img src={placeholder} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}
