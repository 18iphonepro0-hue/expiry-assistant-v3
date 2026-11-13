# 即期品下架助手 V3｜門市多人共用版

實作狀態：已連接正式 Supabase 專案，匿名登入及未授權存取防護已實測通過。GitHub Pages 已發布，正式網址：https://18iphonepro0-hue.github.io/expiry-assistant-v3/ 。持有門市密碼的使用者仍需驗收正確登入、新增及跨裝置同步。公開連線設定位於 src/store-config.js，只含 publishable key；不含門市密碼或管理金鑰。

## 同事操作說明（上線後可直接轉傳）

用 Safari 開啟門市網址 → 第一次輸入門市共用密碼。首頁「今天下架」也包含已過期未移除商品。按「拍照新增」，拍清楚有效日期，從辨識結果選擇並核對年、月、日；辨識失敗直接手動填寫。名稱可留白。商品售出或下架後按「刪除」，誤刪可在 8 秒內按「復原」。顯示「待同步」時請保留此網頁，連網後等到同步完成。無須同事註冊任何帳號或安裝 App。

## 管理員備份及還原

開啟「備份、行事曆與設定」→「匯出完整備份」，保存 JSON 到 iPhone「檔案」或 iCloud Drive。檔案包含目前清單及照片，應妥善保管。離線時只能匯出手機已快取的資料，完整備份請連網且確認無待同步操作後執行。

「還原 / 匯入 V2 備份」可合併 V3 備份或 V2 的 `expiry-helper-v2` / schema 1 備份。相同編號不覆蓋，包括已刪除紀錄；重複匯入不會復活已售出商品。V2 原本沒有照片的紀錄以清楚標示的佔位照片匯入。此功能不是整庫災難復原：若要復原被刪除的既有編號，需由管理員檢查資料庫後處理。V2 每支手機的舊資料要先各自匯出備份，V3 不能跨網站自動讀取它們。

更換共用密碼：由擁有 Supabase 管理帳號的人，在 SQL Editor 執行 `supabase/admin.sql.example` 的更新指令，替換門市 UUID 與新密碼，並保留 `epoch=epoch+1`。舊裝置會於下一次雲端存取時要求重新登入，已下載到手機的資料無法遠端抹除。不會刪除待同步佇列。同事不需要 Supabase 帳號。

## 部署路線（供維護者；對話操作仍一次一步）

1. 在自己的 Supabase 帳號建立免費專案，保存資料庫密碼，不貼入對話。
2. 在 Authentication → Sign In / Providers 啟用 Anonymous Sign-Ins（匿名登入）。這只是讓伺服器辨識每支手機，不要求同事建立帳號。保留 Supabase 的登入速率限制。
3. 在 SQL Editor 執行 `supabase/migrations/001_v3.sql`。只對新的專用 Supabase 專案執行一次，會建立 products/stores 等資料表及私人照片 bucket。不要執行 tests/bootstrap.sql。
4. 在 SQL Editor 按 `supabase/admin.sql.example` 建立門市。密碼請使用至少 16 字元隨機字串，在自己的密碼管理器保存；程式庫與前端不保存密碼。記下回傳 UUID。
5. 新建 GitHub 儲存庫，把本目錄內容放在儲存庫根目錄（含 .github）。免費 GitHub Pages 一般需公開程式庫；此專案原始碼沒有門市密碼、照片、商品資料或管理金鑰。公開前確認沒有把備份和測試產物放入程式庫。不能將現有私人專案擅自公開。
6. 儲存庫 Settings → Secrets and variables → Actions → Variables 設定 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（僅 publishable/anon 公開金鑰）、`VITE_STORE_ID`、`VITE_STORE_NAME`。service_role / secret key / 資料庫密碼絕對不能放到 VITE_ 變數。
7. Settings → Pages → Source 選 GitHub Actions；執行 Deploy V3 to GitHub Pages 工作流程，成功後以 deployment 回傳的 HTTPS 網址驗收。工作流程的變數不可空白。
8. 用兩個不同瀏覽器登入同一門市，測試新增、照片、修改、刪除/復原、即時同步、斷線重試；以未登入瀏覽器確認無法存取雲端資料。最後再傳網址給同事。

本機開發：Node.js 24，`npm ci`、複製 `.env.example` 為 `.env.local` 並填公開設定，`npm run dev`。`npm run build` 產生 dist，使用相對路徑支援 GitHub Pages 子路徑。

## 實作與限制

- Supabase Anonymous Auth 取得裝置身分，`join_store` 在伺服器用 bcrypt 驗證共用密碼，membership 綁定密碼版本；輸入密碼不保存至本機。
- RLS 僅允許當前門市成員讀取資料；寫入只透過 `apply_operation`。照片 bucket 非公開，成員才能下載/新增，不開放修改/刪除照片。
- 資料庫以操作 UUID 避免重複，修改/刪除以 version 防止靜默覆蓋同事資料。衝突會暫停佇列並提供捨棄該筆操作按鈕，後續可重新修改。
- IndexedDB 保存離線佇列及照片，Web Locks 協調同瀏覽器多分頁；網頁需開啟才能同步，清除網站資料/私人瀏覽/裝置遺失會使未上傳資料遺失。不是背景自動上傳 App。
- Realtime 訂閱有 RLS，另每 25 秒及回到前景時重新讀取；斷線會顯示重連與最後同步時間。日期一律 Asia/Taipei，每 25 秒及回前景刷新。商品有效日期當天即應下架，不自動刪除逾期商品。
- Tesseract.js 真正 OCR，在手機執行；首次模型與引擎下載需要網路，載入失敗可手動輸入。支援西元、民國、中文年月日、YYYYMMDD、月/日。兩位數年份不猜世紀；多個候選由人選擇，並核對是否為製造日期。未實測彎曲包裝、反光、模糊及所有台灣品牌字體。
- iPhone 相片透過瀏覽器解碼再縮圖為 JPEG；不支援的照片會要求重拍。照片最長邊 2200px，最多 3 MB。相機需正式 HTTPS 網址。
- 刪除為軟刪除，前端復原按鈕 8 秒，伺服器最大允許 30 秒；超過復原時間不自動從資料庫或 Storage 清除。管理員需定期評估免費方案用量及照片清理；Supabase 免費專案可能因閒置暫停，實際配額以帳號頁面為準。沒有購買或啟用付費方案。
- 匯出 .ics 是手動提醒，已匯入手機的事件不會跟著資料庫刪除或修改。

## 驗證

見 TEST-RESULTS.md。`tests/` 包含日期、安全資料庫、瀏覽器與真正 OCR 測試。`reference/v2.html` 保存使用者提供的原始 V2，供遷移比對。

## 此門市的 GitHub Pages 簡化部署

正式 Supabase 專案為 ccuavehijozbebxvqfoo；門市 ID 為 3aa8dfe4-f525-43a9-a855-3b37a0d78973。src/store-config.js 已含公開設定，不需要逐一設定 Actions 變數。將完整程式及 docs 建置輸出放在獨立公開儲存庫後，Settings → Pages → Deploy from a branch → main → /docs → Save。這條部署路線不使用 Actions 工作流程，也不需要同事擁有任何帳號。

更新程式後執行 npm run build:pages，提交更新後的 docs。保留現有的 src/store-config.js 公開設定。
