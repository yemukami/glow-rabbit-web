現行 v2.1.0-beta.129。必読: REMORSE_AND_PREVENTION.md / REQUEST_ACTIONS_LOG.md / SYNC_START_SPEC.md / REMORSE_LOG.md。同期/START分離: 同期で色/ペース送信、STARTは先行点灯＋startRunnerのみ（未送信時は自動送信）。未接続で同期/STARTはアラート、STOPは未接続でもdry-runでUI停止（接続時は送信）。STOP後は再同期必須。syncNeededバッジあり。STOPは全体1回のみ（プロトコル制約）、表示は距離+50mまで進め、全員到達でSTOP。進捗: renderer/デリゲーション化を進め、activeRaceId整理を維持しつつレース参照をmanagerのgetRaceById/getActiveRace経由に統一。start/stop/sync/モーダルのガードを強化し、startPos入力とstartRaceService内のstartPosを非負サニタイズで統一しテストでカバー。入力ガード（非負/正整数）の単体テストを追加し、startPosサニタイズ時の警告ログをUI/サービス双方で出すよう整理。モード切替/レースタイトル/バージョン表記同期をscreen-rendererに寄せ、レース描画・進行表示もrace-screenヘルパー経由に移行しui-controllerのDOM依存を削減。dummy/未設定デバイスの試験点灯ガードも継続。これまでのSYNCボタン表記統一・要レース設定再送バッジ・renderer ID衝突回避・race UI状態集約・テーブル/デバイス操作デリゲーション・FINISH_MARGIN 50m復帰・startPos即時再描画・セグメント/デバイスrenderer分離・TEST_PLAN整備などを維持。デバイス同期は未接続なら同期を実行せず警告のみ出し、画面遷移は許可。レース進行更新でelapsedTimeを一度計算してrendererへ渡すリファクタ済み。レース画面のヒント文から「要同期」文言を除去し、レース削除確認を日本語化。フラグはレース単位で、SYNC/START/STOPは対象レースのみinitialConfigSent・syncNeededを更新。残タスクは `REMAINING_TASKS.md` を参照（renderer全面移行/状態遷移一元化/入力・ログ整理/STARTラグ可視化/ペーサー個別STOP検討/テスト追加）。E2E手順（未接続アラート→レース設定再送→START/STOP→複数ペーサー距離+50m停止確認、バッジ/ツールチップ確認、デバイス同期ボタン/離脱時ガード確認）を必ず実施。# 開始用コンテキスト

- 必読ファイル: `REMORSE_AND_PREVENTION.md`（懺悔/再発防止チェック）、`REQUEST_ACTIONS_LOG.md`（要求ごとの対応記録）、`SYNC_START_SPEC.md`、`REMORSE_LOG.md`
- .codex必読: `.codex/docs/agent_guide_web.md`, `.codex/docs/report_phase1.md`, `.codex/docs/plans.md`, `.codex/docs/SRS.md`, `.codex/docs/TESTS.md`, `.codex/docs/implementation_rules.md`
- テスト/TDD/E2E: `.codex/docs/TESTS.md` 記載のチェックを実施。コード変更時は `node --check` と該当ユニットテストを走らせ、E2E手動確認（未接続アラート→SYNC→START/STOP→複数ペーサー距離+50m停止）を必ず行う。
- ログ: 作業・思考・反省は `TODAY_LOG.md`、懺悔は `REMORSE_LOG.md`、要求ごとの対応は `REQUEST_ACTIONS_LOG.md` に都度追記し、バージョン更新・コミット・プッシュまで行うこと。
- 現行バージョン: **v2.1.0-beta.129**
- 同期/STARTの設計: 同期フェーズで色/ペースを送信（`syncRaceConfigs`）。STARTは最小コマンド（先行点灯＋startRunner）。設定未送信の場合のみSTARTで自動送信する安全弁あり。`syncNeeded` で要同期を表示。STOP後は `initialConfigSent=false` / `syncNeeded=true` に戻して再同期を必須に。
- BLEガード: 未接続で同期/STARTはアラート。STOPは未接続でもdry-runでUI停止＆記録（接続時は高優先度送信）。接続失敗もアラート。START失敗理由（no pacer/busy/not found）はアラートで明示。
- STOP/オーバーラン: stopRunner は全体停止のみ（プロトコル制約）。ペーサー表示は距離+50mまで進行、全員到達時にSTOPを1回送信。ペーサー個別STOPはFW拡張が必要。
- 今日の進捗: renderRaceScreenの重複importによる起動エラーを解消し、デバイス同期ボタンもrequireConnectionで未接続アラートを統一（挙動変更なし）。
- テスト: `node js/test/race-service.test.js` ほか主要テストは適宜実行。
- 残タスク案: renderer全面移行（DOM更新の集約/VM活用）、状態遷移/フラグ一元化、入力バリデーション/ログ整理、STARTラグ可視化UI、ペーサー個別STOP検討（FW前提）、テスト追加。

最初に伝えること:
「現行 v2.1.0-beta.109。必読: REMORSE_AND_PREVENTION.md / REQUEST_ACTIONS_LOG.md / SYNC_START_SPEC.md / REMORSE_LOG.md。同期/START分離: 同期で色/ペース送信、STARTは先行点灯＋startRunnerのみ（未送信時は自動送信）。未接続で同期/STARTはアラート、STOPは未接続でもdry-run（接続時は送信）。STOP後は再同期必須。syncNeededバッジあり。STOPは全体1回のみで表示は距離+50mまで進め、全員到達でSTOP。進捗: renderer/デリゲーション化を維持しつつ、レース参照を manager の getRaceById/getActiveRace 経由に統一し start/stop/sync/モーダルのガードを強化、startPos を非負サニタイズしテストで確認。入力ガードの単体テストを追加。startPosサニタイズ時の警告ログをUI/サービス双方で追加。dummy/未設定デバイス試験点灯ガードも維持。残タスクは REMAINING_TASKS.md を参照（renderer全面移行/状態遷移一元化/入力・ログ整理/STARTラグ可視化/ペーサー個別STOP検討/テスト追加）。E2E手順（未接続アラート→レース設定再送→START/STOP→複数ペーサー距離+50m停止確認、バッジ/ツールチップ確認）を必ず実施。」 
