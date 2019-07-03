import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';
import pokemon from 'pokemon';
import SelectZero from '../src';

const allPokemon = [...pokemon.all()];
const firstNine = allPokemon.slice(0, 9);

storiesOf('Select', module)
  .add('single', () =>
    React.createElement(() => {
      const [selection, setSelection] = useState<string[]>([]);
      return (
        <SelectZero
          name="demo"
          onChange={setSelection}
          options={firstNine}
          placeholder="Select one"
          value={selection}
        />
      );
    })
  )
  .add('multi', () =>
    React.createElement(() => {
      const [selection, setSelection] = useState<string[]>([]);
      return (
        <SelectZero
          multi
          name="demo"
          onChange={setSelection}
          options={firstNine}
          placeholder="Select options"
          value={selection}
        />
      );
    })
  )
  .add('huge list', () =>
    React.createElement(() => {
      const [selection, setSelection] = useState<string[]>([]);
      return (
        <SelectZero
          multi
          name="demo"
          onChange={setSelection}
          options={allPokemon}
          placeholder="Select options"
          value={selection}
        />
      );
    })
  )
  .add('max 3', () =>
    React.createElement(() => {
      const [selection, setSelection] = useState<string[]>([]);
      return (
        <SelectZero
          max={3}
          multi
          name="demo"
          onChange={setSelection}
          options={firstNine}
          placeholder="Select 3"
          value={selection}
        />
      );
    })
  )
  .add('no search', () =>
    React.createElement(() => {
      const [selection, setSelection] = useState<string[]>([]);
      return (
        <SelectZero
          name="demo"
          noSearch
          onChange={setSelection}
          options={firstNine}
          value={selection}
        />
      );
    })
  )
  .add('allow create', () =>
    React.createElement(() => {
      const [selection, setSelection] = useState<string[]>([]);
      return (
        <SelectZero
          onChange={setSelection}
          value={selection}
          name="demo"
          multi
          allowCreate
          options={firstNine}
        />
      );
    })
  );
