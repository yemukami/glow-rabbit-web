# Glow-Rabbit Web App - Status & Remaining Tasks (v2.1.0-beta.104)

## 必読ファイル / 運用ルール
- ルール: `REMORSE_AND_PREVENTION.md`, `REQUEST_ACTIONS_LOG.md`, `SYNC_START_SPEC.md`, `REMORSE_LOG.md`
- .codex ドキュメント: `.codex/docs/agent_guide_web.md`, `.codex/docs/report_phase1.md`, `.codex/docs/plans.md`, `.codex/docs/SRS.md`, `.codex/docs/TESTS.md`, `.codex/docs/implementation_rules.md`
- 禁則: START/同期/stopRunner/ペース送信に触れる前に上記を再読。不明点や「可能性」ベースの変更は必ず人間に確認。
- git: 作業完了ごとにバージョン更新・テスト実行・コミット/プッシュを徹底。
- TDD/E2E: `.codex/docs/TESTS.md` 記載のテスト/チェックを実行。コード変更時は `node --check` と該当のユニットテストを走らせ、E2E手動確認も必須。  
- ログ運用: 作業・思考・反省は `TODAY_LOG.md`、懺悔は `REMORSE_LOG.md`、要求ごとの対応は `REQUEST_ACTIONS_LOG.md` に都度追記すること。
- E2E手動確認（基本セット）:  
  1) 未接続で SYNC/START を押しアラート確認。  
  2) 接続後 SYNC→syncNeededバッジ消失を確認。  
  3) pacer追加→START→STOP でタイマー停止と syncNeeded 再表示を確認。  
  4) 複数ペーサー走行で、速いペーサーが距離+50mで止まり、全員到達後にSTOP 1回が送られることを確認。

## 現行バージョン
- `v2.1.0-beta.104`
- STOP/オーバーラン: プロトコル上 stopRunner は全体停止のみ。UIは距離+50mまで表示進行、全員到達時にSTOP 1回送信。ペーサー個別STOPはFW拡張が必要。

## これまでの主要作業
- 同期/START責務分離とガード整備、未接続アラート・syncNeededバッジ導入。
- renderer分割進行（行生成・進行更新をrenderer経由へ）、ID衝突回避、syncNeeded表示テスト追加。
- SYNCボタンを行アクションに追加し、スタイルを統一。
- フラグ管理をサービス側に集約（initialConfigSent/syncNeeded）し、START/STOP/リセットでヘルパー利用。
- 送信コマンドサマリをログ出力（sync/start/stop）。
- レースUI状態（展開行/経過時間/編集ペース）を `race-ui-state` に集約し、renderer移行の足場を整備。テーブル操作をデータ属性＋デリゲーションに置換し、行展開/アクションをUI層で一元処理。startPos変更時に再描画してsyncNeeded表示を即時反映。
- フラグはレース単位: SYNCは対象レースのみinitialConfigSent=true/syncNeeded=false、STARTはそのレースの未送信時のみ初期設定を再送しセット、STOPはそのレースだけinitialConfigSent=false/syncNeeded=trueに戻る。他レースには波及しない。
- レーステーブルのイベントデリゲーションを専用モジュールに分離し、renderer全面移行に向けUIロジックを薄くした。
- Setup/レーステーブル描画をrenderer関数に集約し、ui-controllerのDOM操作を削減（挙動不変）。デバイスグリッドのイベントデリゲーションも外部モジュール化。
- モーダル状態を専用モジュール化し、置換モーダル描画・セグメント処理・モーダルUI操作もrenderer/ヘルパー化してUIコントローラの責務を整理。
- SYNCボタンを「レース設定再送」表記＋ツールチップに変更し、要同期バッジを「要レース設定再送」表記＋説明に更新。
- セグメントモーダルのレンダリングを `race-modal-renderer` に分離し、UIコントローラの重複定義を解消。Setupテーブルの操作をデリゲーション化しinline handlerを削減。
- デバイス一覧のセル/オーバーレイ操作をデリゲーション化し、inline handlerを削減。置換モーダルのボタンもdata-action化。
- ペーサーチップのモーダル起動をデリゲーション対応に変更。デバイスグリッドHTML生成をrendererに分離。テスト計画をTEST_PLAN.mdに整備。
- レース参照をmanagerの getRaceById/getActiveRace 経由に寄せ、start/stop/sync/モーダルのガードを強化。startPos更新を非負サニタイズに変更。
- startRaceServiceでもstartPosを非負サニタイズし、race.startPosへ反映するように統一。
- startPosサニタイズをテストでカバーし、負値入力が0に丸められることを確認。
- テスト拡充: race-service / race-sync-service / race-renderer / ui-logic ほか。

## 残タスク（優先イメージ）
1. renderer全面移行: `ui-controller`に残るDOM操作・進行更新をrenderer/view-model経由に集約。  
2. 状態遷移一元化: `activeRaceId`/status遷移をサービス側に寄せ、UIはイベント発火＋描画のみ。  
3. 入力バリデーション/ログ整理: 距離/startPos/人数/ペースのガード共通化、エラーメッセージ統一。  
4. STARTラグ可視化UI: 送信サマリを軽いデバッグ表示へ（挙動変更なし）。  
5. ペーサー個別STOPの可否検討: プロトコル拡張前提。FW対応が必要か要判断。  
6. テスト追加: renderer/view-modelケース、ui-controllerのガード/エラー表示周り。

## 次スレ開始時に伝えること（コピペ用）
「現行 v2.1.0-beta.102。必読: REMORSE_AND_PREVENTION.md / REQUEST_ACTIONS_LOG.md / SYNC_START_SPEC.md / REMORSE_LOG.md。同期/START分離: 同期で色/ペース送信、STARTは先行点灯＋startRunnerのみ（未送信時は自動送信）。未接続で同期/STARTはアラート、STOPは未接続でもdry-run（接続時は送信）。STOP後は再同期必須。syncNeededバッジあり。STOPは全体1回のみで表示は距離+50mまで進め、全員到達でSTOP。進捗: renderer/デリゲーション化を維持しつつ、レース参照をmanagerのgetRaceById/getActiveRace経由に統一し start/stop/sync/モーダルのガードを強化、startPosを非負サニタイズ。dummy/未設定デバイス試験点灯ガードも継続。残タスク: renderer全面移行/状態遷移一元化/入力・ログ整理/STARTラグ可視化/ペーサー個別STOP検討/テスト追加。E2E手順（未接続アラート→レース設定再送→START/STOP→複数ペーサー距離+50m停止確認、バッジ/ツールチップ確認）を必ず実施。」
