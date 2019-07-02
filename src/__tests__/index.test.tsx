import React from 'react';
import { render, fireEvent, waitForElement } from '@testing-library/react';
import ReactSelectZero from '..';

const SEARCH_LABEL = 'Filter options';
const TRIGGER_LABEL = /^select (an option|options) for/i;

// shim scrollIntoView()
Element.prototype.scrollIntoView = jest.fn();

describe('<ReactSelectZero />', () => {
  describe('a11y checks', () => {
    it('updates aria-activedescendant with keyboard up / down', () => {
      const name = 'my-component';
      const { getByLabelText } = render(
        <ReactSelectZero name={name} onChange={jest.fn()} options={['one', 'two', 'three']} />
      );
      const search = getByLabelText(SEARCH_LABEL) as HTMLInputElement;
      expect(search.getAttribute('aria-activedescendant')).toBe(`rsz-${name}-option-0`);
      fireEvent.keyDown(search, { key: 'ArrowDown' });
      expect(search.getAttribute('aria-activedescendant')).toBe(`rsz-${name}-option-1`);
      fireEvent.keyDown(search, { key: 'ArrowUp' });
      fireEvent.keyDown(search, { key: 'ArrowUp' });
      expect(search.getAttribute('aria-activedescendant')).toBe(`rsz-${name}-option-2`);
    });

    it('updates aria-activedescendant with keyboard home / end', () => {
      const name = 'my-component';
      const { getByLabelText } = render(
        <ReactSelectZero name={name} onChange={jest.fn()} options={['one', 'two', 'three']} />
      );
      const search = getByLabelText(SEARCH_LABEL) as HTMLInputElement;
      expect(search.getAttribute('aria-activedescendant')).toBe(`rsz-${name}-option-0`);
      fireEvent.keyDown(search, { key: 'End' });
      expect(search.getAttribute('aria-activedescendant')).toBe(`rsz-${name}-option-2`);
      fireEvent.keyDown(search, { key: 'Home' });
      expect(search.getAttribute('aria-activedescendant')).toBe(`rsz-${name}-option-0`);
    });

    it('allows adding of elements solely with keyboard', () => {
      const onChange = jest.fn();
      const { getByText, getByLabelText } = render(
        <ReactSelectZero
          name="animals"
          onChange={onChange}
          options={['dolphin', 'turtle', 'starfish', 'eel']}
        />
      );
      const search = getByLabelText(SEARCH_LABEL) as HTMLInputElement;
      const trigger = getByText(TRIGGER_LABEL);
      fireEvent.click(trigger);
      fireEvent.change(search, { target: { value: 'turt' } });
      fireEvent.keyDown(search, { key: 'Enter' });
      expect(onChange).toHaveBeenCalledWith(['turtle']);
    });

    it('allows closing of dropdown with Escape key', () => {
      const { getByText, getByLabelText, getByRole } = render(
        <ReactSelectZero
          name="animals"
          onChange={jest.fn()}
          options={['dolphin', 'turtle', 'starfish', 'eel']}
        />
      );
      const trigger = getByText(TRIGGER_LABEL);
      fireEvent.click(trigger);
      expect(getByRole('listbox').getAttribute('aria-expanded')).toBe('true');
      const search = getByLabelText(SEARCH_LABEL) as HTMLInputElement;
      fireEvent.keyDown(search, { key: 'Escape' });
      expect(getByRole('listbox').getAttribute('aria-expanded')).toBe('false');
    });

    it('features aria-multiselectable in multi mode', () => {
      const { getByRole } = render(
        <ReactSelectZero
          multi
          name="select"
          onChange={jest.fn()}
          options={['one', 'two', 'three']}
        />
      );
      expect(getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true');
    });

    it('features aria-expanded when dropdown is open', () => {
      const name = 'demo';
      const { getByRole, getByText } = render(
        <ReactSelectZero name={name} onChange={jest.fn()} options={['one', 'two', 'three']} />
      );
      expect(getByRole('listbox').getAttribute('aria-expanded')).toBe('false');
      const trigger = getByText(TRIGGER_LABEL);
      fireEvent.click(trigger);
      expect(getByRole('listbox').getAttribute('aria-expanded')).toBe('true');
    });

    it('features aria-selected="true" on selected elements', () => {
      const { getAllByRole } = render(
        <ReactSelectZero
          multi
          name="power-rangers"
          onChange={jest.fn()}
          options={['red', 'blue', 'black', 'yellow', 'pink', 'green', 'white']}
          value={['red', 'blue']}
        />
      );
      expect(getAllByRole('option').map(el => el.getAttribute('aria-selected'))).toEqual([
        'true',
        'true',
        'false',
        'false',
        'false',
        'false',
        'false',
      ]);
    });

    it('omits aria-selected when max is reached', () => {
      const { getAllByRole } = render(
        <ReactSelectZero
          max={3}
          multi
          name="power-rangers"
          onChange={jest.fn()}
          options={['red', 'blue', 'black', 'yellow', 'pink', 'green', 'white']}
          value={['red', 'green', 'white']}
        />
      );
      expect(getAllByRole('option').map(el => el.getAttribute('aria-selected'))).toEqual([
        'true',
        null,
        null,
        null,
        null,
        'true',
        'true',
      ]);
    });

    it('closes when tabbing away', () => {
      const { getByLabelText, getByText, getByRole } = render(
        <ReactSelectZero
          name="marvel-heroes"
          onChange={jest.fn()}
          options={['Captain America', 'The Hulk', 'Widowmaker', 'Hawkeye']}
        />
      );
      const trigger = getByText(TRIGGER_LABEL);
      fireEvent.click(trigger);
      expect(getByRole('listbox').getAttribute('aria-expanded')).toBe('true');
      const search = getByLabelText(SEARCH_LABEL) as HTMLInputElement;
      fireEvent.keyDown(search, { key: 'Tab' });
      expect(getByRole('listbox').getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('single', () => {
    it('renders options sequentially with name', () => {
      const name = 'my-component';
      const { getAllByRole } = render(
        <ReactSelectZero onChange={jest.fn()} options={['one', 'two', 'three']} name={name} />
      );
      const IDs: string[] = [];
      getAllByRole('option').forEach(el => {
        const id = el.getAttribute('id');
        if (id) {
          IDs.push(id);
        }
      });
      expect(IDs).toEqual([`rsz-${name}-option-0`, `rsz-${name}-option-1`, `rsz-${name}-option-2`]);
    });

    it('correctly filters results', () => {
      const { getByLabelText, getAllByRole } = render(
        <ReactSelectZero
          name="marvel-heroes"
          onChange={jest.fn()}
          options={['Captain America', 'The Hulk', 'Widowmaker', 'Hawkeye']}
        />
      );
      const search = getByLabelText(SEARCH_LABEL) as HTMLInputElement;
      fireEvent.change(search, { target: { value: 'hu' } });
      expect(getAllByRole('option').map(el => el.innerHTML)).toEqual(['The Hulk']);
    });

    it('fires onChange on single select', () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <ReactSelectZero name="c" options={['one', 'two', 'three']} onChange={onChange} />
      );
      fireEvent.click(getByText('two'));
      expect(onChange).toHaveBeenCalledWith(['two']);
    });
  });

  describe('multi', () => {
    it('initializes with all values', () => {
      const onChange = jest.fn();
      const { getByDisplayValue } = render(
        <ReactSelectZero
          multi
          name="c"
          onChange={onChange}
          options={['one', 'two', 'three']}
          value={['one', 'new']}
        />
      );
      expect(getByDisplayValue('one,new')).not.toBeNull();
    });

    it('preserves order of options', () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <ReactSelectZero
          name="c"
          multi
          options={['one', 'two', 'three']}
          onChange={onChange}
          value={['three']}
        />
      );
      fireEvent.click(getByText('two'));
      expect(onChange).toHaveBeenCalledWith(['two', 'three']);
    });

    it('preserves search on selection', () => {
      const query = 'tw';
      const { getByLabelText, getByText } = render(
        <ReactSelectZero name="c" multi onChange={jest.fn()} options={['one', 'two', 'three']} />
      );
      const search = getByLabelText(SEARCH_LABEL) as HTMLInputElement;
      fireEvent.change(search, { target: { value: query } });
      expect(search.value).toBe(query);
      fireEvent.click(getByText('two'));
      expect(search.value).toBe(query);
    });

    it('respects max', () => {
      const onChange = jest.fn();
      const value = ['one', 'three'];
      const { getByText } = render(
        <ReactSelectZero
          max={2}
          multi
          name="c"
          onChange={onChange}
          options={['one', 'two', 'three']}
          value={value}
        />
      );
      fireEvent.click(getByText('two'));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('allowCreate', () => {
    it('returns created options', async () => {
      const onChange = jest.fn();
      const newItem = 'new';
      const { getByText, getByLabelText } = render(
        <ReactSelectZero
          name="c"
          options={['one', 'two', 'three']}
          allowCreate
          onChange={onChange}
        />
      );
      const search = getByLabelText(SEARCH_LABEL);
      fireEvent.change(search, { target: { value: newItem } });
      const createButton = await waitForElement<HTMLElement>(() => getByText(newItem));
      fireEvent.click(createButton);
      expect(onChange).toHaveBeenCalledWith([newItem]);
    });

    it('returns created options at the end for multi', () => {
      const onChange = jest.fn();
      const newItem = 'new';
      const { getByText, getByLabelText } = render(
        <ReactSelectZero
          allowCreate
          multi
          name="c"
          onChange={onChange}
          options={['one', 'two', 'three']}
          value={['one', 'three']}
        />
      );
      const search = getByLabelText(SEARCH_LABEL);
      fireEvent.change(search, { target: { value: newItem } });
      const createButton = getByText(newItem);
      fireEvent.click(createButton);
      expect(onChange).toHaveBeenCalledWith(['one', 'three', newItem]);
    });
  });

  describe('noSearch', () => {
    it('shows search by default when there are more than 5 items', () => {
      const { getByLabelText } = render(
        <ReactSelectZero
          name="c"
          onChange={jest.fn()}
          options={['one', 'two', 'three', 'four', 'five', 'six']}
        />
      );
      const search = getByLabelText(SEARCH_LABEL);
      expect(search.getAttribute('aria-hidden')).toBeNull();
    });

    it('hides search by default when there are fewer than 5 items', () => {
      const { getByLabelText } = render(
        <ReactSelectZero name="c" onChange={jest.fn()} options={['one', 'two', 'three']} />
      );
      const search = getByLabelText(SEARCH_LABEL);
      expect(search.getAttribute('aria-hidden')).toBe('true');
    });

    it('hides the search form with noSearch', () => {
      const { getByLabelText } = render(
        <ReactSelectZero name="c" onChange={jest.fn()} options={['one', 'two', 'three']} noSearch />
      );
      const search = getByLabelText(SEARCH_LABEL);
      expect(search.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
