import { useReducer, useCallback, useRef, useEffect } from "react";

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_POSSIBILITIES": {
      return {
        ...state,
        possibilities: action.possibilities,
        isOpen: true,
        highlightedIndex: -1
      };
    }
    case "INCREMENT_INDEX":
      return {
        ...state,
        highlightedIndex:
          state.highlightedIndex < state.possibilities.length - 1 &&
          state.highlightedIndex >= 0
            ? state.highlightedIndex + 1
            : -1
      };
    case "DECREMENT_INDEX": {
      let newHighlightedIndex;
      if (state.highlightedIndex > 0) {
        newHighlightedIndex = state.highlightedIndex - 1;
      } else if (state.highlightedIndex === -1) {
        newHighlightedIndex = state.possibilities.length - 1;
      } else {
        newHighlightedIndex = 0;
      }
      return {
        ...state,
        highlightedIndex: newHighlightedIndex
      };
    }
    case "SET_INDEX": {
      if (action.index >= state.possibilities.length || action.index < -1) {
        return state;
      }
      return {
        ...state,
        highlightedIndex: action.index
      };
    }
    case "OPEN":
      return {
        ...state,
        isOpen: true
      };
    case "CLOSE":
      return {
        ...state,
        isOpen: false,
        highlightedIndex: -1
      };
    default:
      return state;
  }
}

const initialState = {
  highlightedIndex: -1,
  isOpen: false,
  possibilities: []
};

export default function useAutocomplete(possibilities, onSelect) {
  const textboxRef = useRef(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleKeyDown = useCallback(
    function(e) {
      if (e.key === "Tab" || e.key === "Enter") {
        if (state.isOpen) {
          if (state.highlightedIndex >= 0) {
            e.preventDefault();
            onSelect(state.highlightedIndex);
          } else {
            dispatch({ type: "CLOSE" });
          }
        }
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!state.isOpen) {
          return;
        }
        if (
          state.highlightedIndex === state.possibilities.length - 1 ||
          state.highlightedIndex === -1
        ) {
          dispatch({ type: "CLOSE" });
          return;
        }
        dispatch({ type: "INCREMENT_INDEX" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!state.isOpen) {
          dispatch({ type: "OPEN" });
        } else {
          dispatch({ type: "DECREMENT_INDEX" });
        }
      }
    },
    [state, onSelect]
  );
  function handleTextBlur(e) {
    dispatch({ type: "CLOSE" });
  }
  function handleTextFocus() {
    dispatch({ type: "OPEN" });
  }
  useEffect(() => {
    dispatch({ type: "LOAD_POSSIBILITIES", possibilities });
  }, [possibilities]);
  useEffect(() => {
    const textareaRef = textboxRef.current.firstElementChild;
    textareaRef.addEventListener("blur", handleTextBlur);
    textareaRef.addEventListener("focus", handleTextFocus);
    return () => {
      textareaRef.removeEventListener("blur", handleTextBlur);
      textareaRef.removeEventListener("focus", handleTextFocus);
    };
  }, []);
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
  return { ...state, textboxRef };
}
