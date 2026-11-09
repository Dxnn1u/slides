import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { scalingCollapseDeck as deck } from '../decks/scaling-collapse/deck';
import { initialState, reduce } from '../src/presentation/state';
import type { SlideRenderProps } from '../src/presentation/types';

const noop = () => {};
const actions = { next: noop, previous: noop, nextSlide: noop, previousSlide: noop, jump: noop, restart: noop };

it('traverses all 17 states forward and backward', () => {
  expect(deck.slides).toHaveLength(13);
  let state = initialState(deck);
  const visited = [`${state.slideId}:${state.step}`];
  for (;;) {
    const next = reduce(deck, state, { type: 'next' });
    if (next === state) break;
    state = next;
    visited.push(`${state.slideId}:${state.step}`);
  }
  expect(visited).toHaveLength(17);
  expect(state.slideId).toBe('closing');
  for (const expected of visited.slice(0, -1).reverse()) {
    state = reduce(deck, state, { type: 'previous' });
    expect(`${state.slideId}:${state.step}`).toBe(expected);
  }
});

it('uses live page IDs for chapters and the nine previews, with the cover centered', () => {
  const ids = new Set<string>(deck.slides.map(slide => String(slide.id)));
  expect(deck.previews).toHaveLength(9);
  expect(deck.previews[4].slideId).toBe('cover');
  for (const entry of [...deck.previews, ...deck.chapters]) expect(ids.has(String(entry.slideId))).toBe(true);
});

it('marks the schematic figure and renders previews without links', () => {
  for (const slide of deck.slides) {
    for (let step = 0; step < slide.steps; step++) {
      const props: SlideRenderProps = { slide, step, actions, mode: 'playback', active: true, still: false, reducedMotion: true };
      const html = renderToStaticMarkup(createElement(deck.RenderSlide, props));
      expect(html).toContain('data-still="true"');
      if (slide.id === 'collapse') expect(html).toContain('不是實驗數據');
      if (['normalize', 'tau-ema', 'tau', 'forecast'].includes(String(slide.id))) expect(html).toContain('<math');
    }
    const preview: SlideRenderProps = { slide, step: slide.steps - 1, actions, mode: 'preview', active: false, still: true, reducedMotion: true };
    expect(renderToStaticMarkup(createElement(deck.RenderSlide, preview))).not.toContain('<a ');
  }
});
