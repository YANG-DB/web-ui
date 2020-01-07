import React, { useState, useCallback } from "react";
import { Editor, Node, Path } from "slate";
import { Slate, Editable } from "slate-react";
import cn from "classnames";

import { Token, Group, DefaultElement } from "../components";
import {
  getPossibleSchemaValues,
  getPreviousNode,
  getTokenType,
  elements
} from "../helpers";
import * as slateConstants from "../constants/slate";

import styles from "./TextInput.module.css";
import SubmitButton from "./SubmitButton";

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

function isInBranch(editor) {
  const path = editor.selection.anchor.path;
  const node = Node.parent(editor, path);
  return (
    path.length >= GROUP_DEPTH &&
    ![slateConstants.QUANTIFIER_LABEL, slateConstants.FILTER_LABEL].includes(
      node.variant
    )
  );
}

export function onAutocompleteSelect(editor, ontology, text) {
  switch (text) {
    case slateConstants.FILTER_ICON: {
      createFilterGroup(editor);
      return;
    }
    case slateConstants.NEW_BRANCH: {
      Editor.removeNodes(editor);
      createBranch(editor);
      return;
    }
    default: {
      replaceCurrentNode(editor, text);
      tokenise(editor, ontology) && startNewNode(editor);
    }
  }
}

function TextInput({
  autocompleteActive,
  textboxRef,
  setAutocompleteOptions,
  editor,
  ontology
}) {
  const [value, setValue] = useState([textNode()]);

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

  return (
    <div className={styles.query} ref={textboxRef}>
      <Slate
        editor={editor}
        value={value}
        onChange={value => {
          setValue(value);
          if (editor.selection) {
            const path = editor.selection.anchor.path;
            if (Node.parent(editor, editor.selection.focus.path).type) {
              // if node has already been tokenised, don't show autocomplete possibilities
              setAutocompleteOptions([]);
              return;
            }
            setAutocompleteOptions(
              getPossibleSchemaValues(editor, ontology) // an action can be suggested, but cannot be tokenised
                .filter(p => {
                  return p.startsWith(Node.text(Node.get(editor, path)));
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
                if (isInBranch(editor)) {
                  const branchPath = path.slice(0, path.length - 2);
                  const branchText = Node.text(Node.get(editor, branchPath));
                  if (autocompleteActive) {
                    // in this case, enter should select the autocomplete item, not start a new branch
                    return;
                  }
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
      <SubmitButton />
    </div>
  );
}

export default React.memo(TextInput);
