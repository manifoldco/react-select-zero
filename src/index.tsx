import React, { useState, ReactNode, useRef, Dispatch, SetStateAction, useEffect } from 'react';

type Selection = string[];
type OnChangeCallback = (selected: Selection) => void | Dispatch<SetStateAction<Selection>>;

interface SelectProps {
  allowCreate?: boolean;
  className?: string;
  max?: number;
  multi?: boolean;
  name: string;
  noSearch?: boolean;
  onChange: OnChangeCallback;
  options: Selection;
  placeholder?: ReactNode;
  value?: Selection;
}

enum KEY {
  DOWN = 'ArrowDown',
  END = 'End',
  ENTER = 'Enter',
  ESC = 'Escape',
  HOME = 'Home',
  UP = 'ArrowUp',
}

const SelectZero: React.FunctionComponent<SelectProps> = ({
  allowCreate = false,
  className = 'rsz',
  max = Infinity,
  multi = false,
  name,
  noSearch = false,
  onChange,
  options,
  placeholder = 'Select',
  value = [],
  ...rest
}) => {
  // state
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [activeDescendantIndex, setActiveDescendantIndex] = useState(0); // Active descendant. Numbers are easier to manipulate than element IDs.
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // computed
  const visibleIndices: number[] = [];
  const visibleOptions: string[] = [];
  options.forEach((option, index) => {
    if (new RegExp(search, 'i').test(option)) {
      // filter results in one pass
      visibleOptions.push(option);
      visibleIndices.push(index);
    }
  });
  const shouldDisplaySearch = noSearch !== true && options.length > 4;
  const shouldDisplayCreate =
    allowCreate === true &&
    search.length > 0 &&
    options.findIndex(option => option === search) === -1;
  const isMaxed = value.length === max;

  // methods
  function elId(component: string) {
    return `rsz-${name}-${component}`;
  }

  function optionId(option: number) {
    return elId(`option-${option}`);
  }

  function scrollTo(wrapper: HTMLElement | null, selector: string): void {
    if (wrapper) {
      const el = wrapper.querySelector(selector);
      if (el) {
        el.scrollIntoView(false);
      }
    }
  }

  function addItem(option: string) {
    // multi
    if (multi === true) {
      let selected = [...value];
      const index = selected.indexOf(option);
      if (index !== -1) {
        selected.splice(index, 1); // if existing, remove
      } else if (selected.length < max) {
        selected.push(option); // if new, add unless we’re at max
      }
      if (options.indexOf(option) !== -1) {
        selected = options.filter(order => selected.indexOf(order) !== -1); // if existing option, keep original order
      }

      onChange(selected);
      return;
    }

    // single
    onChange([option]);
    setIsOpen(false);
  }

  function onKeyDown(evt: React.KeyboardEvent<HTMLInputElement>): void {
    const first = visibleIndices[0];
    const last = visibleIndices[visibleIndices.length - 1];

    switch (evt.key) {
      // select active item
      case KEY.ENTER: {
        evt.preventDefault();
        addItem(options[activeDescendantIndex]);
        break;
      }
      // move down / up
      case KEY.DOWN:
      case KEY.UP: {
        evt.preventDefault();
        const sum = evt.key === KEY.UP ? -1 : 1;
        const fallback = evt.key === KEY.UP ? last : first; // if at beginning, loop around to end, and vice-versa
        const nextIndex = visibleIndices.indexOf(activeDescendantIndex) + sum;
        const next = visibleIndices[nextIndex] !== undefined ? visibleIndices[nextIndex] : fallback;
        setActiveDescendantIndex(next); // set to last index if at beginning of list
        scrollTo(listRef.current, `#${optionId(next)}`);
        break;
      }
      // move to start / end
      case KEY.END:
      case KEY.HOME: {
        const next = evt.key === KEY.HOME ? first : last;
        setActiveDescendantIndex(next);
        scrollTo(listRef.current, `#${optionId(next)}`);
        break;
      }
      // close
      case KEY.ESC:
        setIsOpen(false);
        break;
      default:
        if (noSearch) {
          evt.preventDefault();
        }
        break;
    }
  }

  // effect 1. maintain focus
  useEffect(() => {
    if (searchRef.current && isOpen) {
      searchRef.current.focus();
    }
  });

  // effect 2. active descendant
  useEffect(() => {
    if (visibleIndices.indexOf(activeDescendantIndex) === -1) {
      setActiveDescendantIndex(visibleIndices[0]);
    }
  }, [activeDescendantIndex, visibleIndices]);

  return (
    <div
      aria-expanded={isOpen === true}
      aria-multiselectable={multi === true || undefined}
      className={className}
      role="listbox"
      {...rest}
    >
      <div className="rsz__trigger">
        <button
          aria-controls={elId('menu')}
          aria-haspopup="listbox"
          className="rsz__trigger-button"
          onClick={() => setIsOpen(true)}
          onKeyDown={e => {
            if (e.key === KEY.DOWN) {
              setIsOpen(true);
            }
          }}
          ref={triggerRef}
          type="button"
        >
          {multi === true ? `Select options for ${name}` : `Select an option for ${name}`}
          <span aria-hidden className="rsz__arrow">
            ↓
          </span>
        </button>
        {value.length > 0 ? (
          <ul className="rsz__selection">
            {value.map(option => (
              <li key={option} className="rsz__selected">
                <span className="rsz__selected-text">{option}</span>
                <button
                  aria-label={`remove ${option}`}
                  className="rsz__selected-action"
                  onClick={() => addItem(option)}
                  type="button"
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
      <div aria-label="Close dropdown" className="rsz__overlay" onClick={() => setIsOpen(false)} />
      <menu id={elId('menu')} className="rsz__dropdown-wrapper">
        <div className="rsz__dropdown">
          <input
            aria-activedescendant={optionId(activeDescendantIndex)}
            aria-hidden={shouldDisplaySearch === false || undefined}
            aria-label="Filter options"
            className="rsz__search"
            onChange={e => setSearch(e.target.value)}
            onKeyDown={onKeyDown}
            ref={searchRef}
            type="search"
            value={search}
          />
          <div className="rsz__search-icon" />
          <ul className="rsz__option-list" ref={listRef}>
            {visibleOptions.map((option, index) => {
              const isSelected = value.indexOf(option) !== -1;
              let ariaSelected: boolean | undefined = isSelected;
              if (ariaSelected === false && isMaxed === true) {
                ariaSelected = undefined;
              }
              return (
                <li className="rsz__option" key={option}>
                  <button
                    aria-selected={ariaSelected}
                    data-highlighted={activeDescendantIndex === visibleIndices[index] || undefined}
                    disabled={isMaxed && !isSelected}
                    id={optionId(visibleIndices[index])}
                    onClick={() => addItem(option)}
                    role="option"
                    type="button"
                  >
                    {option}
                  </button>
                </li>
              );
            })}
            {options.length > 0 && visibleOptions.length === 0 && (
              <span className="rsz__no-results">No results for “{search}”</span>
            )}
            {shouldDisplayCreate && (
              <li className="rsz__option">
                <button
                  className="rsz__create"
                  data-highlighted={activeDescendantIndex === options.length || undefined}
                  disabled={isMaxed}
                  id={optionId(options.length)}
                  onClick={() => addItem(search)}
                  type="button"
                >
                  Create <span className="rsz__search-term">{search}</span>
                </button>
              </li>
            )}
            {allowCreate === true && search === '' && (
              <li className="rsz__option">
                <span className="rsz__create">Start typing to create an item</span>
              </li>
            )}
          </ul>
        </div>
      </menu>
      <input type="hidden" name={name} value={value.join(',')} />
    </div>
  );
};

export default SelectZero;
