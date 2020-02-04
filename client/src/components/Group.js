import React from "react";
import cn from "classnames";
import arraysEqual from "../helpers/arraysEqual";

import styles from "./TextInput.module.css";

export default function Group(props) {
  const isFocussed =
    props.element.path &&
    props.focussedPath &&
    arraysEqual(
      props.focussedPath.slice(0, props.element.path.length),
      props.element.path
    );
  return (
    <span
      {...props.attributes}
      className={cn(
        styles[props.element.variant],
        styles.group,
        isFocussed && styles.focussed,
        props.element.forType && styles[props.element.forType]
      )}
    >
      {props.children}
    </span>
  );
}
