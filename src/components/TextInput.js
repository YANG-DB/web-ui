import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef
} from "react";
import { createEditor, Editor, Node, Path } from "slate";
import { Slate, Editable, withReact } from "slate-react";

import { Token, Group, DefaultElement } from "../components";
import queryToSlate from "../helpers/queryToSlate";
import getPossibleSchemaValues from "../helpers/getPossibleSchemaValues";
import getTokenType from "../helpers/getTokenType";
import getPreviousNode from "../helpers/getPreviousNode";
import arraysEqual from "../helpers/arraysEqual";
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

import json from "../mocks/queries/Slate";

function selectOrCreate(editor, node, n) {
  // creates or selects a subsequent node, n levels above current position
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
  const previous = getPreviousNode(
    editor,
    editor.selection.anchor.path,
    false,
    1,
    []
  );
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

function startNewNode(editor) {
  if (isTerminalNode(editor)) {
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
  const [focussed, setFocussed] = useState(null);
  const [focussedDom, setFocussedDom] = useState(null);
  const [possibilities, setPossibilities] = useState([]);

  useEffect(() => {
    loadOntology(mockOntology.data[0]);
  }, []);

  const renderElement = useCallback(
    props => {
      const texts = Node.texts(props.element);
      let result = texts.next();
      while (!result.done) {
        const el = result.value[0];
        if (el.focussed && props.attributes.ref.current) {
          setFocussedDom(props.attributes.ref.current.getBoundingClientRect());
        }
        result = texts.next();
      }
      switch (props.element.type) {
        case slateConstants.TOKEN:
          return <Token {...props} />;
        case slateConstants.GROUP:
          return <Group {...props} />;
        case slateConstants.BRANCH:
          return <DefaultElement {...props} focussedPath={focussed} />;
        default:
          return <DefaultElement {...props} />;
      }
    },
    [focussed]
  );

  const lastFocussed = useRef(null);

  useEffect(() => {
    if (!arraysEqual(lastFocussed.current, focussed)) {
      if (lastFocussed.current) {
        Node.has(editor, lastFocussed.current) &&
          Editor.setNodes(
            editor,
            { focussed: false },
            { at: lastFocussed.current }
          );
      }
      const descendants = Node.descendants(editor);
      let result = descendants.next();
      while (!result.done) {
        const [node, path] = result.value;
        if (
          [slateConstants.QUANTIFIER_ENTRY, slateConstants.FILTER].includes(
            node.variant
          )
        ) {
          // branches should have path stored on them in order to determine whether it should be expanded/collapsed
          Editor.setNodes(
            editor,
            {
              path
            },
            { at: path }
          );
        }
        result = descendants.next();
      }
      if (focussed) {
        Editor.setNodes(editor, { focussed: true }, { at: focussed });
      }
    }
    lastFocussed.current = focussed;
  }, [value, focussed, editor]);

  return (
    <div>
      {focussedDom && (
        <div
          tabIndex={-1}
          className={styles.autocomplete}
          style={{ top: `${focussedDom.top}px`, left: `${focussedDom.left}px` }}
        >
          {possibilities.map(p => (
            <div className={styles.suggestion} tabIndex={-1}>
              {p}
            </div>
          ))}
        </div>
      )}
      <div className={styles.query}>
        <Slate
          editor={editor}
          value={value}
          onChange={value => {
            setValue(value);
            if (editor.selection) {
              setFocussed(editor.selection.focus.path);
              setPossibilities(
                getPossibleSchemaValues(editor, ontology).filter(p => {
                  return p.includes(
                    Node.text(Node.get(editor, editor.selection.anchor.path))
                  );
                })
              );
            }
          }}
        >
          <Editable
            renderElement={renderElement}
            onKeyDown={event => {
              const path = editor.selection.anchor.path;
              const node = Node.parent(editor, path);
              switch (event.key) {
                case "Enter": {
                  event.preventDefault();
                  if (
                    path.length >= GROUP_DEPTH &&
                    ![
                      slateConstants.QUANTIFIER_LABEL,
                      slateConstants.FILTER_LABEL
                    ].includes(node.variant)
                  ) {
                    const branchPath = path.slice(0, path.length - 2);
                    const branchText = Node.text(Node.get(editor, branchPath));
                    if (branchText) {
                      // if the current branch is non-empty, hitting enter should start a new branch
                      if (Node.text(node)) {
                        // don't tokenise previous node if there is nothing in it
                        tokenise(editor, ontology) && createBranch(editor);
                      } else {
                        createBranch(editor);
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
                  break;
                }
                case slateConstants.FILTER_KEY: {
                  event.preventDefault();
                  createFilterGroup(editor);
                  break;
                }
                case "ArrowLeft":
                case "ArrowRight":
                  break;
                case "Backspace": {
                  if (
                    [
                      slateConstants.QUANTIFIER_LABEL,
                      slateConstants.FILTER_LABEL
                    ].includes(node.variant)
                  ) {
                    event.preventDefault();
                    Editor.removeNodes(editor, {
                      at: path.slice(0, path.length - 2)
                    });
                  }
                  break;
                }
                default: {
                  if (
                    [
                      slateConstants.QUANTIFIER_LABEL,
                      slateConstants.FILTER_LABEL
                    ].includes(node.variant)
                  ) {
                    event.preventDefault();
                  }
                }
              }
            }}
          />
        </Slate>
        <button type="submit">Go</button>
      </div>
    </div>
  );
}
