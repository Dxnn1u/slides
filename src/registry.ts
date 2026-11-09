import type { DeckDefinition } from './presentation';

export type DeckEntry = { id: string; title: string; load: () => Promise<DeckDefinition> };

export const deckEntries: DeckEntry[] = [
  {
    id: 'scaling-collapse', title: 'Scaling with Collapse',
    load: () => import('../decks/scaling-collapse/deck').then(module => module.scalingCollapseDeck),
  },
  {
    id: 'pytorch-basic', title: 'PyTorch basic',
    load: () => import('../decks/pytorch-basic/deck').then(module => module.pytorchBasicDeck),
  },
  // The player test fixture is exercised in browser tests, not published in the collection.
  ...(import.meta.env.MODE === 'test' ? [{
    id: 'example', title: 'A different perspective',
    load: () => import('../tests/fixtures/example/deck').then(module => module.exampleDeck),
  }] : []),
];
