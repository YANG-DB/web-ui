import React from "react";
import cn from "classnames";
import styles from "./DatePicker.module.css";

export default function Day({ day, onSelect, isSelected }) {
  return day ? (
    <td
      className={cn(styles.day, isSelected && styles.isSelected)}
      colSpan={1}
      onMouseDown={e => e.preventDefault()}
      onClick={() => onSelect(day)}
    >
      {day.format("D")}
    </td>
  ) : (
    <td />
  );
}
