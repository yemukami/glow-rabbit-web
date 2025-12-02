# Test Plan - Renderer/Delegation Cleanup (v2.1.0-beta.125)

## Scope
- Inline handler排除とデリゲーション化（Setup/Device UI）によるリファクタの安全確認
- 既存のレース設定/START/STOPフローへの影響がないことを確認
- デバイス同期ボタンの未接続ガード統一（requireConnection適用）の確認

## Planned Checks (状態遷移一元化/renderer残タスク)
- `node --check js/ui/ui-controller.js`
- `node --check js/core/race-service.js`
- `node js/test/ui-logic.test.js`
- `node js/test/race-service.test.js`
- `node js/test/input-guards.test.js`
- 手動E2E（接続環境で実施）: 未接続アラート→レース設定再送→START/STOP→複数ペーサー距離+50m停止、バッジ/ツールチップ確認

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
   - デバイス同期ボタンを未接続状態で押すと未接続アラートが出て送信されないことを確認
   - デバイス画面から他画面へ遷移する際、リストがdirtyで未接続なら警告は出るが遷移できることを確認（同期は接続後に実施）
   - デバイスアクションモーダルの表示内容とボタン動作がクラッシュなく動くこと（デリゲーション経由）を確認
   - startPosを負値/NaNで入力しても警告ログが出て0に丸められることをUI上で確認する  

## Results
- 2025-12-xx: `node --check js/ui/ui-controller.js` (Pass)  
- 2025-12-xx: `node js/test/ui-logic.test.js` (Pass)  
- 2025-12-xx: デバイス同期ボタンの未接続ガード（requireConnection）を手動確認予定（未実施）  
- 2025-12-xx: デバイス画面離脱時のdirty＋未接続時に警告のみで遷移できることを手動確認予定（未実施）  
- Manual E2E: 未実施（実機/HTTPS環境が必要）
