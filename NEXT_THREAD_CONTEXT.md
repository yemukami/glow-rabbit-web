# 次スレ開始用コンテキスト（必読・コピペ用）

- 必読ファイル: `REMORSE_AND_PREVENTION.md`（懺悔/再発防止チェック）、`REQUEST_ACTIONS_LOG.md`（要求ごとの対応記録）、`SYNC_START_SPEC.md`、`REMORSE_LOG.md`
- 現行バージョン: **v2.1.0-beta.64**
- 同期/STARTの設計: 同期フェーズで色/ペースを送信（`syncRaceConfigs`）。STARTは最小コマンド（先行点灯＋startRunner）。設定未送信の場合のみSTARTで自動送信する安全弁あり。`syncNeeded` で要同期を表示。STOP後は `initialConfigSent=false` / `syncNeeded=true` に戻して再同期を必須に。
- BLEガード: 未接続で同期/STARTはアラート。STOPは未接続でもdry-runでUI停止＆記録（接続時は高優先度送信）。接続失敗もアラート。
- 懺悔: stopRunnerで設定が消える/同期とSTARTを往復したデグレを記録（REMORSE_LOG.md）。以後、仕様固定＋テスト先行で変更。
- 今日の進捗: レース描画をrenderer側で組み立て＆進行中のUI更新もrenderer経由に寄せ、renderer向けのテストを追加。ui-logicのモックをHTMLベースに更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node --check js/core/race-sync-service.js`, `node --check js/ui/race-renderer.js`; `node js/test/pace-calculator.test.js`, `device-manager.test.js`, `render-utils.test.js`, `race-view-model.test.js`, `race-renderer.test.js`, `race-service.test.js`, `ui-logic.test.js` を実行済み。
- 残タスク案: レース描画のrenderer全面移行（進行時DOM更新の集約/VM活用の徹底）、状態遷移/フラグのサービス一元化、sync導線・テスト強化、号砲同期/送信可視化。

次スレで最初に伝えること（コピペ推奨）:
「現行 v2.1.0-beta.64。必読: REMORSE_AND_PREVENTION.md / REQUEST_ACTIONS_LOG.md / SYNC_START_SPEC.md / REMORSE_LOG.md。同期/START分離: 同期で色/ペース送信、STARTは先行点灯＋startRunnerのみ（未送信時は自動送信）。未接続で同期/STARTはアラート、STOPは未接続でもdry-runでUI停止（接続時は送信）。STOP後は再同期必須。syncNeededバッジあり。懺悔ログにstopRunner起因の設定消失と同期/START迷走を記録。進捗: renderer側でレース行生成と進行中UI更新を統一、rendererテスト追加、ui-logicモックをHTML評価に整備。残タスク: renderer全面移行/状態遷移一元化/sync導線強化/号砲同期・送信可視化。テスト一式実行済み。」
