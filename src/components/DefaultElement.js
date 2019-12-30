import React from "react";
import cn from "classnames";
import styles from "./TextInput.module.css";

export default function DefaultElement(props) {
  return (
    <div
      {...props.attributes}
      className={cn(styles[props.element.type], styles.default)}
    >
      {props.children}
    </div>
  );
}
