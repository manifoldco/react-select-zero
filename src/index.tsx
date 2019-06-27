// TODO: when searching, up/down doesn’t work

import React, { useState, useEffect, ReactNode, useRef, useReducer, Reducer } from 'react';

type Selection = string[];

interface SelectProps {
  allowCreate?: boolean;
  className?: string;
  defaultValue?: Selection;
  max?: number;
  multi?: boolean;
  name: string;
  noSearch?: boolean;
  onChange?: (selected: Selection, created: Selection) => void;
  options: Selection;
  placeholder?: ReactNode;
}

interface SelectState {
  activeDescendant: string;
  created: Selection;
  isOpen: boolean;
  search: string;
  selected: Selection;
  visibleOptions: Selection;
}

export function elId(name: string, component: string) {
  return `rsz-${name}-${component}`;
}

export function optionId(name: string, option: number) {
  return elId(name, `option-${option}`);
}

enum Action {
  APPEND = 'APPEND',
  ADD_MULTI_CLICK = 'ADD_MULTI_CLICK',
  ADD_MULTI_KEYBOARD = 'ADD_MULTI_KEYBOARD',
  ADD_SINGLE_CLICK = 'ADD_SINGLE_CLICK',
  ADD_SINGLE_KEYBOARD = 'ADD_SINGLE_KEYBOARD',
  DROPDOWN_CLOSE = 'DROPDOWN_CLOSE',
  DROPDOWN_OPEN = 'DROPDOWN_OPEN',
  DROPDOWN_TOGGLE = 'DROPDOWN_TOGGLE',
  INIT = 'INIT',
  MOVE_NEXT = 'MOVE_NEXT',
  MOVE_PREV = 'MOVE_PREV',
  MOVE_TO_END = 'MOVE_TO_END',
  MOVE_TO_START = 'MOVE_TO_START',
  SEARCH = 'SEARCH',
}

enum KEY {
  DOWN = 'ArrowDown',
  END = 'End',
  ENTER = 'Enter',
  ESC = 'Escape',
  HOME = 'Home',
  UP = 'ArrowUp',
}

type ActionHandler =
  | { type: Action.ADD_MULTI_CLICK; name: string; max: number; options: Selection; option: string }
  | { type: Action.ADD_MULTI_KEYBOARD; max: number; options: Selection }
  | { type: Action.ADD_SINGLE_CLICK; name: string; option: string; options: Selection }
  | { type: Action.ADD_SINGLE_KEYBOARD; options: Selection }
  | { type: Action.DROPDOWN_CLOSE; name: string; options: Selection }
  | { type: Action.DROPDOWN_OPEN; name: string; options: Selection }
  | { type: Action.DROPDOWN_TOGGLE; name: string; options: Selection }
  | { type: Action.INIT; defaults?: Selection; options: Selection }
  | {
      type: Action.MOVE_NEXT;
      allowCreate: boolean;
      name: string;
      options: Selection;
      wrapper: HTMLUListElement | null;
    }
  | {
      type: Action.MOVE_PREV;
      allowCreate: boolean;
      name: string;
      options: Selection;
      wrapper: HTMLUListElement | null;
    }
  | {
      type: Action.MOVE_TO_END;
      allowCreate: boolean;
      name: string;
      options: Selection;
      wrapper: HTMLUListElement | null;
    }
  | {
      type: Action.MOVE_TO_START;
      allowCreate: boolean;
      name: string;
      options: Selection;
      wrapper: HTMLUListElement | null;
    }
  | { type: Action.SEARCH; allowCreate: boolean; name: string; options: Selection; search: string };

const initialState: SelectState = {
  activeDescendant: '0',
  created: [],
  isOpen: false,
  search: '',
  selected: [],
  visibleOptions: [],
};

function reducer(state: SelectState, action: ActionHandler): SelectState {
  switch (action.type) {
    // Add or remove an option from mouse click
    case Action.ADD_MULTI_CLICK: {
      const isNew = action.options.indexOf(action.option) === -1;
      const total = state.selected.length + state.created.length;

      // if new
      if (isNew) {
        const created = [...state.created];
        const index = state.created.indexOf(action.option);
        if (index !== -1) {
          created.splice(index, 1); // if existing, remove
        } else if (total < action.max) {
          // if new, add unless we’re at max
          created.push(action.option);
        }
        return { ...state, created };
      }

      // if existing
      const selected = [...state.selected];
      const index = state.selected.indexOf(action.option);
      if (index !== -1) {
        selected.splice(index, 1); // if existing, remove
      } else if (total < action.max) {
        selected.push(action.option); // if new, add unless we’re at max
      }
      return {
        ...state,
        selected: action.options.filter(order => selected.indexOf(order) !== -1), // sort by option order
      };
    }
    // Add or remove an option from keyboard
    case Action.ADD_MULTI_KEYBOARD: {
      const match = state.activeDescendant.match(/\d*$/);
      if (!match) {
        return state;
      }
      const total = state.selected.length + state.created.length;
      const number = parseInt(match[0], 10);

      // if new
      if (number > action.options.length - 1) {
        const created = [...state.created];
        const option = state.search;
        const index = state.created.indexOf(option);
        if (index === -1) {
          created.splice(index, 1); // if existing, remove
        } else if (total < action.max) {
          // if new, add unless we’re at max
          created.push(option);
        }
        return { ...state, created };
      }

      // if existing
      const option = action.options[number];
      const selected = [...state.selected];
      const index = state.selected.indexOf(option);
      if (index !== -1) {
        selected.splice(index, 1); // if existing, remove
      } else if (total < action.max) {
        selected.push(option); // if new, add unless we’re at max
      }
      return {
        ...state,
        selected: action.options.filter(order => selected.indexOf(order) !== -1), // sort by option order
      };
    }
    // Set the option from mouse click
    case Action.ADD_SINGLE_CLICK: {
      const newState = { ...state, isOpen: false, search: '', visibleOptions: action.options };
      if (action.options.indexOf(action.option) === -1) {
        return { ...newState, created: [action.option] }; // if new
      }
      return { ...newState, selected: [action.option] }; // if existing
    }
    // Set the option from keyboard
    case Action.ADD_SINGLE_KEYBOARD: {
      const match = state.activeDescendant.match(/\d*$/);
      if (!match) {
        return state;
      }
      const number = parseInt(match[0], 10);
      const newState = { ...state, isOpen: false, visibleOptions: action.options };
      if (number > action.options.length - 1) {
        return { ...newState, created: [state.search] }; // if new
      }
      return { ...newState, selected: [action.options[number]] }; // if existing
    }
    // Close dropdown
    case Action.DROPDOWN_CLOSE: {
      if (state.isOpen === false) {
        return state; // prevent other state from reseting
      }
      const activeDescendant = optionId(action.name, 0);
      return {
        ...state,
        activeDescendant,
        isOpen: false,
        search: '',
        visibleOptions: action.options,
      };
    }
    // Open dropdown
    case Action.DROPDOWN_OPEN: {
      if (state.isOpen === true) {
        return state; // prevent other state from reseting
      }
      const activeDescendant = optionId(action.name, 0);
      return {
        ...state,
        activeDescendant,
        isOpen: true,
        search: '',
        visibleOptions: action.options,
      };
    }
    // Invert dropdown state
    case Action.DROPDOWN_TOGGLE: {
      const nextOpen = !state.isOpen;
      const activeDescendant = optionId(action.name, 0);
      return {
        ...state,
        activeDescendant,
        isOpen: nextOpen,
        search: '',
        visibleOptions: action.options,
      };
    }
    // Move to start / end
    case Action.MOVE_TO_END:
    case Action.MOVE_TO_START: {
      const index =
        action.type === Action.MOVE_TO_START
          ? action.options.indexOf(state.visibleOptions[0])
          : action.options.indexOf(state.visibleOptions[state.visibleOptions.length - 1]);
      const activeDescendant =
        action.allowCreate === true
          ? optionId(action.name, action.options.length)
          : optionId(action.name, index);
      if (action.wrapper) {
        const el = action.wrapper.querySelector(`#${activeDescendant}`);
        if (el) {
          el.scrollIntoView(false);
        }
      }
      return { ...state, activeDescendant };
    }
    // Initialize dropdown & set default state (while still letting props be mutable)
    case Action.INIT: {
      // Users may specify created options within defaults, if they’re missing from the options array
      const defaults = action.defaults || [];
      const selected = action.options.filter(option => defaults.indexOf(option) !== -1);
      const created = defaults.filter(option => action.options.indexOf(option) === -1);
      return { ...state, created, selected, visibleOptions: action.options };
    }
    // Move up or down with keyboard
    case Action.MOVE_NEXT:
    case Action.MOVE_PREV: {
      const match = state.activeDescendant.match(/\d*$/); // get number at end of ID
      if (!match) {
        return state;
      }
      const index = parseInt(match[0], 10);
      const selected = action.options[index];
      const visibleIndex = state.visibleOptions.indexOf(selected);
      const options = [...action.options];
      if (action.allowCreate === true) {
        options.push(state.search); // if allowCreate, allow keyboard to highlight newly-created item
      }
      let next;
      if (action.type === Action.MOVE_PREV) {
        const prevVisible = options.indexOf(state.visibleOptions[visibleIndex - 1]);
        const lastVisible = options.indexOf(state.visibleOptions[state.visibleOptions.length - 1]);
        next = prevVisible !== -1 ? prevVisible : lastVisible;
      } else {
        const nextVisible = options.indexOf(state.visibleOptions[visibleIndex + 1]);
        const firstVisible = options.indexOf(state.visibleOptions[0]);
        next = nextVisible !== -1 ? nextVisible : firstVisible;
      }
      const activeDescendant = optionId(action.name, next);
      if (action.wrapper) {
        const el = action.wrapper.querySelector(`#${activeDescendant}`);
        if (el) {
          el.scrollIntoView(false);
        }
      }
      return { ...state, activeDescendant };
    }
    // Filter results
    case Action.SEARCH: {
      const visibleOptions = action.options.filter(option =>
        new RegExp(action.search, 'i').test(option)
      );
      const options = [...action.options];
      if (action.allowCreate === true) {
        options.push(action.search);
      }
      return {
        ...state,
        activeDescendant: optionId(action.name, options.indexOf(visibleOptions[0] || state.search)),
        search: action.search,
        visibleOptions,
      };
    }
    default:
      return state;
  }
}

const SelectZero: React.FunctionComponent<SelectProps> = ({
  allowCreate = false,
  className = 'rsz',
  defaultValue = [],
  max = Infinity,
  multi = false,
  noSearch = false,
  onChange,
  options,
  placeholder = 'Select',
  name,
  ...rest
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchListener, setSearchListener] = useState();
  const [triggerListener, setTriggerListener] = useState();
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [state, dispatch] = useReducer<Reducer<SelectState, ActionHandler>>(reducer, initialState);

  function onClick(option: string) {
    if (multi === true) {
      dispatch({ max, name, option, options, type: Action.ADD_MULTI_CLICK });
    } else {
      dispatch({ name, option, options, type: Action.ADD_SINGLE_CLICK });
    }
  }

  // effect 1: user callback
  useEffect(() => {
    if (typeof onChange === 'function') {
      onChange(state.selected, state.created);
    }
  }, [state.selected, state.created]); // eslint-disable-line react-hooks/exhaustive-deps

  // effect 2: initialization
  useEffect(() => {
    if (!isInitialized) {
      dispatch({ defaults: defaultValue, options, type: Action.INIT });
      setIsInitialized(true);
    }
  }, [defaultValue, options, isInitialized]);

  // effect 3: maintain focus
  useEffect(() => {
    if (state.isOpen) {
      if (searchRef.current) {
        searchRef.current.focus();
      } else if (triggerRef.current) {
        triggerRef.current.focus();
      }
    } else if (!state.isOpen && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [state.activeDescendant, state.isOpen]);

  // effect 4: navigation listener
  useEffect(() => {
    function onKeydown(evt: KeyboardEvent): void {
      // eslint-disable-next-line default-case
      switch (evt.key) {
        case KEY.ENTER: {
          evt.preventDefault();
          dispatch({
            max,
            options,
            type: multi === true ? Action.ADD_MULTI_KEYBOARD : Action.ADD_SINGLE_KEYBOARD,
          });
          break;
        }
        // move down
        case KEY.DOWN: {
          evt.preventDefault();
          dispatch({
            allowCreate,
            name,
            options,
            type: Action.MOVE_NEXT,
            wrapper: listRef.current,
          });
          break;
        }
        // move to end
        case KEY.END:
          dispatch({
            allowCreate,
            name,
            options,
            type: Action.MOVE_TO_END,
            wrapper: listRef.current,
          });
          break;
        // move to start
        case KEY.HOME:
          dispatch({
            allowCreate,
            name,
            options,
            type: Action.MOVE_TO_START,
            wrapper: listRef.current,
          });
          break;
        // move up
        case KEY.ESC:
          dispatch({ name, options, type: Action.DROPDOWN_CLOSE });
          break;
        // close
        case KEY.UP: {
          evt.preventDefault();
          dispatch({
            allowCreate,
            name,
            options,
            type: Action.MOVE_PREV,
            wrapper: listRef.current,
          });
          break;
        }
      }
    }

    if (!searchListener && searchRef.current) {
      searchRef.current.addEventListener('keydown', onKeydown);
      setSearchListener(true);
    }
  }, [searchListener]); // eslint-disable-line react-hooks/exhaustive-deps

  // effect 5: trigger listener
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === KEY.DOWN) {
        e.preventDefault();
        dispatch({ name, options, type: Action.DROPDOWN_OPEN });
      }
    }

    if (triggerRef.current && !triggerListener) {
      triggerRef.current.addEventListener('keyup', onKeydown);
      setTriggerListener(true);
    }
  }, [name, options, triggerListener]);

  const shouldDisplaySearch = noSearch !== true && options.length > 4;
  const shouldDisplayCreate =
    allowCreate !== false &&
    state.search.length > 0 &&
    state.visibleOptions.findIndex(option => option === state.search) === -1;

  // maintain focus on re-render
  if (searchRef.current && state.isOpen) {
    searchRef.current.focus();
  } else if (triggerRef.current && !state.isOpen) {
    triggerRef.current.focus();
  }

  const selection = [...state.selected, ...state.created];

  return (
    <div
      aria-expanded={state.isOpen || undefined}
      aria-multiselectable={multi === true || undefined}
      className={className}
      role="listbox"
      {...rest}
    >
      <div className="rsz__trigger">
        <button
          aria-controls={elId(name, 'menu')}
          aria-haspopup="listbox"
          className="rsz__trigger-button"
          ref={triggerRef}
          type="button"
          onClick={() => dispatch({ name, options, type: Action.DROPDOWN_TOGGLE })}
        >
          {multi === true ? `Select options for ${name}` : `Select an option for ${name}`}
          <span aria-hidden className="rsz__arrow">
            ↓
          </span>
        </button>
        {selection.length > 0 ? (
          <ul className="rsz__selection">
            {selection.map(option => (
              <li key={option} className="rsz__selected">
                <span className="rsz__selected-text">{option}</span>
                <button
                  className="rsz__selected-action"
                  aria-hidden
                  type="button"
                  onClick={() =>
                    dispatch({ max, name, option, options, type: Action.ADD_MULTI_CLICK })
                  }
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rsz__selection rsz__placeholder">{placeholder}</div>
        )}
      </div>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
      <div
        aria-label="Close dropdown"
        className="rsz__overlay"
        onClick={() => dispatch({ name, options, type: Action.DROPDOWN_CLOSE })}
      />
      <menu className="rsz__dropdown-wrapper">
        <div className="rsz__dropdown">
          <input
            aria-activedescendant={state.activeDescendant}
            aria-hidden={shouldDisplaySearch === false || undefined}
            aria-label="Filter options"
            className="rsz__search"
            onChange={e =>
              noSearch !== true &&
              dispatch({ allowCreate, name, options, search: e.target.value, type: Action.SEARCH })
            }
            ref={searchRef}
            type="search"
            value={state.search}
          />
          <div className="rsz__search-icon" />
          <ul className="rsz__option-list" ref={listRef}>
            {state.visibleOptions.length > 0 ? (
              state.visibleOptions.map(option => {
                const id = optionId(name, options.indexOf(option));
                const isSelected = selection.indexOf(option) !== -1;
                const isMaxxed = selection.length === max;
                let ariaSelected: boolean | undefined = isSelected;
                if (isMaxxed) {
                  ariaSelected = undefined;
                }
                return (
                  <li className="rsz__option" key={option}>
                    <button
                      aria-selected={ariaSelected}
                      data-highlighted={state.activeDescendant === id || undefined}
                      disabled={isMaxxed && !isSelected}
                      id={id}
                      onClick={() => onClick(option)}
                      role="option"
                      type="button"
                    >
                      {option}
                    </button>
                  </li>
                );
              })
            ) : (
              <span className="rsz__no-results">No results for “{state.search}”</span>
            )}
            {shouldDisplayCreate && (
              <li className="rsz__option">
                <button
                  className="rsz__create"
                  id={optionId(name, options.length)}
                  type="button"
                  onClick={() => onClick(state.search)}
                >
                  Create <span className="rsz__search-term">{state.search}</span>
                </button>
              </li>
            )}
            {allowCreate === true && state.search === '' && (
              <li className="rsz__option">
                <span className="rsz__create">Start typing to create an item</span>
              </li>
            )}
          </ul>
        </div>
      </menu>
      <input type="hidden" name={name} value={selection.join(',')} />
    </div>
  );
};

export default SelectZero;
