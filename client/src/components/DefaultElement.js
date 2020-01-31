import React from "react";
import cn from "classnames";
import arraysEqual from "../helpers/arraysEqual";
import * as slateConstants from "../constants/slate";

import styles from "./TextInput.module.css";

export default function DefaultElement(props) {
  const isCollapsible = [
    slateConstants.QUANTIFIER_ENTRY,
    slateConstants.FILTER
  ].includes(props.element.variant);
  const isFocussed =
    isCollapsible &&
    props.element.path &&
    props.focussedPath &&
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
        isCollapsible &&
          !isFocussed &&
          !process.env.REACT_APP_DEV_MODE &&
          styles.hidden
      )}
    >
      {props.children}
    </div>
  );
}
