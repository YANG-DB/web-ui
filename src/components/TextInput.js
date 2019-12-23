import React, { useState, useMemo, useCallback } from "react";
import { createEditor, Editor, Node, Text } from "slate";
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

function getPreviousNodeInBranch() {
  // TODO: should return null if first node of branch
  return true;
}

function getPreviousNodeType(editor, currentPath) {
  const path = getPreviousPath(currentPath);
  if (!path.length) {
    return undefined;
  }
  const node = Node.get(editor, path);
  if (node.variant === slateConstants.FILTER_GROUP) {
    // if it is a filter, get the one before it
    return getPreviousNodeType(editor, path);
  }

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
        type: slateConstants.TOKEN,
        variant: slateConstants.QUANTIFIER_LABEL,
        children: [
          {
            text: type
          }
        ]
      },
      {
        type: slateConstants.GROUP,
        variant: slateConstants.QUANTIFIER_ENTRIES,
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

function siblingBranch(editor) {
  const currentPath = editor.selection.anchor.path;
  const currentBranchIndex = currentPath[currentPath.length - 3];
  if (currentBranchIndex) {
    const siblingBranchPath = [
      ...currentPath.slice(0, currentPath.length - 3),
      currentBranchIndex - 1
    ];
    return siblingBranchPath;
  } else {
    return false;
  }
}

function createBranch(editor) {
  const currentPath = editor.selection.anchor.path;
  const branchParent = currentPath.slice(0, currentPath.length - 2);

  // If a sibling branch already exists, do not create one, but select it.
  if (siblingBranch(editor)) {
    Editor.select(editor, [...siblingBranch(editor), 0, 0]);
  } else {
    Editor.insertNodes(
      editor,
      {
        // TODO: variant
        type: slateConstants.BRANCH,
        children: [textNode()]
      },
      {
        at: branchParent,
        select: true
      }
    );
  }
}

function createFilterGroup(editor) {
  if (getPreviousNodeInBranch(editor)) {
    // then we add a filter to the previous node
    Editor.removeNodes(editor);
    Editor.insertNodes(editor, {
      type: "group",
      variant: "filter_group",
      children: [
        {
          type: "token",
          variant: "filter_label",
          children: [
            {
              text: "..."
            }
          ]
        },
        {
          type: "group",
          variant: "filter_entries",
          children: [
            {
              type: "branch",
              variant: "filter",
              children: [
                {
                  children: [
                    {
                      text: ""
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });
  }
}

function isTerminalNode(editor) {
  const currentNode = Node.parent(editor, editor.selection.anchor.path);
  return currentNode.variant === slateConstants.VALUE;
}

function startNewNode(editor) {
  if (isTerminalNode(editor)) {
    createBranch(editor);
    return;
  }
  Editor.insertNodes(editor, textNode(), { select: true });
}

function pop(editor) {
  // 'pop' out of a nested branch and into the next node on the level above it
  const path = editor.selection.anchor.path;
  if (path.length >= 3) {
    const at = [...path.slice(0, path.length - 3), path[path.length - 3] + 1];
    if (Node.has(editor, at)) {
      Editor.select(editor, at);
    } else {
      Editor.insertNodes(editor, textNode(), {
        at,
        select: true
      });
    }
  }
}

function tokenise(editor) {
  const previous = getPreviousNodeType(editor, editor.selection.anchor.path);
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
    if (
      [
        slateConstants.RELATIONSHIP_IN,
        slateConstants.RELATIONSHIP_OUT
      ].includes(type)
    ) {
      // remove > and < specifier for relationships
      Editor.insertText(editor, text.replace(/(>|<)$/i, ""), {
        at: editor.selection.anchor.path
      });
    }
    Editor.setNodes(editor, {
      type: slateConstants.TOKEN,
      variant: type
    });
    startNewNode(editor);
  }
}

export default function TextInput() {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [value, setValue] = useState([textNode()]);
  const renderElement = useCallback(props => {
    switch (props.element.type) {
      case slateConstants.TOKEN:
        return <Token {...props} />;
      case slateConstants.GROUP:
        return <Group {...props} />;
      case slateConstants.BRANCH:
        return <DefaultElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  console.log(value);

  return (
    <div className={styles.query}>
      <Slate editor={editor} value={value} onChange={value => setValue(value)}>
        <Editable
          renderElement={renderElement}
          onKeyDown={event => {
            switch (event.key) {
              case "Enter": {
                event.preventDefault();
                const path = editor.selection.anchor.path;
                if (path.length > 2) {
                  const branchPath = path.slice(0, path.length - 2);
                  const text = Node.text(Node.get(editor, branchPath));

                  if (text) {
                    tokenise(editor);
                  } else {
                    // if no text in branch, remove it, and start from outside the branch parent
                    Editor.removeNodes(editor, {
                      at: branchPath
                    });
                    pop(editor);
                  }
                }
                return;
              }
              case ".": {
                event.preventDefault();
                createFilterGroup(editor);
                break;
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

function Token(props) {
  return (
    <div
      {...props.attributes}
      className={cn(styles[props.element.variant], styles.token)}
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
