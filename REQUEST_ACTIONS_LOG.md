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
