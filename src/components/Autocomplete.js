import React from "react";
import cn from "classnames";
import * as slateConstants from "../constants/slate";
import styles from "./TextInput.module.css";

function getLabel(key) {
  if (key.endsWith("<")) {
    return [key.replace(/(<)$/i, ""), "⇦"];
  }
  if (key.endsWith(">")) {
    return [key.replace(/(>)$/i, ""), "⇨"];
  }
  switch (key) {
    case slateConstants.NEW_BRANCH:
      return ["New Branch", "⮐"];
    case slateConstants.ESCAPE_GROUP:
      return ["Escape Group", "⮑"];
    case slateConstants.FILTER_ICON:
      return ["Add Filter", slateConstants.FILTER_ICON];
    default:
      return [key, null];
  }
}

export default function Autocomplete({
  isOpen,
  options,
  onSelect,
  highlightedIndex,
  cursorPosition
}) {
  // TODO: if any of the options features slateConstants.PICK_DATE, render a datepicker instead
  return cursorPosition && isOpen ? (
    <div
      className={cn(styles.autocomplete, options.length && styles.visible)}
      style={{
        top: `${cursorPosition.top}px`,
        left: `${cursorPosition.left}px`
      }}
    >
      {options.map((p, i) => {
        const [label, symbol] = getLabel(p);
        return (
          <div
            onMouseDown={e => {
              e.preventDefault();
              onSelect(i);
            }}
            key={i}
            className={cn(
              styles.suggestion,
              i === highlightedIndex && styles.highlighted
            )}
          >
            <span>{symbol}</span>

            <span>{label}</span>
          </div>
        );
      })}
    </div>
  ) : null;
}
