import React from "react";
import cn from "classnames";
import styles from "./TextInput.module.css";

export default function Autocomplete({
  isOpen,
  options,
  onSelect,
  highlightedIndex,
  cursorPosition
}) {
  return cursorPosition && isOpen ? (
    <div
      className={cn(styles.autocomplete, options.length && styles.visible)}
      style={{
        top: `${cursorPosition.top}px`,
        left: `${cursorPosition.left}px`
      }}
    >
      {options.map((p, i) => (
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
          {p}
        </div>
      ))}
    </div>
  ) : null;
}
