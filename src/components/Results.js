import React from "react";
import cn from "classnames";
import { ListItem } from "../components";
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
            <ul className={styles.summaryTable}>
              {[
                { label: "Person", value: 4053 },
                { label: "Know", value: 6454 },
                { label: "Own", value: 1233 },
                { label: "Lives", value: 2355 },
                { label: "Horse", value: 1001 },
                { label: "Kingdom", value: 40 }
              ].map(el => (
                <ListItem label={el.label} value={el.value} />
              ))}
            </ul>
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
          <div className={styles.headers}>
            <h3>
              <a href="" data-hover="Table">
                Table
              </a>
            </h3>
            <h3>
              <a href="" data-hover="List">
                List
              </a>
            </h3>
            <h3 className={styles.selected}>
              <a href="" data-hover="Graph">
                Graph
              </a>
            </h3>
          </div>
          <div className={styles.placeholder}>
            <img src={placeholder} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}
