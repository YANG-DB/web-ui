import React from "react";
import styles from "./HistoryItem.module.css";

export default function HistoryItem({ date, value }) {
  return (
    <div className={styles.item}>
      <div className={styles.profile}>
        <div></div>
      </div>
      <div className={styles.message}>{value}</div>
      <div className={styles.date}>{date}</div>
    </div>
  );
}
