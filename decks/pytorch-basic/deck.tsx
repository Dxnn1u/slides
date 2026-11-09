import type { ReactNode } from 'react';
import { defineDeck, fadeTransition, type SlideRenderProps } from '../../src/presentation';
import { Code } from './Code';
import {
  ActivationPlot, activations, BitLayout, ChainRule, NegLogPlot, NetworkDiagram, SimdScene, StorageScene,
} from './Diagrams';
import mnistSamples from './assets/mnist-samples.png';
import mnistPixels from './assets/mnist-5-pixels.png';
import './styles.css';

/* id, title, steps, chapter label */
const pages = [
  ['cover', 'PyTorch basic', 1, ''],
  ['why', 'Why AI in an HPC training?', 1, 'Introduction'],
  ['roadmap', 'Today', 1, 'Introduction'],
  ['numpy', 'What is NumPy', 1, 'Before we begin'],
  ['storage', 'How is a tensor stored in memory?', 4, 'Before we begin'],
  ['views', 'Views only change metadata', 1, 'Before we begin'],
  ['ndarray', 'Why we like ndarray', 1, 'Before we begin'],
  ['simd', 'What is SIMD?', 2, 'Before we begin'],
  ['dtype-bits', 'What is dtype', 1, 'Before we begin'],
  ['dtype-table', 'Common dtypes', 1, 'Before we begin'],
  ['fp64', 'Why not double precision?', 1, 'Before we begin'],
  ['tensor', 'What is a Tensor', 1, 'Tensor & PyTorch'],
  ['positioning', 'Where PyTorch sits', 1, 'Tensor & PyTorch'],
  ['related', 'PyTorch and related works', 1, 'Tensor & PyTorch'],
  ['mnist', 'Dataset: MNIST', 1, 'MLP · Overview'],
  ['pixels', 'An image is just numbers', 1, 'MLP · Overview'],
  ['task', 'Define the task', 2, 'MLP · Overview'],
  ['size', 'How big is our network?', 1, 'MLP · Overview'],
  ['glimpse', 'A quick glimpse', 1, 'MLP · Overview'],
  ['data', '1. Linear layer — data processing', 5, 'MLP · Build structure'],
  ['neuron', '1. Linear layer — one neuron', 1, 'MLP · Build structure'],
  ['layer', '1. Linear layer — a layer and a batch', 3, 'MLP · Build structure'],
  ['hyper', 'Hyperparameters & batch size', 1, 'MLP · Build structure'],
  ['stacking', '2. Stacking layers', 1, 'MLP · Build structure'],
  ['combine', '2. How to combine layers', 1, 'MLP · Build structure'],
  ['activation', '3. Activation', 2, 'MLP · Build structure'],
  ['activations', '3. Common activation functions', 1, 'MLP · Build structure'],
  ['forward', '4. Forward', 1, 'MLP · Run training'],
  ['loss', '5. Loss — why not accuracy?', 2, 'MLP · Run training'],
  ['softmax', '5. From logits to probability: softmax', 1, 'MLP · Run training'],
  ['softmax-vs', '5. Activation vs. softmax', 1, 'MLP · Run training'],
  ['cross-entropy', '5. Cross-entropy loss', 1, 'MLP · Run training'],
  ['backward-why', '6. Backward — why do we need it?', 1, 'MLP · Run training'],
  ['chain-rule', '6. Backward — chain rule by hand', 7, 'MLP · Run training'],
  ['backprop', '6. How backward propagation works', 1, 'MLP · Run training'],
  ['update', '7. Update', 1, 'MLP · Run training'],
  ['optimizer', '7. Optimizers', 1, 'MLP · Run training'],
  ['train-loop', '8. Train loop', 1, 'MLP · Run training'],
  ['lab', 'Lab', 1, 'Lab'],
  ['references', 'References', 1, 'Reference'],
  ['closing', 'Thanks', 1, ''],
] as const;

type PageId = typeof pages[number][0];

/* ------------------------------------------------------------------ helpers */

const R = ({ on, children, className = '' }: { on: boolean; children: ReactNode; className?: string }) =>
  <div className={`pb-reveal ${className}`} data-on={on}>{children}</div>;

function Bullets({ items }: { items: ReactNode[] }) {
  return <ul className="pb-bullets">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
}

/* ------------------------------------------------------------------ slides */

function Why() {
  return <div className="pb-stack">
    <div className="pb-three">
      {[['HiPAC', 'Taiwan’s largest HPC contest'], ['ISC', 'Student Cluster Competition'], ['APAC', 'HPC-AI Competition']].map(([n, d]) =>
        <div className="pb-card" key={n}><h3>{n}</h3><p className="pb-muted">{d}</p></div>)}
    </div>
    <p className="pb-lead">Each of them has <b>at least one AI task</b> — usually about LLMs:</p>
    <div className="pb-chips"><span>Inference speedup</span><span>Simple RL applications</span><span>LLM training</span></div>
    <p className="pb-note">Lectures 1–5 covered HPC fundamentals. The last two lectures focus on AI and LLMs, so that when a contest asks you to optimise, you know what the model is actually doing.</p>
  </div>;
}

function Roadmap() {
  const items = [
    ['01', 'Before we begin', 'NumPy · memory layout · dtype'],
    ['02', 'Tensor & PyTorch', 'what a tensor adds · where PyTorch sits'],
    ['03', 'MLP', '8 steps: build structure → run training'],
    ['04', 'Lab', 'Base & Advanced'],
  ];
  return <div className="pb-roadmap">{items.map(([n, t, d]) =>
    <div key={n}><span>{n}</span><h2>{t}</h2><p>{d}</p></div>)}</div>;
}

function NumPy() {
  return <div className="pb-two">
    <div>
      <Bullets items={[
        <><b>Num</b>erical <b>Py</b>thon: the basic library for numerical computing</>,
        <>SciPy, pandas and matplotlib are all built on top of it</>,
        <>Heavy computing is implemented in C; linear algebra is delegated to <b>BLAS</b></>,
      ]}/>
      <div className="pb-chips pb-chips-sm"><span>SciPy</span><span>pandas</span><span>matplotlib</span><span>PyTorch ↔ NumPy</span></div>
    </div>
    <div className="pb-tree">
      <div className="pb-tree-root">ndarray</div>
      <div className="pb-tree-branch">
        <div><h3>data buffer</h3><p className="pb-muted">raw bytes in memory</p></div>
        <div><h3>metadata</h3><ul><li>dtype</li><li>shape</li><li className="pb-hl">strides</li><li className="pb-hl">offset</li></ul></div>
      </div>
    </div>
  </div>;
}

function Views() {
  const rows = [
    ['x', '(3, 4)', '(4, 1)', '0', 'yes', '—'],
    ['x[1:, 1:]', '(2, 3)', '(4, 1)', '5', 'no', 'view'],
    ['x.t()', '(4, 3)', '(1, 4)', '0', 'no', 'view'],
    ['torch.tensor([1,2,3]).expand(4, 3)', '(4, 3)', '(0, 1)', '0', 'no', 'view'],
    ['x.t().contiguous()', '(4, 3)', '(3, 1)', '0', 'yes', 'copy'],
  ];
  return <div className="pb-stack">
    <table className="pb-table pb-mono-table">
      <thead><tr><th>expression</th><th>shape</th><th>stride</th><th>offset</th><th>contiguous</th><th>data</th></tr></thead>
      <tbody>{rows.map(r => <tr key={r[0]}>{r.map((c, i) =>
        <td key={i} className={i === 4 && c === 'no' ? 'pb-warn' : i === 5 && c === 'copy' ? 'pb-strong' : ''}>{c}</td>)}</tr>)}</tbody>
    </table>
    <div className="pb-two pb-two-tight">
      <p className="pb-note">Slicing, transpose and expand are <b>O(1)</b>: no data moves, only shape / stride / offset change. Stride <b>0</b> means “read the same element again”.</p>
      <p className="pb-note"><code>.view()</code> needs a compatible (usually contiguous) layout, so <code>x.t().view(12)</code> raises an error. Use <code>.contiguous()</code> or <code>.reshape()</code>.</p>
    </div>
  </div>;
}

function NdArray() {
  return <div className="pb-two">
    <div>
      <h3 className="pb-h3">What is an ndarray</h3>
      <Bullets items={[
        <>N-dimensional array, the core data structure of NumPy</>,
        <><b>Homogeneous</b>: every element has the same dtype</>,
        <><b>Fixed size</b>: the length is fixed once created</>,
      ]}/>
      <h3 className="pb-h3">Automatic type promotion</h3>
      <Code size="sm" source={`np.array([1, 2]) + np.array([0.5, 0.5])
# -> float64`}/>
      <p className="pb-note">Not always lossless: very large integers lose precision as float64.</p>
    </div>
    <div>
      <h3 className="pb-h3">Why it is fast</h3>
      <div className="pb-reasons">
        {[['Contiguous', 'homogeneous → one contiguous block of memory'],
          ['Compiled loops', 'loops run in C, not in the Python interpreter (vectorization)'],
          ['Cache friendly', 'neighbours in memory are loaded together'],
          ['SIMD · BLAS', 'hardware vector instructions and tuned libraries']].map(([h, p]) =>
          <div key={h}><h3>{h}</h3><p>{p}</p></div>)}
      </div>
    </div>
  </div>;
}

function Simd({ step }: { step: number }) {
  return <div className="pb-stack">
    <SimdScene step={step}/>
    <R on={step >= 1}>
      <table className="pb-table pb-simd-table">
        <thead><tr><th>Instruction set</th><th>Register width</th><th>float32 per register</th></tr></thead>
        <tbody>
          <tr><td>SSE / ARM NEON</td><td>128 bit</td><td>4</td></tr>
          <tr><td>AVX2</td><td>256 bit</td><td>8</td></tr>
          <tr><td>AVX-512</td><td>512 bit</td><td>16</td></tr>
        </tbody>
      </table>
    </R>
  </div>;
}

function DtypeTable() {
  const rows = [
    ['float64 (fp64)', '8', '11', '52', 'NumPy default, scientific computing', false],
    ['float32 (fp32)', '4', '8', '23', 'PyTorch default, general training', true],
    ['float16 (fp16)', '2', '5', '10', 'mixed precision (needs loss scaling), inference', true],
    ['bfloat16 (bf16)', '2', '8', '7', 'mixed precision training, inference speedup', true],
    ['int64', '8', '—', '—', 'indices, class labels', false],
    ['int8', '1', '—', '—', 'quantization', true],
    ['bool', '1', '—', '—', 'mask', false],
  ] as const;
  return <table className="pb-table">
    <thead><tr><th>dtype</th><th>bytes</th><th>exponent</th><th>mantissa</th><th>purpose</th></tr></thead>
    <tbody>{rows.map(r => <tr key={r[0]} data-key={r[5]}><td className="pb-mono">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td></tr>)}</tbody>
  </table>;
}

function Fp64() {
  return <div className="pb-three pb-big-three">
    <div><span>01</span><h2>More precision than we need</h2><p>Training is already noisy: every batch only approximates the full dataset.</p></div>
    <div><span>02</span><h2>2× memory &amp; bandwidth</h2><p>Every weight, activation and gradient doubles in size compared with fp32.</p></div>
    <div><span>03</span><h2>Slow on GPUs</h2><p>Most GPUs run fp64 far slower than fp32 or bf16.</p></div>
  </div>;
}

function Tensor() {
  return <div className="pb-two">
    <div>
      <p className="pb-lead">PyTorch’s version of ndarray, with two extra abilities:</p>
      <div className="pb-ability"><span>device</span><p>it can run on a GPU</p></div>
      <div className="pb-ability"><span>requires_grad</span><p>it can track gradients</p></div>
    </div>
    <Code title="python" source={`x = torch.randn(32, 784)
x.shape          # torch.Size([32, 784])
x.dtype          # torch.float32
x.device         # cpu
x.requires_grad  # False

x = x.to("cuda") # move to GPU`}/>
  </div>;
}

function Positioning() {
  return <div className="pb-stack">
    <div className="pb-bridge">
      <div className="pb-bridge-end"><h3>Your model</h3><p>described in Python</p></div>
      <b>→</b>
      <div className="pb-bridge-mid">
        <h3>Deep learning framework</h3>
        <div className="pb-chips pb-chips-sm"><span>tensor computation</span><span>autograd</span><span>GPU acceleration</span><span>data loading</span></div>
      </div>
      <b>→</b>
      <div className="pb-bridge-end"><h3>Hardware</h3><p>CUDA kernels, BLAS…</p></div>
    </div>
    <p className="pb-note">It saves you from writing low-level code such as CUDA kernels, while still being far more flexible than high-level APIs.</p>
    <div className="pb-prereq"><span>Prerequisite</span><p>Basic Python · OOP, especially <b>inheritance</b> (<code>class MLP(nn.Module)</code>)</p></div>
  </div>;
}

function Related() {
  return <div className="pb-three pb-frameworks">
    <div data-key="true"><h2>PyTorch</h2><p>The most widely used training framework today; the major pick for open-source LLM projects.</p></div>
    <div><h2>TensorFlow</h2><p>The most mature deployment ecosystem.</p></div>
    <div><h2>JAX</h2><p>Mostly used by Google for large-scale training on TPU.</p>
      <p className="pb-small">Minimal by itself — paired with <b>Flax</b> (≈ torch.nn) and <b>Optax</b> (≈ torch.optim).</p>
      <p className="pb-small">ISC 2026 virtual SCC: LLM training with <b>MaxText</b>, built on JAX.</p></div>
  </div>;
}

function Mnist() {
  return <div className="pb-two pb-two-media">
    <img src={mnistSamples} alt="Handwritten digits 0 to 9 from MNIST"/>
    <div>
      <div className="pb-stat"><strong>28 × 28</strong><span>grayscale images of handwritten digits 0–9</span></div>
      <div className="pb-stat"><strong>60,000</strong><span>training images</span></div>
      <div className="pb-stat"><strong>10,000</strong><span>test images</span></div>
    </div>
  </div>;
}

function Pixels() {
  return <div className="pb-stack pb-center">
    <img className="pb-pixels" src={mnistPixels} alt="The digit 5 and its 28 by 28 pixel values"/>
    <p className="pb-note">28 × 28 = <b>784</b> pixels, each a grayscale value from <b>0</b> (black) to <b>255</b> (white).</p>
  </div>;
}

function Task({ step }: { step: number }) {
  return <div className="pb-stack">
    <p className="pb-lead">Given a 28×28 image, predict which digit (0–9) it shows, as accurately as possible.</p>
    <blockquote className="pb-quote">A neural network is a function <i>f</i>(<i>x</i>; <i>θ</i>) with learnable parameters <i>θ</i>. Training means finding the <i>θ</i> that minimises the loss.</blockquote>
    <R on={step >= 1} className="pb-two pb-two-tight">
      <div className="pb-card pb-card-purple"><span className="pb-tag">Build structure</span><h3>defines the shape of <i>f</i>(<i>x</i>; <i>θ</i>)</h3><p className="pb-muted">steps 1–3: linear layer · stacking · activation</p></div>
      <div className="pb-card pb-card-teal"><span className="pb-tag">Run training</span><h3>finds the optimal <i>θ</i></h3><p className="pb-muted">steps 4–8: forward · loss · backward · update · loop</p></div>
    </R>
  </div>;
}

function Size() {
  return <div className="pb-two">
    <div>
      <p className="pb-lead">The “1B” in Llama-3.2-1B and the “235B” in Qwen3-235B are <b>parameter counts</b> — that is how a model’s size is defined.</p>
      <table className="pb-table pb-size-table">
        <tbody>
          <tr><td className="pb-mono">fc1</td><td>784 × 256 + 256</td><td>200,960</td></tr>
          <tr><td className="pb-mono">fc2</td><td>256 × 128 + 128</td><td>32,896</td></tr>
          <tr><td className="pb-mono">fc3</td><td>128 × 10 + 10</td><td>1,290</td></tr>
        </tbody>
      </table>
    </div>
    <div className="pb-bignum">
      <strong>235,146</strong>
      <p>parameters ≈ 0.24 M</p>
      <p className="pb-muted">≈ 0.94 MB in fp32 (4 bytes each)</p>
    </div>
  </div>;
}

function Data({ step }: { step: number }) {
  const stages = [
    ['Raw image', 'uint8 · 0–255', '(28, 28)'],
    ['ToTensor()', 'float32 · 0–1', '(1, 28, 28)'],
    ['Normalize', 'zero mean, unit std', '(1, 28, 28)'],
    ['DataLoader', 'shuffle + batch', '(B, 1, 28, 28)'],
    ['Flatten', 'nn.Linear uses the last dim', '(B, 784)'],
  ];
  const notes = [
    'Each pixel is an integer from 0 to 255.',
    'ToTensor turns pixels into float32 in [0, 1]. The 1 in (1, 28, 28) is the number of channels.',
    'Normalization rescales the values so training is more stable.',
    'The DataLoader shuffles the samples and groups them into batches. B is the batch_size (64 for us).',
    'nn.Linear operates on the last dimension and expects 784 input features.',
  ];
  return <div className="pb-stack">
    <div className="pb-pipeline">{stages.map(([name, desc, shape], i) => <div key={name} className="pb-pipe" data-on={i <= step} data-current={i === step}>
      <h3>{name}</h3><p>{desc}</p><code>{shape}</code>
    </div>)}</div>
    <p className="pb-lead pb-pipe-note">{notes[step]}</p>
  </div>;
}

function Neuron() {
  return <div className="pb-two">
    <div>
      <p className="pb-lead">Each neuron in the first hidden layer has <b>784 weights</b> (one per pixel) and <b>one bias</b>.</p>
      <p className="pb-lead">It computes a weighted sum of its inputs plus the bias:</p>
      <div className="pb-formula">z = w<sub>1</sub>x<sub>1</sub> + w<sub>2</sub>x<sub>2</sub> + ⋯ + w<sub>784</sub>x<sub>784</sub> + b<br/><span>= <b>w</b> · <b>x</b> + b</span></div>
    </div>
    <svg viewBox="0 0 560 460" className="pb-neuron">
      {[60, 150, 360].map((y, i) => <g key={y}>
        <circle cx={70} cy={y} r={32} className="pb-n-in"/><text x={70} y={y + 9} textAnchor="middle">x{['₁', '₂', '₇₈₄'][i]}</text>
        <line x1={102} y1={y} x2={348} y2={230} className="pb-n-edge"/>
        <text x={200} y={y + (230 - y) * 0.4 - 10} className="pb-n-w">w{['₁', '₂', '₇₈₄'][i]}</text>
      </g>)}
      {[235, 260, 285].map(y => <circle key={y} cx={70} cy={y} r={5} className="pb-dot"/>)}
      <circle cx={400} cy={230} r={52} className="pb-n-sum"/><text x={400} y={242} textAnchor="middle" className="pb-n-sigma">Σ</text>
      <text x={400} y={330} textAnchor="middle" className="pb-n-w">+ b</text>
      <line x1={452} y1={230} x2={530} y2={230} className="pb-n-edge"/><text x={540} y={240} className="pb-n-z">z</text>
    </svg>
  </div>;
}

function Layer({ step }: { step: number }) {
  return <div className="pb-stack">
    <div className="pb-layer-row">
      <div className="pb-layer-text">
        <h3 className="pb-h3">A group of neurons</h3>
        <p>Stack the weights of all 256 neurons row by row → weight matrix <b>W</b>. Each row is one neuron, so PyTorch stores <code>fc1.weight</code> as <b>(out, in) = (256, 784)</b>.</p>
      </div>
      <div className="pb-formula pb-formula-sm"><b>z</b> = W<b>x</b> + <b>b</b>, &nbsp; W ∈ ℝ<sup>256×784</sup></div>
    </div>
    <R on={step >= 1} className="pb-layer-row">
      <div className="pb-layer-text"><h3 className="pb-h3">Single sample</h3></div>
      <div className="pb-shape-eq"><span>(256, 784)</span><b>·</b><span>(784,)</span><b>+</b><span>(256,)</span><b>→</b><span className="pb-shape-out">(256,)</span></div>
    </R>
    <R on={step >= 2} className="pb-layer-row">
      <div className="pb-layer-text"><h3 className="pb-h3">Batch</h3><p>Each sample is a row of X, so we multiply by <b>Wᵀ</b>. The bias is broadcast to every row.</p></div>
      <div>
        <div className="pb-formula pb-formula-sm">Z = XWᵀ + <b>b</b></div>
        <div className="pb-shape-eq"><span>(B, 784)</span><b>@</b><span>(784, 256)</span><b>+</b><span>(256,)</span><b>→</b><span className="pb-shape-out">(B, 256)</span></div>
      </div>
    </R>
  </div>;
}

function Hyper() {
  return <div className="pb-two">
    <div>
      <h3 className="pb-h3">Hyperparameters vs. parameters</h3>
      <div className="pb-compare">
        <div><span className="pb-tag">Hyperparameters</span><p>chosen <b>before</b> training: number of layers, layer widths (256, 128), batch size, learning rate, epochs</p></div>
        <div><span className="pb-tag pb-tag-teal">Parameters θ</span><p><b>learned</b> during training: weights and biases</p></div>
      </div>
    </div>
    <div>
      <h3 className="pb-h3">How to decide batch_size?</h3>
      <div className="pb-compare">
        <div><span className="pb-tag">Larger batch</span><p>better GPU utilisation, smoother gradients — but more memory, fewer updates per epoch</p></div>
        <div><span className="pb-tag">Smaller batch</span><p>less memory, more updates — but noisier gradients, lower GPU utilisation</p></div>
        <div><span className="pb-tag pb-tag-blue">In practice</span><p>a power of 2 (32–256); increase until memory runs out or accuracy drops. We use <b>64</b>.</p></div>
      </div>
    </div>
  </div>;
}

function Stacking() {
  return <div className="pb-stack">
    <NetworkDiagram loop={false} compact/>
    <div className="pb-three pb-terms">
      <div><h3>Input layer</h3><p>the raw data fed in; <b>no parameters</b> (784)</p></div>
      <div><h3>Hidden layers</h3><p>transform data into intermediate representations (256, 128)</p></div>
      <div><h3>Output layer</h3><p>final raw scores (<b>logits</b>), one per class (10)</p></div>
    </div>
    <p className="pb-note"><b>Depth</b> = number of layers with learnable parameters → <b>3</b>. &nbsp; <b>Width</b> = number of neurons in a layer.</p>
  </div>;
}

function Combine() {
  return <div className="pb-stack">
    <p className="pb-lead">“Deep” means multiple hidden layers stacked together. To combine layers, their dimensions must match.</p>
    <div className="pb-linear-chain">
      <code>nn.Linear(784, <mark className="m1">256</mark>)</code><b>→</b>
      <code>nn.Linear(<mark className="m1">256</mark>, <mark className="m2">128</mark>)</code><b>→</b>
      <code>nn.Linear(<mark className="m2">128</mark>, 10)</code>
    </div>
    <div className="pb-two pb-two-tight">
      <div className="pb-card"><span className="pb-tag">Intuition</span><p>Every output of the previous layer must connect to an input of this layer: <code>out_features</code> = next <code>in_features</code>.</p></div>
      <div className="pb-card"><span className="pb-tag">Math</span><p>Matrix multiplication requires the inner dimensions to be equal: (B, <b>256</b>) @ (<b>256</b>, 128).</p></div>
    </div>
  </div>;
}

function Activation({ step }: { step: number }) {
  return <div className="pb-stack">
    <div className="pb-three pb-props">
      <div><span>01</span><h3>element-wise</h3></div>
      <div><span>02</span><h3>does not change the shape</h3></div>
      <div><span>03</span><h3><b>non-linear</b> — most important</h3></div>
    </div>
    <R on={step >= 1}>
      <h3 className="pb-h3">Why it is needed</h3>
      <p className="pb-lead">No matter how many linear layers we stack, they collapse into a single linear layer:</p>
      <div className="pb-formula">W<sub>3</sub>(W<sub>2</sub>(W<sub>1</sub>x + b<sub>1</sub>) + b<sub>2</sub>) + b<sub>3</sub> = <span className="pb-hl">W′x + b′</span></div>
      <p className="pb-note">A non-linear function between layers prevents the collapse, so the network can represent non-linear relationships.</p>
    </R>
  </div>;
}

function Activations() {
  return <div className="pb-stack">
    <div className="pb-acts">{activations.map(a => <div key={a.name}>
      <ActivationPlot fn={a.fn}/><h3>{a.name}</h3><p>{a.use}</p>
    </div>)}</div>
    <div className="pb-where"><span className="pb-tag pb-tag-blue">Where to put</span><p>After every <b>hidden</b> layer, but <b>not</b> after the output layer. The output stays as logits; softmax is handled inside <code>nn.CrossEntropyLoss</code>.</p></div>
  </div>;
}

function Forward() {
  return <div className="pb-two">
    <div>
      <blockquote className="pb-quote">Forward propagation: with <i>θ</i> fixed, pass the input <i>x</i> through the network to compute the output.</blockquote>
      <Bullets items={[
        <>Simply passes the data through the network we just built</>,
        <><b>Inference</b> only runs the forward pass</>,
        <>During <b>training</b>, forward also saves intermediate values that backward will need</>,
      ]}/>
    </div>
    <Code title="model.py" size="sm" source={`class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(784, 256)
        self.fc2 = nn.Linear(256, 128)
        self.fc3 = nn.Linear(128, 10)
        self.relu = nn.ReLU()

    def forward(self, x):            # (B, 1, 28, 28)
        x = self.flatten(x)          # (B, 784)
        x = self.relu(self.fc1(x))   # (B, 256)
        x = self.relu(self.fc2(x))   # (B, 128)
        return self.fc3(x)           # (B, 10) logits`} focus={[10, 11, 12, 13, 14]}/>
  </div>;
}

function Loss({ step }: { step: number }) {
  const rows = [['A', 0.3, 0.5, 8, 0, 1.20], ['B', 0.4, 0.45, 8, 0, 0.92], ['C', 0.45, 0.4, 3, 1, 0.80], ['D', 0.9, 0.05, 3, 1, 0.11]] as const;
  return <div className="pb-stack">
    <p className="pb-lead">We need a single number telling us how badly the model is doing — <b>lower is better</b>. Target digit: <b>3</b>.</p>
    <div className="pb-loss-grid">
      <table className="pb-table">
        <thead><tr><th>Phase</th><th>P(3)</th><th>P(8)</th><th>Prediction</th><th>Accuracy</th><th>Loss = −ln P(3)</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td>
          <td className={r[4] ? 'pb-good' : 'pb-warn'}>{r[4]}</td><td><b>{r[5].toFixed(2)}</b></td></tr>)}</tbody>
      </table>
      <R on={step >= 1} className="pb-mini-charts">
        <div><h3>Accuracy</h3><div className="pb-bars">{rows.map(r => <i key={r[0]} style={{ height: `${r[4] * 100}%` }} className="pb-bar-acc"><span>{r[0]}</span></i>)}</div><p>stair-like: A → B shows no change</p></div>
        <div><h3>Loss</h3><div className="pb-bars">{rows.map(r => <i key={r[0]} style={{ height: `${r[5] / 1.2 * 100}%` }}><span>{r[0]}</span></i>)}</div><p>decreases smoothly as P(3) grows</p></div>
      </R>
    </div>
  </div>;
}

function Softmax() {
  const logits = [2.0, 1.0, 0.1], exps = logits.map(Math.exp), sum = exps.reduce((a, b) => a + b, 0);
  return <div className="pb-two">
    <div>
      <Bullets items={[
        <><b>logits</b>: raw, unnormalised scores from the last layer</>,
        <><b>max</b> is “winner takes all” — another stair-like function</>,
        <><b>softmax</b> is a smooth version: the largest score still gets the highest probability, but every class gets a non-zero share</>,
        <>Not an activation between layers — it only turns the final logits into probabilities</>,
      ]}/>
      <div className="pb-formula pb-formula-sm">p<sub>k</sub> = e<sup>z<sub>k</sub></sup> / Σ<sub>j</sub> e<sup>z<sub>j</sub></sup></div>
    </div>
    <div className="pb-softmax-demo">
      {logits.map((z, i) => <div key={i} className="pb-sm-row">
        <code>z = {z.toFixed(1)}</code><b>→</b>
        <div className="pb-sm-track"><i style={{ width: `${exps[i] / sum * 100}%` }}/></div>
        <strong>{(exps[i] / sum).toFixed(2)}</strong>
      </div>)}
      <p className="pb-muted">all &gt; 0 · sum = 1</p>
    </div>
  </div>;
}

function SoftmaxVs() {
  return <table className="pb-table pb-vs-table">
    <thead><tr><th/><th>Activation (ReLU, GELU…)</th><th>Softmax</th></tr></thead>
    <tbody>
      <tr><td>Method</td><td>element-wise</td><td>applied to the whole vector</td></tr>
      <tr><td>Purpose</td><td>add non-linearity so layers don’t collapse</td><td>turn logits into probabilities</td></tr>
      <tr><td>Position</td><td>after every hidden layer</td><td>at the output, usually inside the loss</td></tr>
      <tr><td>Output</td><td>same shape, no range / sum constraint</td><td>&gt; 0, sums to 1</td></tr>
      <tr><td>PyTorch</td><td><code>nn.ReLU()</code> — no dim needed</td><td><code>nn.Softmax(dim=1)</code> — <b>must specify dim</b></td></tr>
    </tbody>
  </table>;
}

function CrossEntropy() {
  return <div className="pb-two">
    <div>
      <p className="pb-lead">One of the most widely used losses for classification.</p>
      <div className="pb-formula">L = −log p<sub>correct</sub></div>
      <p className="pb-lead">Lower confidence in the correct class → higher loss. In practice we average over the batch:</p>
      <div className="pb-formula pb-formula-sm">𝓛 = −(1/B) Σ<sub>i</sub> log p<sup>(i)</sup><sub>y<sub>i</sub></sub></div>
    </div>
    <NegLogPlot/>
  </div>;
}

function BackwardWhy() {
  return <div className="pb-two">
    <div className="pb-card pb-card-warn">
      <span className="pb-tag">Most intuitive method</span>
      <h3>Run a forward pass for every parameter we want to update</h3>
      <p>A 1B-parameter model would need about <b>one billion forward passes</b> just to update every parameter once.</p>
    </div>
    <div className="pb-card pb-card-teal">
      <span className="pb-tag pb-tag-teal">Backward propagation</span>
      <h3>One forward + one backward pass gives the gradient of every parameter</h3>
      <p>Walk downhill — opposite to the gradient — and compute all gradients at once with the <b>chain rule</b>.</p>
    </div>
  </div>;
}

function Backprop() {
  const steps: [string, ReactNode][] = [
    ['Forward', 'compute the loss, save intermediate values'],
    ['From loss', 'compute the gradient of the logits'],
    ['Linear layer', <>weight gradient <b>∂W = (∂Z)ᵀ H<sub>in</sub></b>; pass back <b>∂H<sub>in</sub> = ∂Z W</b></>],
    ['ReLU', 'where Z > 0: pass the gradient through; where Z ≤ 0: set it to 0'],
    ['Repeat', 'steps 3–4 layer by layer until the input'],
    ['Done', <>every parameter has a gradient in <code>.grad</code> — none updated yet</>],
  ];
  return <ol className="pb-steps">{steps.map(([h, p], i) => <li key={i}><span>{i + 1}</span><h3>{h}</h3><p>{p}</p></li>)}</ol>;
}

function Update() {
  return <div className="pb-stack pb-center">
    <div className="pb-formula pb-formula-xl">θ ← θ − η · ∂𝓛/∂θ</div>
    <div className="pb-two pb-two-tight">
      <div className="pb-card"><span className="pb-tag">minus sign</span><p>The gradient points where the loss increases fastest, so we move the opposite way.</p></div>
      <div className="pb-card"><span className="pb-tag">η — learning rate</span><p>A hyperparameter that decides how big each step is.</p></div>
    </div>
  </div>;
}

function Optimizer() {
  const rows = [
    ['SGD', 'plain gradient descent on each mini-batch'],
    ['SGD + Momentum', 'running average of past gradients smooths the direction'],
    ['AdaGrad / RMSProp', 'adapts the step size per parameter'],
    ['Adam', 'Momentum + RMSProp; converges fast with little tuning'],
    ['AdamW', 'Adam with decoupled weight decay; the default for LLM training'],
    ['Muon', 'orthogonalises updates of 2-D weight matrices; used with AdamW for the rest'],
  ];
  return <div className="pb-stack">
    <p className="pb-lead">Updating every parameter by hand is impractical — the <b>optimizer</b> decides how to update each one based on its gradient.</p>
    <table className="pb-table">
      <thead><tr><th>Optimizer</th><th>Key idea</th></tr></thead>
      <tbody>{rows.map(([n, d]) => <tr key={n}><td className="pb-mono">{n}</td><td>{d}</td></tr>)}</tbody>
    </table>
  </div>;
}

function TrainLoop() {
  return <div className="pb-two pb-two-code">
    <Code title="train.py" size="sm" source={`model = MLP().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(),
                            lr=0.01, momentum=0.9)

for epoch in range(num_epochs):
    for x, y in train_loader:
        x, y = x.to(device), y.to(device)
        logits = model(x)            # 4. forward
        loss = criterion(logits, y)  # 5. loss
        optimizer.zero_grad()        #    clear old gradients
        loss.backward()              # 6. backward
        optimizer.step()             # 7. update`} focus={[9, 10, 11, 12, 13]}/>
    <div className="pb-terms-list">
      <div><h3>Batch</h3><p>samples processed together in one forward / backward pass</p></div>
      <div><h3>Iteration</h3><p>one parameter update (one batch)</p></div>
      <div><h3>Epoch</h3><p>one full pass over the training set: 60,000 ÷ 64 ≈ <b>938</b> iterations</p></div>
      <p className="pb-note"><code>zero_grad()</code>: PyTorch <b>accumulates</b> gradients in <code>.grad</code>, so clear them every iteration.</p>
    </div>
  </div>;
}

function Lab() {
  return <div className="pb-stack">
    <div className="pb-two pb-two-tight">
      <div className="pb-card"><span className="pb-tag">Basic</span><h3>For everyone</h3><p className="pb-muted">TBD</p></div>
      <div className="pb-card pb-card-purple"><span className="pb-tag">Advanced</span><h3>Already familiar with PyTorch &amp; DNNs?</h3><p className="pb-muted">TBD</p></div>
    </div>
    <p className="pb-note">Companion notebook: <code>lecture6_pytorch_basic.ipynb</code> — runs on Colab or Kaggle, CPU or GPU.</p>
  </div>;
}

function References({ preview }: { preview: boolean }) {
  const refs = [
    ['NumPy documentation', 'https://numpy.org/doc/stable/'],
    ['IEEE-754 floating point format', 'https://www.puntoflotante.net/FLOATING-POINT-FORMAT-IEEE-754.htm'],
    ['PyTorch tutorials', 'https://docs.pytorch.org/tutorials/'],
    ['MNIST dataset (Kaggle)', 'https://www.kaggle.com/datasets/hojjatk/mnist-dataset'],
    ['3Blue1Brown — Neural networks', 'https://www.3blue1brown.com/?topic=neural-networks'],
    ['Adam (Kingma & Ba, 2014)', 'https://arxiv.org/abs/1412.6980'],
    ['AdamW (Loshchilov & Hutter, 2017)', 'https://arxiv.org/abs/1711.05101'],
    ['Muon (Keller Jordan)', 'https://kellerjordan.github.io/posts/muon/'],
  ];
  return <ul className="pb-refs">{refs.map(([t, u]) => <li key={u}>
    {preview ? <span>{t}</span> : <a href={u} target="_blank" rel="noreferrer">{t}</a>}<small>{u.replace(/^https:\/\//, '')}</small>
  </li>)}</ul>;
}

/* ------------------------------------------------------------------ frame */

const body: Partial<Record<PageId, (r: SlideRenderProps) => ReactNode>> = {
  why: () => <Why/>, roadmap: () => <Roadmap/>, numpy: () => <NumPy/>,
  storage: r => <StorageScene step={r.step}/>, views: () => <Views/>, ndarray: () => <NdArray/>,
  simd: r => <Simd step={r.step}/>, 'dtype-bits': () => <BitLayout/>, 'dtype-table': () => <DtypeTable/>,
  fp64: () => <Fp64/>, tensor: () => <Tensor/>, positioning: () => <Positioning/>, related: () => <Related/>,
  mnist: () => <Mnist/>, pixels: () => <Pixels/>, task: r => <Task step={r.step}/>, size: () => <Size/>,
  glimpse: () => <NetworkDiagram/>, data: r => <Data step={r.step}/>, neuron: () => <Neuron/>,
  layer: r => <Layer step={r.step}/>, hyper: () => <Hyper/>, stacking: () => <Stacking/>, combine: () => <Combine/>,
  activation: r => <Activation step={r.step}/>, activations: () => <Activations/>, forward: () => <Forward/>,
  loss: r => <Loss step={r.step}/>, softmax: () => <Softmax/>, 'softmax-vs': () => <SoftmaxVs/>,
  'cross-entropy': () => <CrossEntropy/>, 'backward-why': () => <BackwardWhy/>,
  'chain-rule': r => <ChainRule step={r.step}/>, backprop: () => <Backprop/>, update: () => <Update/>,
  optimizer: () => <Optimizer/>, 'train-loop': () => <TrainLoop/>, lab: () => <Lab/>,
  references: r => <References preview={r.mode === 'preview'}/>,
};

function Slide(r: SlideRenderProps) {
  const index = pages.findIndex(p => p[0] === r.slide.id);
  const [id, title, , chapter] = pages[index];
  const still = r.still || r.reducedMotion;
  if (id === 'cover') return <section className="pb-slide pb-cover" data-still={still} aria-label={title}>
    <div className="pb-cover-art" aria-hidden="true">
      {Array.from({ length: 40 }, (_, i) => <i key={i} style={{ opacity: ((i * 37) % 11) / 14 + 0.08 }}/>)}
    </div>
    <div className="pb-cover-text">
      <p className="pb-cover-kicker">HPC Training · Lecture 6</p>
      <h1>PyTorch basic</h1>
      <p className="pb-cover-sub">From memory layout to training an MLP</p>
    </div>
    <p className="pb-cover-author">Benson Tu</p>
  </section>;
  if (id === 'closing') return <section className="pb-slide pb-closing" data-still={still} aria-label={title}>
    <h1>Thanks!</h1><p>Questions?</p>
  </section>;
  return <section className={`pb-slide pb-s-${id}`} data-still={still} aria-label={title}>
    <header><span>{chapter}</span></header>
    <h1 className="pb-title">{title}</h1>
    <main>{body[id]?.(r)}</main>
    <footer><span>Lecture 6 · PyTorch basic</span><span>{String(index + 1).padStart(2, '0')}<i>/</i>{pages.length}</span></footer>
  </section>;
}

export const pytorchBasicDeck = defineDeck({
  id: 'pytorch-basic', title: 'PyTorch basic', version: 1,
  description: 'HPC Training Lecture 6 — from memory layout to training an MLP.',
  size: { width: 1600, height: 900 },
  slides: pages.map(([id, title, steps]) => ({ id, title, steps })),
  RenderSlide: Slide,
  transition: fadeTransition(.25),
  previews: [
    { slideId: 'cover' }, { slideId: 'storage', step: 2 }, { slideId: 'glimpse' }, { slideId: 'dtype-bits' },
    { slideId: 'chain-rule' }, { slideId: 'activations' }, { slideId: 'simd' }, { slideId: 'train-loop' }, { slideId: 'data' },
  ],
  chapters: [
    { id: 'intro', title: 'Introduction', slideId: 'why' },
    { id: 'before', title: 'Before we begin', slideId: 'numpy' },
    { id: 'tensor', title: 'Tensor & PyTorch', slideId: 'tensor' },
    { id: 'overview', title: 'MLP · Overview', slideId: 'mnist' },
    { id: 'build', title: 'MLP · Build structure', slideId: 'data' },
    { id: 'train', title: 'MLP · Run training', slideId: 'forward' },
    { id: 'lab', title: 'Lab', slideId: 'lab' },
  ],
});
