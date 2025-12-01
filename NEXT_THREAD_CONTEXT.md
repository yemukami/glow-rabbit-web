# 次スレ開始用コンテキスト（必読・コピペ用）

- 必読ファイル: `REMORSE_AND_PREVENTION.md`（懺悔/再発防止チェック）、`REQUEST_ACTIONS_LOG.md`（要求ごとの対応記録）、`SYNC_START_SPEC.md`、`REMORSE_LOG.md`
- 現行バージョン: **v2.1.0-beta.71**
- 同期/STARTの設計: 同期フェーズで色/ペースを送信（`syncRaceConfigs`）。STARTは最小コマンド（先行点灯＋startRunner）。設定未送信の場合のみSTARTで自動送信する安全弁あり。`syncNeeded` で要同期を表示。STOP後は `initialConfigSent=false` / `syncNeeded=true` に戻して再同期を必須に。
- BLEガード: 未接続で同期/STARTはアラート。STOPは未接続でもdry-runでUI停止＆記録（接続時は高優先度送信）。接続失敗もアラート。START失敗理由（no pacer/busy/not found）はアラートで明示。
- STOP/オーバーラン: プロトコル上 stopRunner は全体停止のみ。現状はペーサーごとにゴール距離でUI表示は止めるが、実機停止は最遅ペースのSTOP1回に依存（個別停止はFW拡張が必要）。FINISH_MARGINは一時0に変更済み。
- 今日の進捗: SYNCボタンのスタイルを整え、rendererのID衝突を回避。ペーサーゴール挙動を調整（距離到達でUI停止、STOPは全体1回）。
- テスト: 主要テストは適宜実行（race-service/race-renderer等）。
- 残タスク案: renderer全面移行（DOM更新の集約）、状態遷移/フラグのさらなる一元化、入力バリデーション/ログ整理、プロトコルが許せばペーサー個別停止の検討。

次スレで最初に伝えること（コピペ推奨）:
「現行 v2.1.0-beta.71。必読: REMORSE_AND_PREVENTION.md / REQUEST_ACTIONS_LOG.md / SYNC_START_SPEC.md / REMORSE_LOG.md。同期/START分離: 同期で色/ペース送信、STARTは先行点灯＋startRunnerのみ（未送信時は自動送信）。未接続で同期/STARTはアラート、STOPは未接続でもdry-runでUI停止（接続時は送信）。STOP後は再同期必須。syncNeededバッジあり。STOPは全体1回のみ（プロトコル制約）、UI上は各ペーサーがゴール距離で止まるが実機停止は最遅ペースのSTOPに依存。進捗: SYNCボタン整形、renderer ID衝突回避、ペーサーゴール挙動調整。残タスク: renderer全面移行/状態遷移一元化/入力バリデーション・ログ整理/可能ならペーサー個別停止の検討。」 
