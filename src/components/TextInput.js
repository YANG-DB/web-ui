import React, { useState, useMemo, useCallback } from "react";
import { createEditor, Editor, Node } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import cn from "classnames";

import queryToSlate from "../helpers/queryToSlate";
import getTokenType from "../helpers/getTokenType";

import * as slateConstants from "../constants/slate";

import mockQuery from "../mocks/queries/Dragons";
import mockOntology from "../mocks/ontologies/Dragons";

import styles from "./TextInput.module.css";

const json = queryToSlate(mockQuery.elements, mockOntology.data[0]);

function getPreviousPath(currentPath) {
  let i = currentPath.length - 1;
  while (i >= 0) {
    if (currentPath[i]) {
      return [...currentPath.slice(0, i), currentPath[i] - 1];
    }
    i--;
  }
  return [];
}

function getPreviousNodeType(editor) {
  const path = getPreviousPath(editor.selection.anchor.path);
  if (!path.length) {
    return undefined;
  }
  const node = Node.get(editor, path);
  return node.variant || node.type;
}

function textNode() {
  return {
    children: [
      {
        text: ""
      }
    ]
  };
}

function createQuantifier(type) {
  return {
    type: slateConstants.GROUP,
    variant: slateConstants.QUANTIFIER,
    children: [
      {
        type: slateConstants.GROUP,
        variant: slateConstants.QUANTIFIER_LABEL,
        children: [
          {
            text: type
          }
        ]
      },
      {
        type: slateConstants.GROUP,
        children: [
          {
            type: slateConstants.BRANCH,
            children: [textNode()]
          }
        ]
      }
    ]
  };
}

function traverse(editor, n) {
  const currentPath = editor.selection.anchor.path;
  const targetPath = currentPath.slice(0, currentPath.length - n);
  const result = Editor.node(editor, targetPath);
  return {
    node: result[0],
    path: result[1]
  };
}

function createBranch(editor) {
  const currentPath = editor.selection.anchor.path;
  const branchParent = currentPath.slice(0, currentPath.length - 2);
  Editor.insertNodes(
    editor,
    {
      type: slateConstants.BRANCH,
      children: [textNode()]
    },
    {
      at: branchParent
    }
  );
  Editor.select(editor, [...branchParent, 0]);
}

function startNewNode(editor) {
  Editor.insertNodes(editor, textNode());
}

function tokenise(editor) {
  const previous = getPreviousNodeType(editor);
  const text = Editor.text(editor, editor.selection.anchor.path);
  const type = getTokenType(previous, text);
  if (!text.trim()) {
    Editor.removeNodes(editor);
    return;
  }
  if (type === slateConstants.QUANTIFIER) {
    Editor.removeNodes(editor);
    Editor.insertNodes(editor, createQuantifier(text));
  } else {
    Editor.setNodes(editor, {
      type: type
    });
    startNewNode(editor);
  }
}

export default function TextInput() {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [value, setValue] = useState([textNode()]);
  const renderElement = useCallback(props => {
    switch (props.element.type) {
      case slateConstants.ENTITY:
      case slateConstants.RELATIONSHIP:
      case slateConstants.RELATIONSHIP_OUT:
      case slateConstants.RELATIONSHIP_IN:
      case slateConstants.UNKNOWN:
        return <Token {...props} />;
      case slateConstants.GROUP:
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
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={event => {
            switch (event.key) {
              case "Enter": {
                event.preventDefault();
                if (editor.selection.anchor.path.length > 2) {
                  tokenise(editor);
                  createBranch(editor);
                }
                return;
              }
              case " ": {
                event.preventDefault();
                tokenise(editor);
                break;
              }
              default:
                return;
            }
          }}
        />
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
    <div
      {...props.attributes}
      className={cn(styles[props.element.type], styles.default)}
    >
      {props.children}
    </div>
  );
}
