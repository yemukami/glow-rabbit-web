# 次スレ開始用コンテキスト（必読・コピペ用）

- 現行バージョン: **v2.1.0-beta.48**
- 同期/STARTの設計: 同期フェーズで色/ペースを送信（`syncRaceConfigs`）。STARTは最小コマンド（先行点灯＋startRunner）。設定未送信の場合のみSTARTで自動送信する安全弁あり。`syncNeeded` で要同期を表示。
- BLEガード: 未接続で同期/STARTを押すとアラート表示。接続失敗もアラート。
- 懺悔: stopRunnerで設定が消える/同期とSTARTを往復したデグレを記録（REMORSE_LOG.md）。以後、仕様固定＋テスト先行で変更。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node --check js/core/race-sync-service.js`, `node js/test/ui-logic.test.js`, `node js/test/race-service.test.js` ほか既存を実行済み。
- 残タスク案: syncNeededバナー/導線強化、START時のstop/再送オプションUI、号砲同期/送信可視化（BleCommandQueueログ表示）。

次スレで最初に伝えること（コピペ推奨）:
「現行 v2.1.0-beta.48。同期/START分離: 同期で色/ペース送信、STARTは先行点灯＋startRunnerのみ（未送信時は自動送信）。未接続で同期/STARTするとアラート。syncNeededバッジあり。懺悔ログにstopRunner起因の設定消失と同期/START迷走を記録。残タスク: sync導線強化、STARTオプションUI、号砲同期/送信可視化。テスト一式実行済み。」
