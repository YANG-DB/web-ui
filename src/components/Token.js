import React from "react";
import cn from "classnames";
import styles from "./TextInput.module.css";

export default function Token(props) {
  return (
    <div
      {...props.attributes}
      className={cn(
        styles[props.element.variant],
        styles.token,
        props.element.valid === false && styles.invalid,
        props.element.isFirst && styles.isFirst
      )}
    >
      {props.children}
    </div>
  );
}
