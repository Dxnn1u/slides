# Scaling with Collapse：講稿

約 10 分 30 秒。主軸：問題（A）→ 論文的論證（B，一半以上的時間）→ 對 Lab6 的意義（C）→ 實驗規劃（D）。頁首的圓圈字母和進度條標示目前在哪一段。

## 01 封面（0:10）

今天報告 Bergsma 等人在 ICLR 2026 的 *Scaling with Collapse*：只要用對配方訓練，模型家族的 loss 曲線在正規化後會疊成同一條。

## 02 大綱（0:20）

四段，重點在 B：論文怎麼說明「固定 TPP、τ、LR schedule 就會塌縮」。

## 03 A｜小規模實驗，怎麼可靠地外推？（0:40）

- Lab6：大約 60 次小 run，要在開跑前預測 1B／200B，用 |ln PPL̂ − ln PPL| 計分。
- Cerulean 的目標：1B 對標 Qwen3-4B，降低對 CUDA 的依賴。
- 傳統 scaling law 只擬合終點的一個數字，看不到過程。問題是：能不能預測整條曲線？

## 04 B｜論文的主張（0:40）

- 一句話：在 μP 下，各規模的 TPP 相同、τ 相同且最佳、LR schedule 相同，正規化後的 loss curve 就會疊成同一條。
- 對照：Llama-2 各規模 TPP 不同，τ 約 0.07 和 0.13，曲線不塌縮；Celerity 的 300M 到 1.8B 都是 234 TPP、τ = 0.05，曲線塌縮。
- 左右兩個小圖是示意，真實的對照是論文 Fig. 1。
- 這個主張建立在 Qiu et al.（ICML 2025）的發現上：他們在小規模的 compute-optimal 訓練看到曲線塌縮；這篇證明在寬度、深度、LR、batch、weight decay 一起放大的真實 LLM 家族也成立，並找出 τ 這個關鍵。

## 05 B｜每條曲線各自正規化（0:50）

- 塌縮比的是「各自正規化之後」的曲線：每條曲線的橫軸除以自己的總 token 數，縱軸除以自己的最終 loss。
- 一般式是 (L − L̂)／(L_final − L̂)；論文發現 L̂ = 0 對齊最好，所以直接除以最終 loss，也不用去估 irreducible loss（Qiu 的做法對這個估計很敏感）。
- 實作：train loss 先做 100 step 移動平均；L_final 取最後一段平均；各規模內插到同一組 t̂ 再相減；殘差要和 seed 之間的雜訊比較。

## 06 B｜Collapse：形狀相同，不是 loss 相同（1:00，三步）

- 第一步：原始曲線，越大的模型 loss 越低、訓練越久，長度和高度都不同。
- 第二步：各自正規化後疊成同一條。強調塌縮不是收斂：大模型的 loss 仍然比較低，相同的是下降的形狀。
- 第三步：τ 沒有正確縮放的成員，終點同樣是 1，路徑卻對不上。這就是為什麼塌縮可以當作「超參數縮放是否正確」的檢查。
- 圖是合成的示意曲線。

## 07 B｜機制 ① τ 從哪裡來？（1:00，兩步）

- τ 不是 AdamW 的超參數；AdamW 的超參數是 η、β₁、β₂、ε、λ。τ 是 Wang & Aitchison（2024）提出、Power Lines 和這篇沿用的衍生量。
- 第一步：θ_t = θ_{t−1} − ηλ·θ_{t−1} − η·u_t，合併後改寫成 (1 − ηλ)·θ_{t−1} + ηλ·(−u_t/λ)。這是 EMA 的標準形式，係數 α = ηλ。
- 第二步：係數 α 的 EMA 大約記得最近 1/α 步，所以 τ_iter = 1/(ηλ)；除以總步數 T = D/B，得到 τ = B/(ηλD)，代表權重記得整個訓練的多大比例。
- 例：η = 3×10⁻⁴、λ = 0.1、T = 50,000 → τ ≈ 0.67。β₁、β₂ 也是 EMA，但對象是梯度統計，只記得幾十步。

## 08 B｜機制 ② τ 決定曲線形狀（1:00，兩步）

- 第一步：noisy quadratic model 下，期望 loss 是 bias（初始化偏差，隨 t̂／τ 指數衰減）加 variance（梯度雜訊的下限，約和 1／τ 成正比）。τ 小，bias 降得快，但停得比較高；τ 決定兩者比例，也就決定曲線怎麼彎。
- 第二步：曲率 h 只以乘法出現在最外面（暖色），除以 L(1) 就約掉。模型大小造成的差異只會等比例縮放，剩下的形狀只由 τ 和 t̂ 決定。前提是訓練結束時 bias 可忽略。
- 實驗上，610M 模型只要 τ 相同，不管改 η、λ 還是 B，曲線都一起移動。

## 09 B｜機制 ③ TPP 為什麼必須相同（0:50）

- 論文的論點：constant LR 下，訓練到 t̂ 的那一點，就像一個只訓練到 t̂·TPP 的完整訓練的終點。
- 用 Chinchilla 形式代入（取 α = β 簡化）：L(t̂) = E + N^(−α)·[A + B·k^(−α)·t̂^(−α)]。減掉 E 再除以終點，N 被約掉，k（TPP）留下來。
- 所以不同大小的模型只要 TPP 相同就同形；TPP 不同，形狀就不同。右圖是用這個式子畫的示意：TPP 越高，前段越早變平。
- 這個推導取 L̂ = E；論文實務上發現 L̂ = 0 對齊更好，可能是因為 E 很難估準，而且真實曲線有 LR 衰減的效應。

## 10 B｜機制 ④ LR schedule 為什麼必須相同（0:40）

- LR schedule 就是 learning rate 隨訓練進度變化的規則：warmup、cosine、linear decay-to-zero（論文用的）、WSD。
- 它決定 τ 帶來的 bias–variance 取捨怎麼分配：前期 LR 高，權重快速離開初始值；後期 LR 降，瞬時 τ_t = 1/(η_t·λ·T) 變大，雜訊被平均掉，loss 急降。
- 在 μP 下，schedule 造成的形變與規模無關，所以只要各規模用同一種形狀就不會破壞塌縮。
- 實作提醒（我們的推論）：warmup、cooldown 要用佔訓練的比例設定；寫死步數的話，小模型和大模型在 t̂ 座標上的形狀就不一樣。

## 11 B｜證據、保證與前提（1:00）

- 實驗：610M 掃超參數，同 τ 的曲線一起移動；固定 τ 改 TPP，形狀規律改變；Celerity 家族塌縮。
- 保證：前作 Power Lines 發現最佳 τ 只取決於 TPP。所以固定 TPP ⇒ 各規模最佳 τ 相同 ⇒ 再固定 schedule，三個條件都滿足 ⇒ 塌縮。這也是為什麼論文說塌縮是 compute-efficient 訓練的標誌。
- 應用：一個 1.8B 的 run，殘差在訓練到 60% 時就揭露數值問題，比原始 loss 早；在 111M 上擬合曲線形式，外推到 3.3B（約 1000 倍 FLOPs）；調參時固定 τ，看前 10% 到 30% 就能提早停掉差的設定。
- 前提：μP、超參數是該資料預算下的最佳值、訓練結束時 bias 可忽略、loss 呈 power law、AdamW。其他 optimizer 與資料 curriculum 是否成立，論文列為限制。

## 12 C｜對 Lab6 的意義（1:10）

- 條件核對：TPP 由 lab 規定為 200，已滿足；schedule 自己決定，建議 WSD，warmup 和 cooldown 用比例；τ 要在 150M 掃，中心可以放 Celerity 的 0.05（他們是 234 TPP，很接近，但資料和架構不同）；μP 要自己實作 param groups 和 logit multiplier。
- 預測：既然 L = L_final × 共同形狀，就能反推 L̂_final = L(t̂_now)／ℓ_ref(t̂_now)。畫面上的 2.95／1.12 ≈ 2.63 是示意數字。Lab6 規定計分預測要在 run 開始前交，所以這個方法用在 750M 驗證準度，以及 1B 訓練中途更新預測。
- 疑慮：150M 有 66% 參數是 embedding（128K vocab × 768），有效 TPP 和其他規模差很多，可能偏離塌縮曲線。

## 13 D｜我們的實驗規劃（1:10，兩步）

- 這頁是事先登記：先寫下假說，跑完再對答案，和 Lab6 要求事先交預測的精神一致。
- E1：150M τ sweep（0.0125、0.025、0.05、0.1、0.2），預期正規化曲線形狀隨 τ 規律變化；本來就要決定 weight decay，不額外花 grant。
- E2：同一個 τ，用不同的 (η, λ) 達成，預期兩條曲線重合，直接檢驗「影響形狀的是 τ」。
- E3：150M 到 750M 的 ladder，預期 300M 以上塌縮、150M 偏離。
- E4：用部分曲線預測 750M 終點，和純 L(C) 擬合比較 |Δ ln PPL|。
- 第二步：結論一句話——塌縮讓 scaling law 從預測一個點，變成預測整條曲線。謝謝。

## 來源

- Bergsma et al., *Scaling with Collapse: Efficient and Predictable Training of LLM Families*, ICLR 2026. [arXiv:2509.25087](https://arxiv.org/abs/2509.25087)
- Qiu et al., *Scaling Collapse Reveals Universal Dynamics in Compute-Optimally Trained Neural Networks*, ICML 2025. [arXiv:2507.02119](https://arxiv.org/abs/2507.02119)
- Bergsma et al., *Power Lines*. [arXiv:2505.13738](https://arxiv.org/abs/2505.13738)
- 論文 Section 5 的函數形式與 HP 調參節省量，報告前請對照原文確認細節。
