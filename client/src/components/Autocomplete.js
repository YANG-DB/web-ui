import React from "react";
import cn from "classnames";
import * as slateConstants from "../constants/slate";
import * as queryConstants from "../constants/query";
import { DatePicker } from "../components";
import styles from "./TextInput.module.css";
import DatePickerRange from "./DatePicker/DatePickerRange";

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
  if (cursorPosition && isOpen && options.includes(queryConstants.DATE)) {
    return (
      <div
        className={cn(styles.autocomplete, options.length && styles.visible)}
        style={{
          top: `${cursorPosition.top}px`,
          left: `${cursorPosition.left}px`
        }}
      >
        <DatePicker onSelect={onSelect} />
      </div>
    );
  }
  if (cursorPosition && isOpen && options.includes(queryConstants.DATE_RANGE)) {
    return (
      <div
        className={cn(styles.autocomplete, options.length && styles.visible)}
        style={{
          top: `${cursorPosition.top}px`,
          left: `${cursorPosition.left}px`
        }}
      >
        <DatePickerRange onSelect={onSelect} />
      </div>
    );
  }
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
              onSelect(options[i]);
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
