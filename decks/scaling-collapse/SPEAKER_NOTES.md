# Scaling with Collapse：講稿

每頁的建議時間加總約 10 分 40 秒；第 2、4、5 頁可各壓 10 秒。畫面只放結論，細節和數字來源放在這裡。

## 01 封面（0:10）

今天報告 Bergsma 等人在 ICLR 2026 的 *Scaling with Collapse*，並說明它和我們 Lab6、以及 Upwash 實驗規劃的關係。

## 02 小規模實驗，怎麼可靠地外推？（0:50）

- Lab6：大約 60 次 150M 規模的 run，最後要預測 1B／200B 的 PPL，而且預測要在 run 開始前交出，用 |ln PPL̂ − ln PPL| 計分。
- 讀書會的長期目標：1B 對標 Qwen3-4B，並降低對 CUDA 的依賴。
- 傳統 scaling law 擬合的是終點的一個數字。這篇論文問：能不能預測整條訓練曲線？

## 03 Collapse：形狀相同，不是 loss 相同（1:20，三步）

- 第一步：原始曲線。模型越大、訓練越久，loss 越低，曲線的長度和高度都不同。
- 第二步：正規化後疊成同一條。強調「塌縮不是收斂」，大模型的 loss 依然比較低，相同的是下降的形狀。
- 第三步：τ 沒有正確縮放的成員，終點一樣，路徑卻對不上。
- 這張圖是合成的示意曲線，不是論文或我們的實驗數據；論文的對照是 Fig. 1（Llama-2 不塌縮、Celerity 塌縮）。

## 04 怎麼正規化一條 loss curve（0:50）

- 橫軸：訓練進度 t̂ = 已訓練 tokens／總 tokens。用 token 比用 step 安全，因為不同規模的 batch size 可能不同。
- 縱軸：論文的一般式是 (L − L̂)／(L_final − L̂)，實際採用 L̂ = 0，也就是直接除以最終 training loss，因為這樣對齊最好。
- 曲線先做 100 step 的移動平均。
- 我們的做法：L_final 取最後一段的平均；內插到同一組 t̂；殘差用 2 個 seed 的差距當雜訊基準。

## 05 三個控制量決定曲線形狀（0:50）

- 各規模之間要一致的三個量：TPP、AdamW timescale τ、LR schedule。
- TPP：固定 τ 時，TPP 越高，曲線越低、越早下降、也越早變平。
- 對照：Llama-2 各規模的 TPP 不同，τ 約 0.07 和 0.13，曲線不塌縮；Celerity 的 300M、500M、900M、1.8B 都是 234 TPP、τ = 0.05，曲線塌縮。

## 06 τ 從哪裡來？AdamW 的權重是一個 EMA（1:10，兩步）

- 先講清楚：τ 不是 AdamW 的超參數。AdamW 的超參數是 lr（η）、β₁、β₂、ε、weight_decay（λ）；τ 是 Wang & Aitchison（2024）提出、Power Lines 和這篇沿用的衍生量。
- 第一步：AdamW 每步是 θ_t = θ_{t−1} − ηλ·θ_{t−1} − η·u_t。合併前兩項，再把 η 寫成 ηλ·(1/λ)，就得到 θ_t = (1 − ηλ)·θ_{t−1} + ηλ·(−u_t/λ)。這是 EMA 的標準形式，係數 α = ηλ。所以權重就是「−u／λ」的指數移動平均。
- 第二步：係數 α 的 EMA 大約記得最近 1/α 步，所以 τ_iter = 1/(ηλ)。除以總步數 T = D/B，就是 τ = 1/(ηλT) = B/(ηλD)，代表權重記得整個訓練的多大比例。
- 例子：η = 3×10⁻⁴、λ = 0.1、T = 50,000 → ηλ = 3×10⁻⁵，τ_iter ≈ 33,000 步，τ ≈ 0.67。
- 被問到再講：Adam 的 β₁、β₂ 也是 EMA，但對象是梯度統計，時間尺度只有 1/(1−β)，約 10 到 20 步；τ 講的是權重本身，通常是整個訓練的幾成。

## 07 為什麼關鍵是 τ？（1:10，兩步）

- 機制：論文用 noisy quadratic model 推導。bias 項隨 t̂／τ 指數衰減，variance 的下限約和 1／τ 成正比。τ 小，bias 降得快，但停在比較高的地方。LR 衰減會讓瞬時 τ_t = 1/(η_t·λ·T) 變大，所以訓練末段 loss 會急降。
- 推論：曲率 h 只以乘法出現在最外面（畫面上標成暖色），除以 L(1) 就約掉了，正規化曲線只由 τ 和 t̂ 決定。前提是訓練結束時 bias 可以忽略。
- 實驗上，只要 τ 相同，不論改的是 η、λ 還是 B，曲線都一起移動。所以要調的是 τ，不是個別的 weight decay。
- 補充（被問到再講）：Power Lines（Bergsma et al. 2025）發現最佳 τ 隨 TPP 呈 power law，指數約 −0.527；所以「固定 TPP + 最佳 τ」實務上就是各規模用同一個 τ。

## 08 塌縮能拿來做什麼（0:45）

- 診斷：一個 1.8B 的 Celerity run，塌縮殘差在訓練到 60% 時就顯示數值不穩定，原始 loss 曲線還看不出上升。
- 預測：在 111M 的 run 上擬合正規化曲線的函數形式，外推 3.3B，FLOPs 約差 1000 倍。HP 調參時固定 τ（而不是固定 weight decay），曲線排序能保持，看前 10% 到 30% 就能提早停掉差的設定。
- 論文實驗設定：類 GPT-2（ALiBi、SwiGLU）、SlimPajama、AdamW、μP、linear decay-to-zero、2048 context。

## 09 和我們的關係（0:50）

- Lab6：200 TPP 是規定好的，條件天生就接近。Celerity 的 234 TPP、τ = 0.05 可以當 τ sweep 的中心點，但資料、架構和 vocab 都不同，最佳值不一定一樣。
- CUDA：論文所有實驗都在 Cerebras CS-3 上跑，代表塌縮是演算法層面的性質。我們之後自己寫 kernel 或換到非 CUDA 的 backend，最怕數值上的小 bug，塌縮殘差正好是偵測工具。
- 4B：要追上 4B，需要的 token 遠超 200B。可預測性讓我們能先用小規模實驗估算需要多少 compute。

## 10 Upwash：現況與缺口（0:50）

- 已完成（TDD）：parquet 讀取、排除 dev ids、Llama 3.2 tokenizer、`<u4` token shard、`PackedTokenDataset`；Config、Builder、MemoryLogger、最小 Trainer（SGD）。
- 還缺：Llama 3.2 model、AdamW 與 param groups、LR scheduler、bf16、DDP、checkpoint、eval loop、密集 logging（task 013 的 wandb adapter）、多 shard 與 token budget。
- 為了塌縮實驗要改的三個介面：
  1. `build_trainer` 目前把 `model.parameters()` 直接傳給 optimizer；μP 需要依角色和 fan-in 分組，要改成傳 param groups。
  2. `Trainer.train()` 每次呼叫都把 `global_step` 歸零；scheduler 和 t̂ 需要跨呼叫累積的 step 與 tokens_seen。
  3. logging 目前由呼叫端決定；塌縮分析需要每 10 到 50 step 記一次 train loss 和 tokens_seen。

## 11 事先登記的實驗設計（1:00）

- 這頁是 pre-registration：先寫下假說，跑完再對答案，和 Lab6 要求事先交預測的精神一致。
- E1：150M τ sweep（0.0125、0.025、0.05、0.1、0.2），預期正規化曲線形狀隨 τ 規律變化。本來就要決定 weight decay，不額外花 grant。
- E2：同一個 τ，分別用不同的 (η, λ) 達成，預期兩條曲線重合。
- E3：150M 到 750M 的 ladder，預期 300M 以上塌縮、150M 偏離，因為 150M 有 66% 的參數是 embedding（128K vocab × 768）。
- E4：用部分曲線預測 750M 終點，和純 L(C) 擬合比較 |Δ ln PPL|。
- 前提：μP 加 CompleteP、各規模相同的 schedule、τ 的定義（coupled 或 independent weight decay）在 sweep 前先決定。

## 12 用參考曲線預測終點（0:30）

- 訓練進行中不知道 L_final，但可以反推：L̂_final = L(t̂_now)／ℓ_ref(t̂_now)。
- 畫面的 2.95／1.12 ≈ 2.63 是示意數字。
- 注意：t̂ < 0.05 不要用；schedule 形狀要相同；用 train loss，因為 eval 只有每 10% 一次。
- Lab6 規定計分預測要在 run 前交，所以這個方法改善的是訓練中途的預測更新。

## 13 結尾（0:20）

一句話總結：塌縮讓 scaling law 從預測一個點，變成預測整條曲線，關鍵在 τ。留給大家的問題：embedding 佔多數的小模型，還會塌縮嗎？

## 來源

- Bergsma et al., *Scaling with Collapse: Efficient and Predictable Training of LLM Families*, ICLR 2026. [arXiv:2509.25087](https://arxiv.org/abs/2509.25087)
- Bergsma et al., *Power Lines: Scaling Laws for Weight Decay and Batch Size in LLM Pre-training*. [arXiv:2505.13738](https://arxiv.org/abs/2505.13738)
- 論文 Section 5 的函數形式與 HP 調參節省量，報告前請對照原文確認細節。
