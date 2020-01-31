import React, { useState, useCallback, useMemo, useEffect } from "react";
import { createEditor } from "slate";
import { withReact } from "slate-react";
import TextInput, { onAutocompleteSelect } from "./TextInput";
import Autocomplete from "./Autocomplete";
import apiService from "../services/api";

import useAutocomplete from "../hooks/useAutocomplete";

import globalStyles from "../App.module.css";

export default function TextArea({ onSubmit }) {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [ontology, loadOntology] = useState(null);
  const [structure, loadStructure] = useState(null);
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);

  const submit = useCallback(query => {
    setAutocompleteOptions([]);
    onSubmit(query);
  }, []);

  const onSelect = useCallback(
    (text, shouldTokenise) => {
      onAutocompleteSelect(editor, ontology, structure, text, shouldTokenise);
    },
    [ontology, structure, editor]
  );

  const onCursorPositionChange = useCallback(
    (path, dom) => {
      setCursorPosition(dom && dom.getBoundingClientRect());
    },
    [setCursorPosition]
  );

  const {
    highlightedIndex,
    isOpen,
    textboxRef,
    closeAutocomplete
  } = useAutocomplete(autocompleteOptions, onSelect);

  useEffect(() => {
    apiService.getOntology().then(result => {
      loadOntology(result);
    });
    apiService.getStructure().then(result => {
      loadStructure(result);
    });
  }, []);

  return (
    <div className={globalStyles.section}>
      <Autocomplete
        options={autocompleteOptions}
        isOpen={isOpen}
        onSelect={onSelect}
        highlightedIndex={highlightedIndex}
        cursorPosition={cursorPosition}
      />
      <TextInput
        onSubmit={submit}
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
