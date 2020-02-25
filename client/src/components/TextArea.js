import React, { useState, useCallback, useMemo, useEffect } from "react";
import cn from "classnames";
import { createEditor } from "slate";
import { withReact } from "slate-react";
import TextInput, { onAutocompleteSelect } from "./TextInput";
import Autocomplete from "./Autocomplete";
import apiService from "../services/api";

import useAutocomplete from "../hooks/useAutocomplete";

import styles from "./TextArea.module.css";
import globalStyles from "../App.module.css";

const types = {
  ONE: "Question One",
  TWO: "Question Two",
  THREE: "Question Three"
};

export default function TextArea({ onSubmit, lastQuery, cacheQuery }) {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [ontology, loadOntology] = useState(null);
  const [structure, loadStructure] = useState(null);
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [resultType, setResultType] = useState(types.ONE);

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
      <div className={styles.headers}>
        {Object.keys(types).map(t => {
          return (
            <h3
              className={cn(resultType === types[t] && styles.selected)}
              key={t}
            >
              <button
                data-hover={types[t]}
                onClick={() => setResultType(types[t])}
              >
                {types[t]}
              </button>
            </h3>
          );
        })}
      </div>
      <Autocomplete
        options={autocompleteOptions}
        isOpen={isOpen}
        onSelect={onSelect}
        highlightedIndex={highlightedIndex}
        cursorPosition={cursorPosition}
      />
      <TextInput
        cacheQuery={cacheQuery}
        lastQuery={lastQuery}
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
