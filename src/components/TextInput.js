import React, { useState, useMemo, useCallback } from "react";
import { createEditor, Editor, Text } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import cn from "classnames";

import styles from "./TextInput.module.css";

import queryToSlate from "../helpers/queryToSlate";
import mockQuery from "../mocks/queries/Dragons";
import mockOntology from "../mocks/ontologies/Dragons";

const json = queryToSlate(mockQuery.elements, mockOntology.data[0]);

export default function TextInput() {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [value, setValue] = useState(json);
  const renderElement = useCallback(props => {
    switch (props.element.type) {
      case "entity":
      case "relationship":
      case "relationship_out":
      case "relationship_in":
      case "unknown":
        return <Token {...props} />;
      case "group":
        return <Group {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);
  const renderLeaf = useCallback(props => {
    return <Leaf {...props} />;
  }, []);

  return (
    <div className={styles.query}>
      <Slate editor={editor} value={value} onChange={value => setValue(value)}>
        <Editable renderElement={renderElement} renderLeaf={renderLeaf} />
      </Slate>
      <button type="submit">Go</button>
    </div>
  );
}

function Leaf(props) {
  return (
    <span {...props.attributes} className={styles[props.leaf.type]}>
      {props.children}
    </span>
  );
}

function Token(props) {
  return (
    <div
      {...props.attributes}
      className={cn(styles[props.element.type], styles.token)}
    >
      {props.children}
    </div>
  );
}

function Group(props) {
  return (
    <span
      {...props.attributes}
      className={cn(styles[props.element.variant], styles.group)}
    >
      {props.children}
    </span>
  );
}

function DefaultElement(props) {
  return (
    <div {...props.attributes} className={cn(styles[props.element.type])}>
      {props.children}
    </div>
  );
}
