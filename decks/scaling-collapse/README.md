# Scaling with Collapse

13 頁繁體中文報告、17 個放映狀態，版本 2。預覽：`/scaling-collapse?start=1`。

報告 Bergsma et al., ICLR 2026 的 *Scaling with Collapse*，並連結到 Lab6（1B／200B 預測）、讀書會的長期目標，以及在 Upwash 上規劃的實驗。尚未有實驗結果，所以第 10 頁定位為事先登記的假說。

## 頁面與節奏

| 頁 | ID | 內容 | 狀態 | 時間 |
| --- | --- | --- | --- | --- |
| 1 | cover | 封面 | 1 | 0:10 |
| 2 | problem | 小規模實驗怎麼外推 | 1 | 0:50 |
| 3 | collapse | 原始曲線 → 正規化 → τ 設錯 | 3 | 1:20 |
| 4 | normalize | 正規化的具體做法 | 1 | 0:50 |
| 5 | controls | TPP、τ、schedule；Llama-2 與 Celerity 對照 | 1 | 0:50 |
| 6 | tau-ema | AdamW 更新式 → EMA → τ 的定義 | 2 | 1:10 |
| 7 | tau | 機制（bias／variance）→ 推論（h 約掉） | 2 | 1:10 |
| 8 | applications | 診斷與預測 | 1 | 0:45 |
| 9 | relation | Lab6、CUDA、對標 4B | 1 | 0:50 |
| 10 | upwash | 框架現況與要改的介面 | 1 | 0:50 |
| 11 | experiments | E1–E4 事先登記 | 1 | 1:00 |
| 12 | forecast | 用參考曲線預測終點 | 1 | 0:30 |
| 13 | closing | 結論與 Thanks | 1 | 0:20 |

合計約 10:40，第 2、4、5 頁可各壓 10 秒。講稿與數字來源在 [SPEAKER_NOTES.md](./SPEAKER_NOTES.md)。

## 視覺

- 沿用 TitanFuzz 的舞台語言：黑底、柔白文字、1600×900、思源黑體 TW 加 Helvetica Neue、結尾 Allura 花體、頁尾來源與頁碼。
- 藍 `#a6b4ff` 代表塌縮的模型家族，暖色 `#efb39e` 代表 τ 設錯或缺口，薄荷 `#9bdeca` 代表已完成。
- 第 3 頁的曲線是程式產生的合成示意，畫面上已標示「不是實驗數據」。原始曲線用 log 軸，正規化後四條曲線完全重合。
- 公式用 MathML（分數、上下標、t̂、L̂）排版，字型沿用簡報本身的字體；多行推導用 `mtable`，對齊由 CSS 控制。Chromium、Safari、Firefox 都原生支援。
- 換頁使用共用的 `fadeTransition(.3)`；第 6 頁每一步內容淡入。靜態縮圖與減少動態效果模式直接呈現完成狀態。

`deck.tsx` 只負責定義，`Slides.tsx` 管理頁面內容與示意曲線，`styles.css` 限定於 `[data-deck="scaling-collapse"]`，class 前綴 `sc-`。未修改共用播放器。

## 驗證

撰寫環境無法 `npm ci`，所以沒有跑 `npm run typecheck`、vitest 或 vite build。已做的檢查：

- 用 esbuild 加 React SSR 渲染全部 17 個狀態，以 Chromium 在 1600×900 截圖逐頁檢查，內容都在標題下方到 y=800 之間，沒有溢出。
- 用 `src/presentation/state.ts` 的 `reduce` 確認 17 個狀態可以前後完整走訪。
- 預覽模式不含連結。

合併前請在本機跑 `npm run typecheck`、`npm test` 與 `npm run dev` 確認。

## 來源

- [Scaling with Collapse, arXiv:2509.25087](https://arxiv.org/abs/2509.25087)
- [Power Lines, arXiv:2505.13738](https://arxiv.org/abs/2505.13738)
