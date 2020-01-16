import React from "react";
import styles from "./ListItem.module.css";

export default function ListItem({ label, value }) {
  return (
    <li className={styles.item}>
      <div>{label}</div>
      <div>{value}</div>
    </li>
  );
}
