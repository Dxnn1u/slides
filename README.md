# Slides

本站的簡報框架與設計來自 [ilsao/slides](https://github.com/ilsao/slides)（作者：asciibase64）。

React／Vite 多簡報網站。首頁以真實投影片的靜態拼貼展示簡報；每份簡報可自行設計版型、字型、舞台比例、頁內動畫與跨頁轉場。

首頁先呈現黑色署名開場與閃動游標，向下捲動時淺色收藏頁覆上；也可點選「探索簡報」或使用 `/#collection` 直接前往收藏。收藏以雙欄作品集同時展示多份簡報，900px 以下使用單欄。第一列直接可見，後續各列隨捲動位置逐漸顯現，完整顯示後保持可見。斜向拼貼與投影片內容保持靜態，啟用減少動態效果時停止游標閃動與開場動效，並直接呈現全部卡片。

開場採冷黑石墨與建築式側光：銀灰署名直接完整顯示，背景以靜態柔光、底部陰影與細顆粒呈現霧面空間。手機使用獨立的光影構圖；沒有套印、背景大字或視差，捲動時僅署名淡出，減少動態效果下停用淡出與游標閃動。

## 啟動

在此根目錄執行，需 Node.js 22.12+：

```sh
npm ci
npm run dev
```

- 首頁：http://localhost:5173/
- Scaling with Collapse：http://localhost:5173/scaling-collapse
- PyTorch basic：http://localhost:5173/pytorch-basic

正式建置與本機預覽：

```sh
npm run build
npm start
```

從首頁開啟簡報會回到封面；重新整理則恢復目前分頁的頁面與步驟。進度使用 `sessionStorage`，每份簡報獨立保存，各分頁各自操作。

## 操作

| 按鍵 | 功能 |
| --- | --- |
| →／Space | 下一步，完成本頁後換頁 |
| ← | 上一步；頁首回到前頁的完成狀態 |
| Page Down／Page Up | 整頁切換 |
| O | 章節與頁面選單 |
| F | 全螢幕 |
| ? | 操作說明與從頭開始 |
| Esc | 關閉選單 |

控制列有返回首頁入口，閒置三秒後隱藏；移動游標、觸碰畫面或用鍵盤聚焦即可顯示。減少動態效果偏好會停用跨頁轉場，保留講解步驟。

## 新增簡報

詳見 [新增簡報指南](docs/authoring.md) 與 [播放器測試範例](tests/fixtures/example/deck.tsx)。共用播放程式位於 `src/presentation/`，簡報登錄於 `src/registry.ts`。

## 驗證

```sh
npm test
npm run typecheck
npx playwright install chromium
npm run build:test
npm run test:browser
```

瀏覽器測試使用獨立的 5274 端口與 `.preview-dist/`，不占用本機開發的 5173；測試建置額外登錄作者範例，正式建置只收錄已登錄的公開簡報。

本次結果與涵蓋範圍見 [網站驗證紀錄](docs/verification.md)。

## 靜態部署

### GitHub Pages

已提供 [部署工作流程](.github/workflows/pages.yml)：推送到 `main` 時自動安裝依賴、執行單元測試、建置並部署，也可在 Actions 頁面手動執行。建置使用 Node.js 22，並依 GitHub Pages 設定自動套用網站的 base path，支援專案子路徑及自訂網域。

首次使用時，到 repository 的 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**，再將這些變更推送到 `main`。部署成功後，網址會顯示在 Actions 的 `github-pages` environment；此 repository 的預設網址為 `https://dxnn1u.github.io/slides/`。

簡報路徑為 `/<slug>`，部署到此 repository 後，例如 `https://dxnn1u.github.io/slides/scaling-collapse`。

工作流程會將首頁複製為 `404.html`，讓 GitHub Pages 在直接開啟或重新整理 `/<slug>` 時載入前端路由。這些網址仍會回傳 HTTP 404，但簡報可正常顯示與操作。其他靜態主機可使用下方的路由回退設定，回傳 HTTP 200。

本機驗證 GitHub Pages 子路徑建置：

```sh
npm run build -- --base /slides/
npm start
```

預覽首頁為 `http://localhost:5173/slides/`。

### 其他靜態主機

將 `npm run build` 產生的 `dist/` 放到靜態網站服務。網站使用根路徑，主機須先回傳存在的檔案，其餘路徑回退至 `/index.html`，讓 `/<slug>` 可直接開啟及重新整理。

Nginx 範例：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

使用 Netlify／支援 `_redirects` 的靜態服務時，在發布目錄加入：

```text
/* /index.html 200
```

未知路徑與已移除的 `/presenter` 由前端處理。

Debug 截圖與視覺檢查輸出位於 `output/playwright/` 或各簡報的 `docs/visual-checks/`，僅留在本機，不納入 Git。
