import React from 'react';
import { render, fireEvent, waitForElement } from '@testing-library/react';
import ReactSelectZero, { optionId } from '..';

const SEARCH_LABEL = 'Filter options';

describe('optionId function', () => {
  it('generates an ID from a name & position', () => {
    expect(optionId('my-component', 5)).toBe('rsz-my-component-option-5');
  });
});

describe('<ReactSelectZero />', () => {
  describe('single', () => {
    it('renders options sequentially with name', () => {
      const name = 'my-component';
      const { getAllByRole } = render(
        <ReactSelectZero options={['one', 'two', 'three']} name={name} />
      );
      const IDs: string[] = [];
      getAllByRole('option').forEach(el => {
        const id = el.getAttribute('id');
        if (id) {
          IDs.push(id);
        }
      });
      expect(IDs).toEqual([
        'rsz-my-component-option-0',
        'rsz-my-component-option-1',
        'rsz-my-component-option-2',
      ]);
    });

    it('fires onChange on single select', () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <ReactSelectZero name="c" options={['one', 'two', 'three']} onChange={onChange} />
      );
      fireEvent.click(getByText('two'));
      expect(onChange).toHaveBeenCalledWith(['two'], []);
    });

    it('clears search on selection', () => {
      const query = 'tw';
      const { getByText, getByLabelText } = render(
        <ReactSelectZero name="c" options={['one', 'two', 'three']} />
      );
      const search = getByLabelText(SEARCH_LABEL) as HTMLInputElement;
      fireEvent.change(search, { target: { value: query } });
      expect(search.value).toBe(query);
      fireEvent.click(getByText('two'));
      expect(search.value).toBe('');
    });
  });

  describe('multi', () => {
    it('correctly sets defaultValues between created & non-created', () => {
      const { getByDisplayValue } = render(
        <ReactSelectZero
          name="c"
          multi
          options={['one', 'two', 'three']}
          defaultValue={['new', 'one']}
        />
      );
      expect(getByDisplayValue('one,new')).not.toBeNull();
    });

    it('preserves order of options', () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <ReactSelectZero name="c" multi options={['one', 'two', 'three']} />
      );
      fireEvent.click(getByText('three'));
      fireEvent.click(getByText('two'));
      expect(onChange).toHaveBeenCalledWith(['two', 'three'], []);
    });

    it('preserves search on selection', () => {
      const query = 'tw';
      const { getByLabelText, getByText } = render(
        <ReactSelectZero name="c" multi options={['one', 'two', 'three']} />
      );
      const search = getByLabelText(SEARCH_LABEL) as HTMLInputElement;
      fireEvent.change(search, { target: { value: query } });
      expect(search.value).toBe(query);
      fireEvent.click(getByText('two'));
      expect(search.value).toBe(query);
    });

    it('respects max', () => {
      const { getByDisplayValue, getByText } = render(
        <ReactSelectZero name="c" multi max={2} options={['one', 'two', 'three']} />
      );
      fireEvent.click(getByText('one'));
      fireEvent.click(getByText('two'));
      fireEvent.click(getByText('three'));
      expect(getByDisplayValue('one,two')).not.toBeNull();
    });
  });

  describe('allowCreate', () => {
    it('returns created options separately', async () => {
      const onChange = jest.fn();
      const newItem = 'new';
      const { getByText, getByLabelText } = render(
        <ReactSelectZero name="c" options={['one', 'two', 'three']} />
      );
      const search = getByLabelText(SEARCH_LABEL);
      fireEvent.change(search, { target: { value: newItem } });
      const createButton = await waitForElement<HTMLElement>(() => getByText(newItem));
      fireEvent.click(createButton);
      expect(onChange).toHaveBeenCalledWith([], [newItem]);
    });
  });

  describe('noSearch', () => {
    it('shows search by default when there are more than 5 items', () => {
      const { getByLabelText } = render(
        <ReactSelectZero name="c" options={['one', 'two', 'three', 'four', 'five', 'six']} />
      );
      const search = getByLabelText(SEARCH_LABEL);
      expect(search.getAttribute('aria-hidden')).toBeNull();
    });

    it('hides search by default when there are fewer than 5 items', () => {
      const { getByLabelText } = render(
        <ReactSelectZero name="c" options={['one', 'two', 'three']} />
      );
      const search = getByLabelText(SEARCH_LABEL);
      expect(search.getAttribute('aria-hidden')).toBe('true');
    });

    it('hides the search form with noSearch', () => {
      const { getByLabelText } = render(
        <ReactSelectZero name="c" options={['one', 'two', 'three']} noSearch />
      );
      const search = getByLabelText(SEARCH_LABEL);
      expect(search.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
