# Test Plan - Renderer/Delegation Cleanup (v2.1.0-beta.81)

## Scope
- Inline handler排除とデリゲーション化（Setup/Device UI）によるリファクタの安全確認
- 既存のレース設定/START/STOPフローへの影響がないことを確認

## Test Cases
1) Syntax checks  
   - `node --check js/ui/ui-controller.js`
2) Unit/logic  
   - `node js/test/ui-logic.test.js`
3) Manual E2E（画面で実施）  
   - 未接続で「レース設定再送」/STARTを押しアラート表示を確認  
   - Setupで入力変更・削除・ペーサーチップクリック→モーダルが開くことを確認  
   - デバイスグリッドのセルクリック→モーダル表示、各ボタン（Blink/Swap/Replace scan・manual/Dummy/Remove/Close）が動作しグリッドが再描画されることを確認  
   - レース1で「レース設定再送」→バッジ消失、レース2で「レース設定再送」→レース1に「要レース設定再送」表示を確認  
   - START→距離+50m停止・全員到達でSTOP1回送信、STOP後は対象レースのみバッジ復活を確認  
   - バッジ/ボタンのツールチップが「レース設定（色/ペース）を再送」と表示されることを確認

## Results
- `node --check js/ui/ui-controller.js`: Pass  
- `node js/test/ui-logic.test.js`: Pass  
- Manual E2E: 未実施（実機/HTTPS環境が必要）
