import type { DeckDefinition } from './presentation';

export type DeckEntry = { id: string; title: string; load: () => Promise<DeckDefinition> };

export const deckEntries: DeckEntry[] = [
  {
    id: 'titanfuzz', title: 'TitanFuzz',
    load: () => import('../decks/titanfuzz/deck').then(module => module.titanFuzzDeck),
  },
  {
    id: 'backend-workshop', title: 'Backend Workshop',
    load: () => import('../decks/backend-workshop/src/definition').then(module => module.backendWorkshop),
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
