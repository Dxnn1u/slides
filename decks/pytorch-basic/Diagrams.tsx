import type { ReactNode } from 'react';
import { Code } from './Code';

/* ------------------------------------------------------------------ Storage */

const CELL = 96, GAP = 8, STRIP_X = (1408 - (12 * CELL + 11 * GAP)) / 2;
const cx = (i: number) => STRIP_X + i * (CELL + GAP) + CELL / 2;
const left = (i: number) => STRIP_X + i * (CELL + GAP);

function Arc({ from, to, y, h, label, tone, labelDy = 0 }:
  { from: number; to: number; y: number; h: number; label: string; tone: string; labelDy?: number }) {
  const x1 = cx(from), x2 = cx(to), mid = (x1 + x2) / 2;
  return <g className={`pb-arc pb-tone-${tone}`}>
    <path d={`M${x1} ${y} Q${mid} ${y - h} ${x2 - 4} ${y - 4}`} markerEnd={`url(#pb-arrow-${tone})`}/>
    <text x={mid} y={y - h / 2 - 14 + labelDy} textAnchor="middle">{label}</text>
  </g>;
}

function Markers() {
  return <defs>{['purple', 'teal', 'blue'].map(tone =>
    <marker key={tone} id={`pb-arrow-${tone}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" className={`pb-tone-${tone}`} fill="currentColor"/>
    </marker>)}</defs>;
}

export function StorageScene({ step }: { step: number }) {
  const inY = (i: number) => step >= 2 && i >= 4 && i % 4 !== 0;
  const cellTone = (i: number) => {
    if (step === 3 && [5, 9, 10, 11].includes(i)) return i === 11 ? 'target' : 'path';
    if (inY(i)) return 'view';
    if (step === 1 && i === 0) return 'origin';
    if (step === 1 && i === 4) return 'purple';
    if (step === 1 && i === 1) return 'teal';
    return '';
  };
  const code = `x = torch.arange(12).view(3, 4)
x.stride()           # (4, 1)
y = x[1:, 1:]
y.storage_offset()   # 5
y[1, 2]              # 5 + 1×4 + 2×1 = 11`;
  return <div className="pb-storage">
    <div className="pb-storage-top">
      <Code source={code} visible={[1, 2, 4, 5][step]} title="python"/>
      <div className="pb-grid-wrap">
        <p className="pb-caption">{step >= 2 ? <>shape of <b>y</b>: (2, 3)</> : <>shape of <b>x</b>: (3, 4)</>}</p>
        <svg viewBox="0 0 312 234" className="pb-grid">
          {Array.from({ length: 12 }, (_, i) => {
            const r = Math.floor(i / 4), c = i % 4;
            return <g key={i} className={`pb-cell pb-cell-${cellTone(i) || 'plain'}`} data-out={step >= 2 && !inY(i)}>
              <rect x={c * 78 + 2} y={r * 78 + 2} width={74} height={74} rx={8}/>
              <text x={c * 78 + 39} y={r * 78 + 49} textAnchor="middle">{i}</text>
            </g>;
          })}
        </svg>
      </div>
      <dl className="pb-readout">
        <div><dt>stride</dt><dd>(4, 1)</dd></div>
        <div data-on={step >= 2}><dt>storage_offset</dt><dd>{step >= 2 ? 5 : 0}</dd></div>
        <div data-on={step >= 3}><dt>position</dt><dd>offset + i₀·4 + i₁·1</dd></div>
      </dl>
    </div>
    <svg viewBox="0 0 1408 330" className="pb-strip">
      <Markers/>
      <text x={1408 - STRIP_X} y={322} textAnchor="end" className="pb-strip-label">storage — one contiguous 1-D block</text>
      {step === 1 && <>
        <Arc from={0} to={4} y={150} h={150} label="+4 → next row (dim 0)" tone="purple"/>
        <Arc from={0} to={1} y={150} h={46} label="" tone="teal"/>
        <text x={cx(1) + 14} y={130} className="pb-arc-side pb-tone-teal">+1 → next column</text>
      </>}
      {step === 3 && <>
        <Arc from={5} to={9} y={150} h={100} label="i₀ = 1 → +4" tone="blue"/>
        <Arc from={9} to={11} y={150} h={60} label="i₁ = 2 → +2" tone="blue"/>
      </>}
      {Array.from({ length: 12 }, (_, i) => <g key={i} className={`pb-cell pb-cell-${cellTone(i) || 'plain'}`}>
        <rect x={left(i)} y={150} width={CELL} height={78} rx={8}/>
        <text x={cx(i)} y={200} textAnchor="middle">{i}</text>
        <text x={cx(i)} y={256} textAnchor="middle" className="pb-index">[{i}]</text>
      </g>)}
      {step >= 2 && <g className="pb-offset">
        <path d={`M${left(0)} 276 V290 H${left(5) - 2} V276`}/>
        <text x={(left(0) + left(5)) / 2} y={318} textAnchor="middle" className="pb-offset-label">storage_offset = 5</text>
      </g>}
    </svg>
  </div>;
}

/* ------------------------------------------------------------------ SIMD */

export function SimdScene({ step }: { step: number }) {
  const lanes = Array.from({ length: 8 }, (_, i) => i);
  return <div className="pb-simd">
    <div className="pb-simd-panel" data-active={step === 0}>
      <h3>Scalar</h3>
      <p className="pb-muted">one number per instruction</p>
      <div className="pb-scalar-ops">{lanes.map(i =>
        <div key={i}><span>a{i}</span><b>+</b><span>b{i}</span><em>add #{i + 1}</em></div>)}</div>
      <p className="pb-simd-count"><strong>8</strong> add instructions</p>
    </div>
    <div className="pb-simd-panel" data-active={step >= 1} data-pending={step < 1}>
      <h3>SIMD</h3>
      <p className="pb-muted">8 numbers packed into one 256-bit vector register</p>
      <div className="pb-vector">
        <div className="pb-reg"><label>a</label>{lanes.map(i => <span key={i}>a{i}</span>)}</div>
        <div className="pb-reg pb-reg-op"><label/>{lanes.map(i => <span key={i}>+</span>)}</div>
        <div className="pb-reg"><label>b</label>{lanes.map(i => <span key={i}>b{i}</span>)}</div>
        <div className="pb-reg pb-reg-out"><label>c</label>{lanes.map(i => <span key={i}>c{i}</span>)}</div>
      </div>
      <p className="pb-simd-count"><strong>1</strong> instruction · each slot is a <b>lane</b></p>
    </div>
  </div>;
}

/* ------------------------------------------------------------------ Float bit layout */

const BIT = 30;
export function BitLayout() {
  const rows = [
    { name: 'fp32', exp: 8, man: 23, note: 'PyTorch default' },
    { name: 'fp16', exp: 5, man: 10, note: 'small range, more precision' },
    { name: 'bf16', exp: 8, man: 7, note: 'fp32 range, less precision' },
  ];
  return <div className="pb-bits">
    {rows.map(r => <div className="pb-bits-row" key={r.name}>
      <div className="pb-bits-name"><strong>{r.name}</strong><span>{1 + r.exp + r.man} bits</span></div>
      <div className="pb-bits-bar">
        <div className="pb-bit-sign" style={{ width: BIT }}>S</div>
        <div className="pb-bit-exp" style={{ width: r.exp * BIT }}>exponent · {r.exp}</div>
        <div className="pb-bit-man" style={{ width: r.man * BIT }}>{r.man >= 7 ? `mantissa · ${r.man}` : r.man}</div>
      </div>
      <p className="pb-bits-note">{r.note}</p>
    </div>)}
    <div className="pb-bits-legend">
      <span><i className="pb-bit-sign"/>sign: + / −</span>
      <span><i className="pb-bit-exp"/>exponent: range (how big / small)</span>
      <span><i className="pb-bit-man"/>mantissa: precision (how many digits)</span>
    </div>
  </div>;
}

/* ------------------------------------------------------------------ Network */

type Layer = { label: string; sub: string; tone: 'gray' | 'purple' | 'teal' };
const layers: Layer[] = [
  { label: 'Input', sub: '784 pixels', tone: 'gray' },
  { label: 'Hidden 1', sub: '256 · ReLU', tone: 'purple' },
  { label: 'Hidden 2', sub: '128 · ReLU', tone: 'purple' },
  { label: 'Output', sub: '10 classes', tone: 'teal' },
];

export function NetworkDiagram({ width = 1408, loop = true, compact = false }: { width?: number; loop?: boolean; compact?: boolean }) {
  const colW = width / layers.length, ys = compact ? [40, 130, 290] : [50, 150, 330], r = compact ? 30 : 36;
  const xOf = (i: number) => colW * i + colW / 2;
  const netH = ys[2] + 2 * r + 24, boxY = netH, boxH = 90;
  const totalH = loop ? boxY + boxH + 236 : boxY + boxH + 10;
  const steps = [['Forward', 'model(x)'], ['Loss', 'criterion(logits, y)'], ['Backward', 'loss.backward()'], ['Update', 'optimizer.step()']];
  return <svg viewBox={`0 0 ${width} ${totalH}`} className="pb-network">
    <defs><marker id="pb-net-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#86868b"/></marker></defs>
    {layers.slice(0, -1).map((_, i) => ys.flatMap(y1 => ys.map(y2 =>
      <line key={`${i}-${y1}-${y2}`} x1={xOf(i) + r} y1={y1 + r} x2={xOf(i + 1) - r} y2={y2 + r} className="pb-edge"/>)))}
    {layers.map((layer, i) => <g key={layer.label} className={`pb-layer pb-layer-${layer.tone}`}>
      {ys.map(y => <circle key={y} cx={xOf(i)} cy={y + r} r={r}/>)}
      {[0, 1, 2].map(k => <circle key={k} cx={xOf(i)} cy={(ys[1] + ys[2]) / 2 + r - 26 + k * 26} r={4.5} className="pb-dot"/>)}
      <rect x={xOf(i) - 120} y={boxY} width={240} height={boxH} rx={14}/>
      <text x={xOf(i)} y={boxY + 40} textAnchor="middle" className="pb-layer-label">{layer.label}</text>
      <text x={xOf(i)} y={boxY + 72} textAnchor="middle" className="pb-layer-sub">{layer.sub}</text>
    </g>)}
    {loop && <g className="pb-loop">
      {steps.map(([name, code], i) => {
        const x = 30 + i * ((width - 60) / 4), w = (width - 60) / 4 - 70, y = boxY + boxH + 60;
        return <g key={name}>
          <rect x={x} y={y} width={w} height={100} rx={14}/>
          <text x={x + w / 2} y={y + 44} textAnchor="middle" className="pb-loop-name">{name}</text>
          <text x={x + w / 2} y={y + 76} textAnchor="middle" className="pb-loop-code">{code}</text>
          {i < 3 && <line x1={x + w + 10} y1={y + 50} x2={x + w + 58} y2={y + 50} markerEnd="url(#pb-net-arrow)" className="pb-loop-line"/>}
        </g>;
      })}
      {(() => {
        const w = (width - 60) / 4 - 70, y = boxY + boxH + 60, first = 30 + w / 2, last = 30 + 3 * ((width - 60) / 4) + w / 2;
        return <>
          <path d={`M${last} ${y + 100} V${y + 150} H${first} V${y + 108}`} className="pb-loop-line" markerEnd="url(#pb-net-arrow)" fill="none"/>
          <rect x={width / 2 - 150} y={y + 128} width={300} height={44} rx={22} className="pb-loop-pill"/>
          <text x={width / 2} y={y + 158} textAnchor="middle" className="pb-loop-code">repeat for every batch</text>
        </>;
      })()}
    </g>}
  </svg>;
}

/* ------------------------------------------------------------------ Activation plots */

const gelu = (x: number) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export const activations: { name: string; fn: (x: number) => number; use: string }[] = [
  { name: 'ReLU', fn: x => Math.max(0, x), use: 'the most commonly used' },
  { name: 'GELU', fn: gelu, use: 'GPT-2, BERT' },
  { name: 'SiLU', fn: x => x * sigmoid(x), use: 'Llama & most recent LLMs (in SwiGLU)' },
  { name: 'Tanh', fn: Math.tanh, use: 'RNN, early stage' },
  { name: 'Sigmoid', fn: sigmoid, use: 'binary classification, early stage' },
];

export function ActivationPlot({ fn }: { fn: (x: number) => number }) {
  const W = 240, H = 160, sx = (x: number) => (x + 4) / 8 * W, sy = (y: number) => H / 2 - y / 4 * H * 0.9;
  const d = Array.from({ length: 81 }, (_, i) => -4 + i * 0.1)
    .map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${Math.max(-10, sy(fn(x))).toFixed(1)}`).join(' ');
  return <svg viewBox={`0 0 ${W} ${H}`} className="pb-act-plot">
    <line x1={0} x2={W} y1={H / 2} y2={H / 2} className="pb-axis"/>
    <line x1={W / 2} x2={W / 2} y1={0} y2={H} className="pb-axis"/>
    <path d={d}/>
  </svg>;
}

/* ------------------------------------------------------------------ -log p */

export function NegLogPlot() {
  const W = 560, H = 340, pad = 50;
  const sx = (p: number) => pad + p * (W - pad - 20), sy = (l: number) => H - pad - l / 4 * (H - pad - 20);
  const d = Array.from({ length: 99 }, (_, i) => 0.02 + i * 0.01)
    .map((p, i) => `${i ? 'L' : 'M'}${sx(p).toFixed(1)} ${sy(Math.min(4, -Math.log(p))).toFixed(1)}`).join(' ');
  const marks = [[0.3, 'A'], [0.4, 'B'], [0.45, 'C'], [0.9, 'D']] as const;
  return <svg viewBox={`0 0 ${W} ${H}`} className="pb-neglog">
    <line x1={pad} x2={W - 10} y1={H - pad} y2={H - pad} className="pb-axis"/>
    <line x1={pad} x2={pad} y1={10} y2={H - pad} className="pb-axis"/>
    <path d={d} className="pb-neglog-line"/>
    {marks.map(([p, n]) => <g key={n}>
      <circle cx={sx(p)} cy={sy(-Math.log(p))} r={7}/>
      <text x={sx(p) + 12} y={sy(-Math.log(p)) - 10}>{n}</text>
    </g>)}
    <text x={W - 10} y={H - 14} textAnchor="end" className="pb-axis-label">p(correct) → 1</text>
    <text x={pad + 8} y={28} className="pb-axis-label">loss</text>
    <text x={pad} y={H - 14} textAnchor="middle" className="pb-axis-label">0</text>
  </svg>;
}

/* ------------------------------------------------------------------ Chain rule */

const chainNodes = [
  { id: 'x', label: 'x', fwd: '2' },
  { id: 'a', label: 'a = w₁x', fwd: '1' },
  { id: 'h', label: 'h = ReLU(a)', fwd: '1' },
  { id: 'z', label: 'z = w₂h', fwd: '4' },
  { id: 'L', label: 'L = (z − y)²', fwd: '9' },
];
const backRows: { goal: string; rule: ReactNode; calc: string; result: string; node?: string; weight?: string }[] = [
  { goal: '∂L/∂z', rule: '2(z − y)', calc: '2 × 3', result: '6', node: 'z' },
  { goal: '∂L/∂w₂', rule: '∂L/∂z · h', calc: '6 × 1', result: '6', weight: 'w2' },
  { goal: '∂L/∂h', rule: '∂L/∂z · w₂', calc: '6 × 4', result: '24', node: 'h' },
  { goal: '∂L/∂a', rule: '∂L/∂h · 𝟙[a > 0]', calc: '24 × 1', result: '24', node: 'a' },
  { goal: '∂L/∂w₁', rule: '∂L/∂a · x', calc: '24 × 2', result: '48', weight: 'w1' },
];

export function ChainRule({ step }: { step: number }) {
  const shown = Math.max(0, step - 1);
  const grads: Record<string, string> = {};
  backRows.slice(0, shown).forEach(r => { const k = r.node ?? r.weight; if (k) grads[k] = r.result; });
  const current = shown > 0 ? backRows[shown - 1] : undefined;
  const currentKey = current?.node ?? current?.weight;
  return <div className="pb-chain">
    <div className="pb-chain-graph">
      {chainNodes.map((n, i) => <div key={n.id} className="pb-chain-cell">
        <div className="pb-chain-node" data-current={currentKey === n.id}>
          <span>{n.label}</span>
          <b data-on={step >= 1}>{n.fwd}</b>
          <em data-on={!!grads[n.id]}>∂ {grads[n.id] ?? ''}</em>
        </div>
        {i < chainNodes.length - 1 && <div className="pb-chain-edge">
          {i === 0 && <span className="pb-chain-weight" data-current={currentKey === 'w1'}>× w₁ = 0.5<em data-on={!!grads.w1}>∂ {grads.w1 ?? ''}</em></span>}
          {i === 2 && <span className="pb-chain-weight" data-current={currentKey === 'w2'}>× w₂ = 4<em data-on={!!grads.w2}>∂ {grads.w2 ?? ''}</em></span>}
        </div>}
      </div>)}
    </div>
    <div className="pb-chain-bottom">
      <div className="pb-chain-given">
        <h3>Given</h3>
        <p>x = 2 · w₁ = 0.5 · w₂ = 4 · y = 1</p>
        <p className="pb-muted" data-on={step >= 1}>{step >= 1 ? 'Forward: a = 1 → h = 1 → z = 4 → L = 9' : ' '}</p>
      </div>
      <table className="pb-table pb-chain-table">
        <thead><tr><th>Goal</th><th>Chain rule</th><th>Calculation</th><th>Result</th></tr></thead>
        <tbody>{backRows.map((r, i) => <tr key={r.goal} data-on={i < shown} data-current={i === shown - 1}>
          <td>{r.goal}</td><td>{r.rule}</td><td>{r.calc}</td><td><strong>{r.result}</strong>{i === 0 && <span className="pb-shared"> reused ↓</span>}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
