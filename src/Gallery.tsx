import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { SlidePreview, useReducedMotion, type DeckDefinition } from './presentation';
import { deckEntries, type DeckEntry } from './registry';
import { sitePath } from './paths';

const showcaseQuery = '(min-width: 900px)';
const subscribeViewport = (changed: () => void) => {
  const media = matchMedia(showcaseQuery);
  media.addEventListener('change', changed);
  return () => media.removeEventListener('change', changed);
};
function DeckCard({ entry, immediate }: {
  entry: DeckEntry; immediate: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const revealed = useRef(false);
  const opacity = useMotionValue(1);
  const y = useTransform(opacity, [0, 1], [24, 0]);
  useLayoutEffect(() => {
    if (immediate || revealed.current) { opacity.set(1); revealed.current = true; return; }
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.max(0, Math.min(1, (innerHeight * .95 - root.current!.getBoundingClientRect().top) / (innerHeight * .3)));
      if (progress === 1) revealed.current = true;
      opacity.set(revealed.current ? 1 : progress);
    };
    const schedule = () => { if (!frame && !revealed.current) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(root.current!.parentElement!);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, [immediate, opacity]);
  const [deck, setDeck] = useState<DeckDefinition | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    const observer = new IntersectionObserver(([item]) => {
      if (!item.isIntersecting) return;
      observer.disconnect();
      void entry.load().then(value => { if (alive) setDeck(value); }).catch(() => { if (alive) setFailed(true); });
    }, { rootMargin: '250px' });
    observer.observe(root.current!);
    return () => { alive = false; observer.disconnect(); };
  }, [entry]);
  const href = sitePath(`${entry.id}?start=1`);
  const artwork = <a className="deck-artwork" href={href} aria-label={`播放 ${entry.title}`}>
      {deck ? <div className="mosaic-grid" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, deck.previews.length))}, minmax(0, 1fr))` }}>{deck.previews.map((preview, i) => <SlidePreview key={`${preview.slideId}-${i}`} deck={deck} {...preview}/>)}</div>
        : <div className="gallery-placeholder" role="status">{failed ? '預覽暫時無法載入' : '載入投影片預覽…'}</div>}
    </a>;
  return <article className="deck-card" ref={root} data-gallery-deck={entry.id}
    onFocusCapture={() => { revealed.current = true; opacity.set(1); }}>
    <motion.div className="deck-surface" style={{ opacity, y }}>
      {artwork}
      <div className="deck-caption">
        <div className="deck-title-row"><h3 className="deck-title">{entry.title}</h3><p className="deck-meta">{deck ? `${deck.slides.length} 頁` : '\u00a0'}</p></div>
        <p className="deck-description">{deck?.description || '\u00a0'}</p>
        <a className="play-link" href={href}>播放投影片<ArrowUpRight size={17} aria-hidden="true"/></a>
      </div>
    </motion.div>
  </article>;
}

export function Gallery() {
  const reduced = useReducedMotion();
  const desktop = useSyncExternalStore(subscribeViewport, () => matchMedia(showcaseQuery).matches, () => false);
  const intro = useRef<HTMLElement>(null);
  const collection = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const progress = useMotionValue(0);
  const signatureOpacity = useTransform(progress, [0, .65], [1, 0]);
  const hintOpacity = useTransform(progress, [0, .15], [1, 0]);
  const [covered, setCovered] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  useLayoutEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = intro.current!.getBoundingClientRect().height;
      const value = Math.max(0, Math.min(1, 1 - collection.current!.getBoundingClientRect().top / height));
      progress.set(value);
      setCovered(value >= 1);
      setHintVisible(value < .15);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(intro.current!);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [progress]);
  useEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const restoring = navigation?.type === 'reload' || navigation?.type === 'back_forward';
    const position: unknown = history.state?.galleryScrollY;
    if (restoring && typeof position === 'number' && Number.isFinite(position)) {
      window.scrollTo(0, position);
    } else if (location.hash === '#collection') {
      collection.current?.scrollIntoView();
    }
    const savePosition = () => {
      history.replaceState({ ...history.state, galleryScrollY: scrollY }, '');
    };
    window.addEventListener('pagehide', savePosition);
    window.addEventListener('beforeunload', savePosition);
    return () => {
      window.removeEventListener('pagehide', savePosition);
      window.removeEventListener('beforeunload', savePosition);
    };
  }, []);
  useEffect(() => { document.title = '簡報 · Slides'; }, []);
  return <main className="gallery-page" data-ready="true">
    <section ref={intro} className="gallery-intro" aria-labelledby="intro-title" data-covered={covered} inert={covered}>
      <div className="intro-art" aria-hidden="true">
        <div className="intro-light"/>
        <div className="intro-grain"/>
      </div>
      <motion.h1 id="intro-title" className="intro-signature" style={{ opacity: reduced ? 1 : signatureOpacity }}>
        Dxnn1u<span className="intro-cursor" aria-hidden="true"/>
      </motion.h1>
      <motion.a className="intro-explore" href="#collection" tabIndex={hintVisible || reduced ? 0 : -1}
        style={{ opacity: reduced ? 1 : hintOpacity, pointerEvents: hintVisible || reduced ? 'auto' : 'none' }}
        onClick={event => {
          event.preventDefault();
          if (location.hash !== '#collection') history.pushState(null, '', '#collection');
          collection.current?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' });
          title.current?.focus({ preventScroll: true });
        }}>探索簡報<span aria-hidden="true">↓</span></motion.a>
    </section>
    <section ref={collection} id="collection" className="gallery-collection" aria-labelledby="collection-title">
      <header className="site-header"><div className="site-header-inner"><a href={sitePath()} className="site-brand" aria-label="Slides 首頁">Slides.</a></div></header>
      <div className="gallery-main">
        <h2 ref={title} id="collection-title" tabIndex={-1} className="collection-title">簡報</h2>
        <div className="deck-collection">{deckEntries.map((entry, index) => <DeckCard entry={entry} immediate={reduced || index < (desktop ? 2 : 1)} key={entry.id}/>)}</div>
      </div>
    </section>
  </main>;
}
