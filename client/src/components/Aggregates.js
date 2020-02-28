import React from "react";
import cn from "classnames";
import { ListItem, Card } from "../components";
import styles from "./Aggregates.module.css";
import globalStyles from "../App.module.css";
import piePlaceholder from "../assets/pie_placeholder.png";

export default function Aggregates() {
  return (
    <div className={styles.aggregates}>
      <Card classname={cn(styles.summary, globalStyles.top)}>
        <h2>Summary</h2>
        <ul className={styles.summaryTable}>
          {[
            { label: "Person", value: 4053 },
            { label: "Know", value: 6454 },
            { label: "Own", value: 1233 },
            { label: "Lives", value: 2355 },
            { label: "Horse", value: 1001 },
            { label: "Kingdom", value: 40 }
          ].map((el, i) => (
            <ListItem label={el.label} value={el.value} key={i} />
          ))}
        </ul>
      </Card>
      <Card classname={styles.trends}>
        <h2>Trends</h2>
        <img
          src={piePlaceholder}
          alt="pie_placeholder"
          className={styles.pieChart}
        />
        <ul className={styles.summaryTable}>
          {[
            { label: "Data 1", value: 4053 },
            { label: "Data 2", value: 6454 },
            { label: "Data 3", value: 1233 },
            { label: "Data 4", value: 2355 }
          ].map((el, i) => (
            <ListItem label={el.label} value={el.value} key={i} />
          ))}
        </ul>
      </Card>
    </div>
  );
}
