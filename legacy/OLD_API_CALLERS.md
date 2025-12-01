# 旧API呼び出し元メモ (退避用)

- `js/core/race-manager.js` の旧API: `sendRaceConfig` / `sendStartRace` / `sendStopRace`
- 旧呼び出し元:
  - `js/ui/ui-controller.js` で import していたが、`startRaceService` / `sendStopRunner` / `syncRaceConfigs` に置き換え済み（v2.1.0-beta.48以降のリファクタ）。
- 復旧が必要な場合:
  - 実装は `js/core/legacy/race-manager-legacy.js` に退避済み。**新規コードでの直接利用は禁止**。
  - 使う場合は理由とテストを明記し、現行仕様（同期/START分離、安全弁）と衝突しないかを必ず確認すること。
