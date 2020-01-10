import React, { useState, useCallback, useMemo, useEffect } from "react";
import { createEditor } from "slate";
import { withReact } from "slate-react";
import TextInput, { onAutocompleteSelect } from "./TextInput";
import Autocomplete from "./Autocomplete";

import mockOntology from "../mocks/ontologies/Dragons";
import mockStructure from "../mocks/structures/Default";

import useAutocomplete from "../hooks/useAutocomplete";

export default function TextArea() {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [ontology, loadOntology] = useState(null);
  const [structure, loadStructure] = useState(null);
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);

  const onSelect = useCallback(
    text => {
      onAutocompleteSelect(editor, ontology, structure, text);
    },
    [ontology, structure, editor]
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

  useEffect(() => {
    loadOntology(mockOntology.data[0]);
    loadStructure(mockStructure);
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
        structure={structure}
        autocompleteActive={isOpen && highlightedIndex !== -1}
        textboxRef={textboxRef}
        setAutocompleteOptions={setAutocompleteOptions}
        onCursorPositionChange={onCursorPositionChange}
      />
    </div>
  );
}
