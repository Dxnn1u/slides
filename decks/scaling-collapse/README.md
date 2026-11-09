# Scaling with Collapse

13 頁繁體中文報告、18 個放映狀態，版本 3。預覽：`/scaling-collapse?start=1`。

報告 Bergsma et al., ICLR 2026 的 *Scaling with Collapse*：論文如何說明「固定 TPP、τ、LR schedule，模型家族各自正規化後的 loss curve 就會塌縮」，這對 Lab6 的意義，以及我們事先登記的實驗。

## 頁面與節奏

| 頁 | ID | 段落 | 內容 | 狀態 | 時間 |
| --- | --- | --- | --- | --- | --- |
| 1 | cover | — | 封面 | 1 | 0:10 |
| 2 | outline | — | 大綱（四段） | 1 | 0:20 |
| 3 | problem | A | 為什麼要預測整條曲線 | 1 | 0:40 |
| 4 | claim | B | 主張；Llama-2 與 Celerity 對照 | 1 | 0:40 |
| 5 | normalize | B | 每條曲線各自正規化的流程 | 1 | 0:50 |
| 6 | collapse | B | 原始 → 正規化 → τ 設錯 | 3 | 1:00 |
| 7 | tau-ema | B | 機制 ①：AdamW 是 EMA，τ 的定義 | 2 | 1:00 |
| 8 | tau | B | 機制 ②：bias／variance，h 被約掉 | 2 | 1:00 |
| 9 | tpp | B | 機制 ③：代入 power law，N 約掉、TPP 留下 | 1 | 0:50 |
| 10 | schedule | B | 機制 ④：schedule 分配 bias 與 variance | 1 | 0:40 |
| 11 | evidence | B | 實驗證據、保證鏈、應用與前提 | 1 | 1:00 |
| 12 | lab6 | C | 條件核對、預測方法、待驗證事項 | 1 | 1:10 |
| 13 | experiments | D | E1–E4，第二步出現結論與 Thanks | 2 | 1:10 |

合計約 10:30。講稿與數字來源在 [SPEAKER_NOTES.md](./SPEAKER_NOTES.md)。

## 視覺

- 淺色紙張底（`#f7f6f2`）、深墨色文字、1600×900、思源黑體 TW 加 Helvetica Neue、Allura 花體致謝；播放器背景與強調色也跟著換成同一組顏色。
- 頁首左側是段落代號（A–D），右側是依時間比例分段的進度條。
- 藍 `#3f51c7` 代表塌縮的模型家族與重點，暖色 `#c4613f` 代表會被約掉或會破壞塌縮的量，綠 `#1d8a6b` 代表已滿足。
- 第 4、6、9 頁的曲線都是程式產生的合成示意，畫面上已標示「不是實驗數據」；第 9 頁的曲線直接由頁面上的推導式計算。
- 公式用 MathML 排版（分數、上下標、t̂、L̂），多行推導用 `mtable`，對齊由 CSS 控制。
- 換頁使用共用的 `fadeTransition(.3)`；機制頁每一步內容淡入。靜態縮圖與減少動態效果模式直接呈現完成狀態。

`deck.tsx` 只負責定義，`Slides.tsx` 管理頁面內容與示意圖，`styles.css` 限定於 `[data-deck="scaling-collapse"]`，class 前綴 `sc-`。

## 驗證

撰寫環境無法 `npm ci`，所以沒有跑 `npm run typecheck`、vitest 或 vite build。已做的檢查：

- 用 esbuild 加 React SSR 渲染全部 18 個狀態，以 Chromium 在 1600×900 截圖逐頁檢查，內容都在標題下方到 y=800 之間，沒有溢出。
- 用 `src/presentation/state.ts` 的 `reduce` 確認 18 個狀態可以前後完整走訪。
- 預覽模式不含連結。

合併前請在本機跑 `npm run typecheck`、`npm test` 與 `npm run dev` 確認。

## 來源

- [Scaling with Collapse, arXiv:2509.25087](https://arxiv.org/abs/2509.25087)
- [Scaling Collapse Reveals Universal Dynamics, arXiv:2507.02119](https://arxiv.org/abs/2507.02119)
- [Power Lines, arXiv:2505.13738](https://arxiv.org/abs/2505.13738)
