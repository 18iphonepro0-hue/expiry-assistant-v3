# 即期品下架助手 V3｜門市使用說明

正式網址：https://18iphonepro0-hue.github.io/expiry-assistant-v3/

## 可直接傳給同事

用 Safari 開啟上方網址，第一次輸入門市共用密碼。查看「今天下架」；按「拍照新增」拍清楚有效日期，選擇並核對年、月、日後儲存，名稱可留白。商品售出或已下架就按「刪除」，誤刪可在 8 秒內按「復原」。顯示「待同步」時，請保持網頁開啟並等恢復連線後同步完成。不必註冊任何帳號，也不用安裝 App。

## 管理員備份與還原

連網並確認沒有待同步資料後，開啟「備份、行事曆與設定」→「匯出完整備份」，把檔案保存到 iPhone「檔案」或 iCloud Drive。備份包含商品照片，請妥善保管。

「還原 / 匯入 V2 備份」可匯入 V2/V3 備份，合併到全店清單。相同編號不覆蓋，包含已刪除的紀錄；因此已售出的商品不會因重複匯入而重新出現。完整說明見 README.md。

## 更換門市共用密碼

只由管理員在 Supabase SQL Editor 操作。以下內容只修改一次「在這裡填新密碼」；不要把修改後的 SQL 或密碼存入 GitHub，也不要貼到對話。執行後，所有手機下一次存取雲端時均需以新密碼登入。已下載的手機快取無法遠端抹除。

```sql
DO $change_password$
DECLARE
  p text := '在這裡填新密碼';
BEGIN
  IF p IS NULL OR length(p) NOT BETWEEN 16 AND 32 THEN
    RAISE EXCEPTION '請填入16～32碼的英數新密碼';
  END IF;
  UPDATE public.stores
  SET password_hash = extensions.crypt(p, extensions.gen_salt('bf', 12)),
      epoch = epoch + 1
  WHERE id = '3aa8dfe4-f525-43a9-a855-3b37a0d78973';
  IF NOT FOUND THEN
    RAISE EXCEPTION '找不到指定門市，密碼尚未變更';
  END IF;
END;
$change_password$;
```

## 測試狀態

已通過：正式 HTTPS 發布、手機尺寸登入頁載入、雲端錯誤/空值密碼及未授權讀寫防護、本機日期/OCR/修改衝突/離線佇列/備份匯入測試。

待驗收：使用者以正確密碼登入、正式商品照片上傳、兩支手機即時同步、實體 iPhone 相機/包裝辨識及行事曆通知。測試詳情見 TEST-RESULTS.md。
