import { defineDeck, fadeTransition } from '../../src/presentation';
import { pages, Slide } from './Slides';
import './styles.css';

export const scalingCollapseDeck = defineDeck({
  id: 'scaling-collapse', title: 'Scaling with Collapse', version: 3,
  description: '固定 TPP、τ、LR schedule，模型家族的正規化 loss curve 就會塌縮：論文的論證、對 Lab6 的意義與實驗規劃。',
  size: { width: 1600, height: 900 },
  slides: pages.map(([id, title, steps]) => ({ id, title, steps })),
  RenderSlide: Slide,
  transition: fadeTransition(.3),
  freezeEntranceOnNavigation: false,
  previews: [
    { slideId: 'collapse', step: 2 }, { slideId: 'claim' }, { slideId: 'tpp' },
    { slideId: 'normalize' }, { slideId: 'cover' }, { slideId: 'tau', step: 1 },
    { slideId: 'schedule' }, { slideId: 'lab6' }, { slideId: 'outline' },
  ],
  chapters: [
    { id: 'problem', title: 'A. 問題', slideId: 'problem' },
    { id: 'argument', title: 'B. 論文的論證', slideId: 'claim' },
    { id: 'lab6', title: 'C. 對 Lab6 的意義', slideId: 'lab6' },
    { id: 'plan', title: 'D. 實驗規劃', slideId: 'experiments' },
  ],
});
