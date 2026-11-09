import type { CSSProperties, ReactNode } from 'react';
import type { SlideRenderProps } from '../../src/presentation/types';

/** [id, title, steps]. Keep IDs stable: chapters, previews and saved progress refer to them. */
export const pages = [
  ['cover', 'Scaling with Collapse', 1],
  ['outline', '大綱', 1],
  ['problem', '小規模實驗，怎麼可靠地外推？', 1],
  ['claim', '論文的主張', 1],
  ['normalize', '每條曲線各自正規化', 1],
  ['collapse', 'Collapse：形狀相同，不是 loss 相同', 3],
  ['tau-ema', 'τ 從哪裡來？', 2],
  ['tau', 'τ 決定曲線形狀', 2],
  ['tpp', 'TPP 為什麼必須相同', 1],
  ['schedule', 'LR schedule 為什麼必須相同', 1],
  ['evidence', '證據、保證與前提', 1],
  ['lab6', '對 Lab6 的意義', 1],
  ['experiments', '我們的實驗規劃', 2],
] as const;

type PageId = typeof pages[number][0];

/* ---------- Sections: drive the header progress and the outline ---------- */

const sections = [
  { key: 'A', title: '問題', note: '為什麼要預測整條曲線', minutes: 0.7, pages: ['problem'] },
  { key: 'B', title: '論文的論證', note: '主張 → 正規化 → 三個機制 → 證據', minutes: 6.8, pages: ['claim', 'normalize', 'collapse', 'tau-ema', 'tau', 'tpp', 'schedule', 'evidence'] },
  { key: 'C', title: '對 Lab6 的意義', note: '條件核對與預測方法', minutes: 1.1, pages: ['lab6'] },
  { key: 'D', title: '實驗規劃', note: '事先登記的 E1–E4', minutes: 1.2, pages: ['experiments'] },
] as const;
const sectionIndex = (id: string) => sections.findIndex(s => (s.pages as readonly string[]).includes(id));

const paperHref = 'https://arxiv.org/abs/2509.25087';
const paperLabel = 'Bergsma et al., ICLR 2026';
const paperSlides = new Set<string>(['claim', 'normalize', 'collapse', 'tau-ema', 'tau', 'tpp', 'schedule', 'evidence']);

/* ---------- Charts: tiny, hand-rolled SVG helpers ---------- */

type Panel = { x: number; y: number; w: number; h: number; x0: number; x1: number; y0: number; y1: number; log?: boolean };
const px = (p: Panel, v: number) => p.log
  ? p.x + (Math.log10(v / p.x0) / Math.log10(p.x1 / p.x0)) * p.w
  : p.x + ((v - p.x0) / (p.x1 - p.x0)) * p.w;
const py = (p: Panel, v: number) => p.y + p.h - ((v - p.y0) / (p.y1 - p.y0)) * p.h;
const path = (p: Panel, points: [number, number][]) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${px(p, x).toFixed(1)} ${py(p, y).toFixed(1)}`).join(' ');
const range = (from: number, to: number, n: number) => Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1));

function Axes({ p, xTicks, yTicks, xLabel, yLabel }: {
  p: Panel; xTicks: [number, string][]; yTicks: [number, string][]; xLabel?: string; yLabel?: string;
}) {
  return <g className="sc-axes">
    <line x1={p.x} y1={p.y + p.h} x2={p.x + p.w} y2={p.y + p.h}/>
    <line x1={p.x} y1={p.y} x2={p.x} y2={p.y + p.h}/>
    {xTicks.map(([v, t]) => <text key={`x${v}`} x={px(p, v)} y={p.y + p.h + 32} textAnchor="middle">{t}</text>)}
    {yTicks.map(([v, t]) => <text key={`y${v}`} x={p.x - 14} y={py(p, v) + 8} textAnchor="end">{t}</text>)}
    {xLabel && <text className="sc-axis-label" x={p.x + p.w / 2} y={p.y + p.h + 70} textAnchor="middle">{xLabel}</text>}
    {yLabel && <text className="sc-axis-label" x={p.x + 10} y={p.y - 6}>{yLabel}</text>}
  </g>;
}

/** Universal normalized shape under a decay-to-zero schedule (synthetic). */
const shape = (t: number, a = 0.12, b = 0.06) => 1 + a * ((t + 0.04) ** -0.55 - 1.04 ** -0.55) + b * (1 - t);
const misScaled = (t: number) => shape(t, 0.19, 0.015);
const samples = range(0.05, 1, 64);
const family = [
  { label: '150M', tokens: 30, final: 3.45, color: '#a3acdf' },
  { label: '300M', tokens: 60, final: 3.15, color: '#8c98da' },
  { label: '500M', tokens: 100, final: 2.93, color: '#5f6ecf' },
  { label: '1B', tokens: 200, final: 2.66, color: '#3f51c7' },
];

const Schematic = () => <span className="sc-schematic">示意圖：合成曲線，不是實驗數據</span>;

/* ---------- MathML building blocks ---------- */

const That = () => <mover accent="true"><mi>t</mi><mo>^</mo></mover>;
const Sub = ({ base, sub }: { base: ReactNode; sub: ReactNode }) => <msub>{base}{sub}</msub>;
const Frac = ({ top, bottom }: { top: ReactNode; bottom: ReactNode }) => <mfrac><mrow>{top}</mrow><mrow>{bottom}</mrow></mfrac>;
const Txt = ({ children }: { children: string }) => <mi mathvariant="normal">{children}</mi>;
const Lfinal = () => <Sub base={<mi>L</mi>} sub={<Txt>final</Txt>}/>;
const Lt = () => <><mi>L</mi><mo>(</mo><That/><mo>)</mo></>;
const Lhat = () => <mover accent="true"><mi>L</mi><mo>^</mo></mover>;

/* ---------- A. Problem ---------- */

function Outline() {
  return <ol className="sc-outline">
    {sections.map(s => <li key={s.key} data-main={s.key === 'B'}>
      <span className="sc-outline-key">{s.key}</span>
      <div><h2>{s.title}</h2><p>{s.note}</p></div>
    </li>)}
  </ol>;
}

function Problem() {
  return <div className="sc-problem">
    <div className="sc-columns sc-three">
      <div><span className="sc-index">Lab6</span><h2>只有小 run 的機會</h2><p>約 60 次小規模實驗，<br/>要在開跑前預測 1B／200B。</p></div>
      <div><span className="sc-index">Cerulean</span><h2>Cerulean 的目標</h2><p>1B 對標 Qwen3-4B，<br/>同時降低對 CUDA 的依賴。</p></div>
      <div><span className="sc-index">Scaling law</span><h2>只預測一個點</h2><p>擬合的是終點的 loss，<br/>看不到訓練過程。</p></div>
    </div>
    <p className="sc-question">能不能預測<b>整條</b>訓練曲線？</p>
  </div>;
}

/* ---------- B. The paper's argument ---------- */

function Spark({ curves, tone }: { curves: ((t: number) => number)[]; tone: 'bad' | 'good' }) {
  const p: Panel = { x: 8, y: 10, w: 300, h: 130, x0: 0.05, x1: 1, y0: 0.98, y1: 1.62 };
  return <svg className="sc-spark" viewBox="0 0 320 150" aria-hidden="true" data-tone={tone}>
    <line className="sc-spark-axis" x1={p.x} y1={p.y + p.h} x2={p.x + p.w} y2={p.y + p.h}/>
    {curves.map((f, i) => <path key={i} d={path(p, samples.map(t => [t, f(t)]))} style={{ opacity: 0.55 + 0.15 * i }}/>)}
  </svg>;
}

function Claim() {
  return <div className="sc-claim">
    <p className="sc-claim-line">在 μP 下，只要各規模的</p>
    <div className="sc-chips">
      <span><b>TPP</b>相同</span><i>＋</i><span><b>τ</b>相同</span><i>＋</i><span><b>LR schedule</b>相同</span>
      <i>⇒</i><strong>正規化後的 loss curve 疊成同一條</strong>
    </div>
    <p className="sc-small sc-claim-note">最佳 τ 只取決於 TPP，所以各規模的 τ 取最佳值時，自然就相同。</p>
    <div className="sc-contrast-cards">
      <div data-tone="bad"><Spark tone="bad" curves={[t => shape(t, 0.09, 0.08), t => shape(t, 0.13, 0.05), t => shape(t, 0.18, 0.02)]}/>
        <div><b>Llama-2</b><span>各規模 TPP 不同，τ ≈ 0.07／0.13</span><strong>不塌縮</strong></div></div>
      <div data-tone="good"><Spark tone="good" curves={[shape, t => shape(t) + 0.004, t => shape(t) - 0.003, t => shape(t) + 0.002]}/>
        <div><b>Celerity</b><span>300M–3.9B 全部 234 TPP、τ = 0.05</span><strong>塌縮</strong></div></div>
    </div>
    <Schematic/>
  </div>;
}

function Normalize() {
  const raw: Panel = { x: 150, y: 24, w: 380, h: 190, x0: 0, x1: 120, y0: 2.6, y1: 4.4 };
  const nrm: Panel = { x: 900, y: 24, w: 380, h: 190, x0: 0, x1: 1, y0: 0.95, y1: 1.45 };
  const Lend = 3.0, D = 100;
  return <div className="sc-normalize">
    <svg viewBox="0 0 1440 260" className="sc-normalize-figure" role="img" aria-label="一條 loss curve 正規化前後">
      <Axes p={raw} xTicks={[[0, '0'], [D, 'D_total']]} yTicks={[[Lend, 'L_final']]} yLabel="loss"/>
      <line className="sc-guide" x1={px(raw, D)} y1={py(raw, Lend)} x2={px(raw, D)} y2={raw.y + raw.h}/>
      <line className="sc-guide" x1={raw.x} y1={py(raw, Lend)} x2={px(raw, D)} y2={py(raw, Lend)}/>
      <path className="sc-curve" d={path(raw, samples.map(t => [t * D, Lend * shape(t)]))}/>
      <circle className="sc-dot" cx={px(raw, D)} cy={py(raw, Lend)} r={8}/>
      <g className="sc-arrow">
        <line x1={600} y1={120} x2={810} y2={120}/><path d="M802 110 L820 120 L802 130 Z"/>
        <text x={710} y={92} textAnchor="middle">橫軸 ÷ D_total</text>
        <text x={710} y={166} textAnchor="middle">縱軸 ÷ L_final</text>
      </g>
      <Axes p={nrm} xTicks={[[0, '0'], [1, '1']]} yTicks={[[1, '1']]} yLabel="ℓ"/>
      <line className="sc-guide" x1={px(nrm, 1)} y1={py(nrm, 1)} x2={px(nrm, 1)} y2={nrm.y + nrm.h}/>
      <line className="sc-guide" x1={nrm.x} y1={py(nrm, 1)} x2={px(nrm, 1)} y2={py(nrm, 1)}/>
      <path className="sc-curve" d={path(nrm, samples.map(t => [t, shape(t)]))}/>
      <circle className="sc-dot" cx={px(nrm, 1)} cy={py(nrm, 1)} r={8}/>
    </svg>
    <div className="sc-formulas">
      <math display="block" aria-label="t hat 等於已訓練 tokens 除以總 tokens">
        <That/><mo>=</mo><Frac top={<Sub base={<mi>D</mi>} sub={<Txt>seen</Txt>}/>} bottom={<Sub base={<mi>D</mi>} sub={<Txt>total</Txt>}/>}/>
      </math>
      <math display="block" aria-label="ell of t hat 等於 L of t hat 除以 L final">
        <mi>ℓ</mi><mo>(</mo><That/><mo>)</mo><mo>=</mo><Frac top={<Lt/>} bottom={<Lfinal/>}/>
      </math>
    </div>
    <ol className="sc-chiprow">
      <li><b>平滑</b><span>train loss 做 100 step 移動平均，壓小 batch 的雜訊</span></li>
      <li><b>offset</b><span>一般式會減掉 <math><Lhat/></math>，論文用 <math><Lhat/><mo>=</mo><mn>0</mn></math></span></li>
      <li><b>內插</b><span>各規模內插到同一組 <math><That/></math></span></li>
      <li><b>殘差</b><span>和 seed 之間的雜訊比較</span></li>
    </ol>
  </div>;
}

const collapseCaptions = [
  '原始曲線：模型越大、訓練越久，loss 越低，長度和高度都不同。',
  '每條曲線各自正規化之後，疊成同一條。',
  'τ 沒有正確縮放的成員，即使終點一樣，路徑也對不上。',
];

function CollapseFigure({ step }: { step: number }) {
  const raw: Panel = { x: 90, y: 30, w: 560, h: 360, x0: 1, x1: 300, y0: 2.4, y1: 5.2, log: true };
  const norm: Panel = { x: 830, y: 30, w: 560, h: 360, x0: 0, x1: 1, y0: 0.95, y1: 1.6 };
  return <figure className="sc-collapse" data-step={step}>
    <svg viewBox="0 0 1440 480" role="img" aria-label="示意圖：原始 loss 曲線與正規化後的塌縮曲線">
      <g className="sc-panel" data-on="true">
        <Axes p={raw} xLabel="訓練 tokens（B，log 軸）" yLabel="train loss"
          xTicks={[[1, '1'], [3, '3'], [10, '10'], [30, '30'], [100, '100'], [300, '300']]}
          yTicks={[[2.5, '2.5'], [3.5, '3.5'], [4.5, '4.5']]}/>
        {family.map(m => <path key={m.label} className="sc-curve"
          d={path(raw, samples.map(t => [t * m.tokens, m.final * shape(t)]))} style={{ stroke: m.color }}/>)}
        <g className="sc-legend">{family.map((m, i) => <g key={m.label} transform={`translate(${raw.x + raw.w - 150} ${raw.y + 20 + i * 36})`}>
          <line x1={0} y1={-8} x2={36} y2={-8} style={{ stroke: m.color }}/>
          <text x={50} y={0} style={{ fill: m.color }}>{m.label}</text>
        </g>)}</g>
      </g>
      <g className="sc-panel" data-on={step >= 1}>
        <Axes p={norm} xLabel="訓練進度 t̂" yLabel="ℓ = L / L_final"
          xTicks={[[0, '0'], [0.25, '.25'], [0.5, '.5'], [0.75, '.75'], [1, '1']]}
          yTicks={[[1, '1.0'], [1.2, '1.2'], [1.4, '1.4']]}/>
        {family.map(m => <path key={m.label} className="sc-curve sc-curve-thin"
          d={path(norm, samples.map(t => [t, shape(t)]))} style={{ stroke: m.color }}/>)}
        <text className="sc-curve-label" x={px(norm, 0.62)} y={py(norm, 1.13)} style={{ fill: 'var(--sc-blue)' }}>四條曲線重合</text>
        <g className="sc-mis" data-on={step >= 2}>
          <path className="sc-curve sc-curve-mis" d={path(norm, samples.map(t => [t, misScaled(t)]))}/>
          <text className="sc-curve-label sc-mis-label" x={px(norm, 0.14)} y={py(norm, 1.47)}>τ 設錯的 300M</text>
        </g>
      </g>
    </svg>
    <figcaption><span className="sc-caption">{collapseCaptions[step]}</span><Schematic/></figcaption>
  </figure>;
}

function Rail({ items, step }: { items: readonly string[]; step: number }) {
  return <ol className="sc-rail" aria-hidden="true">
    {items.map((c, i) => <li key={c} data-on={step >= i} data-current={step === i}>{c}</li>)}
  </ol>;
}

function TauEma({ step }: { step: number }) {
  const theta = (sub: ReactNode) => <Sub base={<mi>θ</mi>} sub={sub}/>;
  const prev = <mrow><mi>t</mi><mo>−</mo><mn>1</mn></mrow>;
  return <div className="sc-mech">
    <Rail items={['更新式', '時間尺度']} step={step}/>
    <div className="sc-mech-stage">
      {step === 0 && <div className="sc-mech-block">
        <p className="sc-lead">AdamW 每一步的更新（u<sub>t</sub> 是 Adam 算出的方向）可以改寫成：</p>
        <math display="block" className="sc-math-lg" aria-label="AdamW 更新改寫成指數移動平均">
          <mtable>
            <mtr><mtd>{theta(<mi>t</mi>)}</mtd><mtd><mo>=</mo></mtd><mtd>{theta(prev)}<mo>−</mo><mi>η</mi><mi>λ</mi>{theta(prev)}<mo>−</mo><mi>η</mi><Sub base={<mi>u</mi>} sub={<mi>t</mi>}/></mtd></mtr>
            <mtr><mtd/><mtd><mo>=</mo></mtd><mtd><mo>(</mo><mn>1</mn><mo>−</mo><mi className="sc-hl">η</mi><mi className="sc-hl">λ</mi><mo>)</mo>{theta(prev)}<mo>+</mo><mi className="sc-hl">η</mi><mi className="sc-hl">λ</mi><mo>·</mo><mrow><mo>(</mo><mo>−</mo><Frac top={<Sub base={<mi>u</mi>} sub={<mi>t</mi>}/>} bottom={<mi>λ</mi>}/><mo>)</mo></mrow></mtd></mtr>
          </mtable>
        </math>
        <div className="sc-note">
          <p><b>這就是 EMA</b>：新值 = (1 − α)·舊值 + α·新觀測，係數 <math><mi>α</mi><mo>=</mo><mi>η</mi><mi>λ</mi></math></p>
          <p>AdamW 的權重，就是「−u／λ」的指數移動平均。</p>
        </div>
      </div>}
      {step === 1 && <div className="sc-mech-block">
        <math display="block" className="sc-math-lg" aria-label="tau iter 等於 1 除以 eta lambda；tau 等於 tau iter 除以 T，等於 B 除以 eta lambda D">
          <mtable>
            <mtr><mtd><Sub base={<mi>τ</mi>} sub={<Txt>iter</Txt>}/></mtd><mtd><mo>=</mo></mtd><mtd><Frac top={<mn>1</mn>} bottom={<><mi>η</mi><mi>λ</mi></>}/></mtd></mtr>
            <mtr><mtd><mi className="sc-hl">τ</mi></mtd><mtd><mo>=</mo></mtd><mtd><Frac top={<Sub base={<mi>τ</mi>} sub={<Txt>iter</Txt>}/>} bottom={<mi>T</mi>}/><mo>=</mo><Frac top={<mi>B</mi>} bottom={<><mi>η</mi><mi>λ</mi><mi>D</mi></>}/></mtd></mtr>
          </mtable>
        </math>
        <div className="sc-terms">
          <div><b>τ<sub>iter</sub></b><span>以步數計：權重大約記得最近 1／(ηλ) 步</span></div>
          <div><b>τ</b><span>除以總步數 T = D／B：記得整個訓練的多大比例</span></div>
        </div>
        <p className="sc-small">例：η = 3×10⁻⁴、λ = 0.1、T = 50,000 步 → τ ≈ 0.67（η 要用 μP 調整後的值）。τ 不是 AdamW 的超參數，而是 η、λ、B、D 的組合；也不同於只記得幾十步梯度統計的 β₁、β₂。</p>
      </div>}
    </div>
  </div>;
}

function Tau({ step }: { step: number }) {
  const e = <msup><mi>e</mi><mrow><mo>−</mo><mn>2</mn><That/><mo>/</mo><mi>τ</mi></mrow></msup>;
  const half = <Frac top={<mn>1</mn>} bottom={<mn>2</mn>}/>;
  return <div className="sc-mech">
    <Rail items={['bias／variance', 'h 被約掉']} step={step}/>
    <div className="sc-mech-stage">
      {step === 0 && <div className="sc-mech-block">
        <p className="sc-lead">noisy quadratic model 下的期望 loss：</p>
        <math display="block" className="sc-math-lg" aria-label="noisy quadratic model 下 loss 的期望值">
          <mi mathvariant="normal">E</mi><mo>[</mo><Lt/><mo>]</mo><mo>=</mo>{half}<mi className="sc-h">h</mi>
          <mrow><mo>[</mo>{e}<mo>·</mo><mi mathvariant="normal">E</mi><mo>[</mo><msubsup><mi>θ</mi><mn>0</mn><mn>2</mn></msubsup><mo>]</mo><mo>+</mo>
            <Frac top={<msup><mi>σ</mi><mn>2</mn></msup>} bottom={<><mn>2</mn><mi>τ</mi></>}/><mo>(</mo><mn>1</mn><mo>−</mo>{e}<mo>)</mo><mo>]</mo></mrow>
        </math>
        <div className="sc-terms">
          <div><b>bias</b><span>初始化偏差，隨 t̂／τ 指數衰減</span></div>
          <div><b>variance</b><span>梯度雜訊的下限，約和 1／τ 成正比</span></div>
        </div>
        <ul className="sc-cases">
          <li><b>Constant LR</b><span>τ 小，前期降得快，但停在比較高的地方</span></li>
          <li><b>Linear D2Z</b><span>效果反過來：τ 小，後期掉得更多；τ 大，前期掉得更多</span></li>
        </ul>
      </div>}
      {step === 1 && <div className="sc-mech-block">
        <math display="block" className="sc-math-lg" aria-label="L of t hat 除以 L of 1，曲率 h 約掉，只剩 g of t hat 與 tau">
          <Frac top={<Lt/>} bottom={<><mi>L</mi><mo>(</mo><mn>1</mn><mo>)</mo></>}/><mo>=</mo>
          <Frac top={<>{half}<mi className="sc-h">h</mi><mo>·</mo><mi>g</mi><mo>(</mo><That/><mo>;</mo><mi>τ</mi><mo>)</mo></>} bottom={<>{half}<mi className="sc-h">h</mi><mo>·</mo><mi>g</mi><mo>(</mo><mn>1</mn><mo>;</mo><mi>τ</mi><mo>)</mo></>}/>
          <mo>=</mo><Frac top={<><mi>g</mi><mo>(</mo><That/><mo>;</mo><mi>τ</mi><mo>)</mo></>} bottom={<><mi>g</mi><mo>(</mo><mn>1</mn><mo>;</mo><mi>τ</mi><mo>)</mo></>}/>
        </math>
        <h2>曲率 h 只是外面的倍數，除以最終 loss 就約掉</h2>
        <p className="sc-small">模型大小造成的差異只會等比例縮放曲線；剩下的形狀只由 τ 和 t̂ 決定（前提：訓練結束時 bias 可忽略）。</p>
      </div>}
    </div>
  </div>;
}

/** ℓ(t̂) for the Chinchilla form at fixed TPP k, with E subtracted (α = β, A = 1, B = 8). */
const tppShape = (t: number, k: number) => (1 + 8 * k ** -0.3 * t ** -0.3) / (1 + 8 * k ** -0.3);

function Tpp() {
  const p: Panel = { x: 70, y: 20, w: 470, h: 300, x0: 0, x1: 1, y0: 1, y1: 2.2 };
  const ks = [{ k: 20, c: '#c4613f' }, { k: 80, c: '#8c98da' }, { k: 200, c: '#3f51c7' }];
  const N = <msup><mi className="sc-h">N</mi><mrow><mo>−</mo><mi>α</mi></mrow></msup>;
  const k = <mi className="sc-hl">k</mi>;
  const ka = <msup>{k}<mrow><mo>−</mo><mi>α</mi></mrow></msup>;
  const ta = <msup><That/><mrow><mo>−</mo><mi>α</mi></mrow></msup>;
  return <div className="sc-tpp">
    <div className="sc-tpp-math">
      <p className="sc-lead">Constant LR 下，訓練到 t̂ 的那一點，就是一個只訓練 t̂·k·N 個 token 的完整訓練的終點（k = TPP）。代入 Chinchilla 形式（取 α = β）：</p>
      <math display="block" className="sc-math-md" aria-label="代入 Chinchilla 形式後，N 被約掉，只剩 TPP k">
        <mtable>
          <mtr><mtd><Lt/></mtd><mtd><mo>=</mo></mtd><mtd><mi>E</mi><mo>+</mo><mi>A</mi>{N}<mo>+</mo><mi>B</mi><msup><mrow><mo>(</mo><That/><mo>·</mo>{k}<mo>·</mo><mi className="sc-h">N</mi><mo>)</mo></mrow><mrow><mo>−</mo><mi>α</mi></mrow></msup></mtd></mtr>
          <mtr><mtd/><mtd><mo>=</mo></mtd><mtd><mi>E</mi><mo>+</mo>{N}<mo>·</mo><mo>[</mo><mi>A</mi><mo>+</mo><mi>B</mi>{ka}{ta}<mo>]</mo></mtd></mtr>
          <mtr><mtd><Frac top={<><Lt/><mo>−</mo><mi>E</mi></>} bottom={<><mi>L</mi><mo>(</mo><mn>1</mn><mo>)</mo><mo>−</mo><mi>E</mi></>}/></mtd><mtd><mo>=</mo></mtd><mtd><Frac top={<><mi>A</mi><mo>+</mo><mi>B</mi>{ka}{ta}</>} bottom={<><mi>A</mi><mo>+</mo><mi>B</mi>{ka}</>}/></mtd></mtr>
        </mtable>
      </math>
      <div className="sc-terms">
        <div><b className="sc-h-text">N 被約掉</b><span>不同大小的模型，形狀一樣</span></div>
        <div><b>k 留下來</b><span>TPP 不同，形狀就不同</span></div>
      </div>
    </div>
    <figure className="sc-tpp-figure">
      <svg viewBox="0 0 600 400" role="img" aria-label="示意圖：不同 TPP 的正規化曲線形狀不同">
        <Axes p={p} xLabel="訓練進度 t̂" xTicks={[[0, '0'], [0.5, '.5'], [1, '1']]} yTicks={[[1, '1.0'], [1.5, '1.5'], [2, '2.0']]}/>
        {ks.map(({ k: kv, c }) => <path key={kv} className="sc-curve" style={{ stroke: c }} d={path(p, range(0.04, 1, 60).map(t => [t, tppShape(t, kv)]))}/>)}
        {ks.map(({ k: kv, c }, i) => <text key={`l${kv}`} className="sc-curve-label" x={360} y={70 + i * 34} style={{ fill: c }}>TPP = {kv}</text>)}
      </svg>
      <figcaption><span>推導時取 L̂ = E；論文實務上用 L̂ = 0。</span><Schematic/></figcaption>
    </figure>
  </div>;
}

/** LR multipliers on t̂ ∈ [0, 1]: 10% warmup (as in the paper), then the decay shape. */
const warm = (t: number, f: (t: number) => number) => (t < 0.1 ? t / 0.1 : f(t));
const schedules = [
  { name: 'Linear D2Z（論文用）', c: '#3f51c7', f: (t: number) => warm(t, x => (1 - x) / 0.9) },
  { name: 'Cosine', c: '#8c98da', f: (t: number) => warm(t, x => 0.5 * (1 + Math.cos(Math.PI * (x - 0.1) / 0.9))) },
  { name: 'WSD', c: '#1d8a6b', f: (t: number) => warm(t, x => (x < 0.8 ? 1 : (1 - x) / 0.2)) },
];

function Schedule() {
  const p: Panel = { x: 70, y: 60, w: 560, h: 260, x0: 0, x1: 1, y0: 0, y1: 1.08 };
  return <div className="sc-schedule">
    <figure>
      <svg viewBox="0 0 680 420" role="img" aria-label="三種 LR schedule 的形狀">
        <rect className="sc-phase" x={px(p, 0.7)} y={p.y} width={px(p, 1) - px(p, 0.7)} height={p.h}/>
        <text className="sc-phase-label" x={px(p, 0.85)} y={p.y - 12} textAnchor="middle">後期：壓 variance</text>
        <text className="sc-phase-label sc-phase-early" x={px(p, 0.35)} y={p.y - 12} textAnchor="middle">前期：降 bias</text>
        <Axes p={p} xLabel="訓練進度 t̂" xTicks={[[0, '0'], [0.5, '.5'], [0.8, '.8'], [1, '1']]} yTicks={[[0, '0'], [1, '1']]}/>
        {schedules.map(s => <path key={s.name} className="sc-curve" style={{ stroke: s.c }} d={path(p, range(0, 1, 200).map(t => [t, s.f(t)]))}/>)}
      </svg>
      <figcaption className="sc-legend-row">{schedules.map(s => <span key={s.name}><i style={{ background: s.c }}/>{s.name}</span>)}</figcaption>
    </figure>
    <ol className="sc-points">
      <li><b>前期 LR 高</b><span>權重快速離開初始值，bias 降得快，但雜訊大</span></li>
      <li><b>後期 LR 降</b><span>瞬時 τ<sub>t</sub> 變大，雜訊被平均掉，loss 急降</span></li>
      <li><b>μP 下與規模無關</b><span>schedule 造成的形變對每個規模都一樣，只要形狀相同</span></li>
      <li><b>warmup 用比例</b><span>Celerity 的 warmup 有 375M token 上限，各規模比例不同，20 TPP 前段就出現小偏差</span></li>
    </ol>
  </div>;
}

function Evidence() {
  return <div className="sc-evidence">
    <div className="sc-columns sc-three">
      <div><span className="sc-index">實驗</span><h3>三個因素確實決定形狀</h3><ul>
        <li>610M：同一個 τ，改 η、λ 或 B，曲線一起移動</li>
        <li>固定 τ 改 TPP：TPP 越高，越早變平</li>
        <li>Celerity 300M–3.9B、20／80／234 TPP 三組：都塌縮</li>
      </ul></div>
      <div><span className="sc-index">保證</span><h3>為什麼一定會塌縮</h3>
        <ol className="sc-chain">
          <li>最佳 τ 只取決於 TPP <em>（Power Lines）</em></li>
          <li>固定 TPP ⇒ 各規模最佳 τ 相同</li>
          <li>再固定 schedule ⇒ 三個條件都滿足</li>
          <li className="sc-chain-end">⇒ 塌縮</li>
        </ol></div>
      <div><span className="sc-index">應用</span><h3>從現象變成工具</h3><ul>
        <li>1.8B：殘差把問題定位在 <b>60%</b>，原始曲線要到 90% 後才看得出</li>
        <li>111M 擬合曲線形式，外推 3.3B（約 1000 倍 FLOPs）</li>
        <li>λ sweep：1.7B 看 30%、3.3B 看 10%，就選對最佳值</li>
      </ul></div>
    </div>
    <p className="sc-premise"><span>前提</span>μP／CompleteP · AdamW · 單一 epoch · 超參數是該資料預算下的最佳值 · 訓練結束時 bias 可忽略 · loss 呈 power law</p>
  </div>;
}

/* ---------- C. Lab6 ---------- */

const checks = [
  ['TPP 相同', 'lab 規定 200 TPP', '已滿足', 'done'],
  ['LR schedule 相同', '各規模同一種（待討論），warmup 用比例', '要決定', 'todo'],
  ['τ 相同', '150M 掃 τ 取最佳，中心 0.05（Celerity）', '要實驗', 'todo'],
  ['μP', 'param groups、logit multiplier；ladder 改層數就考慮 CompleteP', '要實作', 'todo'],
] as const;

function Lab6() {
  return <div className="sc-lab6">
    <table className="sc-table sc-checks" aria-label="Lab6 條件核對">
      <thead><tr><th scope="col">塌縮的條件</th><th scope="col">Lab6 的做法</th><th scope="col">狀態</th></tr></thead>
      <tbody>{checks.map(([cond, how, state, tone]) => <tr key={cond}>
        <th scope="row">{cond}</th><td>{how}</td><td><span className="sc-state" data-tone={tone}>{state}</span></td>
      </tr>)}</tbody>
    </table>
    <div className="sc-lab6-side">
      <span className="sc-index">預測 1B 的終點</span>
      <math display="block" className="sc-math-md sc-accent sc-forecast-math" aria-label="預測的最終 loss 是讓已跑完的一段曲線除以 c 之後，最貼近參考曲線的那個 c">
        <mtable>
          <mtr><mtd><Sub base={<Lhat/>} sub={<Txt>final</Txt>}/></mtd><mtd><mo>=</mo></mtd><mtd><munder><mo>arg min</mo><mi>c</mi></munder></mtd></mtr>
          <mtr><mtd/><mtd/><mtd><munder><mo>∑</mo><mrow><That/><mo>∈</mo><mi>S</mi></mrow></munder>
            <msup><mrow><mo>(</mo><Lt/><mo>/</mo><mi>c</mi><mo>−</mo><Sub base={<mi>ℓ</mi>} sub={<Txt>ref</Txt>}/><mo>(</mo><That/><mo>)</mo><mo>)</mo></mrow><mn>2</mn></msup></mtd></mtr>
        </mtable>
      </math>
      <p className="sc-small">S 是已跑完的一段（例如 20%–30%）。找一個除數 c，讓這段曲線和參考曲線最貼合，c 就是預測的最終 loss（論文 §5）。</p>
      <p className="sc-warn"><b>待驗證</b>150M 約 66% 參數是 embedding；Celerity 300M 的比例相近，仍然塌縮。</p>
    </div>
  </div>;
}

/* ---------- D. Experiments ---------- */

const experiments = [
  ['E1', '150M τ sweep（0.0125–0.2）', '曲線形狀隨 τ 規律變化', '約 5 次 150M'],
  ['E2', '同一個 τ，用不同 (η, λ) 達成（重現 Fig. 3）', '兩條曲線重合', '約 2 次 150M'],
  ['E3', '150M → 750M ladder', '全部塌縮，包含 150M', '0：共用 ladder'],
  ['E4', '用部分曲線預測 750M 終點', '比純 L(C) 擬合更準', '0'],
];
function Experiments({ step }: { step: number }) {
  return <div className="sc-experiments" data-step={step}>
    <table className="sc-table" aria-label="事先登記的實驗設計">
      <thead><tr><th scope="col"/><th scope="col">實驗</th><th scope="col">假說</th><th scope="col">成本</th></tr></thead>
      <tbody>{experiments.map(([id, what, hypothesis, cost]) => <tr key={id}>
        <th scope="row">{id}</th><td>{what}</td><td>{hypothesis}</td><td>{cost}</td>
      </tr>)}</tbody>
    </table>
    <div className="sc-finale" data-on={step >= 1}>
      <p>塌縮讓 scaling law 從預測一個點，變成預測<b>整條曲線</b>。</p>
      <span lang="en">Thanks for listening</span>
    </div>
  </div>;
}

/* ---------- Slide frame ---------- */

/** Cover art: a faint bundle of curves that have already collapsed. */
function CoverArt() {
  const p: Panel = { x: -40, y: 470, w: 1680, h: 400, x0: 0.05, x1: 1, y0: 0.98, y1: 1.5 };
  return <svg className="sc-cover-art" viewBox="0 0 1600 900" aria-hidden="true">
    {[0, 1, 2, 3, 4, 5].map(i => <path key={i} style={{ opacity: 0.05 + i * 0.025 }}
      d={path(p, samples.map(t => [t, shape(t) + (i - 2.5) * 0.004]))}/>)}
  </svg>;
}

function Header({ id }: { id: string }) {
  const current = sectionIndex(id);
  if (current < 0) return <div className="sc-header" aria-hidden="true"/>;
  return <div className="sc-header" aria-hidden="true">
    <span className="sc-section"><b>{sections[current].key}</b>{sections[current].title}</span>
    <span className="sc-progress">{sections.map((s, i) => <i key={s.key} data-state={i < current ? 'past' : i === current ? 'now' : 'next'} style={{ flexGrow: s.minutes }}/>)}</span>
  </div>;
}

const titles: Partial<Record<PageId, ReactNode>> = {
  problem: '小規模實驗，怎麼可靠地外推？',
  claim: '論文的主張',
  normalize: <>每條曲線<span className="sc-muted">各自</span>正規化</>,
  collapse: <>Collapse：形狀相同，<span className="sc-muted">不是 loss 相同</span></>,
  'tau-ema': <><span className="sc-num">機制 ①</span>τ 從哪裡來？<span className="sc-muted sc-title-sub">AdamW 的權重是 EMA</span></>,
  tau: <><span className="sc-num">機制 ②</span>τ 決定曲線形狀</>,
  tpp: <><span className="sc-num">機制 ③</span>TPP 為什麼必須相同</>,
  schedule: <><span className="sc-num">機制 ④</span>LR schedule 為什麼必須相同</>,
  evidence: '證據、保證與前提',
  lab6: '對 Lab6 的意義',
  experiments: '我們的實驗規劃',
};

export function Slide(r: SlideRenderProps) {
  const id = String(r.slide.id) as PageId;
  const index = pages.findIndex(page => page[0] === id);
  const body = (content: ReactNode) => <div className="sc-body"><div className="sc-body-content">{content}</div></div>;
  const source = paperSlides.has(id)
    ? (r.mode === 'preview' ? paperLabel : <a href={paperHref} target="_blank" rel="noreferrer">{paperLabel}</a>)
    : '';
  const content: Partial<Record<PageId, ReactNode>> = {
    outline: <Outline/>, problem: <Problem/>, claim: <Claim/>, normalize: <Normalize/>,
    collapse: <CollapseFigure step={r.step}/>, 'tau-ema': <TauEma step={r.step}/>, tau: <Tau step={r.step}/>,
    tpp: <Tpp/>, schedule: <Schedule/>, evidence: <Evidence/>, lab6: <Lab6/>, experiments: <Experiments step={r.step}/>,
  };
  return <section className={`sc-slide sc-page-${id}`} data-still={r.still || r.reducedMotion} data-authored-slide={id}
    data-step={r.step} aria-label={r.slide.title} style={{ '--sc-step': r.step } as CSSProperties}>
    <Header id={id}/>
    <main>
      {id === 'cover' && <CoverArt/>}
      {id === 'cover' && <div className="sc-cover-layout">
        <p className="sc-cover-kicker">Paper reading · Lab6</p>
        <h1 className="sc-cover-title" lang="en">Scaling with Collapse</h1>
        <h2>用整條 loss 曲線，預測大模型的訓練</h2>
        <p className="sc-cover-sub">Bergsma et al., ICLR 2026</p>
        <p className="sc-cover-author">杜晟甫 <span>Cerulean Labs</span></p>
      </div>}
      {id === 'outline' && <><h1 className="sc-title">大綱</h1>{body(content.outline)}</>}
      {id !== 'cover' && id !== 'outline' && <><h1 className="sc-title">{titles[id]}</h1>{body(content[id])}</>}
    </main>
    <footer><span>{source}</span><span>{String(index + 1).padStart(2, '0')} <i>/</i> {pages.length}</span></footer>
  </section>;
}
