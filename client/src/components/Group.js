import React from "react";
import cn from "classnames";
import styles from "./TextInput.module.css";

export default function Group(props) {
  return (
    <span
      {...props.attributes}
      className={cn(
        styles[props.element.variant],
        styles.group,
        props.element.forType && styles[props.element.forType]
      )}
    >
      {props.children}
    </span>
  );
}
