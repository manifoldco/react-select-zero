import React from 'react';
import { storiesOf } from '@storybook/react';
import pokemon from 'pokemon';
import SelectZero from '../src';

const allPokemon = [...pokemon.all()];
const firstNine = allPokemon.slice(0, 9);

storiesOf('Select', module)
  .add('single', () => <SelectZero name="demo" placeholder="Select one" options={firstNine} />)
  .add('multi', () => (
    <SelectZero name="demo" multi options={firstNine} placeholder="Select options" />
  ))
  .add('huge list', () => (
    <SelectZero name="demo" multi options={allPokemon} placeholder="Select options" />
  ))
  .add('max 3', () => (
    <SelectZero name="demo" max={3} multi options={firstNine} placeholder="Select 3" />
  ))
  .add('no search', () => <SelectZero name="demo" noSearch options={firstNine} />)
  .add('allow create', () => <SelectZero name="demo" multi allowCreate options={firstNine} />)
  .add('allow create w/ defaults', () => (
    <SelectZero
      name="demo"
      multi
      allowCreate
      defaultValue={[...firstNine, 'Missingno']}
      options={firstNine}
    />
  ));
