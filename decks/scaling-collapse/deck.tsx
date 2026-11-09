import { defineDeck, fadeTransition } from '../../src/presentation';
import { pages, Slide } from './Slides';
import './styles.css';

export const scalingCollapseDeck = defineDeck({
  id: 'scaling-collapse', title: 'Scaling with Collapse', version: 2,
  description: '用整條 loss 曲線預測大模型：論文、Lab6 與 Upwash 的實驗規劃。',
  size: { width: 1600, height: 900 },
  slides: pages.map(([id, title, steps]) => ({ id, title, steps })),
  RenderSlide: Slide,
  transition: fadeTransition(.3),
  freezeEntranceOnNavigation: false,
  previews: [
    { slideId: 'collapse' }, { slideId: 'controls' }, { slideId: 'tau', step: 1 },
    { slideId: 'normalize' }, { slideId: 'cover' }, { slideId: 'relation' },
    { slideId: 'upwash' }, { slideId: 'experiments' }, { slideId: 'closing' },
  ],
  chapters: [
    { id: 'paper', title: '論文：什麼是塌縮', slideId: 'cover' },
    { id: 'mechanism', title: '機制與應用', slideId: 'controls' },
    { id: 'ours', title: '我們的實驗規劃', slideId: 'relation' },
  ],
});
