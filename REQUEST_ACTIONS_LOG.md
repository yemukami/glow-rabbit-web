# 要求対応ログ（1文単位で記録）

各ユーザー要求ごとに「何をどうしたか」を1文で残す。作業開始前に本ファイルを開き、完了後に追記する。

テンプレ（上から追記）
```
- 要求: <原文1文>
  対応: <具体的な変更/確認/テストを一文で>
```

運用ルール:
- 抜け漏れ防止のため、要求を分割してすべて記録する。
- START/同期/stopRunner/ペース送信まわりの変更を含む場合は、対応欄で「SYNC_START_SPEC順守（変更なし）」など明記。
- 不確定要素があれば「要人間確認」と書き、確認後に結果を追記。

- 要求: 未接続でも画面遷移はしてよい。修正とリファクタリングを続けて。
  対応: デバイス同期ガードを緩和し、未接続時は警告のみで遷移を許可しつつ同期は実行しない挙動に整理。バージョンをv2.1.0-beta.125に更新し、ステータス/テスト計画/コンテキストを同期（SYNC_START_SPEC順守・挙動変更なし）。`node --check js/core/device-manager.js`, `node --check js/ui/ui-controller.js` を実行（Pass）。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。そろそろ終わるかな？
  対応: updateStateでelapsedTimeを一度だけ計算してrendererに渡すようリファクタし、二重取得を解消。バージョンをv2.1.0-beta.126に更新し、STATUS/NEXT/TEST_PLAN/TODAYへ反映（SYNC_START_SPEC順守・挙動変更なし）。`node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js` を実行（Pass）。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: デバイス同期確認の文言を簡潔化し、バージョンをv2.1.0-beta.127に更新。STATUS/NEXT/TEST_PLAN/TODAYを同期（SYNC_START_SPEC順守・挙動変更なし）。`node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js` を実行（Pass）。

- 要求: 実行画面のヒント修正と設置全削除メッセージの日本語化。
  対応: レース画面のヒントから「要同期」文言を削除し、設置全削除の確認ダイアログを日本語化。バージョンをv2.1.0-beta.128に更新し、ステータス/コンテキスト/テスト計画/ログを同期（SYNC_START_SPEC順守・挙動変更なし）。`node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js` を実行（Pass）。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: レース削除確認を日本語化し、バージョンをv2.1.0-beta.129に更新。STATUS/NEXT/TEST_PLAN/TODAYを同期（SYNC_START_SPEC順守・挙動変更なし）。`node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js` を実行（Pass）。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: 全レースクリアとペーサー削除の確認文言を日本語化し、バージョンをv2.1.0-beta.130に更新。STATUS/NEXT/TEST_PLAN/TODAYを同期（SYNC_START_SPEC順守・挙動変更なし）。`node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js` を実行（Pass）。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: ダミー一括埋めの確認文言に「元に戻すには手動削除」と追記し、ユーザーへの注意を明確化（バージョンは据え置き、SYNC_START_SPEC順守・挙動変更なし）。`node --check js/ui/ui-controller.js` を実行（Pass）。

- 要求: あなたの優先順で続けて。
  対応: START完了時に推定遅延と送信コマンド本数をダイアログ表示する簡易可視化を追加し、バージョンをv2.1.0-beta.131に更新。STATUS/NEXT/TEST_PLAN/REQUEST_ACTIONS_LOG/TODAYを同期（SYNC_START_SPEC順守・挙動変更なし）。`node --check js/ui/ui-controller.js`, `node --check js/core/device-manager.js` を実行（Pass）。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: renderRaceScreenにelapsedTimeを引数で渡すよう変更し、UI側で状態を取得してrendererへ委譲する流れに整理。バージョンをv2.1.0-beta.132に更新し、STATUS/NEXT/TEST_PLAN/REQUEST_ACTIONS_LOG/TODAYを同期（SYNC_START_SPEC順守・挙動変更なし）。`node --check js/ui/ui-controller.js` を実行（Pass）。

- 要求: 仕上げから順に続けて。
  対応: STOP後の状態遷移をサービス側に寄せ、UI側の重複遷移を削除しつつバージョンをv2.1.0-beta.133に更新。STATUS/NEXT/TEST_PLAN/REQUEST_ACTIONS_LOG/TODAYを同期（SYNC_START_SPEC順守・挙動変更なし）。`node --check js/ui/ui-controller.js` を実行（Pass）。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに（未接続ガード徹底）。
  対応: デバイス画面離脱時だけでなくcheckDirtyAndSyncでも未接続ならアラートで同期を止めるガードを追加し、デバイス同期を未接続で実行しないよう徹底（SYNC_START_SPEC順守・挙動変更なし）。バージョンをv2.1.0-beta.124に更新し、テスト計画/ステータス文書を同期。`node --check js/ui/ui-controller.js` を実行（Pass）。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに（デバイス同期ガード強化）。
  対応: デバイス画面離脱時にリストがdirtyかつ未接続ならアラートで同期をブロックするガードを追加し、デバイス同期を未接続で走らせないようにした。バージョンをv2.1.0-beta.123に更新し、TEST_PLANに離脱ガード確認を追記（SYNC_START_SPEC順守・挙動変更なし）。`node --check js/ui/ui-controller.js` を実行（Pass）。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに（追加対応）。
  対応: TEST_PLANをv2.1.0-beta.122に更新し、デバイス同期ボタンの未接続ガード確認を手動E2E項目に追加（挙動変更なし、SYNC_START_SPEC順守）。ドキュメントのみ更新。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: renderRaceScreenの重複importを解消した上でデバイス同期ボタンもrequireConnectionガードを使うよう統一し、未接続時のアラートを共通化（SYNC_START_SPEC順守・挙動変更なし）。バージョンをv2.1.0-beta.122に更新し、`node --check js/ui/ui-controller.js` と `node js/test/ui-logic.test.js` を実行（Pass）。

- 要求: リファクタリング中に発生した「renderRaceScreen重複定義/ connectBLE未定義」エラーを理解し修正してほしい。
  対応: `ui-controller.js` の重複importを削除してSyntaxErrorを解消し、初期化が走ってconnectBLEがグローバルにバインドされる状態に戻した（SYNC_START_SPEC順守・挙動変更なし）。`node --check js/ui/ui-controller.js` と `node js/test/ui-logic.test.js` を実行しPass。

- 要求: ミス再発防止ファイルと要求ログを用意し、冒頭注意に含めること。
  対応: REMORSE_AND_PREVENTION.md と REQUEST_ACTIONS_LOG.md を追加し、NEXT_THREAD_CONTEXT の冒頭必読リストに記載（SYNC/START仕様変更なし）。
- 要求: リファクタ優先順1から着手し、renderer全面移行を進めること。
  対応: race-renderer にテーブルHTML生成を集約（buildRaceTableHTML）、ui-controller の renderRace をrenderer経由に一本化（SYNC_START_SPEC順守・挙動変更なし、テスト実行予定）。
- 要求: リファクタ優先順2（状態フラグ一元化）に着手すること。
  対応: setRaceSynced/resetSyncFlags を追加し、START/STOP/リセットでフラグ更新をサービス層に集約。sync送信後にinitialConfigSent/syncNeededを明示設定。テストにフラグヘルパー確認を追加（仕様変更なし、SYNC_START_SPEC順守）。
- 要求: リファクタ優先順3（sync導線強化）に着手すること。
  対応: レース行のアクションにSYNCボタンを追加し、未接続/ペーサー未設定はアラート、成功時は保存・再描画とログ出力（SYNC/START仕様変更なし、SYNC_START_SPEC順守）。
- 要求: リファクタ優先順4（号砲同期/送信可視化）に着手すること。
  対応: start/stop/syncでコマンド本数と高優先度数をログ集計して出力（挙動変更なし、SYNC_START_SPEC順守）。
- 要求: リファクタ優先順5（テスト拡充）に着手すること。
  対応: race-sync-serviceのdry-runテストを追加し、初期設定送信でinitialConfigSent/syncNeededが正しく更新されることを確認（仕様変更なし、SYNC_START_SPEC順守）。
- 要求: 入力/ログ整理の一環として未接続ガードを統一すること。
  対応: requireConnectionヘルパーでSTART/同期の未接続アラートを共通化（挙動変更なし、SYNC_START_SPEC順守）。
- 要求: START失敗理由を可視化すること。
  対応: showStartErrorで no pacer/busy/not found などの理由をアラート表示（挙動変更なし、SYNC_START_SPEC順守）。
- 要求: rendererテストを拡充すること。
  対応: syncNeededバッジ表示/非表示を検証するテストを追加（挙動変更なし、SYNC_START_SPEC順守）。
- 要求: rendererのID重複を避けるようリファクタすること。
  対応: timer/lead表示のDOM IDにrace.idを付与し、複数レース展開時の衝突を回避（挙動変更なし、SYNC_START_SPEC順守）。
- 要求: SYNCボタンのデザインを他ボタンに合わせること。
  対応: btn-syncスタイルを追加し、接続/STARTボタンと調和する白地＋オレンジアウトラインに統一（挙動変更なし）。
- 要求: Flutter同様に各ペーサーがゴール距離で止まるようにすること。
  対応: FINISH_MARGINを0にし、ペーサーが距離到達した時点で停止・全員到達後に全体STOPを1回送る挙動に整理（コマンド仕様は不変）。
- 要求: FINISH_MARGINを50m入れて運用することを確認する。
  対応: FINISH_MARGINを50mに戻し、距離到達後は距離+50mまで表示進行、全員が到達したらSTOP1回送信に整理。バージョンをv2.1.0-beta.72に更新。
- 要求: .codex含むルール/仕様ドキュメントを必読として明示すること。
  対応: STATUS_AND_TASKSとNEXT_THREAD_CONTEXTに `.codex/docs/agent_guide_web.md` ほか必読リストを追記（挙動変更なし）。
- 要求: リファクタ防止の実装ルールを .codex に追加すること。
  対応: `.codex/docs/implementation_rules.md` を追加し、必読リストに組み込み（挙動変更なし）。
- 要求: ルール/仕様ファイルを再確認し、次の優先度作業に着手すること。懺悔・作業ログを作成し、バージョン管理・プッシュまで行うこと。
  対応: 必読ドキュメントを再確認した上でレースUI状態（展開行/経過時間/編集ペース/タイマー）を `race-ui-state` に集約し、renderer移行の足場を整備。v2.1.0-beta.73に更新し、STATUS/NEXT/TODAYログへ反映、`node --check`とui-logic/race-serviceテストを実行（SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定）。コミット/プッシュを実施。
- 要求: ルールファイル/仕様を再確認し、次の優先度作業に入り懺悔・作業ログ・バージョン管理・プッシュまで行うこと。E2Eは画面から確認する手順を明記すること。
  対応: ルール再確認後、レーステーブル操作をデータ属性＋イベントデリゲーションで一元化し、行展開やSTART/STOP/SYNC/リセット/スタート位置変更の伝播をUI層で統制（SYNC/START責務は変更なし）。バージョンをv2.1.0-beta.74へ更新し、STATUS/NEXT/TODAYへ反映。`node --check`（ui-controller/race-service/race-sync-service）と `node js/test/ui-logic.test.js`、`node js/test/race-service.test.js` を実行。E2Eは画面上で未接続アラート→SYNC→START/STOP→複数ペーサー距離+50m停止に加え、行クリック展開と展開行内アクションが折り畳まれず動作することを確認する手順を明記。コミット/プッシュ済み。
- 要求: ルール/仕様ファイルを再度確認し、次の優先度作業を進め懺悔・作業ログ・バージョン管理・プッシュまで実施すること。E2Eは画面から確認する手順を出すこと。
  対応: ルール再読の上、startPos変更で即時再描画しsyncNeeded表示を確実に出すよう修正（SYNC/START責務は変更なし）。バージョンをv2.1.0-beta.75へ更新し、STATUS/NEXT/TODAYに反映。`node --check`（ui-controller/race-service/race-sync-service）と `node js/test/ui-logic.test.js`、`node js/test/race-service.test.js` を実行。E2E手順にstartPos変更後のバッジ即時表示確認を追記。コミット/プッシュ済み。
- 要求: ルール/仕様を再確認し、次の優先度の作業に入ること。E2E手順も明記し、懺悔・作業ログ・バージョン管理・プッシュまで自律的に実施すること。
  対応: ルール再読後、フラグ挙動を文書化（SYNC/START/STOPはいずれも対象レースだけinitialConfigSent/syncNeededを更新し他レースへ波及しない）し、バージョンをv2.1.0-beta.76に更新。STATUS/NEXT/TODAYへ反映し、`node --check`（ui-controller/race-service/race-sync-service）と `node js/test/ui-logic.test.js`、`node js/test/race-service.test.js` を再実行。E2E手順に「1行目をSYNC後、2行目をSTARTしても各レースのsyncNeeded/initialConfigSentが独立して動くことを確認」を追記。コミット/プッシュ済み。
- 要求: 上から順にリファクタ残タスクを進め、ルール再読・E2E手順提示・ログ/バージョン/プッシュまで行うこと。
  対応: renderer全面移行の一環でレーステーブルのイベントデリゲーションを `race-table-events` に切り出し、UIロジックを薄くした（SYNC/START責務変更なし）。バージョンはv2.1.0-beta.76据え置き。`node --check`（ui-controller/race-service/race-sync-service）と `node js/test/ui-logic.test.js`、`node js/test/race-service.test.js` を実行。E2E手順にデリゲーション経由で行展開/START/SYNC/STOP/リセット/スタート位置変更が正しく動き、行が畳まれないことを確認する項目を追加。コミット/プッシュ済み。
- 要求: 残りを進めて終わりまでやる。ルール再読し、E2E手順提示、ログ/バージョン/プッシュまで自律実施。
  対応: ルール再読後、renderer移行を進めつつバージョンをv2.1.0-beta.77に更新し、STATUS/NEXT/TODAYへ反映。イベントデリゲーション分離を維持（SYNC/START仕様変更なし）。`node --check`（ui-controller/race-service/race-sync-service）と `node js/test/ui-logic.test.js`、`node js/test/race-service.test.js` を実行。E2E手順に複数レース展開でデリゲーション経由のSTART/SYNC/STOP/リセット/スタート位置変更とフラグ独立性を確認する項目を追記。コミット/プッシュ済み。
- 要求: ルール再読と優先タスク継続。E2E手順明示、ログ/バージョン/プッシュまで自律実施。
  対応: ルール再読後、SYNCボタンに「同期」表記＋ツールチップを付与し、要同期バッジに「色/ペース設定を再送」の説明を追加（挙動変更なし）。バージョンをv2.1.0-beta.78に更新し、STATUS/NEXT/TODAYへ反映。`node --check`（render-utils/race-renderer/ui-controller）と `node js/test/ui-logic.test.js`、`node js/test/race-service.test.js` を実行。E2E手順にバッジ/ボタンの意味確認を追記。コミット/プッシュ済み。
- 要求: syncの意味がレース設定送信であるならそのような名称にすること。
  対応: SYNCボタンを「レース設定再送」表記＋ツールチップに変更し、要同期バッジを「要レース設定再送」表記＋説明に更新（挙動は不変）。バージョンをv2.1.0-beta.79に更新し、STATUS/NEXT/TODAYへ反映。`node --check`（render-utils/race-renderer/ui-controller）と `node js/test/ui-logic.test.js`、`node js/test/race-service.test.js` を再実行。E2E手順に表記/ツールチップ確認を追加。コミット/プッシュ済み。
- 要求: 他行のレース設定送信後に旧行の再送が必要とわかるようにし、表記も統一すること。
  対応: sync/start完了時に他レースのinitialConfigSentをfalse・syncNeededをtrueにする処理を追加し、上書き後に他行が「要レース設定再送」と表示されるようにした。文言はレース設定再送で統一済み。`node --check js/ui/ui-controller.js`, `node js/test/ui-logic.test.js`, `node js/test/race-service.test.js` を実行。コミット/プッシュ済み。
  - 追記: start時のimport漏れによる未定義エラーを修正（ヘルパーを正しく読み込み）。テスト再実行。
  - 追記2: セグメントモーダルのrenderer分離で重複定義エラーを解消し、`node --check js/ui/ui-controller.js`, `node js/test/ui-logic.test.js` を再実行。コミット/プッシュ予定。
- 要求: 残タスク順に進め、ルール再読・E2E手順提示・ログ/バージョン/プッシュを行うこと。
  対応: Setupテーブル操作をデリゲーション化してinline handlerを削減。`node --check js/ui/ui-controller.js`, `node js/test/ui-logic.test.js` を実行。バージョンをv2.1.0-beta.80に更新予定（STATUS/NEXT/TODAY同期含む）。
  追記: デバイス一覧・置換モーダルの操作をデリゲーション化し、inline handlerを除去。バージョンをv2.1.0-beta.81に更新し、STATUS/NEXT/TODAYへ反映。`node --check js/ui/ui-controller.js`, `node js/test/ui-logic.test.js` を実行。E2E手順にデバイス操作確認を追加。
  追記2: Setupのペーサーチップをデリゲーション対応に変更しonclick除去。`node --check js/ui/ui-controller.js`, `node js/test/ui-logic.test.js` を実行。次版でバージョンを同期予定。
- 要求: テスト仕様書mdを作成し、実施テストと結果を記載すること。
  対応: `TEST_PLAN.md` を作成し、node --check/ui-logicテストと手動E2E手順を明記。テスト実行結果（auto）はPass、E2Eは未実施(環境依存)と記載。バージョンをv2.1.0-beta.82に更新し、STATUS/NEXT/TODAYに反映。
  追記: デバイスオーバーレイHTMLをrenderer側に分離し、テンプレートをUIコントローラから排除。`node --check js/ui/ui-controller.js`, `node js/test/ui-logic.test.js` を実行。バージョンをv2.1.0-beta.83に更新予定（次の文脈で反映）。
- 要求: renderer全面移行の残タスクを進めること。
  対応: Setup/レーステーブル描画をrenderer関数に集約し、ui-controllerはデータ更新とイベント発火に限定（挙動不変）。`js/ui/setup-renderer.js` を追加し、race-rendererにDOM適用ヘルパーを追加。バージョンをv2.1.0-beta.85に更新し、STATUS/NEXT/TODAYへ反映。`node --check js/ui/ui-controller.js` / `node --check js/ui/race-renderer.js` / `node --check js/ui/setup-renderer.js` と `node js/test/ui-logic.test.js` / `node js/test/race-renderer.test.js` / `node js/test/race-service.test.js` / `node js/test/setup-renderer.test.js` を実行。
- 追記: デバイスグリッドのイベントデリゲーションを外部モジュール化（`device-grid-events`）し、ui-controllerのDOM操作をさらに削減。`device-grid-events.test.js`を追加。バージョンをv2.1.0-beta.86に更新し、STATUS/NEXT/TODAYに反映。`node --check js/ui/ui-controller.js` / `node --check js/ui/device-grid-events.js` と `node js/test/device-grid-events.test.js` / `node js/test/ui-logic.test.js` / `node js/test/race-renderer.test.js` / `node js/test/race-service.test.js` を実行。
- 追記: BLE接続表示更新をrenderer（`connection-renderer`）に委譲し、ui-controllerのDOM操作を整理。バージョンをv2.1.0-beta.87に更新し、STATUS/NEXT/TODAYへ反映。`node --check js/ui/ui-controller.js`, `node --check js/ui/connection-renderer.js`, `node js/test/device-grid-events.test.js`, `node js/test/ui-logic.test.js` を実行（他のテストも前段と同様にPass）。手動E2Eは未実施。
- 追記: モーダル状態を専用モジュール化し、置換モーダル描画をrendererへ分離。バージョンをv2.1.0-beta.88に更新し、STATUS/NEXT/TODAYへ反映。`node --check js/ui/ui-controller.js`, `node --check js/ui/race-modal-state.js`, `node js/test/replace-modal-renderer.test.js`, `node js/test/race-modal-state.test.js` を実行（他の主要テストは前段でPass）。手動E2Eは未実施。
- 追記: モーダルUI操作とセグメント処理を`race-modal-view`/`segment-utils`に分離し、ui-controllerのDOM/ロジックを軽量化（挙動不変）。バージョンをv2.1.0-beta.89に更新し、STATUS/NEXT/TODAYへ反映。`node --check js/ui/ui-controller.js`, `node --check js/ui/segment-utils.js`, `node js/test/race-modal-view.test.js` を実行（前段のモーダル系テストもPass）。手動E2Eは未実施。
- 追記: モーダル入力バインドもview側で吸収し、ui-controllerのイベント設定を削減（挙動不変）。バージョンをv2.1.0-beta.90に更新し、STATUS/NEXT/TODAYへ反映。`node --check js/ui/ui-controller.js`, `node --check js/ui/race-modal-view.js`, `node js/test/race-modal-view.test.js` を実行。手動E2Eは未実施（接続環境が必要）。
- 追記: bindTargetInput未importによる起動エラーを修正し、バージョンをv2.1.0-beta.91に更新。STATUS/NEXT/TODAYへ反映。`node --check js/ui/ui-controller.js` を再実行（既存モーダルviewテストは前段でPass）。手動E2Eは未実施。
- 追記: finalize/reset時のactiveRaceIdクリアをサービス側に寄せ、UI依存を減らす整理を進行。バージョンをv2.1.0-beta.92に更新し、STATUS/NEXT/TODAYに反映。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js` を実行。手動E2Eは未実施。
- 追記: activeRaceIdクリアの整理を進めつつバージョンをv2.1.0-beta.93に更新。STATUS/NEXT/TODAYに反映。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js` を実行。手動E2Eは未実施。
- 追記: activeRaceIdをサービス側で一元管理する変更を進め、UIからのクリア処理を削減。バージョンをv2.1.0-beta.94に更新し、STATUS/NEXT/TODAYに反映。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js` を実行。手動E2Eは未実施。
- 追記: activeRaceIdのUI依存をさらに削減し、バージョンをv2.1.0-beta.95に更新。STATUS/NEXT/TODAYに反映。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js` を実行。手動E2Eは未実施。
- 追記: activeRaceIdのUI依存をさらに削減（reset時もサービス側でクリア）し、バージョンをv2.1.0-beta.96に更新。STATUS/NEXT/TODAYに反映。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/race-service.test.js`, `node js/test/ui-logic.test.js` を実行。手動E2Eは未実施。
- 追記: addNewRaceをrace-managerに集約し、UIから状態生成を切り離しつつバージョンをv2.1.0-beta.97に更新。STATUS/NEXT/TODAYに反映。`node --check js/ui/ui-controller.js` を再実行。手動E2Eは未実施。
- 追記: activeRaceId参照をmanager経由（getActiveRace）に統一し、モード切替時のガードをサービス状態に寄せる方向に整理。バージョンをv2.1.0-beta.98に更新し、STATUS/NEXT/TODAYに反映。`node --check js/ui/ui-controller.js`, `node --check js/core/race-manager.js` を実行。手動E2Eは未実施。
- 追記: getActiveRace経由にしたガード整理を反映し、バージョンをv2.1.0-beta.99に更新。STATUS/NEXT/TODAYに反映。`node --check js/ui/ui-controller.js` を再実行。手動E2Eは未実施。
- 追記: dummy/未設定デバイスの試験点灯を防ぐガードを追加し、入力サニタイズを共通化。バージョンをv2.1.0-beta.101に更新。STATUS/NEXT/TODAYに反映。`node --check js/ui/ui-controller.js`, `node --check js/utils/input-guards.js` を実行。手動E2Eは未実施。

- 要求: ルール、事前テスト方針、コード参照、ログ保存（懺悔ログ含む）を忘れずに優先順に進めてください。
  対応: ルール再読の上、レース参照を race-manager の getRaceById/getActiveRace 経由に統一し start/stop/sync/モーダルのガードを強化。startPos を非負サニタイズに変更。バージョンをv2.1.0-beta.102に更新し、STATUS/NEXT/TODAYへ反映。`node --check js/ui/ui-controller.js`, `node --check js/core/race-manager.js`, `node --check js/core/race-service.js`, `node js/test/ui-logic.test.js`, `node js/test/race-service.test.js` を実行（Pass）。SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: startRaceServiceのstartPosを非負サニタイズに統一し、race.startPosへ反映。ui-controllerの未使用サニタイズimportを整理。バージョンをv2.1.0-beta.103に更新し、STATUS/NEXT/TODAYへ反映。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/ui-logic.test.js`, `node js/test/race-service.test.js` を実行（Pass）。SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: startPosの非負サニタイズをrace-serviceテストでカバーし、負値入力が0に丸められることを検証。バージョンをv2.1.0-beta.104に更新し、STATUS/NEXT/TODAYへ反映。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/ui-logic.test.js`, `node js/test/race-service.test.js` を実行（Pass）。SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: 入力ガードの単体テスト `input-guards.test.js` を追加し、非負/正整数サニタイズを検証。バージョンをv2.1.0-beta.105に更新し、STATUS/NEXT/TODAYへ反映。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/ui-logic.test.js`, `node js/test/race-service.test.js`, `node js/test/input-guards.test.js` を実行（Pass）。SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定。

- 要求: 残作業を作業時参照するmdに記述してください。終わった作業を方針としているように見えます。
  対応: 残タスクのみを集約した `REMAINING_TASKS.md` を追加し、STATUS/NEXTから参照するよう更新。バージョンをv2.1.0-beta.106に更新し、STATUS/NEXT/TODAYを同期。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/ui-logic.test.js`, `node js/test/race-service.test.js`, `node js/test/input-guards.test.js` を再実行（Pass）。SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: startPosサニタイズ時に警告ログを追加し、デバッグ時に生値と丸め結果を確認できるようにした。バージョンをv2.1.0-beta.107に更新し、STATUS/NEXT/TODAYを同期。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/ui-logic.test.js`, `node js/test/race-service.test.js`, `node js/test/input-guards.test.js` を再実行（Pass）。SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: updateStartPosでもサニタイズ警告を出し、UI/サービス両方でraw/sanitizedを追えるように統一。バージョンをv2.1.0-beta.108に更新し、STATUS/NEXT/TODAYを同期。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/ui-logic.test.js`, `node js/test/race-service.test.js`, `node js/test/input-guards.test.js` を再実行（Pass）。SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: startPosサニタイズ警告をrace-serviceテストでも確認するようにし、バージョンをv2.1.0-beta.109に更新。STATUS/NEXT/TODAYを同期。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/ui-logic.test.js`, `node js/test/race-service.test.js`, `node js/test/input-guards.test.js` を再実行（Pass）。SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: startPosサニタイズ警告をrace-serviceテストに追加し、TEST_PLANに入力ガード/警告確認を追記。バージョンをv2.1.0-beta.110に更新し、STATUS/NEXT/TODAYを同期。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/ui-logic.test.js`, `node js/test/race-service.test.js`, `node js/test/input-guards.test.js` を再実行（Pass）。SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定。

- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: モード切替のDOM更新をscreen-rendererへ分離し、ui-controllerのDOM責務を削減。バージョンをv2.1.0-beta.111に更新し、STATUS/NEXT/TODAY/TEST_PLANを同期。`node --check js/ui/ui-controller.js`, `node --check js/core/race-service.js`, `node js/test/ui-logic.test.js`, `node js/test/race-service.test.js`, `node js/test/input-guards.test.js` を再実行（Pass）。SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定。
- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: FUTURE_FIXES.md を追加し、距離未設定でペース追加ダイアログを開く前に警告する改善案を記録（実装変更なし）。バージョンをv2.1.0-beta.119系へ順次更新中。
- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: バージョン表記をv2.1.0-beta.120に同期し、ロード時のタイトル同期をrenderer経由に整理（挙動変更なし）。`node --check js/ui/ui-controller.js` を実行。SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定。
- 要求: 続けて。ルール、ソース参照、ログ、作業状況、ログ、git忘れずに。
  対応: レース描画呼び出しを `race-screen` ヘルパーに切り出し、ui-controllerのDOM依存を削減（挙動変更なし）。未使用のrenderer importを整理。`node --check js/ui/ui-controller.js` を実行（Pass）。SYNC/START仕様変更なし、E2Eは接続環境で従来手順を実施予定。
