import type { CSSProperties, ReactNode } from 'react';
import type { SlideRenderProps } from '../../src/presentation/types';

/** [id, title, steps]. Keep IDs stable: chapters, previews and saved progress refer to them. */
export const pages = [
  ['cover', 'Scaling with Collapse', 1],
  ['problem', '小規模實驗，怎麼可靠地外推？', 1],
  ['collapse', 'Collapse：形狀相同，不是 loss 相同', 3],
  ['normalize', '怎麼正規化一條 loss curve', 1],
  ['controls', '三個控制量決定曲線形狀', 1],
  ['tau', '為什麼關鍵是 τ？', 3],
  ['applications', '塌縮能拿來做什麼', 1],
  ['relation', '和我們的關係', 1],
  ['upwash', 'Upwash：現況與缺口', 1],
  ['experiments', '事先登記的實驗設計', 1],
  ['forecast', '用參考曲線預測終點', 1],
  ['closing', 'Thanks for listening', 1],
] as const;

const paperHref = 'https://arxiv.org/abs/2509.25087';
const paperLabel = 'Bergsma et al., ICLR 2026';
const paperSlides = new Set(['collapse', 'normalize', 'controls', 'tau', 'applications']);

/* ---------- Schematic curves (synthetic, not experimental data) ---------- */

/** Universal normalized shape under a decay-to-zero schedule: fast early drop, a final drop as the LR anneals. */
const shape = (t: number, a = 0.12, b = 0.06) =>
  1 + a * ((t + 0.04) ** -0.55 - 1.04 ** -0.55) + b * (1 - t);
/** A family member whose τ was mis-scaled: same endpoint after normalization, different path. */
const misScaled = (t: number) => shape(t, 0.19, 0.015);

const samples = Array.from({ length: 64 }, (_, i) => 0.05 + (0.95 * i) / 63);
const family = [
  { label: '150M', tokens: 30, final: 3.45, color: '#5d6684' },
  { label: '300M', tokens: 60, final: 3.15, color: '#7783b8' },
  { label: '500M', tokens: 100, final: 2.93, color: '#8f9cdf' },
  { label: '1B', tokens: 200, final: 2.66, color: '#a6b4ff' },
];

type Panel = { x: number; y: number; w: number; h: number; x0: number; x1: number; y0: number; y1: number; log?: boolean };
const raw: Panel = { x: 90, y: 30, w: 560, h: 360, x0: 1, x1: 300, y0: 2.4, y1: 5.2, log: true };
const norm: Panel = { x: 830, y: 30, w: 560, h: 360, x0: 0, x1: 1, y0: 0.95, y1: 1.6 };
const px = (p: Panel, v: number) => p.log
  ? p.x + (Math.log10(v / p.x0) / Math.log10(p.x1 / p.x0)) * p.w
  : p.x + ((v - p.x0) / (p.x1 - p.x0)) * p.w;
const py = (p: Panel, v: number) => p.y + p.h - ((v - p.y0) / (p.y1 - p.y0)) * p.h;
const path = (p: Panel, points: [number, number][]) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${px(p, x).toFixed(1)} ${py(p, y).toFixed(1)}`).join(' ');

function Axes({ p, xTicks, yTicks, xLabel, yLabel }: {
  p: Panel; xTicks: [number, string][]; yTicks: [number, string][]; xLabel: string; yLabel: string;
}) {
  return <g className="sc-axes">
    <line x1={p.x} y1={p.y + p.h} x2={p.x + p.w} y2={p.y + p.h}/>
    <line x1={p.x} y1={p.y} x2={p.x} y2={p.y + p.h}/>
    {xTicks.map(([v, t]) => <text key={`x${v}`} x={px(p, v)} y={p.y + p.h + 34} textAnchor="middle">{t}</text>)}
    {yTicks.map(([v, t]) => <text key={`y${v}`} x={p.x - 14} y={py(p, v) + 8} textAnchor="end">{t}</text>)}
    <text className="sc-axis-label" x={p.x + p.w / 2} y={p.y + p.h + 74} textAnchor="middle">{xLabel}</text>
    <text className="sc-axis-label" x={p.x} y={p.y - 4} textAnchor="start" dx={8} dy={0}>{yLabel}</text>
  </g>;
}

const collapseCaptions = [
  '原始曲線：模型越大、訓練越久，loss 越低，長度和高度都不同。',
  '正規化之後：橫軸換成訓練進度，縱軸除以最終 loss，曲線疊成同一條。',
  'τ 沒有正確縮放的成員，即使終點一樣，路徑也對不上。',
];

function CollapseFigure({ step }: { step: number }) {
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
        <text className="sc-curve-label" x={px(norm, 0.62)} y={py(norm, 1.13)} style={{ fill: '#a6b4ff' }}>四條曲線重合</text>
        <g className="sc-mis" data-on={step >= 2}>
          <path className="sc-curve sc-curve-mis" d={path(norm, samples.map(t => [t, misScaled(t)]))}/>
          <text className="sc-curve-label sc-mis-label" x={px(norm, 0.14)} y={py(norm, 1.47)}>τ 設錯的 300M</text>
        </g>
      </g>
    </svg>
    <figcaption>
      <span className="sc-caption">{collapseCaptions[step]}</span>
      <span className="sc-schematic">示意圖：合成曲線，不是實驗數據</span>
    </figcaption>
  </figure>;
}

/* ---------- Page bodies ---------- */

function Problem() {
  return <div className="sc-columns sc-three">
    <div><span className="sc-index">01</span><h2>Lab6 的限制</h2><p>約 60 次小 run，<br/>要預測 1B／200B 的結果，<br/>並在開跑前交出預測。</p></div>
    <div><span className="sc-index">02</span><h2>讀書會的目標</h2><p>1B 對標 Qwen3-4B，<br/>同時降低對 CUDA 的依賴。</p></div>
    <div><span className="sc-index">03</span><h2>傳統 scaling law</h2><p>只預測終點的一個數字。<br/><b>能不能預測整條曲線？</b></p></div>
  </div>;
}

function Normalize() {
  return <div className="sc-normalize">
    <div className="sc-formulas">
      <div><span>橫軸</span><p className="sc-formula">t̂ = D<sub>seen</sub> / D<sub>total</sub></p></div>
      <div><span>縱軸</span><p className="sc-formula">ℓ(t̂) = L(t̂) / L<sub>final</sub></p></div>
    </div>
    <ol className="sc-steps">
      <li><b>平滑</b>：train loss 先做移動平均（論文用 100 step）</li>
      <li><b>offset</b>：一般式是 (L − L̂)／(L<sub>final</sub> − L̂)，論文發現 L̂ = 0 對齊最好</li>
      <li><b>對齊網格</b>：各規模 step 數不同，先內插到同一組 t̂</li>
      <li><b>殘差</b>：ℓ<sub>N</sub>(t̂) − ℓ<sub>ref</sub>(t̂)，用 seed 雜訊當判斷基準</li>
    </ol>
  </div>;
}

function Controls() {
  return <>
    <div className="sc-columns sc-three">
      <div><span className="sc-index">TPP</span><h2>tokens per parameter</h2><p>D／N。固定 τ 時，TPP 越高，<br/>曲線越低、越早變平。</p></div>
      <div><span className="sc-index">τ</span><h2>AdamW timescale</h2><p>B／(ηλD)。權重記得<br/>多大比例的訓練過程。</p></div>
      <div><span className="sc-index">LR</span><h2>schedule 形狀</h2><p>不同 schedule 造成不同形變，<br/>但形變本身與規模無關。</p></div>
    </div>
    <div className="sc-contrast">
      <div className="sc-contrast-bad"><b>Llama-2</b><span>各規模 TPP 不同，τ ≈ 0.07／0.13</span><strong>不塌縮</strong></div>
      <div className="sc-contrast-good"><b>Celerity</b><span>300M–1.8B 全部 234 TPP、τ = 0.05</span><strong>塌縮</strong></div>
    </div>
  </>;
}

const tauCaptions = ['定義', '機制', '推論'];
function Tau({ step }: { step: number }) {
  return <div className="sc-tau" data-step={step}>
    <ol className="sc-tau-rail" aria-hidden="true">
      {tauCaptions.map((c, i) => <li key={c} data-on={step >= i} data-current={step === i}>{c}</li>)}
    </ol>
    <div className="sc-tau-stage">
      {step === 0 && <div className="sc-tau-block">
        <p className="sc-formula">θ<sub>t</sub> = (1 − ηλ)·θ<sub>t−1</sub> − η·u<sub>t</sub></p>
        <p>AdamW 的權重就是「過去更新的 EMA」，大約記得最近 1／(ηλ) 步。</p>
        <p className="sc-formula sc-accent">τ = 1 / (ηλT) = B / (ηλD)</p>
        <p>正規化成訓練總長的比例：τ = 0.05 代表權重記得最後約 5% 的訓練。</p>
      </div>}
      {step === 1 && <div className="sc-tau-block">
        <p className="sc-formula sc-formula-long">E[L(t̂)] = ½h·[ e<sup>−2t̂/τ</sup>·E[θ₀²] + (σ²/2τ)·(1 − e<sup>−2t̂/τ</sup>) ]</p>
        <div className="sc-tau-terms">
          <div><b>bias</b><span>初始化偏差，隨 t̂／τ 指數衰減</span></div>
          <div><b>variance</b><span>梯度雜訊的下限，約和 1／τ 成正比</span></div>
        </div>
        <p>LR 衰減會讓瞬時的 τ<sub>t</sub> 變大，所以訓練末段 loss 會急降。</p>
      </div>}
      {step === 2 && <div className="sc-tau-block">
        <h2>除以最終 loss，曲率 h 被消掉</h2>
        <p>正規化後的曲線只剩 τ 和 t̂ 決定形狀，和模型大小無關。</p>
        <h2 className="sc-tau-second">只要 τ 相同，改 η、λ 或 B 都一樣</h2>
        <p>要調的是 τ 這個組合，不是個別的 weight decay。</p>
      </div>}
    </div>
  </div>;
}

function Applications() {
  return <div className="sc-columns sc-two">
    <div><span className="sc-index">診斷</span><h2>提早發現訓練問題</h2>
      <p>1.8B 的 run 在訓練到 <b>60%</b> 時，<br/>塌縮殘差就顯示數值不穩定，<br/>原始 loss 還看不出上升。</p></div>
    <div><span className="sc-index">預測</span><h2>小模型擬合，外推大模型</h2>
      <p>在 111M 上擬合曲線形式，外推 3.3B，<br/>FLOPs 相差約 <b>1000 倍</b>。<br/>HP 調參時固定 τ，只看前 10–30% 就能排序。</p></div>
  </div>;
}

function Relation() {
  return <div className="sc-columns sc-three">
    <div><span className="sc-index">Lab6</span><h2>條件幾乎已滿足</h2>
      <p>lab 規定 200 TPP。<br/>Celerity 是 234 TPP、τ = 0.05，<br/>可當 τ sweep 的起點。</p></div>
    <div><span className="sc-index">CUDA</span><h2>和硬體無關</h2>
      <p>論文全部在 Cerebras CS-3 上跑。<br/>自己寫 kernel、換 backend 時，<br/>殘差就是數值檢查。</p></div>
    <div><span className="sc-index">4B</span><h2>先估算，再訓練</h2>
      <p>1B 要追上 4B，需要的 token<br/>遠超 200B。用小規模實驗<br/>估算 compute，不靠大 run 試錯。</p></div>
  </div>;
}

function Upwash() {
  return <>
    <div className="sc-ledger">
      <div><h3>已完成（TDD）</h3><ul>
        <li>Parquet 讀取、排除 dev ids、Llama 3.2 tokenizer</li>
        <li><code>&lt;u4</code> token shard、<code>PackedTokenDataset</code></li>
        <li>Config、Builder、MemoryLogger、最小 Trainer</li>
      </ul></div>
      <div><h3>做實驗前還缺</h3><ul>
        <li>Llama 3.2 model、AdamW 與 param groups、LR scheduler</li>
        <li>bf16、DDP、checkpoint、eval loop</li>
        <li>密集 metric logging、多 shard 與 token budget</li>
      </ul></div>
    </div>
    <div className="sc-changes">
      <h3>為了塌縮實驗要改的介面</h3>
      <div>
        <p><code>build_trainer</code><span>傳 param groups，不是 <code>model.parameters()</code></span></p>
        <p><code>global_step</code><span>跨呼叫累積，scheduler 和 t̂ 都需要</span></p>
        <p><code>logger</code><span>每 10–50 step 記 train loss 與 tokens_seen</span></p>
      </div>
    </div>
  </>;
}

const experiments = [
  ['E1', '150M τ sweep（0.0125–0.2）', '曲線形狀隨 τ 規律變化', '約 5 次 150M'],
  ['E2', '同一個 τ，用不同 (η, λ) 達成', '兩條曲線重合', '約 2 次 150M'],
  ['E3', '150M → 750M ladder', '300M 以上塌縮；150M 偏離（66% 是 embedding）', '0：共用 ladder'],
  ['E4', '用部分曲線預測 750M 終點', '比純 L(C) 擬合更準', '0'],
];
function Experiments() {
  return <table className="sc-table" aria-label="事先登記的實驗設計">
    <thead><tr><th scope="col"/><th scope="col">實驗</th><th scope="col">假說</th><th scope="col">成本</th></tr></thead>
    <tbody>{experiments.map(([id, what, hypothesis, cost]) => <tr key={id}>
      <th scope="row">{id}</th><td>{what}</td><td>{hypothesis}</td><td>{cost}</td>
    </tr>)}</tbody>
  </table>;
}

function Forecast() {
  return <div className="sc-forecast">
    <p className="sc-formula sc-accent sc-formula-big">L̂<sub>final</sub> = L(t̂<sub>now</sub>) / ℓ<sub>ref</sub>(t̂<sub>now</sub>)</p>
    <div className="sc-example">
      <span>示意</span>
      <p>1B 跑到 30%，loss = 2.95；參考曲線 ℓ<sub>ref</sub>(0.3) = 1.12<br/>→ 預測最終 loss ≈ 2.95 ／ 1.12 ≈ <b>2.63</b></p>
    </div>
    <ul className="sc-caveats">
      <li>t̂ &lt; 0.05 不要用，相除後雜訊太大</li>
      <li>schedule 形狀必須相同</li>
      <li>用 train loss：eval 每 10% 才一次</li>
    </ul>
  </div>;
}

/* ---------- Slide frame ---------- */

export function Slide(r: SlideRenderProps) {
  const id = String(r.slide.id);
  const index = pages.findIndex(page => page[0] === id);
  const title = (text: ReactNode) => <h1 className="sc-title">{text}</h1>;
  const body = (content: ReactNode) => <div className="sc-body"><div className="sc-body-content">{content}</div></div>;
  const source = paperSlides.has(id)
    ? (r.mode === 'preview' ? paperLabel : <a href={paperHref} target="_blank" rel="noreferrer">{paperLabel}</a>)
    : '';
  return <section className={`sc-slide sc-page-${id}`} data-still={r.still || r.reducedMotion} data-authored-slide={id}
    data-step={r.step} aria-label={r.slide.title} style={{ '--sc-step': r.step } as CSSProperties}>
    <div className="sc-header" aria-hidden="true"/>
    <main>
      {id === 'cover' && <div className="sc-cover-layout">
        <h1 className="sc-cover-title" lang="en">Scaling with Collapse</h1>
        <h2>用整條 loss 曲線，預測大模型的訓練</h2>
        <p className="sc-cover-sub">Bergsma et al., ICLR 2026 · 結合 Lab6 與 Upwash 的實驗規劃</p>
        <p className="sc-cover-author">杜晟甫 <span>Cerulean Labs 讀書會</span></p>
      </div>}
      {id === 'problem' && <>{title('小規模實驗，怎麼可靠地外推？')}{body(<Problem/>)}</>}
      {id === 'collapse' && <>{title(<>Collapse：形狀相同，<span className="sc-muted">不是 loss 相同</span></>)}{body(<CollapseFigure step={r.step}/>)}</>}
      {id === 'normalize' && <>{title('怎麼正規化一條 loss curve')}{body(<Normalize/>)}</>}
      {id === 'controls' && <>{title('三個控制量決定曲線形狀')}{body(<Controls/>)}</>}
      {id === 'tau' && <>{title('為什麼關鍵是 τ？')}{body(<Tau step={r.step}/>)}</>}
      {id === 'applications' && <>{title('塌縮能拿來做什麼')}{body(<Applications/>)}</>}
      {id === 'relation' && <>{title('和我們的關係')}{body(<Relation/>)}</>}
      {id === 'upwash' && <>{title('Upwash：現況與缺口')}{body(<Upwash/>)}</>}
      {id === 'experiments' && <>{title('事先登記的實驗設計')}{body(<Experiments/>)}</>}
      {id === 'forecast' && <>{title('用參考曲線預測終點')}{body(<Forecast/>)}</>}
      {id === 'closing' && <div className="sc-thanks">
        <p className="sc-closing-line">塌縮讓 scaling law 從預測一個點，變成預測整條曲線。</p>
        <p className="sc-closing-question">embedding 佔多數的小模型，還會塌縮嗎？</p>
        <h1 lang="en">Thanks for listening</h1>
        <div className="sc-closing-rule"/>
      </div>}
    </main>
    <footer><span>{source}</span><span>{String(index + 1).padStart(2, '0')} <i>/</i> {pages.length}</span></footer>
  </section>;
}
