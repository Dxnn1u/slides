# 新增一份簡報

新增 `decks/<slug>/deck.tsx` 與該簡報自己的 CSS，再在 `src/registry.ts` 登錄一個延遲載入入口。路由、播放控制與首頁會自動使用同一份簡報定義。

實際簡報位於 `decks/scaling-collapse/` 與 `decks/pytorch-basic/`。測試用範例位於 `tests/fixtures/example/`，只在測試模式註冊。

## 最小範例

```tsx
import { defineDeck, type SlideRenderProps } from '../../src/presentation';
import './styles.css';

function Slide({ slide, step, still, mode, actions }: SlideRenderProps) {
  return <section className="my-talk-slide">
    <h1>{slide.title}</h1>
    <p style={{ opacity: step >= 1 ? 1 : 0,
      transition: still ? 'none' : 'opacity .4s' }}>逐步揭露內容</p>
    {mode === 'playback' && <button onClick={actions.next}>下一步</button>}
  </section>;
}

export const myTalk = defineDeck({
  id: 'my-talk',
  title: '我的簡報',
  size: { width: 1600, height: 900 },
  slides: [{ id: 'cover', title: '開場', steps: 2 }],
  previews: [{ slideId: 'cover', step: 1 }],
  RenderSlide: Slide,
  transition: false,
});
```

舞台按 `size` 等比例縮放；使用其他比例時直接更改尺寸。頁面 ID 可以是字串或數字，保持穩定並互不重複。`steps` 包含起始狀態，`step` 從零開始。

CSS 限定於簡報的 `data-deck`：

```css
:where([data-deck="my-talk"]) .my-talk-slide {
  width: 1600px;
  height: 900px;
  padding: 100px;
  background: #142b35;
  color: #f7e7c9;
  font-family: Georgia, serif;
}
```

CSS 變數也放在 `[data-deck="my-talk"]`，動畫名稱使用該簡報的前綴。將所有元件與樣式放在自己的模組內，可以使用 CSS、SVG、Motion 或其他動畫方式。

登錄：

```ts
{
  id: 'my-talk', title: '我的簡報',
  load: () => import('../decks/my-talk/deck').then(module => module.myTalk),
}
```

登錄 ID 與定義 ID 必須一致；放映網址為 `/my-talk`。`load` 成功時須回傳 `DeckDefinition`。

## 渲染與預覽

`RenderSlide` 接收頁面、`step`、`mode`、`still`、`active`、`reducedMotion` 與導覽 `actions`。

- `mode` 是 `playback` 或 `preview`；預覽使用同一個元件，不啟動播放器與自訂 Provider。
- `still` 表示直接呈現當前狀態；預覽、減少動態效果及離場快照會使用它。手動推進步驟後可正常播放頁內動畫。
- `active` 表示目前可互動的播放畫面；離場快照及首頁預覽不能操作。
- `actions` 提供 `next`、`previous`、`nextSlide`、`previousSlide`、`jump(id)` 與 `restart`。預覽中的方法不執行操作。

設定 `previews` 選取代表頁，省略 `step` 時使用該頁最後一步。首頁只掛載這些預覽。計時、資料寫入及其他播放副作用放在自訂 `Provider`，不要放在投影片的預覽渲染流程。

## 選用功能

`chapters` 定義 `{ id, title, slideId }`，顯示於章節選單。`handout` 定義 `{ title, href }`，顯示於操作說明。`description` 顯示在首頁名稱下面。

`Overlay` 可渲染自己的章節指引，接收播放器狀態、舞台縮放與視窗尺寸。需要為指引預留空間時，提供 `reserveWidth(slide, viewport)`；播放核心仍置中舞台。

`Provider` 包住放映介面，接收 `children` 與此次是否從封面開始的 `fresh`；其中可使用 `usePlayback()`，實作該簡報的計時或其他行為。`Controls` 提供額外控制，`Help` 提供操作說明補充。`state.generation` 在「從頭開始」時遞增，可用來重設自訂狀態。

`version` 在變更頁面／步驟結構時遞增；恢復進度時保留仍存在的頁面，將步驟回到零。已刪除或無效的頁面會回到封面。

新簡報預設可播放頁面入場動畫。若希望跨頁時直接落在指定步驟，只有手動下一步才開始頁內動畫，設定 `freezeEntranceOnNavigation: true`；Backend Workshop 使用此設定。

## 自訂跨頁轉場

使用共用淡化：

```ts
import { fadeTransition } from '../../src/presentation';
// 定義中加入：
transition: fadeTransition(.3),
```

省略 `transition` 或設定 `false` 都會直接切換。自訂轉場提供 `name` 與 `animate({ incoming, outgoing }, direction)`，回傳 Web Animations API 的一個 `Animation` 或陣列。`direction` 為前進 `1` 或後退 `-1`。

動畫必須在有限時間內完成。播放器會在完成後移除離場快照，快速操作會取消舊動畫，減少動態效果時直接切換。需要滑動範例時，參考 `tests/fixtures/example/deck.tsx`。
