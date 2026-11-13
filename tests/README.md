測試使用方式

npm ci && npm test && npm run build

資料庫安全測試：建立乾淨的 PostgreSQL 17 測試資料庫，以超級使用者依序執行 bootstrap.sql、../supabase/migrations/001_v3.sql、security.sql。bootstrap 僅模擬 Supabase 的 auth/storage schema，絕對不可用於正式 Supabase 專案。

瀏覽器測試：啟動 Vite 時設定測試 URL https://test.supabase.co、測試 key 及測試門市 UUID 11111111-1111-4111-a111-111111111111，執行 node tests/browser.mjs。使用 /usr/bin/chromium，HTTP 回應為模擬資料，測試產物在 test-artifacts/。這不取代正式 Supabase 或 iPhone 測試。

OCR：test-artifacts/ocr-fixture.png 為製造/有效雙日期合成圖；將 eng.traineddata.gz 從 Tesseract 官方模型鏡像下載到 test-artifacts/，執行 node tests/ocr.mjs。此測試使用真正 Tesseract 引擎，但不是實拍包裝。
