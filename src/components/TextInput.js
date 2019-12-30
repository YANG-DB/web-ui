import React, { useState, useMemo, useCallback, useEffect } from "react";
import { createEditor, Editor, Node } from "slate";
import { Slate, Editable, withReact } from "slate-react";

import { Token, Group, DefaultElement } from "../components";
import queryToSlate from "../helpers/queryToSlate";
import getPossibleSchemaValues from "../helpers/getPossibleSchemaValues";
import getTokenType from "../helpers/getTokenType";
import getPreviousNode from "../helpers/getPreviousNode";
import {
  textNode,
  quantifier,
  filter,
  GROUP_DEPTH,
  BRANCH_DEPTH
} from "../helpers/slate";

import * as slateConstants from "../constants/slate";

import mockQuery from "../mocks/queries/Dragons";
import mockOntology from "../mocks/ontologies/Dragons";

import styles from "./TextInput.module.css";

const json = queryToSlate(mockQuery.elements, mockOntology.data[0]);

function selectOrCreate(editor, node, n) {
  // creates or selects the subsequent node, n levels above current position
  const currentPath = editor.selection.anchor.path;
  let path = [
    ...currentPath.slice(0, currentPath.length - n),
    currentPath[currentPath.length - n] + 1
  ];
  if (Node.has(editor, path)) {
    while (Node.has(editor, path)) {
      Editor.select(editor, path);
      path = [...path, 0];
    }
  } else {
    Editor.insertNodes(editor, node, { at: path, select: true });
  }
}

function createBranch(editor) {
  // assumes we are operating from an existing branch
  const currentPath = editor.selection.anchor.path;
  const currentBranch = Node.get(
    editor,
    currentPath.slice(0, currentPath.length - (BRANCH_DEPTH - 1))
  );
  selectOrCreate(
    editor,
    {
      variant: currentBranch.variant, // new branch has same type as its sibling
      type: slateConstants.BRANCH,
      children: [textNode()]
    },
    BRANCH_DEPTH
  );
}

function createFilterGroup(editor) {
  const previous = getPreviousNode(editor, editor.selection.anchor.path, false);
  if (previous && previous.variant !== slateConstants.FILTER_GROUP) {
    // then we add a filter to the previous node
    Editor.removeNodes(editor);
    Editor.insertNodes(editor, filter());
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

function typeCheck(text, type) {
  // TODO: assert validity of string against date/string/numeric types
  return true;
}

function isValid(editor, ontology, intendedType) {
  if (intendedType === slateConstants.VALUE) {
    const fieldNode = getPreviousNode(
      editor,
      editor.selection.anchor.path,
      true,
      2
    );
    const variableType = (
      ontology.properties.find(p => p.pType === Node.text(fieldNode)) || {}
    ).type;
    const text = Editor.text(editor, editor.selection.anchor.path);
    return typeCheck(text, variableType);
  }
  const possibilities = getPossibleSchemaValues(editor, ontology);
  const text = Editor.text(editor, editor.selection.anchor.path);
  return possibilities.some(poss => text === poss);
}

function tokenise(editor, ontology) {
  const previous = getPreviousNode(editor, editor.selection.anchor.path)
    .variant;
  const text = Editor.text(editor, editor.selection.anchor.path);
  const type = getTokenType(previous, text);
  if (!text.trim()) {
    return false;
  }
  if (type === slateConstants.QUANTIFIER) {
    const path = editor.selection.anchor.path;
    Editor.removeNodes(editor);
    Editor.insertNodes(editor, quantifier(text), {
      at: path.slice(0, path.length - 1),
      select: true
    });
    return false;
  } else {
    const valid = isValid(editor, ontology, type);
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
      valid
    });
    return true;
  }
}

export default function TextInput() {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [value, setValue] = useState([textNode()]);
  const [ontology, loadOntology] = useState(null);
  const [possibilities, setPossibilities] = useState([]);
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

  console.log(value);

  return (
    <div>
      <div>
        {possibilities.map(p => (
          <div>{p}</div>
        ))}
      </div>
      <div className={styles.query}>
        <Slate
          editor={editor}
          value={value}
          onChange={value => setValue(value)}
        >
          <Editable
            renderElement={renderElement}
            onKeyDown={event => {
              const path = editor.selection.anchor.path;
              const node = Node.parent(editor, path);
              if (
                !["ArrowLeft", "ArrowRight", "Backspace"].includes(event.key)
              ) {
                setPossibilities(getPossibleSchemaValues(editor, ontology));
              }
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
                  if (path.length >= GROUP_DEPTH) {
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
                      selectOrCreate(editor, textNode(), GROUP_DEPTH);
                    }
                  }
                  return;
                }
                case " ": {
                  event.preventDefault();
                  tokenise(editor, ontology) && startNewNode(editor);
                  setPossibilities(getPossibleSchemaValues(editor, ontology));
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
    </div>
  );
}
