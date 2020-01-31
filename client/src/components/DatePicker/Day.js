import React from "react";
import cn from "classnames";
import { DateContext } from "../DatePicker";

import styles from "./DatePicker.module.css";

const isSelected = (day, date) => {
  return (day && date && day.isSame(date, "d")) || false;
};

export default function Day({ day }) {
  return (
    <DateContext.Consumer>
      {({ selectedDate, onSelect, onHover, hoveredDate }) => {
        const selected = isSelected(day, selectedDate);
        const isInRange =
          selectedDate &&
          hoveredDate &&
          day.isAfter(selectedDate, "d") &&
          day.isBefore(hoveredDate, "d");
        return day ? (
          <td
            onMouseOver={() => onHover && onHover(day)}
            className={cn(
              styles.day,
              selected && styles.isSelected,
              isInRange && styles.isInRange
            )}
            colSpan={1}
            onMouseDown={e => e.preventDefault()}
            onClick={() => onSelect(day)}
          >
            {day.format("D")}
          </td>
        ) : (
          <td />
        );
      }}
    </DateContext.Consumer>
  );
}
