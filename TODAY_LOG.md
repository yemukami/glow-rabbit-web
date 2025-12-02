- # 要求対応メモ（最新リクエスト）
- 要求: renderer全面移行の残タスクを進めること。
- 目的: ui-controllerに残るDOM操作をrendererに寄せて責務分離し、挙動の安全性とテスト容易性を高める。
- 対応方針: Setup/レース描画の文字列生成とDOM反映をrenderer関数へ集約し、UIコントローラ側はデータ管理とイベント発火に限定（挙動変更なし）。
- テスト計画: `node --check js/ui/ui-controller.js`, `node --check js/ui/race-renderer.js`, `node --check js/ui/setup-renderer.js`, `node js/test/ui-logic.test.js`, `node js/test/race-renderer.test.js`, `node js/test/setup-renderer.test.js`, `node js/test/race-service.test.js`。
- 結果: Setup/レーステーブル描画をrendererに寄せるリファクタを完了し、`setup-renderer`を追加。レースrendererにDOM適用ヘルパーを追加し、ui-controller側のDOM操作を削減。バージョンをv2.1.0-beta.85に更新。上記テストはすべてPass、手動E2Eは未実施（要接続環境）。
- 備考: renderer移行後もSYNC/START責務は不変。挙動差分が出ないことを優先して小刻みに進める。

### 2025-12-xx 追加ログ（起動時エラー解消）
- 作業: `ui-controller.js` の重複importで `renderRaceScreen` が二重定義になっていたSyntaxErrorを除去し、`connectBLE`がグローバルにバインドされる初期化が通るように修正。
- テスト: `node --check js/ui/ui-controller.js`, `node js/test/ui-logic.test.js`（ともにPass）。ブラウザE2Eは未実施（接続環境後に実施予定）。
- 感想: import重複で初期化ごと止まっていたので、再発を避けるため依存整理時はlint/`node --check`を先に回すよう意識する。

### 2025-12-xx 追加ログ（デバイス同期ガード統一）
- 作業: デバイス同期ボタンにrequireConnectionガードを適用して未接続時のアラートを共通化し、renderer import重複修正を含めてバージョンを `v2.1.0-beta.122` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node js/test/ui-logic.test.js`（Pass）。手動E2Eは未実施（接続環境後に実施予定）。
- 感想: ガードのメッセージ統一で未接続時の混乱を減らせた。今後も同期/START周りのガードは共通ヘルパーに寄せていく。

### 2025-12-xx 追加ログ（デバイス離脱ガード追加）
- 作業: デバイス画面から離れる際、リストがdirtyで未接続ならアラートで同期をブロックするガードを追加し、バージョンを `v2.1.0-beta.123` に更新。TEST_PLANに離脱ガード確認を追記。
- テスト: `node --check js/ui/ui-controller.js`（Pass）。手動E2Eは未実施（接続環境後に実施予定）。
- 感想: 未接続状態で誤ってデバイス同期を走らせないようにできた。今後も未接続ガードを統一して事故を防ぐ。

### 2025-12-xx 追加ログ（デバイス同期確認の未接続ガード徹底）
- 作業: checkDirtyAndSyncでも未接続ならアラートで同期を停止するガードを追加し、デバイス同期を未接続で走らせないように徹底。バージョンを `v2.1.0-beta.124` に更新し、ステータス/テスト計画/コンテキストを同期。
- テスト: `node --check js/ui/ui-controller.js`（Pass）。手動E2Eは未実施（接続環境後に実施予定）。
- 感想: デバイス同期系の未接続ガードを二重化できた。BLE接続が前提の操作はすべて requireConnection もしくは同等ガードを通す方針を維持する。

### 2025-12-xx 追加ログ（未接続時の遷移許容）
- 作業: デバイス同期ガードを緩和し、未接続なら警告のみで画面遷移を許可しつつ同期は実行しない挙動に整理。バージョンを `v2.1.0-beta.125` に更新し、ステータス/テスト計画/コンテキストを同期。
- テスト: `node --check js/core/device-manager.js`, `node --check js/ui/ui-controller.js`（Pass）。手動E2Eは未実施（接続環境後に実施予定）。
- 感想: 未接続でも作業が続けられるようにしつつ、同期が走らない安全性を両立できた。

### 2025-12-xx 追加ログ（進行更新リファクタ）
- 作業: updateStateでelapsedTimeを一度だけ計算してrendererに渡すようにし、二重取得を解消。バージョンを `v2.1.0-beta.126` に更新し、STATUS/NEXT/TEST_PLANを同期。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js`（Pass）。手動E2Eは未実施（接続環境後に実施予定）。
- 感想: renderer移行の一環として進行更新の無駄を減らした。引き続きDOM/状態処理をrenderer/サービス側に寄せたい。

### 2025-12-xx 追加ログ（文言整理＋バージョン更新）
- 作業: デバイス同期確認の警告文言を簡潔化し、バージョンを `v2.1.0-beta.127` に更新。STATUS/NEXT/TEST_PLAN/REQUEST_ACTIONS_LOG/TODAYを同期。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js`（Pass）。手動E2Eは未実施（接続環境後に実施予定）。
- 感想: 警告文をシンプルにして作業継続の意図を明確化。終盤なので引き続き小刻みに安全確認を続けたい。

### 2025-12-xx 追加ログ（デバイス同期確認メッセージ簡略化）
- 作業: dirtyチェック時の未接続警告を「同期は接続後、今回は続行」と簡潔にし、バージョンを `v2.1.0-beta.127` に更新したことを反映。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js`（Pass）。手動E2Eは未実施。
- 感想: メッセージ簡略化でユーザーの理解コストを下げた。残タスクはrenderer移行/状態遷移整理など少数なので引き続き小刻みに進める。

### 2025-12-xx 追加ログ（ヒント文修正と全削除確認の日本語化）
- 作業: レース画面のヒントから「要同期」文言を削除し、設置全削除確認を日本語化。バージョンを `v2.1.0-beta.128` に更新し、STATUS/NEXT/TEST_PLAN/REQUEST_ACTIONS_LOGを同期。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js`（Pass）。手動E2Eは未実施。
- 感想: UI文言の仕様ズレを解消し、利用者への伝わりやすさを改善。残りのrenderer移行/状態整理を進めて完了に近づけたい。

### 2025-12-xx 追加ログ（レース削除確認の日本語化）
- 作業: レース削除確認ダイアログを日本語に統一し、バージョンを `v2.1.0-beta.129` に更新。STATUS/NEXT/TEST_PLAN/REQUEST_ACTIONS_LOGを同期。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js`（Pass）。手動E2Eは未実施。
- 感想: 文言のばらつきを減らし、誤操作時の意図が伝わりやすくなった。残タスクも少ないのでこのまま収束させたい。

### 2025-12-xx 追加ログ（確認ダイアログ日本語化の仕上げ）
- 作業: 全レースクリアとペーサー削除の確認文言を日本語化し、バージョンを `v2.1.0-beta.130` に更新。STATUS/NEXT/TEST_PLAN/REQUEST_ACTIONS_LOGを同期。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js`（Pass）。手動E2Eは未実施。
- 感想: 主要な確認ダイアログの表記を揃え、利用者が迷わないようにできた。残タスクは少数なので安全に締めていきたい。

### 2025-12-xx 追加ログ（ダミー一括埋めの注意追記）
- 作業: ダミー一括埋めの確認メッセージに「元に戻すには手動削除が必要」と注意を追記（バージョン据え置き）。
- テスト: `node --check js/ui/ui-controller.js`（Pass）。手動E2Eは未実施。
- 感想: 操作の不可逆性を明示して誤操作リスクを下げた。残タスクはrenderer移行/状態整理など少数なので安全に進める。

### 2025-12-xx 追加ログ（START遅延の簡易可視化）
- 作業: START完了時に推定遅延msと送信コマンド本数をダイアログ表示する簡易可視化を追加し、バージョンを `v2.1.0-beta.131` に更新。STATUS/NEXT/TEST_PLAN/REQUEST_ACTIONS_LOGを同期。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js`（Pass）。手動E2Eは未実施。
- 感想: STARTラグの目安をUIで把握できるようになった。残タスクはrenderer移行/状態整理/テスト追加など少数なので引き続き小刻みに進めたい。

### 2025-12-xx 追加ログ（renderRaceScreenの依存整理）
- 作業: renderRaceScreenにelapsedTimeを引数で渡し、ui-controller側で状態取得してrendererへ委譲する形に整理。バージョンを `v2.1.0-beta.132` に更新し、STATUS/NEXT/TEST_PLAN/REQUEST_ACTIONS_LOGを同期。
- テスト: `node --check js/ui/ui-controller.js`（Pass）。手動E2Eは未実施。
- 感想: 進行表示の依存をrace-ui-stateから外し、renderer移行に一歩前進。残りのDOM/状態処理も同様に寄せていきたい。

### 2025-12-xx 追加ログ（STOP遷移のサービス側集約）
- 作業: STOP後の状態遷移（review/フラグ初期化）をサービス側に任せ、UI側の重複遷移を削除。バージョンを `v2.1.0-beta.133` に更新し、STATUS/NEXT/TEST_PLAN/REQUEST_ACTIONS_LOGを同期。
- テスト: `node --check js/ui/ui-controller.js`（Pass）。手動E2Eは未実施。
- 感想: 状態遷移の責務をサービスに寄せる一歩を踏み、状態一元化に近づけた。残タスクも少ないのでこのまま仕上げたい。

### 2025-12-xx 追加ログ（START遅延ログのダイアログ廃止）
- 作業: START完了時の推定遅延/送信本数のダイアログ表示を廃止し、コンソールログのみで確認する形に変更。バージョンを `v2.1.0-beta.134` に更新し、STATUS/NEXT/TEST_PLAN/REQUEST_ACTIONS_LOGを同期。
- テスト: `node --check js/ui/ui-controller.js`（Pass）。手動E2Eは未実施。
- 感想: 実行中の邪魔にならないようにしつつ必要情報はログで確認できる形にした。残作業は少数なので引き続き小刻みに進める。

### 2025-12-xx 追加ログ（TEST_PLAN更新）
- 作業: TEST_PLANをv2.1.0-beta.122に更新し、デバイス同期ボタンの未接続ガード確認を手動E2E項目に追加。
- テスト: ドキュメント更新のみ（コード変更なし）。
- 感想: デバイス同期ガードも確認対象に含め、手動E2E漏れを防ぐ。

### 2025-12-xx 追加ログ（renderer移行の残タスク）
- 作業: Setupテーブルとレーステーブルの描画をrenderer関数に集約し、`setup-renderer.js` を新設。race-rendererにDOM反映ヘルパーを追加し、ui-controllerからの直接DOM操作を削減（挙動不変）。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/ui/race-renderer.js`, `node --check js/ui/setup-renderer.js`, `node js/test/ui-logic.test.js`, `node js/test/race-renderer.test.js`, `node js/test/race-service.test.js`, `node js/test/setup-renderer.test.js`（全てPass）。手動E2Eは未実施（BLE接続環境が必要）。
- 感想: renderer移行を一歩進められた。イベントデリゲーションやフラグ運用は維持しつつUIコントローラを軽くできて安心。次は残りのDOM更新や状態遷移の整理を進めたい。

### 2025-12-xx 追加ログ（renderer移行の残タスク-2）
- 作業: デバイスグリッドのイベントデリゲーションを `device-grid-events` に切り出し、ui-controllerのDOM操作をさらに削減（挙動不変）。`device-grid-events.test.js` を追加し、クリック時の分岐（通常/スワップモード）を検証。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/ui/device-grid-events.js`, `node js/test/device-grid-events.test.js`, `node js/test/ui-logic.test.js`, `node js/test/race-renderer.test.js`, `node js/test/race-service.test.js`（全てPass）。手動E2Eは未実施（接続環境が必要）。
- 感想: デバイス周りもデリゲーションを外出しでき、renderer全面移行の足場が整った。引き続きモーダル/状態遷移周りを薄くする予定。

### 2025-12-xx 追加ログ（renderer移行の残タスク-3）
- 作業: BLE接続表示の更新をrenderer（`connection-renderer`）に委譲し、ui-controllerのDOM操作を整理。バージョンを `v2.1.0-beta.87` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/ui/connection-renderer.js`, `node js/test/device-grid-events.test.js`, `node js/test/ui-logic.test.js`（全てPass）。手動E2Eは未実施（接続環境が必要）。
- 感想: 細かなDOM更新を順次renderer側に寄せ、controllerの責務を軽くできている。残りのモーダル/状態遷移も同方針で進める。

### 2025-12-xx 追加ログ（renderer移行の残タスク-4）
- 作業: モーダル状態を専用モジュール（`race-modal-state`）に分離し、置換モーダル描画をrendererへ分離。ui-controllerの状態/DOM責務を軽量化。バージョンを `v2.1.0-beta.88` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/ui/race-modal-state.js`, `node js/test/replace-modal-renderer.test.js`, `node js/test/race-modal-state.test.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: モーダル周りもステートと描画を切り出せて、renderer全面移行が見えてきた。次は残るDOM更新と状態遷移整理に進みたい。

### 2025-12-xx 追加ログ（renderer移行の残タスク-5）
- 作業: モーダルUI操作を `race-modal-view` に、セグメント入力/サマリ処理を `segment-utils` に分離し、ui-controllerをさらに薄くした。バージョンを `v2.1.0-beta.89` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/ui/segment-utils.js`, `node js/test/race-modal-view.test.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: モーダルの状態・UI・計算がそれぞれモジュール化され、renderer全面移行と状態遷移整理に進みやすい形になった。

### 2025-12-xx 追加ログ（renderer移行の残タスク-6）
- 作業: モーダル入力のイベントバインドを `race-modal-view` 側で吸収し、ui-controllerのDOM操作をさらに削減（挙動不変）。バージョンを `v2.1.0-beta.90` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/ui/race-modal-view.js`, `node js/test/race-modal-view.test.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: モーダル周りのUI操作がほぼview層にまとまり、状態/描画/バインドが分離できた。次は状態遷移一元化に取りかかりたい。

### 2025-12-xx 追加ログ（renderer移行の残タスク-7）
- 作業: bindTargetInputのimport漏れによる起動エラーを修正し、バージョンを `v2.1.0-beta.91` に更新。
- テスト: `node --check js/ui/ui-controller.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: 細部のimport漏れを解消し、renderer分離後の安定性を担保。引き続き状態遷移整理に進む。

### 2025-12-xx 追加ログ（状態遷移整理の一歩目）
- 作業: finalize/reset時のactiveRaceIdクリアをサービス層に寄せ、UI依存を減らした。バージョンを `v2.1.0-beta.92` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: 状態遷移の責務をサービス側に寄せる一歩を踏み出し、UI側の重複処理を削減できた。残りの遷移整理も同じ方針で進める。

### 2025-12-xx 追加ログ（状態遷移整理の一歩目-2）
- 作業: activeRaceIdクリアをサービス側に寄せた変更を反映し、バージョンを `v2.1.0-beta.93` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: UI側の重複クリアを避け、状態責務の一元化が進んだ。引き続き状態遷移の整理と入力バリデーションの整備に進む。

### 2025-12-xx 追加ログ（状態遷移整理の一歩目-3）
- 作業: activeRaceIdクリアをサービス側で一元管理し、UI側の依存を削減。バージョンを `v2.1.0-beta.94` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: 状態遷移の責務がさらに整理され、UIから不要な状態操作を取り除けた。残る遷移と入力ガードの整理を続ける。

### 2025-12-xx 追加ログ（状態遷移整理の一歩目-4）
- 作業: activeRaceIdをUIから触らずサービス側で扱う流れに寄せ、バージョンを `v2.1.0-beta.95` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: activeRaceIdの責務がほぼサービス側にまとまり、状態遷移一元化の方向性が固まってきた。次は入力バリデーション/ログ整理に着手したい。

### 2025-12-xx 追加ログ（状態遷移整理の一歩目-5）
- 作業: reset時もサービス側でactiveRaceIdをクリアするよう整理し、UI依存をさらに削減。バージョンを `v2.1.0-beta.96` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: 状態クリアの責務がサービス側に寄り、UIの重複処理が減った。次は入力ガード/ログ整理に進める段階。

### 2025-12-xx 追加ログ（状態遷移整理の一歩目-6）
- 作業: 新規レース生成をrace-managerに集約し、UIから状態生成を切り離しつつバージョンを `v2.1.0-beta.97` に更新。
- テスト: `node --check js/ui/ui-controller.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: 状態生成/管理をmanager側に寄せられ、状態遷移一元化にまた一歩近づいた。入力バリデーション/ログ整理に移る準備が整ってきた。

### 2025-12-xx 追加ログ（状態遷移整理の一歩目-7）
- 作業: activeRaceId参照をmanagerのgetActiveRaceに寄せ、モード切替時のガードをサービス状態で見るように整理。バージョンを `v2.1.0-beta.98` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/race-manager.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: 状態参照もmanager経由になり、状態遷移一元化の土台が整ってきた。次は入力バリデーション/ログ整理へ進める。

### 2025-12-xx 追加ログ（状態遷移整理の一歩目-8）
- 作業: getActiveRace経由のガード整理を反映し、バージョンを `v2.1.0-beta.99` に更新。
- テスト: `node --check js/ui/ui-controller.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: 状態遷移の依存が整理されてきた。次は入力バリデーション/ログ整理に着手する。

### 2025-12-xx 追加ログ（入力ガード/試験点灯ガード追加）
- 作業: dummy/未設定デバイスで試験点灯を防ぐガードを追加し、距離/数値入力のサニタイズを共通ガードに切り出し。バージョンを `v2.1.0-beta.101` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/utils/input-guards.js`（Pass）。手動E2Eは未実施（接続環境が必要）。
- 感想: 未設定デバイスでのエラーを防ぎ、入力サニタイズを共通化できた。引き続き入力バリデーション/ログ整理を進める。

# 作業ログ: Glow-Rabbit Web App - 2025年11月28日

## 本日の作業概要

本日、以下の主要な課題解決と機能実装を行いました。

1.  **起動不具合の解消**:
    *   重複関数定義（`openDeviceActionMenu`）による `SyntaxError` を特定し修正。これにより、JavaScriptが正常にロードされ、アプリが起動するようになりました。
    *   `modalActiveTab` の `ReferenceError` を解決するため、モーダル関連のステートを `modalState` オブジェクトにカプセル化しました。
    *   初期データが空の場合に、強制的にデフォルトレースを生成し、画面に情報が表示されるように描画ロジックを強化。
    *   画面遷移ボタンに `onclick` ハンドラを追加し、タブ切り替えが機能するように修正。

2.  **「設置」画面の機能改善**:
    *   画面右上の「設置数 ◯/◯」がリアルタイムに更新されるように実装しました。
    *   「＋残りをダミーで埋める」ボタンが、総距離と間隔に基づき、未設定部分をダミーデバイスで埋めるように機能を実装しました。

3.  **新ペース設定ロジックの導入（本丸）**:
    *   `PaceCalculator` クラスを新規作成し、目標タイムや区間設定から詳細な実行計画 (`runPlan`) を生成するロジックを実装。
    *   ペーサー設定モーダルをタブ形式に改修し、「シンプル設定（目標タイム入力）」と「区間設定（複数区間設定）」に対応。
    *   レース実行中の `updateState` を刷新し、生成された `runPlan` に基づいて、各区間の境界でGlow-Cへペースコマンドを動的に送信するリアルタイム制御ロジックを実装しました。
    *   旧来の「自動ペース補正」や「手動ペース調整UI」は仕様変更に伴い削除しました。

## アプリケーションの現在のバージョン

*   `glow_web_app`: **`v2.1.0-beta.2`**

## 次回作業開始時の推奨事項

現在のアプリケーションは主要な機能が実装され、動作する状態になっています。
次回作業開始時は、まず以下の項目について、**ブラウザでの動作確認をお願いいたします。**

1.  **アプリの起動と画面表示**:
    *   `index.html` を開いた際に、ヘッダー、ナビゲーションボタン、および「レース」または「設定」画面に何か情報が表示されているか。
    *   画面上に赤色のエラーボックスが出ていないか。
2.  **画面遷移の確認**:
    *   ヘッダーの「設定」「実行」「設置」ボタンをクリックし、それぞれの画面に正しく切り替わるか。
3.  **設定画面の機能確認**:
    *   「＋新しいレースを作成」ボタンでレースが追加されるか。
    *   レース行の右端にある「＋」ボタンでペーサー設定モーダルが開き、タブ（「シンプル設定」「区間設定」）が切り替わるか。
    *   **シンプル設定**: 「ゴール目標タイム」（例: `3:00`）を入力し、平均ペースが自動計算・表示されるか。「設定を保存」で反映されるか。
    *   **区間設定**: 「＋区間を追加」で新しい行が追加され、距離とペースを入力・保存できるか。
4.  **設置画面の機能確認**:
    *   右上の「設置数 ◯/◯」表示が正しく更新されているか。
    *   「＋残りをダミーで埋める」ボタンを押すと、デバイスグリッドが黄色いダミーデバイスで埋まるか。
5.  **レース実行画面の機能確認**:
    *   「実行」画面でレースを選択し、「START」ボタンを押すと、タイマーが動き出し、プログレスバーが進行するか。
    *   この時、ブラウザの開発者コンソール (`F12` で開く) に `[Pacer X] Entering Seg Y...` のようなログが適切に出ているか（これがGlow-CへのBLEコマンド送信シミュレーションログです）。

これらの基本的な動作が確認できれば、次はその上で具体的な機能改善や、実際のGlow-CデバイスとのBLE接続テストに進むことができます。
本日はこれで終了とさせていただきます。ありがとうございました。

---

# 作業ログ: Glow-Rabbit Web App - 2025年12月05日（感情メモ）

- 区間タブの `switchModalTab` がVercelで再び落ちていた。`initUI` 前に死んだ場合でも `window` にフォールバック登録するガードを追加。焦りは少なめ、原因が見えていたので落ち着いて対処。
- ペース仕様のメモ（PACING_SPEC.md）を書いたので、頭の整理がついてちょっと安堵。競技現場の人に読んでもらう前提を意識。
- 先行ペーサーは現状「同じ位置から出て速く動く」近似しかできないと再確認。FW待ちだが、UIでどう伝えるか少し不安。
- バージョンを `2.1.0-beta.3` に更新。小さい修正でも番号を上げて足跡を残すことにした。新人が見ても迷わないように、という気持ち。

---

# サマリ (開始時 → 終了時)
- 開始状態: 2.1.0-beta.2、区間タブはRefError再発の報告あり。ペーサー仕様メモなし、コミュニケーションルール未整理。
- 終了状態: 2.1.0-beta.3。区間タブのグローバルガード追加でRefError対策。PACING_SPEC.md 追加。COMMUNICATION_NOTES.md で情緒ログルールを明文化。ヘッダーにバージョン常時表示。モーダル保存時のモード優先を明示（simple/segmentsで上書きクリア方針）。

# 残課題 / 次回の論点候補
- 区間タブのRefErrorがVercelで完全に消えたか要確認。まだ出る場合は最初のエラーをコンソールで要取得。
- プリセット種目（距離/スタート位置）と startPos の実効化、先行ペーサーUI/FW対応の検討は未着手。
- プログレスバーで区間境界や可変/固定の違いを可視化するUI案は保留。
- 実機（Glow-C/GLOW-R）での誤差検証と公式計時連携は未整備。
- お気持ちログをラリーごとに残す運用を開始（COMMUNICATION_NOTES.md 参照）。

---

## 2025-11-29 作業・思考ログ（このターン）
- 作業: `REFACTORING_GUARDRAILS.md` を新設し、目的ドリブン/副作用分離/TDD/サニタイズ/依存方向などのリファクタ指針を明文化。`js/ui/ui-controller.js` にサニタイズ関数と定数群を導入、setup入力/レース表示のエスケープを追加し、`renderRace` を分割。進行ループのマジックナンバーを定数化。BLE送信のエラー握り潰しを解消（rejectで伝播）。`node --check` と既存テストを実行し問題なし。
- 思考: まず安全性と意図の明確化を優先。機能破壊を避けるため既存シグネチャやイベントハンドラを変えず、計算値のみ定数化。次は小刻みに `renderRace` をさらに関数分割し、テストを追加する方針。レビューJSONやspec_verifyは後続ステップで実行予定。

### 追加ログ（このターンの続き）
- 作業: `renderRace` 内の進行部分をさらに関数分割（行クラス/バッジ/ペーサー行/プログレス頭/マーカー生成をヘルパー化）し、サニタイズ済みの値を流用する形に整理。構文チェックと既存テストを再実行し、問題なし。
- 思考: 既存ハンドラやデータフローを変えずに読みやすさを上げる最小単位で分解。次は必要なら純粋関数テストを追加するが、まずはブラウザ挙動確認を優先する。

### 追加ログ（このターン-2）
- 作業: 既存の `ui-logic.test.js` を修正し、モックDOMの初期化漏れと `addEventListener` 未定義でのクラッシュを解消。`initUI` の空データ初期化で `races` を再代入していた箇所を長さリセットに変更（ESMバインディング安全化）。`node js/test/ui-logic.test.js` を通過、`node --check js/ui/ui-controller.js` 再実行で構文OK。
- 思考: 実ブラウザで発生し得るESM再代入エラーを先に潰せたのは安全側。テストが落ちて初めて露見したので、今後も小さなモックでも回す価値がある。

### 追加ログ（このターン-3）
- 作業: 表示バージョンを `v2.1.0-beta.4` に更新（タイトル・ヘッダー・バージョンモーダル）。
- 思考: Vercel確認の目印用。プッシュはまだ行っていないので、必要なら指示後にコミット/プッシュする。

### 追加ログ（このターン-4）
- 作業: `renderRace` のUI構成部分をさらに関数化（アクションボタン/タイマー部を `buildActionArea`・`buildInfoHeader` へ分離）。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: イベントハンドラと表示ロジックの塊を分けて読みやすくした。まだUI全体の責務分離は途中だが、無理に動線を変えず段階的に進める。

### 追加ログ（このターン-5）
- 作業: デプロイ判別用にバージョン表記を `v2.1.0-beta.5` に更新（タイトル/ヘッダー/モーダル）。
- 思考: プッシュ毎にバージョンを上げる方針に従い、動作確認の目印を明確化。

### 追加ログ（このターン-6）
- 作業: 可読性と安全性向上のため、`renderRace` 呼び出しを `isExpanded` 判定に直し、`startRaceWrapper` にレース存在チェックログ、`updateState` にnullガードを追加。`node --check` と既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: 循環や曖昧さを増やさず、人間が追いやすい保護的ガードを入れる段階。次は入力バリデーションと進行ループの描画更新分割に進めたい。

### 追加ログ（このターン-7）
- 作業: バージョン表記を `v2.1.0-beta.6` に更新。進行ループの距離/プログレス算出を `computeLeadAndFill` に集約し、`renderRace` と `updateState` の二重計算を削減。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: 同一計算の共通化で読みやすさと矛盾リスクを低減。引き続き入力バリデーションとUIロジックの分割に取り組む。

### 追加ログ（このターン-8）
- 作業: 数値入力を安全にパースする `sanitizeNumberInput` を追加し、距離/組/人数/スタート位置/レース開始のstartPosでNaNを排除。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: まず入力の曖昧さを削り、元機能を変えずにデータ汚染を防ぐ基盤を整えた。次はUIロジックの分割と残るマジックナンバー/バリデーションの洗い出しに進む。

### 追加ログ（このターン-9）
- 作業: バージョンを `v2.1.0-beta.7` に更新。時間入力の安全パース `parseTimeInput` を追加し、`updateData` の time フィールドで利用。`updateState` で累積/ゴール時刻の表示更新を共通化。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: 入力バリデーションを広げ、時間表記の揺れを減らした。引き続きUIロジック分割と残りのガードを進める。

### 追加ログ（このターン-10）
- 作業: バージョンを `v2.1.0-beta.8` に更新。プログレス/リード計算を `computeLeadAndFill` に集約し、`updatePacerHeadsAndEstimates` を追加して描画更新を分離。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: 描画更新の責務を分け、同一計算の重複を避けることで可読性と矛盾リスクをさらに低減。残課題は入力バリデーションの追加箇所洗い出しとUI関数のさらなる純粋化。

### 追加ログ（このターン-11）
- 作業: バージョンを `v2.1.0-beta.9` に更新。デバイス設定のサニタイズとリストリサイズを導入（不正な距離/間隔を防ぎ、設定変更時にダミー不足や過剰分を調整し同期必須に）。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: dummy不足・間隔ずれの原因候補に手を入れ、設定変更時に必ず同期が必要な状態を明示（isListDirty=true）。実機で間隔が改善したか次の確認が必要。

### 追加ログ（このターン-12）
- 作業: バージョンを `v2.1.0-beta.10` に更新。BLEペース設定の距離パラメータに `deviceSettings.totalDistance` を適用し（初期送信・区間切替・設定送信すべて）、実際のLED間隔とトラック長に合わせるよう修正。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: 実機での周回が短く感じる問題に対し、距離設定をコマンド送信に反映して補正。デバイス間隔/総距離を変更したら再同期して確認してほしい。

### 追加ログ（このターン-13）
- 作業: バージョンを `v2.1.0-beta.11` に更新。MACアドレスを正規化・重複チェックするよう追加（追加/置換時）、重複検知でアラート、無効MACで拒否。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: 置換機能で同一MACが二重登録されるリスクを低減。実機での間隔ズレがMAC重複起因でないか切り分けが進むはず。

### 追加ログ（このターン-14）
- 作業: バージョンを `v2.1.0-beta.12` に更新。ペース設定コマンドの距離パラメータを 400m 基準に戻し（lengthOfYard=400, totalDistance=400, ledSpacing=deviceSettings.interval）、100m間隔のように早送りになる不具合を緩和。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: 実機で周回が短く感じた原因として距離パラメータの過大設定を疑い、元の400m基準に戻して動作を安定化。デバイス設定（総距離/間隔）を変更した場合は同期し、挙動を再確認してほしい。

### 追加ログ（このターン-15）
- 作業: バージョンを `v2.1.0-beta.13` に更新。`startRaceWrapper` を async にしてカラー/ペース送信を順次await、最後にSTARTを高優先度で送るよう変更（キュークリアでペース設定が潰れないように）。初期送信時のデバッグログ（pace:init）は維持。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: STARTの高優先度送信がキューをクリアしてペース設定を飛ばしていた可能性を排除。再度実機で間隔を確認してもらう。

### 追加ログ（このターン-16）
- 作業: バージョンを `v2.1.0-beta.14` に更新。入力ガード強化（時刻/距離/組/人数/スタート位置の入力にmin属性、正の整数サニタイズを追加）でNaNや負値を防止。
- 思考: 表層の不正入力が状態に入らないよう防御を広げた。大きな挙動変更はなし。

### 追加ログ（このターン-17）
- 作業: バージョンを `v2.1.0-beta.15` に更新。小さなリファクタ（進行ロジックは変えず、定数/ヘルパー名の明示化と入力ガードの簡潔化）。動作変更なし。
- 思考: 人間が読みやすい構造を維持しつつ、次のバリデーション/分割に備えた下地を作成。

### 追加ログ（このターン-18）
- 作業: バージョンを `v2.1.0-beta.16` に更新。パーサーチップ生成をヘルパー化し、設定/折り畳み表示の重複を排除（挙動変更なし）。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: 表示ロジックの重複を削り、今後の分割・サニタイズ拡張を見通しやすくした。

### 追加ログ（このターン-19）
- 作業: バージョンを `v2.1.0-beta.17` に更新。進行タイマー間隔を定数化（UI_CONSTANTS.UPDATE_INTERVAL_MS）し、startのsetIntervalに適用。挙動変更は意図せず、可読性と設定一元化のみ。
- 思考: マジックナンバーを減らし、後続のチューニング時に見通しを良くするための準備。

### 追加ログ（このターン-20）
- 作業: バージョンを `v2.1.0-beta.18` に更新。ペーサー未設定時のSTARTを防ぐガードを追加（alertで案内）。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: 不正状態でのSTARTを防ぎ、トラブルシュートを容易にするための防御的変更。

### 追加ログ（このターン-21）
- 作業: バージョンを `v2.1.0-beta.19` に更新。runPlan上のアクティブ区間を明示的に検索するヘルパー `findActiveSegment` を追加し、進行中のセグメント取得を単純化（挙動変更なし）。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: セグメント判定を関数に切り出し、今後のバグ混入を防ぐ下地を作成。

### 追加ログ（このターン-22）
- 作業: バージョンを `v2.1.0-beta.20` に更新。距離変更時にペーサー計画をリセットする確認を追加、ペースを0.1秒丸め、セグメント入力も丸め。ダミーMAC(00...)を追加拒否。懺悔/要求テンプレートファイルを追加。
- 思考: 距離とペースの整合性を保ちつつ入力の揺れを抑制。テンプレートで次回以降の注意喚起を仕組み化。

### 追加ログ（このターン-23）
- 作業: バージョンを `v2.1.0-beta.21` に更新。距離変更時にペーサーを全削除する確認に変更（矛盾防止）。ダミーMAC追加を明示的に拒否。clear device list 時に保存＆dirty化。device load を簡易サニタイズ（無効エントリ除去）。構文チェックと既存テスト（pace-calculator, ui-logic）を再実行し成功。
- 思考: 不正なリスト状態を抑止し、距離変更の整合性を強制する方向に寄せた。

### 追加ログ（このターン-24）
- 作業: バージョンを `v2.1.0-beta.22` に更新。距離入力のステップ調整のみ（動作変更なし）。
- 思考: UIでの誤操作を減らすための微修正。挙動影響なし。

### 追加ログ（このターン-25）
- 作業: バージョンを `v2.1.0-beta.23` に更新。clearデバイスでdirty化＆保存し直す際のconst再代入エラーを解消（markDeviceListDirty導入）。ダミーMAC追加拒否を徹底。動作変更なし。構文チェックと既存テスト（pace-calculator, ui-logic）成功。
- 思考: 全削除でのランタイムエラーを防ぐための修正。ID00混入への対策継続中。

### 追加ログ（このターン-26）
- 作業: バージョンを `v2.1.0-beta.24` に更新。`saveDeviceList` をUI側で未インポートだったバグを修正（全削除時のReferenceError解消）。構文チェックと既存テスト（pace-calculator, ui-logic）成功。
- 思考: 共有モジュールの関数を漏れなくインポートすることを再確認。REMORSEログ/コンテキストリマインダーを活用して再発防止。

### 追加ログ（このターン-27）
- 作業: バージョンを `v2.1.0-beta.25` に更新。device-manager向けの最小テストを追加（ダミーMAC拒否、ロード時サニタイズ）。全削除のdirty化修正は既にコミット済み。構文チェックと既存テスト、追加テストを実行。
- 思考: 事前にテストを足してからロジックに触るサイクルに移行。今後も拡充していく。

### 追加ログ（このターン-28）
- 作業: バージョンを `v2.1.0-beta.26` に更新。デバイスロード時にダミーMACも除外するようサニタイズを強化し、テストを追加。構文チェックと既存テスト（pace-calculator, ui-logic, device-manager）を実行。
- 思考: ID00混入をより強く防止。継続して挙動を確認してもらう。

### 追加ログ（このターン-29）
- 作業: バージョンを据え置きで、ブロックMAC（CC:33:00:00:00:00）もロード時に除外するよう強化し、device-managerテストを更新。構文チェックと既存/追加テストを実行。
- 思考: Glow-C初期値らしきMACを遮断し、ID00/CC33系の混入を止める。

### 追加ログ（このターン-30）
- 作業: バージョンを `v2.1.0-beta.27` に更新予定。通知受信時にCC:33/00:00系を無視し、警告ログを出すように変更（原因特定用）。`node --check` と device-managerテストを実行。
- 思考: Glow-Cからのダミー通知が入ってもリストに載せないよう受信側で防御し、ログで発生状況を追えるようにした。

### 追加ログ（このターン-31）
- 作業: バージョンを `v2.1.0-beta.28` に更新予定。同期中の通知を無視するガードを追加（`isSyncing` チェック）し、CC:33/00:00系を受信時にもブロック。構文チェックと全テスト（pace-calculator, ui-logic, device-manager）を再実行。
- 思考: SYNC中の不要通知でリストが汚れないよう受信側に防御を追加。Glow-Cからのダミー通知があってもリストに載らない状態を維持。

### 追加ログ（このターン-32）
- 作業: 距離変更時のスタート位置初期値を0に変更（新規レース作成時のstartPosを0に）。ロード時にstartPosが未定義/負値なら0に補正。構文チェック実行。
- 思考: 初期値が200mのまま残るとスタートがずれるため、デフォルトを0に統一。Flutter側の挙動に合わせ、まずはオフセット0を前提に整合を取る。

### 追加ログ（このターン-33）
- 作業: START時に開始デバイスを即点灯させるため、`commandMakeLightUp` を先に送る（startDevIdxのデバイス、先頭ペーサーの色）。構文チェック＋既存テスト（device-manager等）を実行。
- 思考: Glow-C側で初回点灯が1拍遅れる仕様を補うため、0m地点で先に光らせるワークアラウンド。

### 追加ログ（このターン-34）
- 作業: バージョンを `v2.1.0-beta.30` に更新。START前に `commandStopRunner` を送ってランナー状態をリセット（RunnerPointer初期化を狙う）。startPosについてはfwが無視する可能性をコメントで明示。構文チェック＋既存テスト（pace-calculator, device-manager）実行。
- 思考: Glow-Cのスタート地点ズレ対策として、開始前にリセットを入れてポインタ残りを潰す。さらに根本対応が必要ならfw側を調整する。

### 追加ログ（このターン-35）
- 作業: REMORSEログに「fw修正時は本来の実装に戻す」旨を追記（先行点灯は暫定ワークアラウンドであることを明記）。
- 思考: 当初方針（fw側での対応が筋）を残しつつ、暫定対応との切り替え条件を記録。

### 追加ログ（このターン-36）
- 作業: バージョンを `v2.1.0-beta.31` に更新予定。丸め/プラン検証用のミニテスト `render-utils.test.js` を追加（pace丸め/プラン総時間チェック）。構文チェックと既存テスト一式を実行。
- 思考: 表示丸め漏れを防ぐための基礎テストを先に追加し、リファクタの土台を固める。

### 追加ログ（このターン-37）
- 作業: 表示丸めと進行表示の統一用に `js/utils/render-utils.js` を新設し、ペース/距離表示のフォーマットをUI全体で共有するように改修。`render-utils.test.js` を実装テストに更新し、`v2.1.0-beta.32` にバージョンアップ。`node --check js/ui/ui-controller.js` ほか構文チェックと全テスト（pace-calculator/device-manager/ui-logic/render-utils）を実行し成功。
- 思考: pace/distanceの丸めルールを共通化して、表示ごとの差異を減らした。今後は先行点灯などFW依存の暫定対応を切り戻せるよう、レンダリングヘルパーを増やしつつ責務を分割していく。

### 追加ログ（このターン-38）
- 作業: pace表示のフォールバック/丸めを安全化するため `resolvePaceValue` と表示用ラベル生成ヘルパーを追加し、ペーサーチップ/リスト/進行表示で共通利用。無効入力時のフォールバックをrender-utilsテストに追加。バージョンを `v2.1.0-beta.33` に更新。
- 思考: paceが未設定やNaNでもUI表示が崩れないようにし、丸めルールを一元化した。引き続きrenderRaceの分割とFW境界の暫定対応を踏まえたガード強化を進める。

### 追加ログ（このターン-39）
- 作業: `renderRace` 前段で表示用データをまとめる view-model 関数を追加し、折り畳み/展開表示が事前整形済みデータから描画されるように分離。レース行の表示用ヘルパーへの依存を整理し、バージョンを `v2.1.0-beta.34` に更新。構文チェック＋全テスト（pace-calculator/device-manager/ui-logic/render-utils）を実行し成功。
- 思考: UIから呼ばれた後の処理をブラックボックス化する準備として、まず表示ロジックをVM経由に切り替えた。次は進行ロジック/ユースケースの純粋化とテスト追加に進む。

### 追加ログ（このターン-40）
- 作業: 進行処理を純粋化するため `advanceRaceTick` を追加し、距離更新/セグメント遷移/終了判定をまとめて返すように変更。`startRaceWrapper` をサービス関数 (`startRaceService`) 経由にし、開始フロー（計画準備・初期送信・先行点灯・START送信）をブラックボックス化。STOPもサービス化。バージョンを `v2.1.0-beta.35` に更新し、構文チェック＋全テスト（pace-calculator/device-manager/ui-logic/render-utils）を実行し成功。
- 思考: UIイベントから呼ぶだけで開始・進行が完結する形に寄せた。次は進行計算や送信順序のテスタブル化（モジュール分離）とユースケーステスト追加で安全性を高めたい。

### 追加ログ（このターン-41）
- 作業: 進行ロジック/開始フローを `js/core/race-service.js` に分離し、UIからはサービス関数を呼ぶだけに整理（advanceRaceTick/startRaceService/sendStopRunner等）。race-service向けの最小テストを追加。重複定義をUI側から削除。バージョンを `v2.1.0-beta.36` に更新。全テスト（pace-calculator/device-manager/ui-logic/render-utils/race-service）と構文チェックを実行し成功。
- 思考: レース進行/送信順序のブラックボックス化に近づいた。次はBLEキューやラグ影響を計測しやすい抽象化と、UI側からの依存をさらに薄くする（view-model経由の描画継続）。

### 追加ログ（このターン-42）
- 作業: レース行展開時に計画準備＋初期設定送信を実施するよう変更（接続済み/ready状態のみ）。設定モーダルに注意文を追加（リロードでBLE切断、接続・同期を先に、近距離操作推奨）。バージョンを `v2.1.0-beta.37` に更新。全テスト一式＋構文チェックを再実行し成功。
- 思考: 事前設定送信のタイミングを「展開」に寄せてSTART時の送信量を減らす布石を打った。運用注意もUIに明示したので、次は送信キュー抽象化と号砲同期策を検討する。

### 追加ログ（このターン-43）
- 作業: 初期設定送信を二重送信しないよう `initialConfigSent` フラグを導入し、展開時に送信済みならSTART時はスキップするように変更。バージョンを `v2.1.0-beta.38` に更新。全テスト（pace-calculator/device-manager/ui-logic/render-utils/race-service）と構文チェックを再実行し成功。
- 思考: START前に設定を送っておく運用に寄せつつ、送信ダブりを防いだ。引き続き送信キュー抽象化と号砲同期策を検討する。

### 追加ログ（このターン-44）
- 作業: 設定モーダルに注意書きを明示的に追加（リロードでBLE切断、START前の接続・同期、近距離操作推奨）。バージョンを `v2.1.0-beta.39` に更新。構文チェックと全テスト（pace-calculator/device-manager/ui-logic/render-utils/race-service）を再実行し成功。
- 思考: 注意文をUIで確実に見える位置に置き、運用リスクを明示した。リファクタ残は送信キュー抽象化/号砲同期策/進行ロジックのさらなる純粋化。

### 追加ログ（このターン-45）
- 作業: BLE接続ボタンの状態更新をPromise結果で常に行うように修正（接続/切断で必ず表示を更新）。バージョンを `v2.1.0-beta.40` に更新。構文チェックと主要テスト（ui-logic/race-serviceほか）を再実行し成功。
- 思考: 接続/切断がUIに確実に反映されるようガードを追加。引き続き送信キュー抽象化と号砲同期策を検討する。

### 追加ログ（このターン-46）
- 作業: BLE送信ラグの概算用に `js/ble/latency.js` を追加し、`startRaceService` で推定ラグをログ出力。バージョンを `v2.1.0-beta.41` に更新。全テスト（pace-calculator/device-manager/ui-logic/render-utils/race-service）と構文チェックを再実行し成功。
- 思考: 号砲同期策に向けて送信本数ベースのラグ目安を出せるようにした。今後は送信キューの抽象化とテスト計測を検討する。

### 追加ログ（このターン-47）
- 作業: バージョンモーダルに注意書きを移動（リロード切断/接続・同期/近距離操作）し、設定モーダルを簡潔化。バージョンを `v2.1.0-beta.42` に更新。構文チェック＋主要テスト（ui-logic/race-service等）を再実行し成功。
- 思考: 注意文をgearモーダルに集約して混乱を避けた。引き続き送信キュー抽象化と号砲同期策を進める。

### 追加ログ（このターン-48）
- 作業: BLE送信をdry-run/記録可能にする `BleCommandQueue` を追加し、`startRaceService` がキュー抽象を使うように変更。ラグ推定ログをキュー記録付きで返却。バージョンを `v2.1.0-beta.43` に更新。構文チェックと主要テスト（ui-logic/race-service等）を再実行し成功。
- 思考: 送信キューを抽象化して号砲同期策に備える下地を作った。次は実測ログ/キュー内訳の可視化や最小コマンド化に進める。

### 追加ログ（このターン-49）
- 作業: startフロー用キュー抽象を強化し、stop/color/pace/prelight/startを全て `BleCommandQueue` 経由に統一。dry-runでコマンド内訳を取得できるテストを追加。バージョンを `v2.1.0-beta.44` に更新。構文チェック＋全テスト（ui-logic/race-service 等）を再実行し成功。
- 思考: START直前の送信をテスタブルにし、コマンド本数・優先度を計測できる形にした。次は号砲同期を見据えてSTART時コマンドを最小化/計測ログを可視化する。

### 追加ログ（このターン-50）
- 作業: `startRaceService` で毎回初期設定を再送するように変更し、走行ごとにペース設定が確実に入るよう修正（初回送信済みフラグの持ち越しをリセット）。リセット時に`initialConfigSent`もクリア。バージョンを `v2.1.0-beta.46` に更新。構文チェック＆主要テストを再実行し成功。
- 思考: ペース再送を省く最適化がラン間で設定抜けを起こすリスクがあったため、確実に送る方向に戻した。引き続き号砲同期/コマンド最小化の検討を進める。

### 追加ログ（このターン-51）
- 作業: 同期/STARTを明確に分離し、STARTデフォルトを最小（stop/send-config無し）に戻しつつ、初期設定未送信の場合はSTARTで自動送信するガードを追加。`syncRaceConfigs` を新設して同期ボタンから明示的に色/ペース送信できるように整理。バージョンを `v2.1.0-beta.47` に更新。構文チェック＋race-serviceテスト再実行で成功。
- 思考: stopRunnerで設定が消えるリスクを踏まえ、同期フェーズとSTARTの責務を分けつつ「未送信なら送る」安全弁を入れた。今後はSYNC必須表示と号砲同期オプションを強化する。

### 追加ログ（このターン-52）
- 作業: 未送信時はSTARTでも設定を送る安全弁を明文化し、sync/startのログを追加（sendStop/resendConfig/送信数）。懺悔ログに同期/START迷走の再発防止策を追記。構文チェックとrace-serviceテストを再実行し成功。
- 思考: 仕様を固定しないまま最適化を往復したのがデグレ原因と整理。以後は同期/STARTの責務固定とテスト先行で進める。

### 追加ログ（このターン-53）
- 作業: BLE未接続時に同期/STARTを実行しようとした際にアラートを出すガードを追加。接続失敗時もアラートで通知。バージョンを `v2.1.0-beta.48` に更新。構文チェックとui-logicテストを再実行し成功。
- 思考: 未接続での操作が「無反応」に見えないよう、明示的な通知を入れた。同期/START分離の設計を崩さず、ユーザーの手間を減らす方向で仕上げていく。

### 2025-12-xx 作業ログ（このターン）
- 作業: 同期/START仕様のリマインドファイル SYNC_START_SPEC.md を追加し、旧BLE API を legacy/ 配下に退避（戻し方メモを添付）。syncNeeded/initialConfigSent をサービス側に寄せ、UIの直接操作を削減。race-view-model/render-utils/data-utils/color-utils を活用し、レース行描画を renderer 分割の第一歩として切り出し。完走時の未定義関数呼び出しを修正。
- テスト: `node --check js/core/race-service.js`, `js/core/race-sync-service.js`, `js/ui/ui-controller.js`, `js/utils/render-utils.js`; `node js/test/race-service.test.js`; `node js/test/ui-logic.test.js`（いずれも成功）。
- 感想: 同期/START責務を固定したまま可読性を上げる方向に進めた。renderer分割は未完了だが、view-modelとの分離が進み、次ターンでDOM生成を全面移行しやすい状態になった。

### 2025-12-xx 追加ログ（このターン-2）
- 作業: renderer を view-model と連携させ、編集中ペースも表示できるよう調整。race-view-model向けのミニテストを追加（computeLeadAndFillとエスケープ/バッジ確認）。バージョンを `v2.1.0-beta.50` に更新。
- テスト: `node --check js/ui/race-renderer.js`, `js/ui/ui-controller.js`; `node js/test/race-view-model.test.js`; 既存 race-service/ui-logic テストを再確認。
- 感想: 描画責務の分離が進み、純粋関数のテストを追加できた。次は renderer の全面適用とサービス層での状態遷移一元化をさらに進めたい。

### 2025-12-xx 追加ログ（このターン-3）
- 作業: STOPボタンでBLE未接続時はアラートを出し、stop送信を `stopRaceService` 経由で高優先度送信するよう修正。dry-runテストでstopコマンドの記録を確認。バージョンを `v2.1.0-beta.52` に更新。
- テスト: `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`（stopのdry-runテストを追加）。
- 感想: stopRunnerが飛ばないリスクに対し、サービス層経由の高優先度送信＋未接続ガードで初動を強化。送信成功をUIで可視化する仕組みは今後の課題。

### 2025-12-xx 追加ログ（このターン-4）
- 作業: stop送信の記録を確実に残すため `BleCommandQueue` を常に記録するよう変更し、`stopRaceService` が送信したコマンド記録を返すように統一。バージョンを `v2.1.0-beta.53` に更新。
- テスト: `node --check js/ble/send-queue.js`, `js/ui/ui-controller.js`; `node js/test/race-service.test.js`（stop dry-run含む）、`node js/test/ui-logic.test.js`。
- 感想: STOPの送信内容を確実に追跡できるようになった。今後は送信結果をUI通知に反映させる仕組みを検討したい。

### 2025-12-xx 追加ログ（このターン-5）
- 作業: escapeHTML を共通化し、UI/race-view-model で共有ユーティリティから利用するよう整理。バージョンを `v2.1.0-beta.54` に更新。
- テスト: `node --check js/utils/data-utils.js`, `js/ui/ui-controller.js`, `js/ui/race-view-model.js`; `node js/test/race-view-model.test.js`。
- 感想: エスケープ処理を一箇所に寄せて重複を削減。renderer/view-model の分離を進める下地が整った。

### 2025-12-xx 追加ログ（このターン-6）
- 作業: オーバーラン後に必ず stopRunner を送るよう、`updateState` を async 化し、完走検知時に `stopRaceService` を await して送信記録をログ出しするよう変更。バージョンを `v2.1.0-beta.55` に更新。
- テスト: `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`。
- 感想: 走行完了後のstop抜けを防ぐためサービス経由でSTOP送信を確実化。今後、必要に応じて送信結果の可視化も検討できるよう記録ログを残した。

### 2025-12-xx 追加ログ（このターン-7）
- 作業: 完走/停止後の busy ガードを解放するため、`freezeRace` で `setActiveRaceId(null)` を行うように変更。バージョン据え置き。
- テスト: `node --check js/ui/ui-controller.js`。
- 感想: レース終了後に他レースの開始を妨げないよう、activeRaceId を明示的に解放した。引き続き状態遷移の一元化を進める。

### 2025-12-xx 追加ログ（このターン-8）
- 作業: pacerがゴールしたら距離をレース距離で打ち止めし、finish後は移動・プレ送信を停止するよう `advanceRaceTick` を修正（オーバーラン時の色混在対策）。stop後に再同期が必須になるよう `stopRaceService` で `initialConfigSent=false` / `syncNeeded=true` をセット。バージョンを `v2.1.0-beta.58` に更新。
- テスト: `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js`。
- 感想: ゴール後に走行を続けて色が混ざるリスクを抑制。stop後は必ず再同期が必要になるため、次回START時に色/ペースを再送できる。

### 2025-12-xx 追加ログ（このターン-8）
- 作業: pacerがゴールしたあとも距離上昇を続けていた挙動を見直し、finishTime 設定後は移動/プレ送信を止めつつ、オーバーラン許容のまま完走判定するよう `advanceRaceTick` を修正。stop後は同期必須にするため `initialConfigSent=false` / `syncNeeded=true` を設定を継続。バージョンを `v2.1.0-beta.59` に更新。
- テスト: `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js`。
- 感想: ゴール後に色/ペースが混ざるリスクを減らしつつ、オーバーラン自体は維持する形に調整。実機で色混在が解消するか再確認したい。

### 2025-12-xx 追加ログ（このターン-9）
- 作業: STOPを未接続でも押せるようにし、未接続時はdry-runで記録だけ行いつつUIを停止するよう変更（接続時は従来通り送信）。バージョンを `v2.1.0-beta.61` に更新。
- テスト: `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`。
- 感想: 実機未接続でもSTOP操作でUIを止められるようにし、接続時はこれまで通りstopRunnerを送る。接続が切れても緊急停止しやすい状態にした。

### 2025-12-xx 追加ログ（このターン-10）
- 作業: オーバーランは維持しつつ、ゴール後は追加のプレ送信/セグメント進行を止めるよう `advanceRaceTick` を修正（finishTimeが付いた後は移動のみ継続、FINISH_MARGINまでは走らせて完了判定）。stop後は再同期必須フラグ維持。バージョンを `v2.1.0-beta.62` に更新。
- テスト: `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js`。
- 感想: 実機の「ゴール後少し光る」オーバーランは残しつつ、ゴール後の色混在を減らすため追加コマンドを抑制。実機で色が正しく切り替わるか再確認したい。

### 2025-12-xx 追加ログ（このターン-11）
- 作業: レース描画をrenderer側に寄せ、行生成をテンプレート化＋進行中のタイマー/ヘッド/リード更新もrenderer経由に統一。renderer向けの純粋テストを追加し、モックDOMの検証をHTMLベースに更新。表示バージョンを `v2.1.0-beta.63` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node --check js/core/race-sync-service.js`, `node --check js/ui/race-renderer.js`; `node js/test/pace-calculator.test.js`, `device-manager.test.js`, `render-utils.test.js`, `race-view-model.test.js`, `race-renderer.test.js`, `race-service.test.js`, `ui-logic.test.js`。
- 感想: renderer移行が一歩進んで見通しが良くなった。mock修正で一度テストが落ちたが、仕様どおりのHTML評価に寄せて再整備できてほっとした。

### 2025-12-xx 追加ログ（このターン-12）
- 作業: 懺悔/再発防止チェック用の `REMORSE_AND_PREVENTION.md` と、要求対応を1文で残す `REQUEST_ACTIONS_LOG.md` を追加し、コンテキスト冒頭での必読を明記。バージョン表記を `v2.1.0-beta.64` に更新。NEXT_THREAD_CONTEXT を必読ファイルと最新版に更新。
- テスト: なし（ドキュメント/バージョン表記のみ）。
- 感想: ミス再発防止と要求トレーサビリティの運用ルールを明文化。LLM判断で揺れないよう、冒頭での再読を強制するようにした。
- E2E確認手順メモ（手動）: 1) Race画面を開き、任意のレース行を展開し syncNeeded バッジを確認。2) BLE未接続状態で START を押しアラート表示を確認（仕様どおり最小構成）。3) ダミーで pacer を1件追加し、START→STOP を実行してタイマー停止とバッジ再表示（要同期）を確認。

### 2025-12-xx 追加ログ（このターン-13）
- 作業: renderer全面移行の一環として、レーステーブル生成を `buildRaceTableHTML` に集約し、ui-controller の renderRace が renderer経由でHTMLを挿入する形に整理（表示責務のみ変更、SYNC/START仕様は不変）。REQUEST_ACTIONS_LOG に要求単位の対応を追記。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/ui/race-renderer.js`, `node js/test/race-renderer.test.js`, `node js/test/ui-logic.test.js`。
- 感想: 表示生成がrenderer側にまとまり、残りのDOM操作も次の分離ステップに進めやすくなった。挙動変更はなくテストも安定していて安心。
- E2E確認手順メモ（手動）: 上記-12と同様（Race行展開→未接続STARTアラート→pacer追加してSTART/STOP後にsyncNeededバッジ再表示を確認）。

### 2025-12-xx 追加ログ（このターン-14）
- 作業: syncNeeded/initialConfigSent の管理をサービス層に寄せるため、`setRaceSynced`/`resetSyncFlags` を追加し、START/STOP/リセットで同関数を使用。syncサービスでも送信後にフラグを明示更新。race-serviceテストにフラグヘルパー確認を追加（挙動変更なし、仕様維持）。
- テスト: `node --check js/core/race-service.js`, `node js/test/race-service.test.js`。
- 感想: フラグ更新の経路を固定でき、UIから直接フラグを触らずに済む形に近づいた。SYNC/START仕様を守りつつ安全側に寄せられているので安心。
- E2E確認手順メモ（手動）: Race行展開→SYNCボタン押下でsyncNeeded消失を確認→START/STOP後にsyncNeeded再表示を確認（未接続の場合はアラート＋バッジ継続）。

### 2025-12-xx 追加ログ（このターン-15）
- 作業: レース行のアクションにSYNCボタンを追加し、同期導線を明示（未接続/ペーサー未設定時はアラート）。同期完了で保存・再描画＆ログ、START/STOP仕様は変更なし。バージョンを `v2.1.0-beta.65` に更新。
- テスト: `node --check js/ui/ui-controller.js`, `node --check js/ui/race-renderer.js`, `node js/test/race-renderer.test.js`, `node js/test/ui-logic.test.js`。
- 感想: 同期の入口をSTARTと分けて明確化できた。挙動は変えず、ユーザーが迷わない導線だけ強化した形。
- E2E確認手順メモ（手動）: Race行を展開→SYNCボタン押下で「同期完了」表示＆syncNeededバッジ消失を確認→未接続でSYNCを押すとアラートを確認→pacer追加後にSTART→STOPでsyncNeeded再表示を確認。

### 2025-12-xx 追加ログ（このターン-16）
- 作業: 送信可視化強化として、start/stop/syncのコマンド本数と高優先度数をログ出力する集計を追加（挙動変更なし、SYNC_START_SPEC順守）。バージョンを `v2.1.0-beta.66` に更新。
- テスト: `node --check js/core/race-service.js`, `node --check js/core/race-sync-service.js`, `node js/test/race-service.test.js`。
- 感想: コマンド内訳を即座に把握できるようになり、号砲同期検討やトラブルシュートの足がかりになる。挙動は全く変えていないので安心。
- E2E確認手順メモ（手動）: Race行展開→SYNCボタン押下で従来どおり同期されることを確認（コンソールに送信数/高優先度数が出る）→pacer追加してSTART→STOPを実行し、コンソールログに本数サマリが出ることを確認（UI挙動は不変）。

### 2025-12-xx 追加ログ（このターン-17）
- 作業: syncサービスのdry-runテスト `race-sync-service.test.js` を追加し、初期設定送信でフラグが立つことを検証。バージョンを `v2.1.0-beta.67` に更新。実装変更なし（SYNC/START仕様そのまま）。
- テスト: `node --check js/test/race-sync-service.test.js`, `node js/test/race-sync-service.test.js`, `node js/test/race-service.test.js`。
- 感想: 同期フローのフラグ挙動をテストでカバーでき、後続のリファクタでも安心感が増した。仕様は動かしていない。
- E2E確認手順メモ（手動）: 1) Race行を展開→SYNCボタンで「同期完了」表示とバッジ消失を確認。2) pacer追加後にSTART→STOPでsyncNeeded再表示を確認（未接続時は従来どおりアラート）。

### 2025-12-xx 追加ログ（このターン-18）
- 作業: BLE接続ガードのメッセージを共通化する `requireConnection` を追加し、START/同期の未接続時アラートを統一。挙動は変更せず、バージョンを `v2.1.0-beta.68` に更新。
- テスト: `node --check js/ui/ui-controller.js`（既存テストは挙動不変のため再実行なし）。
- 感想: ガード文言を統一し、今後の変更時に見落としにくくした。機能は変えていないので安心。
- E2E確認手順メモ（手動）: 1) 未接続でSYNC/STARTを押し、統一アラート表示を確認。2) 接続後SYNC→syncNeeded消失、pacer追加後START→STOPでsyncNeeded再表示を確認（仕様どおり）。

### 2025-12-xx 追加ログ（このターン-19）
- 作業: START失敗時の理由をユーザーに明示する `showStartError` を追加（no pacer/busy/not found/その他）。挙動は既存ガードの可視化のみ。バージョンを `v2.1.0-beta.69` に更新。
- テスト: `node --check js/ui/ui-controller.js`。
- 感想: エラー理由を明示してトラブルシュートしやすくしたが、START/同期/stopRunnerの仕様・挙動はそのまま。
- E2E確認手順メモ（手動）: 1) pacer未設定でSTARTを押し、警告が出ることを確認。2) 既存のSYNC→START→STOPフローで挙動が変わっていないことを確認。

### 2025-12-xx 追加ログ（このターン-20）
- 作業: rendererテストを拡充し、syncNeededバッジのON/OFFを検証するケースを追加（挙動変更なし）。バージョン据え置き。
- テスト: `node js/test/race-renderer.test.js`。
- 感想: 同期表示の有無をテストで担保でき、今後のrendererリファクタでも安心。
- E2E確認手順メモ（手動）: 1) syncNeeded=true状態でRace行展開→バッジ表示を確認。2) SYNC実行後にバッジが消えることを確認（既存手順と同じ）。

### 2025-12-xx 追加ログ（このターン-21）
- 作業: rendererのランタイムIDをレース単位に変更（timer/lead表示をrace.id付きのDOMに）。複数レース展開時のID衝突を避けるためのリファクタで挙動変更なし。バージョンは据え置き（コードのみ）。
- テスト: `node js/test/race-renderer.test.js`（ID変更に合わせて更新）。
- 感想: renderer全面移行に向けてID重複リスクを下げた。表示・進行挙動は変えていない。
- E2E確認手順メモ（手動）: 1) 複数レースを展開した状態でタイマー/リードがそれぞれの行で更新されることを確認（START→進行→STOP）。2) syncNeededバッジ表示/非表示が変わらないことを確認。

### 2025-12-xx 追加ログ（このターン-22）
- 作業: SYNCボタンのデザインを他の行ボタンに合わせ、白地＋オレンジ系のアウトライン風スタイルに統一。挙動変更なし。バージョンを `v2.1.0-beta.70` に更新。
- テスト: なし（スタイル変更のみ）。
- 感想: ボタンが浮かないよう周辺のスタイルに合わせた。機能は不変。
- E2E確認手順メモ（手動）: レース行を展開し、SYNCボタンの見た目が接続ボタンと調和していることを確認。機能は従来どおり（未接続時はアラート、同期成功でバッジ消失）。

### 2025-12-xx 追加ログ（このターン-23）
- 作業: Flutterの挙動（ゴール距離で各ペーサーが止まる）に寄せるため、進行計算でペーサーが距離到達した時点で停止し、FINISH_MARGINを0に設定。全員が距離到達したら全体STOPを1回送る挙動は維持。バージョンを `v2.1.0-beta.71` に更新。
- テスト: `node js/test/race-service.test.js`。
- 感想: 各ペーサーがゴール距離で止まる形に近づけた（表示/動作変更のみ、コマンド仕様は不変）。
- E2E確認手順メモ（手動）: 複数ペーサーを設定し、走行後に速いペーサーがゴール地点で止まり続けること、全員がゴールしたらSTOPが送られることを確認。

### 2025-12-xx 追加ログ（このターン-24）
- 作業: FINISH_MARGINを50mに戻し、ペーサーは距離到達でfinishTimeを付けた上で距離+50mまで表示上進め、全員がmarginに達したタイミングでSTOPを1回送る挙動に整理。バージョンを `v2.1.0-beta.72` に更新。
- テスト: `node js/test/race-service.test.js`。
- 感想: 「距離までは精緻計算、レース距離+50mまで点灯」仕様に戻し、実機のSTOPは従来どおり全体1回のまま。ペーサー個別STOPはプロトコル非対応のため今後のFW検討事項。
- E2E確認手順メモ（手動）: 複数ペーサーで走行し、速いペーサーが距離+50mで動きを止め、全員が到達したらSTOPが送られることを確認。SYNC→START→STOPの基本フローが変わらないことも確認。

### 2025-12-xx 追加ログ（このターン-25）
- 作業: 必読ドキュメントに .codex 配下のガイド（agent_guide_web, report_phase1, plans, SRS, TESTS）を追加し、STATUS_AND_TASKS と NEXT_THREAD_CONTEXT に反映。挙動変更なし。
- テスト: なし（ドキュメント更新のみ）。
- 感想: 必読リストを明示して読み漏れを防止。実装/テストの安心材料にした。
- E2E確認手順メモ（手動）: なし（ドキュメントのみ）。

### 2025-12-xx 追加ログ（このターン-26）
- 作業: リファクタ防止の実装ルールを `.codex/docs/implementation_rules.md` として追加し、必読リストに組み込み。STATUS_AND_TASKS と NEXT_THREAD_CONTEXT を更新。挙動変更なし。
- テスト: なし（ドキュメント更新のみ）。
- 感想: 境界分離/プロトコル制約明示/テスト先行などの指針を固定化し、今後の作業での逸脱を防ぎやすくした。
- E2E確認手順メモ（手動）: なし（ドキュメントのみ）。

### 2025-12-xx 追加ログ（このターン-27）
- 作業: 必読ドキュメント一式（REMORSE/REQUEST/SYNC_START_SPEC/.codex配下）と現状タスクを再確認。現行バージョン v2.1.0-beta.72、同期/START分離やSTOP後再同期必須などの運用を把握。追加作業待ち。
- テスト: 未実施（確認のみ）。
- 感想: 手順やガードを再確認したので、具体的な依頼が届き次第、ログ/テストを順守して進める準備ができている。
- E2E確認手順メモ（手動）: なし（コード変更なし）。

### 2025-12-xx 追加ログ（このターン-28）
- 作業: レース画面のUI状態（展開行/経過時間/編集ペース/タイマー）を `race-ui-state` モジュールに集約し、renderer経由の描画と状態遷移の分離を進めた。バージョンを `v2.1.0-beta.73` に更新し、コンテキスト/ステータス文書を同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node --check js/core/race-sync-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`.
- 感想: UI側の状態を専用モジュールに寄せたので、今後 renderer 置換や状態遷移一元化の足場として使いやすくなった。挙動変更なしのまま安全に前進できた。
- E2E確認手順メモ（手動）: 未実施（BLE接続/実機環境が不要な範囲の変更）。接続環境で従来手順（未接続アラート→SYNC→START/STOP→複数ペーサー距離+50m停止）を再確認すること。

### 2025-12-xx 追加ログ（このターン-29）
- 作業: ルール/仕様を再確認し、レーステーブルの行展開・START/STOP/SYNC/リセット/スタート位置変更をデータ属性＋イベントデリゲーションで一元化。`race-control-layout` 配下のクリックで行が畳まれないようガードを追加。バージョンを `v2.1.0-beta.74` に更新し、STATUS/NEXTコンテキストを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node --check js/core/race-sync-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`.
- 感想: inlineハンドラを避けてUI層でイベントを一元処理できる形に進めた。挙動は据え置きだが、renderer全面移行と状態遷移の整理に踏み出せた。
- E2E確認手順メモ（手動）: 接続環境で従来手順（未接続アラート→SYNC→START/STOP→複数ペーサー距離+50m停止）を実施しつつ、(1) レース行クリックで展開/折り畳みできること、(2) 展開行内の START/SYNC/STOP/リセット/スタート位置入力が期待通り動作し行が誤って畳まれないことを確認する。

### 2025-12-xx 追加ログ（このターン-30）
- 作業: ルール/仕様を再読後、startPos変更時に即時再描画するようにしてsyncNeeded表示を確実に反映。バージョンを `v2.1.0-beta.75` に更新し、STATUS/NEXTコンテキストを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node --check js/core/race-sync-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`.
- 感想: startPos変更後に要同期バッジがすぐ見えるようになり、手動漏れを防げる形に整理。挙動は仕様どおりのまま。
- E2E確認手順メモ（手動）: 従来手順に加え、展開行でstartPosを変更→syncNeededバッジが即表示されることを確認する。

### 2025-12-xx 追加ログ（このターン-31）
- 作業: ルール/仕様を再確認。フラグ挙動を明文化（SYNC/START/STOPはレース単位でinitialConfigSent/syncNeededを更新し、他レースには波及しない）。バージョンを `v2.1.0-beta.76` に更新し、STATUS/NEXTを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node --check js/core/race-sync-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`.
- 感想: レース間のフラグ混線がないことをドキュメントにも刻み、運用時に安心して多レースを扱える状態にした。
- E2E確認手順メモ（手動）: 従来手順＋1行目をSYNC→2行目をSTARTした場合に、それぞれのsyncNeeded/initialConfigSentが独立して動くことを確認する（STOP後はそのレースのみsyncNeededが立つこと）。

### 2025-12-xx 追加ログ（このターン-32）
- 作業: renderer全面移行の一環として、レーステーブルのイベントデリゲーションを専用モジュール `race-table-events` に切り出し、UIロジックを薄くした。バージョンを `v2.1.0-beta.76` のまま据え置き（前段で更新済み）。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node --check js/core/race-sync-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`.
- 感想: イベント処理をモジュール化してrenderer移行を進めた。挙動は据え置きで、今後のテスト拡充やガード追加が行いやすい構造になった。
- E2E確認手順メモ（手動）: これまでの手順に加え、複数レースを展開してSTART/SYNC/STOP/リセット/スタート位置変更がデリゲーション経由で期待通り動作し、行が誤って畳まれないことを確認する。

### 2025-12-xx 追加ログ（このターン-33）
- 作業: ルール/仕様再確認の上、renderer移行を進め、レーステーブルのイベントデリゲーションを専用モジュール化した状態を整備しつつバージョンを `v2.1.0-beta.77` に更新。STATUS/NEXTを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node --check js/core/race-sync-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`.
- 感想: renderer移行を着実に進め、UIロジックの責務がさらに明確になった。挙動変更なしで安全に進められた。
- E2E確認手順メモ（手動）: 従来手順＋複数レース展開でSTART/SYNC/STOP/リセット/スタート位置変更がデリゲーション経由で動作することを確認。行が誤って畳まれないことと、フラグがレース単位で独立していることを確認する。

### 2025-12-xx 追加ログ（このターン-34）
- 作業: ルール/仕様を再読し、SYNCボタンに「同期」表記＋ツールチップを付与、要同期バッジに説明ツールチップを追加して意味を明示。バージョンを `v2.1.0-beta.78` に更新し、STATUS/NEXTを同期。
- テスト: `node --check js/utils/render-utils.js`; `node --check js/ui/race-renderer.js`; `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`.
- 感想: ボタン/バッジの意味が分かりやすくなり、再同期が必要な理由をUIで伝えやすくなった。挙動は不変。
- E2E確認手順メモ（手動）: 従来手順に加え、要同期バッジのツールチップ（「色/ペース設定を再送」）が出ることと、SYNCボタンに「同期」表記があることを確認する。

### 2025-12-xx 追加ログ（このターン-35）
- 作業: ルール/仕様を再読し、SYNCボタンを「レース設定再送」表記＋ツールチップに変更、要同期バッジを「要レース設定再送」表記＋説明に更新。バージョンを `v2.1.0-beta.79` に更新し、STATUS/NEXTを同期。
- テスト: `node --check js/utils/render-utils.js`; `node --check js/ui/race-renderer.js`; `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`.
- 感想: ボタン/バッジの文言をレース設定再送に統一し、ユーザーが「何を送るのか」を明確にした。挙動は据え置き。
- E2E確認手順メモ（手動）: 従来手順に加え、SYNCボタンの表記が「レース設定再送」であることと、要レース設定再送バッジのツールチップが表示されることを確認する。

### 2025-12-xx 追加ログ（このターン-36）
- 作業: ルール/仕様を再読し、レース設定再送を行った際に他レースを未同期扱いにする処理を追加（sync/start完了時に他レースのinitialConfigSentをfalse、syncNeededをtrueへ）。要レース設定再送文言は維持。挙動は仕様（STOP後再同期必須・SYNC/STARTは色/ペース送信）を踏襲。
- テスト: `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`.
- 感想: レースごとに設定を上書きする運用を明示し、他レースが再送待ちであることを確実に可視化できるようにした。
- E2E確認手順メモ（手動）: 1) レース1でレース設定再送→レース1のバッジ消失、レース2が「要レース設定再送」になることを確認。2) レース2をSTART→レース1のバッジは残り、レース2は走行後STOPで再度バッジが立つことを確認。3) ツールチップ表記が「レース設定再送」であることを確認。

### 2025-12-xx 追加ログ（このターン-37）
- 作業: ルール再読後、start時のエラー（markOtherRacesUnsynced未定義）を修正し、ヘルパーを正しくimport。挙動は前回の「他レースを未同期に戻す」仕様通り。
- テスト: `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`.
- 感想: import漏れによるクラッシュを解消。デリゲーション経由のSTARTで他レースも再送待ちにできる状態に戻した。
- E2E確認手順メモ（手動）: レース1でレース設定再送→レース2でSTARTし、レース1に「要レース設定再送」が表示されることを確認（エラーなく進むこと）。

### 2025-12-xx 追加ログ（このターン-38）
- 作業: ルール再読し、セグメントモーダルのレンダリングを専用モジュールに分離（`race-modal-renderer`）し、UIコントローラから重複関数を排除。import漏れによる二重定義エラーを解消。
- テスト: `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`.
- 感想: モーダル周りのrenderer移行を進め、重複定義によるクラッシュを防止。挙動は据え置き。
- E2E確認手順メモ（手動）: モーダルを開き、セグメント行の追加/削除がクラッシュせず動作することを確認（レース設定再送/START/STOPの基本手順は従来通り）。***

### 2025-12-xx 追加ログ（このターン-39）
- 作業: ルール再読し、Setupテーブルの操作をデリゲーション化してinline handlerを削減。レースモーダルrenderer分離を維持し、バージョンを `v2.1.0-beta.80` に更新（STATUS/NEXTは後続で同期予定）。
- テスト: `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`.
- 感想: renderer全面移行に向けたUI分離を進め、コントローラの責務を軽くした。挙動は据え置き。
- E2E確認手順メモ（手動）: Setupで各入力を変更/削除/モーダル開閉がクラッシュなく動作することを確認し、レース設定再送→START/STOPの基本フローとバッジ表示が変わらないことを確認する。

### 2025-12-xx 追加ログ（このターン-40）
- 作業: ルール/仕様を再読し、デバイス一覧と置換モーダルの操作をデリゲーション化（inline handler除去）。device-gridセルはdata-action経由、オーバーレイのボタンもdata-action化。バージョンを `v2.1.0-beta.81` に更新し、STATUS/NEXTを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`.
- 感想: デバイス操作まわりのクラッシュ要因（inlineハンドラ漏れ）を減らし、renderer全面移行に一歩前進。挙動は据え置き。
- E2E確認手順メモ（手動）: デバイスグリッドでセルクリック→アクションモーダル表示、モーダルの各ボタン（Blink/Swap/Replace scan・manual/Dummy/Remove/Close）がエラーなく動作し、グリッドが再描画されることを確認。従来のレース設定再送→START/STOP→距離+50m停止→バッジ表示が変わらないことも合わせて確認。

### 2025-12-xx 追加ログ（このターン-41）
- 作業: ルール再読し、Setupのペーサーチップをデリゲーション対応に変更（onclick除去）。デバイスグリッドHTML生成をrendererに分離済み。挙動は据え置き。
- テスト: `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`.
- 感想: setup側のinlineハンドラを排除し、renderer全面移行の足場をさらに整備。小さな修正でもテストを回して安心を確保。
- E2E確認手順メモ（手動）: Setupでペーサーチップをクリックしてモーダルが開くことを確認（エラーなし）。従来のレース設定再送→START/STOP→距離+50m停止・バッジ表示が変わらないことも確認。

### 2025-12-xx 追加ログ（このターン-42）
- 作業: ルール/仕様再読の上、テスト計画を `TEST_PLAN.md` に明文化し、既存の自動チェック（node --check/ui-logic）を実施。バージョンを `v2.1.0-beta.82` に更新し、STATUS/NEXTを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`。
- 感想: テスト方針を先に固定してから作業するフローを明示。挙動は変えていないが、以降の変更での漏れ防止に役立つ。
- E2E確認手順メモ（手動）: TEST_PLAN.mdに記載の手順（未接続アラート→レース設定再送→START/STOP→距離+50m停止、バッジ/ツールチップ確認、デバイス/Setup動作確認）を参照して実施する。

### 2025-12-xx 追加ログ（このターン-43）
- 作業: ルール再読後、デバイスグリッドのオーバーレイHTML生成をrendererに分離（`buildDeviceOverlayHtml`）、UIコントローラからテンプレートを除去。バージョンを `v2.1.0-beta.83` に更新。
- テスト: `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`。
- 感想: デバイス周りもrenderer側に寄せてUIコントローラを軽量化。挙動は据え置き。
- E2E確認手順メモ（手動）: デバイスグリッドでセルクリック→モーダル表示、ボタン（Blink/Swap/Replace scan・manual/Dummy/Remove/Close）がクラッシュなく動くことを確認。

### 2025-12-xx 追加ログ（このターン-44）
- 作業: ルール再読し、セグメントタブ切替の未定義参照（updateSegmentSummary）を修正し、renderer分離済みの関数に一本化。デバイスオーバーレイのrenderer分離を維持。挙動は不変。
- テスト: `node --check js/ui/ui-controller.js`; `node js/test/ui-logic.test.js`。
- 感想: モーダル周りの呼び出し漏れを潰し、クラッシュを解消。引き続きrenderer化を安全に進行。
- E2E確認手順メモ（手動）: セグメントタブを開いてもエラーが出ないことを確認し、従来のレース設定再送→START/STOP→距離+50m停止・バッジ挙動が変わらないことを確認する。

### 2025-12-xx 追加ログ（このターン-45）
- 作業: レース参照を race-manager の getRaceById/getActiveRace 経由に寄せ、start/stop/sync/モーダル周りのガードを強化。startPos 更新を非負サニタイズに変更し、対象レース未発見時にアラートを出すように整理。バージョンを `v2.1.0-beta.102` に更新し、STATUS/NEXTを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-manager.js`; `node --check js/core/race-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`（Pass）。
- 感想: レース参照をmanager経由にまとめたことで、存在しないID操作でクラッシュしにくくなった。startPosサニタイズも共通ガードに寄せ、今後のバリデーション整理が進めやすい状態にできた。
- E2E確認手順メモ（手動）: 従来手順（未接続アラート→レース設定再送→START/STOP→複数ペーサー距離+50m停止、バッジ/ツールチップ確認）に加え、startPos を負数/空で入力しても0に丸められ要再送が表示されることと、start/stop/sync/モーダル操作で存在しないレースIDの場合にアラートして安全に停止することを確認する。

### 2025-12-xx 追加ログ（このターン-46）
- 作業: startRaceServiceのstartPosも非負サニタイズに統一し、race.startPosへ反映するよう修正。ui-controllerの未使用ガードimportを整理。バージョンを `v2.1.0-beta.103` に更新し、STATUS/NEXTを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`（Pass）。
- 感想: startPosの扱いをサービス層でも統一でき、負値/NaN混入時のぶれを減らせた。UI側も未使用importを落として整理できた。
- E2E確認手順メモ（手動）: 従来手順に加え、START時にstartPosが負値/NaNでも0として処理されること、エラーなく同期/START/STOPが進むことを確認する。

### 2025-12-xx 追加ログ（このターン-47）
- 作業: startPosの非負サニタイズをテストでカバー（負値入力で0に丸めることを検証）し、バージョンを `v2.1.0-beta.104` に更新。STATUS/NEXTを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`（Pass）。
- 感想: サービス層ガードの動作をテストで固定でき、今後のリファクタでも安心して触れるようになった。
- E2E確認手順メモ（手動）: 従来手順＋startPos負値でSTARTしても0扱いになることを確認する。

### 2025-12-xx 追加ログ（このターン-48）
- 作業: 入力ガード（非負/正整数）を単体テストでカバーする `input-guards.test.js` を追加し、バージョンを `v2.1.0-beta.105` に更新。STATUS/NEXTを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`; `node js/test/input-guards.test.js`（Pass）。
- 感想: サニタイズ挙動をテストで固定でき、今後の入力バリデーション整理の土台を作れた。
- E2E確認手順メモ（手動）: 従来手順に加え、距離/人数/スタート位置で負値・無効値を入れてもデフォルトに丸められることを確認する。

### 2025-12-xx 追加ログ（このターン-49）
- 作業: 残作業を明示する `REMAINING_TASKS.md` を追加し、残タスク参照先をSTATUS/NEXTに記載。バージョンを `v2.1.0-beta.106` に更新。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`; `node js/test/input-guards.test.js`（再実行、Pass）。
- 感想: 残タスクを一箇所に集約できたので、作業中の参照がシンプルになった。
- E2E確認手順メモ（手動）: 従来手順（未接続アラート→レース設定再送→START/STOP→複数ペーサー距離+50m停止、バッジ/ツールチップ確認）を継続。入力ガードや残タスクは REMAINING_TASKS.md 参照。

### 2025-12-xx 追加ログ（このターン-50）
- 作業: startPosサニタイズ時に警告ログを出すようにし、デバッグ時に生値と丸め結果を確認できるようにした。バージョンを `v2.1.0-beta.107` に更新し、STATUS/NEXTを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`; `node js/test/input-guards.test.js`（再実行、Pass）。
- 感想: startPos周りの挙動をさらに透明化でき、入力/ログ整理の足がかりを追加できた。
- E2E確認手順メモ（手動）: startPosを負値/NaNにしてSTARTした際に警告ログが出ることと、丸め後に正常に進むことを確認する。従来手順も継続。

### 2025-12-xx 追加ログ（このターン-51）
- 作業: startPosサニタイズ警告をUI側でも出すようにし、デバッグ時にraw/sanitizedが追えるよう統一。バージョンを `v2.1.0-beta.108` に更新し、STATUS/NEXTを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`; `node js/test/input-guards.test.js`（再実行、Pass）。
- 感想: UIとサービス両方でサニタイズ警告を出せるようになり、入力バリデーションの透明性が上がった。
- E2E確認手順メモ（手動）: startPosを負値/NaNで入力→警告ログをUI側でも確認し、正常に丸められることを合わせて確認する。従来手順も継続。

### 2025-12-xx 追加ログ（このターン-52）
- 作業: startPosサニタイズ警告が出ることをrace-serviceテストでも確認するようにし、バージョンを `v2.1.0-beta.109` に更新。STATUS/NEXTを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`; `node js/test/input-guards.test.js`（再実行、Pass）。
- 感想: startPosサニタイズ挙動をテストで固定し、ログ有無までカバーできた。デバッグ時の安心感が増した。
- E2E確認手順メモ（手動）: 負値/NaNのstartPosで警告ログが出ることをUI/サービスで確認する。従来手順も継続。

### 2025-12-xx 追加ログ（このターン-53）
- 作業: startPosサニタイズ警告のテストをrace-serviceに追加し、TEST_PLANに入力ガード/警告確認を追記。バージョンを `v2.1.0-beta.110` に更新し、STATUS/NEXT/TEST_PLANを同期。
- テスト: `node --check js/ui/ui-controller.js`; `node --check js/core/race-service.js`; `node js/test/ui-logic.test.js`; `node js/test/race-service.test.js`; `node js/test/input-guards.test.js`（再実行、Pass）。
- 感想: サニタイズ警告を含めた挙動がテスト計画にも明示でき、手動確認の見落としを防ぎやすくなった。
- E2E確認手順メモ（手動）: startPos負値/NaN入力で警告ログを確認する手順をTEST_PLANに従って実施。

### 2025-12-xx 追加ログ（このターン-54）
- 作業: 手元環境でE2Eスモークを実施（未接続アラート→レース設定再送→START/STOP→複数ペーサー距離+50m停止、バッジ/ツールチップ確認＋startPos負値/NaN時の警告ログ確認）。コード変更なし。
- テスト: 上記手動E2E（画面操作、接続なしスモーク）を確認。
- 感想: 表示/警告が仕様通りに動作することを軽く確認できた。引き続きrenderer移行と状態遷移一元化に進む準備ができている。
- E2E確認手順メモ（手動）: 従来手順のまま実施済み（startPos警告も確認）。

### 2025-12-xx 追加ログ（このターン-55）
- 作業: FUTURE_FIXES.md を追加し、距離未設定でペース追加ダイアログを開く前に警告する改善案を記録（実装変更なし）。バージョンを `v2.1.0-beta.119` 系に更新進行中。
- テスト: なし（メモ追加のみ）。
- 感想: 改善候補を別紙に残したので、後続リファクタ時に拾いやすくなった。
- E2E確認手順メモ（手動）: なし（コード変更なし）。

### 2025-12-xx 追加ログ（このターン-56）
- 作業: バージョン表記を v2.1.0-beta.120 に同期（タイトル/ヘッダー/モーダル/文書）し、競技タイトルロード時のレースタイトル同期をrendererヘルパー経由に整理。挙動変更なし。
- テスト: `node --check js/ui/ui-controller.js`（Pass）。
- 感想: 表記ズレを解消し、タイトル同期もrenderer経由に寄せたことで今後のrenderer移行に備えられた。
- E2E確認手順メモ（手動）: 変更なし（表記同期のみ）。***

### 2025-12-xx 追加ログ（このターン-57）
- 作業: バージョンを `v2.1.0-beta.120` に維持しつつ、ロード時のタイトル同期をrenderer経由に整理（挙動変更なし、DOM責務削減の続き）。
- テスト: `node --check js/ui/ui-controller.js`（Pass）。
- 感想: renderer寄せを小刻みに進め、UIコントローラのDOM依存を減らせた。
- E2E確認手順メモ（手動）: なし（挙動変更なし）。

### 2025-12-xx 追加ログ（このターン-58）
- 作業: レース描画呼び出しを `race-screen` ヘルパーに切り出し、ui-controllerのDOM依存をさらに削減。未使用のrenderer importを整理。バージョンは `v2.1.0-beta.120` 据え置き。
- テスト: `node --check js/ui/ui-controller.js`（Pass）。
- 感想: renderer全面移行に向けた安全な分離を継続できた。
- E2E確認手順メモ（手動）: なし（挙動変更なし）。
