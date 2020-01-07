import React, { useState, useCallback, useMemo, useEffect } from "react";
import { createEditor } from "slate";
import { withReact } from "slate-react";
import TextInput, { onAutocompleteSelect } from "./TextInput";
import Autocomplete from "./Autocomplete";

import mockOntology from "../mocks/ontologies/Dragons";

import useAutocomplete from "../hooks/useAutocomplete";
import useFocus from "../hooks/useFocus";

export default function TextArea() {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [ontology, loadOntology] = useState(null);
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);

  const onSelect = useCallback(
    index => {
      onAutocompleteSelect(editor, ontology, autocompleteOptions[index]);
    },
    [ontology, editor, autocompleteOptions]
  );

  const onCursorPositionChange = useCallback(
    (path, dom) => {
      setCursorPosition(dom && dom.getBoundingClientRect());
    },
    [setCursorPosition]
  );

  const { highlightedIndex, isOpen, textboxRef } = useAutocomplete(
    autocompleteOptions,
    onSelect
  );

  useFocus(editor, onCursorPositionChange);

  useEffect(() => {
    loadOntology(mockOntology.data[0]);
  }, []);

  return (
    <div>
      <Autocomplete
        options={autocompleteOptions}
        isOpen={isOpen}
        onSelect={onSelect}
        highlightedIndex={highlightedIndex}
        cursorPosition={cursorPosition}
      />
      <TextInput
        editor={editor}
        ontology={ontology}
        autocompleteActive={isOpen && highlightedIndex !== -1}
        textboxRef={textboxRef}
        setAutocompleteOptions={setAutocompleteOptions}
      />
    </div>
  );
}
