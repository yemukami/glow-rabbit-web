# 次スレ開始用プロンプト

現行 v2.1.0-beta.153。必読: REMORSE_AND_PREVENTION.md / REQUEST_ACTIONS_LOG.md / SYNC_START_SPEC.md / REMORSE_LOG.md。同期/START分離: 同期で色/ペース送信、STARTは先行点灯＋startRunnerのみ（未送信時は自動送信）。未接続で同期/STARTはアラート、STOPは未接続でもdry-run（接続時は送信）。STOP後は再同期必須。syncNeededバッジあり。STOPは全体1回のみ（プロトコル制約）、表示は距離+50mまで進め、全員到達でSTOP。

- 接続/同期: 接続結果はヘッダー表示＋トースト（設定でダイアログ任意）。接続後自動同期（dummy含む）は設定でON/OFF可。接続/切断/失敗や同期実行後に共通ハンドラでヘッダーと設置同期バッジを最新化するよう整理（CONNECTION_SYNC_TASKS参照）。ヘッダーとレース行の接続ボタンは同一フロー（connectBLEUi）経由に統一し、ヘッダーのonclickを廃止してリスナー化済み。Setup/デバイス主要ボタンもリスナー化を開始。
- 文言: SYNCボタン/バッジは「レース設定送信」で統一、バッジは赤系。
- startPos: START時にstartRunnerへ渡す（先行点灯もstartDevIdx使用）。実機で反映しない場合はUI側補正が課題。
- リファクタ残: REFACTORING_TASKS.md, CONNECTION_SYNC_TASKS.md を参照。接続/同期ステータス共通化、dirty→UI反映、startPos表示補正、DOM移行残など。
- dummy: 再読込後も保持。設置内容をそのまま同期する運用（接続時自動同期ONの場合も含む）。
- テスト: コード変更時は `node --check` と該当ユニットテスト（ui-logic/race-renderer等）。手動E2Eは未接続アラート→レース設定送信→START/STOP→距離+50m停止、バッジ/ツールチップ/接続表示/設置同期バッジを確認。
- ログ: TODAY_LOG.md に作業/思考を記録、REQUEST_ACTIONS_LOG.md に要求対応を記載。懺悔は REMORSE_LOG.md。
