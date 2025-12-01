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
