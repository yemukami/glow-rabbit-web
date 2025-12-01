# Glow-Rabbit Web App - Status & Remaining Tasks (v2.1.0-beta.72)

## 必読ファイル / 運用ルール
- ルール: `REMORSE_AND_PREVENTION.md`, `REQUEST_ACTIONS_LOG.md`, `SYNC_START_SPEC.md`, `REMORSE_LOG.md`
- .codex ドキュメント: `.codex/docs/agent_guide_web.md`, `.codex/docs/report_phase1.md`, `.codex/docs/plans.md`, `.codex/docs/SRS.md`, `.codex/docs/TESTS.md`
- 禁則: START/同期/stopRunner/ペース送信に触れる前に上記を再読。不明点や「可能性」ベースの変更は必ず人間に確認。
- git: 作業完了ごとにバージョン更新・テスト実行・コミット/プッシュを徹底。
- E2E手動確認（基本セット）:  
  1) 未接続で SYNC/START を押しアラート確認。  
  2) 接続後 SYNC→syncNeededバッジ消失を確認。  
  3) pacer追加→START→STOP でタイマー停止と syncNeeded 再表示を確認。  
  4) 複数ペーサー走行で、速いペーサーが距離+50mで止まり、全員到達後にSTOP 1回が送られることを確認。

## 現行バージョン
- `v2.1.0-beta.72`
- STOP/オーバーラン: プロトコル上 stopRunner は全体停止のみ。UIは距離+50mまで表示進行、全員到達時にSTOP 1回送信。ペーサー個別STOPはFW拡張が必要。

## これまでの主要作業
- 同期/START責務分離とガード整備、未接続アラート・syncNeededバッジ導入。
- renderer分割進行（行生成・進行更新をrenderer経由へ）、ID衝突回避、syncNeeded表示テスト追加。
- SYNCボタンを行アクションに追加し、スタイルを統一。
- フラグ管理をサービス側に集約（initialConfigSent/syncNeeded）し、START/STOP/リセットでヘルパー利用。
- 送信コマンドサマリをログ出力（sync/start/stop）。
- テスト拡充: race-service / race-sync-service / race-renderer / ui-logic ほか。

## 残タスク（優先イメージ）
1. renderer全面移行: `ui-controller`に残るDOM操作・進行更新をrenderer/view-model経由に集約。  
2. 状態遷移一元化: `activeRaceId`/status遷移をサービス側に寄せ、UIはイベント発火＋描画のみ。  
3. 入力バリデーション/ログ整理: 距離/startPos/人数/ペースのガード共通化、エラーメッセージ統一。  
4. STARTラグ可視化UI: 送信サマリを軽いデバッグ表示へ（挙動変更なし）。  
5. ペーサー個別STOPの可否検討: プロトコル拡張前提。FW対応が必要か要判断。  
6. テスト追加: renderer/view-modelケース、ui-controllerのガード/エラー表示周り。

## 次スレ開始時に伝えること（コピペ用）
「現行 v2.1.0-beta.72。必読: REMORSE_AND_PREVENTION.md / REQUEST_ACTIONS_LOG.md / SYNC_START_SPEC.md / REMORSE_LOG.md。同期/START分離: 同期で色/ペース送信、STARTは先行点灯＋startRunnerのみ（未送信時は自動送信）。未接続で同期/STARTはアラート、STOPは未接続でもdry-runでUI停止（接続時は送信）。STOP後は再同期必須。syncNeededバッジあり。STOPは全体1回のみ（プロトコル制約）、表示は距離+50mまで進め、全員到達でSTOP。進捗: renderer分割/ID衝突回避、SYNCボタン整形、フラグ一元化、送信サマリログ。残タスク: renderer全面移行/状態遷移一元化/入力・ログ整理/STARTラグ可視化/ペーサー個別STOP検討/テスト追加。E2E手順を必ず実施（未接続アラート→SYNC→START/STOP→複数ペーサーの距離+50m停止確認）。」
