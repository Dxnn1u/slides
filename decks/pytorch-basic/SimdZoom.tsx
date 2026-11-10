import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/*
 * “Why we like ndarray” with a SIMD detour.
 *   step 0  the slide as usual
 *   step 1  the SIMD card is singled out
 *   step 2  the card grows into a full panel: what SIMD is
 *   step 3  vector registers and lanes
 *   step 4  why ndarray benefits
 *   step 5  the panel shrinks back into its card
 */
export const SIMD_ZOOM_STEPS = 6;

type Rect = { left: number; top: number; width: number; height: number };
/* The panel covers the whole slide except the footer; coordinates are relative to <main> (left 96, top 184). */
const EXPANDED: Rect = { left: -40, top: -150, width: 1488, height: 806 };

const reasons: [string, string][] = [
  ['Contiguous', 'homogeneous → one contiguous block of memory'],
  ['Compiled loops', 'loops run in C, not in the Python interpreter (vectorization)'],
  ['Cache friendly', 'neighbours in memory are loaded together'],
  ['SIMD', 'one instruction handles many numbers at once'],
];

export function NdArraySlide({ step, left }: { step: number; left: ReactNode }) {
  const card = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  useLayoutEffect(() => {
    const el = card.current;
    if (el) setRect({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
  }, []);
  const open = step >= 2 && step <= 4;
  const focus = step === 1;
  return <>
    <div className="pb-two" data-dim={open}>
      <div>{left}</div>
      <div>
        <h3 className="pb-h3">Why it is fast</h3>
        <div className="pb-reasons" data-focus={focus}>
          {reasons.map(([h, p], i) => {
            const simd = i === 3;
            return <div key={h} ref={simd ? card : undefined} data-simd={simd} data-done={simd && step >= 5}>
              <h3>{h}{simd && step >= 5 && <span className="pb-done-badge">✓ covered</span>}</h3>
              <p>{p}</p>
              {simd && <span className="pb-zoom-hint" data-on={focus}>zoom in ↗</span>}
            </div>;
          })}
        </div>
      </div>
    </div>
    {rect && <div className="pb-zoom" data-open={open} style={open ? EXPANDED : rect} aria-hidden={!open}>
      <div className="pb-zoom-inner" data-on={open}>
        <p className="pb-crumb">Why we like ndarray <b>›</b> SIMD</p>
        <div className="pb-zoom-page" key={step}>
          {step === 2 && <SimdWhat/>}
          {step === 3 && <SimdRegisters/>}
          {step === 4 && <SimdNdarray/>}
        </div>
      </div>
    </div>}
  </>;
}

const lanes = Array.from({ length: 8 }, (_, i) => i);

function Reg({ name, tone = '' }: { name: string; tone?: string }) {
  return <div className={`pb-zreg ${tone}`}><label>{name}</label>{lanes.map(i => <i key={i}>{name}{i}</i>)}</div>;
}

function SimdWhat() {
  return <>
    <h1>What is SIMD?</h1>
    <p className="pb-zoom-lead"><b>S</b>ingle <b>I</b>nstruction, <b>M</b>ultiple <b>D</b>ata — one CPU instruction does the <b>same operation</b> on <b>several numbers</b> at once.</p>
    <div className="pb-zwhat">
      <div className="pb-zcol">
        <span className="pb-tag">Normal instruction</span>
        <div className="pb-zscalar"><i>a0</i><b>+</b><i>b0</i><b>→</b><i className="pb-zout">c0</i></div>
        <p>1 instruction → <strong>1</strong> result</p>
      </div>
      <div className="pb-zcol pb-zcol-simd">
        <span className="pb-tag pb-tag-blue">SIMD instruction</span>
        <div className="pb-zstack">
          <Reg name="a"/>
          <div className="pb-zplus">+</div>
          <Reg name="b"/>
          <div className="pb-zplus">↓</div>
          <Reg name="c" tone="pb-zreg-out"/>
        </div>
        <p>1 instruction → <strong>8</strong> results</p>
      </div>
    </div>
  </>;
}

function SimdRegisters() {
  return <>
    <h1>Where do the 8 numbers live?</h1>
    <p className="pb-zoom-lead">In a wide <b>vector register</b> inside the CPU, split into equal slots called <b>lanes</b>.</p>
    <div className="pb-zbits">
      <div className="pb-zbits-ruler"><span>bit 255</span><span>256-bit register (AVX2)</span><span>bit 0</span></div>
      <div className="pb-zbits-bar">{lanes.map(i => <i key={i}><b>lane {7 - i}</b><span>fp32 · 32 bit</span></i>)}</div>
    </div>
    <div className="pb-zwidths">
      <div><span>SSE / ARM NEON</span><b>128-bit</b><em>4 × fp32</em></div>
      <div data-key="true"><span>AVX2</span><b>256-bit</b><em>8 × fp32</em></div>
      <div><span>AVX-512</span><b>512-bit</b><em>16 × fp32</em></div>
    </div>
    <p className="pb-zoom-note">Smaller dtype → more lanes: the same 256-bit register holds 16 × bf16 or 32 × int8.</p>
  </>;
}

function SimdNdarray() {
  const memory = Array.from({ length: 16 }, (_, i) => i);
  return <>
    <h1>Why ndarray benefits</h1>
    <p className="pb-zoom-lead">One load instruction fills a register with <b>neighbouring</b> elements — so the data must sit <b>next to each other in memory</b>.</p>
    <div className="pb-zmem">
      <div className="pb-zmem-row"><label>ndarray</label><div>{memory.map(i => <i key={i} data-hit={i < 8}>x{i}</i>)}</div></div>
      <div className="pb-zmem-load"><span>one load ↓</span></div>
      <div className="pb-zmem-row"><label>register</label><div className="pb-zmem-reg">{lanes.map(i => <i key={i}>x{i}</i>)}</div></div>
    </div>
    <div className="pb-zcompare">
      <div><span className="pb-tag pb-tag-teal">ndarray / tensor</span><p>homogeneous, contiguous → SIMD-friendly</p></div>
      <div><span className="pb-tag">Python list</span><p>each element is a separate object somewhere in memory → no single load</p></div>
    </div>
    <p className="pb-zoom-note">NumPy and PyTorch kernels use SIMD for you — as long as you write <code>x + y</code>, not a Python loop.</p>
  </>;
}
