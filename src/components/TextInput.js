import React, { useState, useMemo, useCallback, useEffect } from "react";
import { createEditor, Editor, Node, Text } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import cn from "classnames";

import queryToSlate from "../helpers/queryToSlate";
import getTokenType, { getPossibleTypes } from "../helpers/getTokenType";

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

function getPreviousNodeInBranch(editor) {
  const currentPath = editor.selection.anchor.path;
  const previous = [
    ...currentPath.slice(0, currentPath.length - 2),
    currentPath[currentPath.length - 2] - 1
  ];
  if (Node.has(editor, previous)) {
    return Node.get(editor, previous);
  }
  return false;
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
            variant: slateConstants.QUANTIFIER_ENTRY,
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
  const branchGroup = Node.get(
    editor,
    currentPath.slice(0, currentPath.length - 2)
  );

  // If a sibling branch already exists, do not create one, but select it.
  if (siblingBranch(editor)) {
    Editor.select(editor, [...siblingBranch(editor), 0, 0]);
  } else {
    Editor.insertNodes(
      editor,
      {
        variant: branchGroup.variant, // new branch has same type as its sibling
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
  const previous = getPreviousNodeInBranch(editor);
  if (previous && previous.variant !== slateConstants.FILTER_GROUP) {
    // then we add a filter to the previous node
    Editor.removeNodes(editor);
    Editor.insertNodes(editor, {
      type: slateConstants.GROUP,
      variant: slateConstants.FILTER_GROUP,
      children: [
        {
          type: slateConstants.TOKEN,
          variant: slateConstants.FILTER_LABEL,
          children: [
            {
              text: "ᗊ"
            }
          ]
        },
        {
          type: slateConstants.GROUP,
          variant: slateConstants.FILTER_ENTRIES,
          children: [
            {
              type: slateConstants.BRANCH,
              variant: slateConstants.FILTER,
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
  if (editor.selection.anchor.path.length <= 2) {
    return false;
  }
  const currentNode = Node.parent(editor, editor.selection.anchor.path);
  return currentNode.variant === slateConstants.VALUE;
}

function startNewNode(editor, opts = {}) {
  if (isTerminalNode(editor) || opts.branch) {
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

function getPossibilities(editor, ontology) {
  // return the possible tokens given the state of the editor and the available schema
  const previousType = getPreviousNodeType(
    editor,
    editor.selection.anchor.path
  );
  // first get possible token types based on previous type, then expand it to the schema
  const possibleTypes = getPossibleTypes(previousType);
  return possibleTypes.reduce((acc, curr) => {
    switch (curr) {
      case slateConstants.RELATIONSHIP: {
        // take into account prior entity
        return acc.concat([]);
      }
      case slateConstants.RELATIONSHIP_IN: {
        // take into account prior entity
        return acc.concat([]);
      }
      case slateConstants.RELATIONSHIP_OUT: {
        // take into account prior entity
        return acc.concat([]);
      }
      case slateConstants.ENTITY: {
        // take into account prior relationship, if any
        return acc.concat([]);
      }
      case slateConstants.VARIABLE: {
        // take into account prior entity to see what properties it has
        return acc.concat([]);
      }
      case slateConstants.OPERATOR: {
        return acc.concat(slateConstants.OPERATORS);
      }
      case slateConstants.QUANTIFIER: {
        // take into account prior entity
        return acc.concat([slateConstants.AND, slateConstants.OR]);
      }
      case slateConstants.VALUE: {
        return acc;
      }
      default:
        return acc;
    }
  }, []);
}

function isValid(editor, ontology) {
  const possibilities = getPossibilities(editor, ontology);
  const text = Editor.text(editor, editor.selection.anchor.path);
  return possibilities.some(poss => text === poss);
}

function tokenise(editor, ontology) {
  const previous = getPreviousNodeType(editor, editor.selection.anchor.path);
  const text = Editor.text(editor, editor.selection.anchor.path);
  const type = getTokenType(previous, text);
  if (!text.trim()) {
    return false;
  }
  if (type === slateConstants.QUANTIFIER) {
    const path = editor.selection.anchor.path;
    Editor.removeNodes(editor);
    Editor.insertNodes(editor, createQuantifier(text), {
      at: path.slice(0, path.length - 1),
      select: true
    });
    return false;
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
      variant: type,
      valid: isValid(editor, ontology)
    });
    return true;
  }
}

export default function TextInput() {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [value, setValue] = useState([textNode()]);
  const [ontology, loadOntology] = useState(null);
  useEffect(() => {
    loadOntology(mockOntology.data[0]);
  }, []);

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

  const renderLeaf = useCallback(props => {
    return <Leaf {...props} />;
  }, []);

  console.log(value);

  return (
    <div className={styles.query}>
      <Slate editor={editor} value={value} onChange={value => setValue(value)}>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={event => {
            const path = editor.selection.anchor.path;
            const node = Node.parent(editor, path);
            if (
              [
                slateConstants.QUANTIFIER_LABEL,
                slateConstants.FILTER_LABEL
              ].includes(node.variant)
            ) {
              if (
                !["ArrowLeft", "ArrowRight", "Backspace"].includes(event.key)
              ) {
                event.preventDefault();
                return;
              } else if (event.key === "Backspace") {
                // then delete the node
                event.preventDefault();
                Editor.removeNodes(editor, {
                  at: path.slice(0, path.length - 2)
                });
              }
            }
            switch (event.key) {
              case "Enter": {
                event.preventDefault();
                if (path.length > 2) {
                  const branchPath = path.slice(0, path.length - 2);
                  const branchText = Node.text(Node.get(editor, branchPath));
                  if (branchText) {
                    // if the current branch is non-empty, hitting enter should start a new branch
                    if (Node.text(node)) {
                      // don't tokenise previous node if there is nothing in it
                      tokenise(editor, ontology) &&
                        startNewNode(editor, { branch: true });
                    } else {
                      startNewNode(editor, { branch: true });
                    }
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
              case " ": {
                event.preventDefault();
                tokenise(editor, ontology) && startNewNode(editor);
                break;
              }
              case slateConstants.FILTER_KEY: {
                event.preventDefault();
                createFilterGroup(editor);
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

function Leaf(props) {
  return (
    <span {...props.attributes} className={styles[props.leaf.type]}>
      {props.children}
    </span>
  );
}
