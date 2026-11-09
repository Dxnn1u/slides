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

- 一句話：在 μP 下，各規模的 TPP 相同、τ 相同、LR schedule 相同，正規化後的 loss curve 就會疊成同一條。
- 「最佳」是另一層：前作發現最佳 τ 只取決於 TPP，所以 TPP 固定時，各規模的 τ 取最佳值就自然相同。也就是說，好好訓練的家族本來就會塌縮。
- 對照：Llama-2 各規模 TPP 不同，τ 約 0.07 和 0.13，曲線不塌縮；Celerity 的 300M 到 3.9B 都是 234 TPP、τ = 0.05，曲線塌縮。
- 左右兩個小圖是示意，真實的對照是論文 Fig. 1。
- 這個主張建立在 Qiu et al.（ICML 2025）的發現上：他們在小規模的 compute-optimal 訓練看到曲線塌縮；這篇用實驗展示，在寬度、深度、batch size、weight decay 一起放大的真實 LLM 家族也成立，並找出 τ 這個關鍵。

## 05 B｜每條曲線各自正規化（0:50）

- 塌縮比的是「各自正規化之後」的曲線：每條曲線的橫軸除以自己的總 token 數，縱軸除以自己的最終 loss。
- 一般式是 (L − L̂)／(L_final − L̂)；論文發現 L̂ = 0 對齊最好，所以直接除以最終 loss，也不用去估 irreducible loss。為什麼 L̂ = 0 最好，論文自己也還不知道，列為未來工作。
- 實作：train loss 先做 100 step 移動平均，也就是把每個點換成連續 100 步 loss 的平均，用來壓掉小 batch 的雜訊；這是畫圖時才做，不影響訓練。L_final 取最後一段平均；各規模內插到同一組 t̂ 再相減；殘差要和 seed 之間的雜訊比較。

## 06 B｜Collapse：形狀相同，不是 loss 相同（1:00，三步）

- 第一步：原始曲線，越大的模型 loss 越低、訓練越久，長度和高度都不同。
- 第二步：各自正規化後疊成同一條。強調塌縮不是收斂：大模型的 loss 仍然比較低，相同的是下降的形狀。
- 第三步：τ 沒有正確縮放的成員，終點同樣是 1，路徑卻對不上。這就是為什麼塌縮可以當作「超參數縮放是否正確」的檢查。
- 圖是合成的示意曲線。

## 07 B｜機制 ① τ 從哪裡來？（1:00，兩步）

- τ 不是 AdamW 的超參數；AdamW 的超參數是 η、β₁、β₂、ε、λ。Wang & Aitchison（2024）指出 AdamW 的權重是 EMA，時間尺度以步數或 epoch 計；除以總步數的正規化 τ 是 Power Lines（Bergsma et al. 2025a）定義的，這篇沿用。
- 第一步：θ_t = θ_{t−1} − ηλ·θ_{t−1} − η·u_t，合併後改寫成 (1 − ηλ)·θ_{t−1} + ηλ·(−u_t/λ)。這是 EMA 的標準形式，係數 α = ηλ。
- 第二步：係數 α 的 EMA 大約記得最近 1/α 步，所以 τ_iter = 1/(ηλ)；除以總步數 T = D/B，得到 τ = B/(ηλD)，代表權重記得整個訓練的多大比例。
- 例：η = 3×10⁻⁴、λ = 0.1、T = 50,000 → τ ≈ 0.67。實作時 η 要用 μP 調整後的值，不是 base LR。β₁、β₂ 也是 EMA，但對象是梯度統計，只記得幾十步。

## 08 B｜機制 ② τ 決定曲線形狀（1:00，兩步）

- 第一步：noisy quadratic model 下，期望 loss 是 bias（初始化偏差，隨 t̂／τ 指數衰減）加 variance（梯度雜訊的下限，約和 1／τ 成正比）。τ 決定兩者比例，也就決定曲線怎麼彎。
- 要分 schedule 講：constant LR 下，τ 小時前期降得快，但停得比較高；linear decay-to-zero 下效果反過來（論文 Fig. 10），τ 小時後期掉得更多，τ 大時前期掉得更多。原因是 LR 衰減時瞬時 τ_t 變大，小 τ 的 run 在後期多得到很多壓雜訊的效果。
- 第二步：曲率 h 只以乘法出現在最外面（暖色），除以 L(1) 就約掉。模型大小造成的差異只會等比例縮放，剩下的形狀只由 τ 和 t̂ 決定。前提是訓練結束時 bias 可忽略。
- 實驗上，610M 模型只要 τ 相同，不管改 η、λ 還是 B，曲線都一起移動。

## 09 B｜機制 ③ TPP 為什麼必須相同（0:50）

- 論文的論點：constant LR 下，訓練到 t̂ 的那一點，就像一個只訓練到 t̂·TPP 的完整訓練的終點。
- 用 Chinchilla 形式代入（取 α = β 簡化）：L(t̂) = E + N^(−α)·[A + B·k^(−α)·t̂^(−α)]。減掉 E 再除以終點，N 被約掉，k（TPP）留下來。
- 所以不同大小的模型只要 TPP 相同就同形；TPP 不同，形狀就不同。右圖是用這個式子畫的示意：TPP 越高，前段越早變平。
- 這個推導取 L̂ = E；論文實務上發現 L̂ = 0 對齊更好，原因論文也還不知道。

## 10 B｜機制 ④ LR schedule 為什麼必須相同（0:40）

- LR schedule 就是 learning rate 隨訓練進度變化的規則：warmup、cosine、linear decay-to-zero（論文用的）、WSD。
- 它決定 τ 帶來的 bias–variance 取捨怎麼分配：前期 LR 高，權重快速離開初始值；後期 LR 降，瞬時 τ_t = 1/(η_t·λ·T) 變大，雜訊被平均掉，loss 急降。
- 在 μP 下，schedule 造成的形變與規模無關，所以只要各規模用同一種形狀就不會破壞塌縮。
- warmup 要用佔訓練的比例設定，論文有佐證：Celerity 的 warmup 是 min(10% 總 token, 375M token)，受上限影響的規模比例就不同，論文把 20 TPP 那組前段的小偏差歸因於此。圖上的 schedule 也照論文用 10% warmup。

## 11 B｜證據、保證與前提（1:00）

- 實驗：610M、80 TPP 掃 η、λ 或 B，只要 τ 一樣，曲線形狀就一樣；固定 τ 改 TPP，TPP 越高越早變平；Celerity 300M–3.9B 在 20、80、234 TPP 三組都塌縮。234 TPP 時大模型的 training loss 後期掉得比預期多，但 held-out loss 仍然對得上。
- 保證：前作 Power Lines 發現最佳 τ 只取決於 TPP。所以固定 TPP ⇒ 各規模最佳 τ 相同 ⇒ 再固定 schedule，三個條件都滿足 ⇒ 塌縮。這也是為什麼論文說塌縮是 compute-efficient 訓練的標誌。
- 應用一：Celerity 1.8B 的原始曲線要到 90% 之後才看得出 loss 上升；拿 500M 當參考，殘差把問題起點定位在約 60%。原因是 job 重啟換了機器後，某個 loss kernel 只在特定 microbatch size 下出現數值錯誤；修好後從偏離前重啟，曲線就貼回參考。對手寫 kernel 的訓練框架，這種檢查特別有用。
- 應用二：在 111M 上擬合曲線的函數形式，外推到 3.3B（約 1000 倍 FLOPs）。
- 應用三：λ sweep 時，把部分曲線對齊參考曲線來預測終點，1.7B 看 30%、3.3B 看 10% 就能選到最佳值。調 batch size 時要固定 τ（調整 λ），曲線排序才不會交叉。
- 前提：μP（Celerity 用的是 CompleteP，同時處理寬度和深度）、AdamW、單一 epoch、超參數是該資料預算下的最佳值、訓練結束時 bias 可忽略、loss 呈 power law。其他 optimizer、多 epoch、資料 curriculum 是否成立，論文列為限制。

## 12 C｜對 Lab6 的意義（1:10）

- 條件核對：TPP 由 lab 規定為 200，已滿足；schedule 各規模要用同一種，用哪一種還沒決定，warmup 用比例；τ 要在 150M 掃，中心可以放 Celerity 的 0.05（他們是 234 TPP，很接近，但資料和架構不同）；τ 要用 μP 調整後的 LR 計算；μP 要自己實作 param groups 和 logit multiplier，如果 ladder 也改層數，就考慮 CompleteP。
- 預測：用論文 §5 的方法。取已跑完的一段 S（例如 20%–30%），找一個除數 c，讓 L(t̂)／c 在這段和參考曲線最貼合，c 就是預測的最終 loss。用一整段擬合比單點相除穩。Lab6 規定計分預測要在 run 開始前交，所以這個方法用在 750M 驗證準度，以及 1B 訓練中途更新預測。
- 待驗證：150M 約 66% 參數是 embedding（128K vocab × 768，tied）。不過 Celerity 300M（d = 640、128K vocab、untied）的 embedding 比例相近，仍然塌縮，所以我們不預期它偏離。

## 13 D｜我們的實驗規劃（1:10，兩步）

- 這頁是事先登記：先寫下假說，跑完再對答案，和 Lab6 要求事先交預測的精神一致。
- E1：150M τ sweep（0.0125、0.025、0.05、0.1、0.2），預期正規化曲線形狀隨 τ 規律變化；本來就要決定 weight decay，不額外花 grant。
- E2：同一個 τ，用不同的 (η, λ) 達成，預期兩條曲線重合，直接檢驗「影響形狀的是 τ」，等於在我們的框架上重現論文 Fig. 3。
- E3：150M 到 750M 的 ladder，預期全部塌縮，包含 150M；如果 150M 偏離，再回頭檢查 embedding 佔比的影響。
- E4：用部分曲線預測 750M 終點，和純 L(C) 擬合比較 |Δ ln PPL|。
- 第二步：結論一句話——塌縮讓 scaling law 從預測一個點，變成預測整條曲線。謝謝。

## 來源

- Bergsma et al., *Scaling with Collapse: Efficient and Predictable Training of LLM Families*, ICLR 2026. [arXiv:2509.25087](https://arxiv.org/abs/2509.25087)
- Qiu et al., *Scaling Collapse Reveals Universal Dynamics in Compute-Optimally Trained Neural Networks*, ICML 2025. [arXiv:2507.02119](https://arxiv.org/abs/2507.02119)
- Bergsma et al., *Power Lines*. [arXiv:2505.13738](https://arxiv.org/abs/2505.13738)
