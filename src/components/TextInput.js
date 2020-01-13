import React, { useState, useCallback, useRef } from "react";
import { Editor, Node, Path } from "slate";
import { Slate, Editable } from "slate-react";
import cn from "classnames";

import { Token, Group, DefaultElement } from "../components";
import {
  getPossibleSchemaValues,
  getPreviousNode,
  getTokenType,
  elements,
  arraysEqual,
  isInBranch,
  getBranchPath
} from "../helpers";
import * as slateConstants from "../constants/slate";
import * as queryConstants from "../constants/query";
import useFocus from "../hooks/useFocus";

import styles from "./TextInput.module.css";
import SubmitButton from "./SubmitButton";
import {
  isNewBranchPossible,
  isEscapeGroupPossible
} from "../helpers/getPossibleActions";

const { textNode, quantifier, filter, GROUP_DEPTH, BRANCH_DEPTH } = elements;

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

function replaceCurrentNode(editor, text) {
  if (editor.selection) {
    const path = Path.parent(editor.selection.anchor.path);
    Editor.insertNodes(editor, textNode(text));
    Editor.removeNodes(editor, { at: path });
  }
}

function createBranch(editor) {
  // assumes we are operating from an existing branch
  const currentBranch = Node.get(editor, getBranchPath(editor));
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

function startNewNode(editor) {
  Editor.insertNodes(editor, textNode(), { select: true });
}

function typeCheck(text, type) {
  // TODO: assert validity of string against date/string/numeric types
  return true;
}

function isValid(editor, ontology, structure, intendedType) {
  if (intendedType === slateConstants.VALUE) {
    const operatorNode = getPreviousNode(
      editor,
      editor.selection.anchor.path,
      true
    );
    const operator = Node.text(operatorNode);
    if (queryConstants.UNARY_OPERATORS.includes(operator)) {
      return false; // values should not follow unary operators
    }
    const fieldNode = getPreviousNode(
      editor,
      editor.selection.anchor.path,
      true,
      2
    );
    const fieldType = (
      ontology.properties.find(p => p.pType === Node.text(fieldNode)) || {}
    ).type;
    const text = Editor.text(editor, editor.selection.anchor.path);
    return typeCheck(text, fieldType);
  }
  const possibilities = getPossibleSchemaValues(editor, ontology, structure);
  const text = Editor.text(editor, editor.selection.anchor.path);
  return possibilities.some(poss => text === poss);
}

function tokenise(editor, ontology, structure) {
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
    const valid = isValid(editor, ontology, structure, type);
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

function escapeGroup(editor) {
  const path = editor.selection.anchor.path;
  if (!getPreviousNode(editor, path, false)) {
    // then we are at start of empty branch
    const branchPath = getBranchPath(editor);
    Editor.removeNodes(editor, {
      at: branchPath
    });
    selectOrCreate(editor, textNode(), GROUP_DEPTH);
  } else {
    // then we are at end of branch
    selectOrCreate(editor, textNode(), GROUP_DEPTH);
  }
}

function isTerminalNode(editor, path) {
  // used to determine whether deletion is possible
  const possibleNextPath = path.map((idx, i) =>
    i === path.length - 2 ? path[path.length - 2] + 1 : idx
  );
  const possibleNextBranch =
    path.length >= 5
      ? [...path.slice(0, path.length - 5), path[path.length - 5] + 1]
      : false;
  return (
    !Node.has(editor, possibleNextPath) &&
    !(possibleNextBranch && Node.has(editor, possibleNextBranch))
  );
}

export function onAutocompleteSelect(
  editor,
  ontology,
  structure,
  text,
  shouldTokenise = true
) {
  switch (text) {
    case slateConstants.FILTER_ICON: {
      createFilterGroup(editor);
      return;
    }
    case slateConstants.NEW_BRANCH: {
      createBranch(editor);
      return;
    }
    case slateConstants.ESCAPE_GROUP: {
      escapeGroup(editor);
      return;
    }
    default: {
      replaceCurrentNode(editor, text);
      shouldTokenise &&
        tokenise(editor, ontology, structure) &&
        startNewNode(editor);
    }
  }
}

function TextInput({
  autocompleteActive,
  setAutocompleteOptions,
  editor,
  ontology,
  structure,
  onCursorPositionChange
}) {
  const [value, setValue] = useState([textNode()]);
  const [focusPath, setFocusPath] = useState(null);
  const lastAutocompleteOptions = useRef(null);

  const renderElement = useCallback(
    props => {
      switch (props.element.type) {
        case slateConstants.TOKEN:
          return <Token {...props} />;
        case slateConstants.GROUP:
          return <Group {...props} />;
        case slateConstants.BRANCH:
          return (
            <DefaultElement
              {...props}
              focussedPath={editor.selection && editor.selection.focus.path}
            />
          );
        default:
          return <DefaultElement {...props} />;
      }
    },
    [editor]
  );

  useFocus(editor, focusPath, onCursorPositionChange);

  console.log(value);

  return (
    <div className={styles.query}>
      <Slate
        editor={editor}
        value={value}
        onChange={value => {
          setValue(value);
          setFocusPath(editor.selection && editor.selection.focus.path);
          let autocompleteOptions = [];
          if (
            editor.selection &&
            !Node.parent(editor, editor.selection.focus.path).type
          ) {
            // if node has already been tokenised, don't show autocomplete possibilities
            autocompleteOptions = getPossibleSchemaValues(
              editor,
              ontology,
              structure
            ).filter(p => {
              return p.startsWith(
                Node.text(Node.get(editor, editor.selection.anchor.path))
              );
            });
          }
          if (
            !arraysEqual(lastAutocompleteOptions.current, autocompleteOptions)
          ) {
            setAutocompleteOptions(autocompleteOptions);
            lastAutocompleteOptions.current = autocompleteOptions;
          }
        }}
      >
        <Editable
          renderElement={renderElement}
          onKeyDown={event => {
            const path = editor.selection.anchor.path;
            const node = Node.parent(editor, path);
            switch (event.key) {
              case "Escape": {
                event.preventDefault();
                if (isEscapeGroupPossible(editor)) {
                  escapeGroup(editor);
                }
                return;
              }
              case "Enter": {
                event.preventDefault();
                if (isInBranch(editor)) {
                  if (autocompleteActive) {
                    // in this case, enter should select the autocomplete item, not start a new branch
                    return;
                  }
                  if (isNewBranchPossible(editor)) {
                    createBranch(editor);
                  } else if (isEscapeGroupPossible(editor)) {
                    escapeGroup(editor);
                  }
                }
                return;
              }
              case " ": {
                event.preventDefault();
                tokenise(editor, ontology, structure) && startNewNode(editor);
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
                if (!isTerminalNode(editor, editor.selection.focus.path)) {
                  // prevent deletion of all but the last nodes in a branch
                  event.preventDefault();
                  return;
                }
                if (isInBranch(editor)) {
                  // if its the last node in a group, we need to delete the whole group
                  const branchIndex = path[path.length - BRANCH_DEPTH];
                  const tokenIndex = path[path.length - (BRANCH_DEPTH - 1)];
                  if (branchIndex === 0 && tokenIndex === 0) {
                    const currentNodeText = Node.text(
                      Node.get(editor, editor.selection.anchor.path)
                    );
                    if (
                      !Node.has(editor, getBranchPath(editor, 1)) &&
                      (!currentNodeText || currentNodeText.length === 1)
                    ) {
                      event.preventDefault();
                      Editor.removeNodes(editor, {
                        at: path.slice(0, path.length - (GROUP_DEPTH - 1))
                      });
                    }
                  }
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
      <SubmitButton />
    </div>
  );
}

export default React.memo(TextInput);
