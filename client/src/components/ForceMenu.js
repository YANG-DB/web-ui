import React, { useState, useCallback } from "react";
import Force from "./Force";
import List from "./List";
import styles from "./ForceMenu.module.css";

export default function ForceMenu({ results }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const onHover = useCallback(index => {
    setHoveredIndex(index);
  }, []);
  return (
    <div className={styles.wrapper}>
      <div className={styles.menu}>
        <List
          results={results.data.assignments}
          pattern={results.data.pattern}
          isMenu={true}
          onHover={onHover}
          hoveredIndex={hoveredIndex}
        />
      </div>
      <Force results={results} hoveredIndex={hoveredIndex} />
    </div>
  );
}
