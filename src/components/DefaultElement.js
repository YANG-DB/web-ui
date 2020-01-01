import React from "react";
import cn from "classnames";
import arraysEqual from "../helpers/arraysEqual";
import * as slateConstants from "../constants/slate";

import styles from "./TextInput.module.css";

export default function DefaultElement(props) {
  const isFocussed =
    props.element.variant === slateConstants.QUANTIFIER_ENTRY &&
    props.element.path &&
    arraysEqual(
      props.focussedPath.slice(0, props.element.path.length),
      props.element.path
    );

  return (
    <div
      {...props.attributes}
      className={cn(
        styles[props.element.type],
        styles.default,
        props.element.variant === slateConstants.QUANTIFIER_ENTRY &&
          !isFocussed &&
          styles.hidden,
        props.element.variant === slateConstants.QUANTIFIER_ENTRY &&
          isFocussed &&
          styles.visible
      )}
    >
      {props.children}
    </div>
  );
}
