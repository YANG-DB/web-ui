import React, { useState } from "react";
import cn from "classnames";
import globalStyles from "../App.module.css";
import styles from "./Card.module.css";

export default function Card({ classname, children }) {
  const [minimised, setMinimised] = useState(false);
  return (
    <div
      className={cn(
        globalStyles.card,
        classname,
        minimised && styles.minimised
      )}
    >
      <button
        className={styles.minimise}
        onClick={() => setMinimised(min => !min)}
      ></button>
      {children}
    </div>
  );
}
