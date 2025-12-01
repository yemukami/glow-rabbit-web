# SYNC/START 挙動仕様 (v2.1.0-beta.48)

> 作業開始前に必ず本ファイルと REMORSE_LOG.md を読み返すこと。変更の意図・リスクを明文化し、あいまいな点は人間に確認する。

## 目的
- 同期フェーズと START フェーズの責務を固定し、最小コマンド化と安全弁を両立する。
- stopRunner の高優先度送信で設定が消えるデグレを防ぐ。
- BLE 未接続時の無反応を避け、ユーザーに明示的に通知する。

## 現行フロー
- 同期フェーズ (`syncRaceConfigs`):
  - `prepareRacePlans` で runPlan を生成・初期化。
  - `sendInitialConfigs` でペーサーごとに色 (`commandSetColor`) とペース (`commandSetTimeDelay`) を送信。
  - 送信成功で `race.initialConfigSent = true`、`race.syncNeeded = false`。
- START フェーズ (`startRaceService`):
  - 忙殺ガード（他レース実行中）と pacer 有無をチェック。startPos をサニタイズ（負値→0）。
  - 送信キューは `BleCommandQueue` を使用。
  - オプション `sendStop`（デフォルト false）。true のときのみ START 前に `commandStopRunner` を高優先度で送信。
  - `prepareRacePlans` を再実行。
  - `resendConfig` もしくは `!initialConfigSent` の場合のみ `sendInitialConfigs` を送る（未送信時の安全弁）。
  - `sendStartWithPrelight` で startPos 位置のデバイスを先行点灯後、`commandStartRunner` を高優先度送信。
  - 送信本数をログ出力し、推定ラグを算出。
  - レース状態を `running` に遷移し、pacers の距離/タイムをリセット。
- ガード/UI:
  - BLE 未接続で同期/STARTを押すとアラート。
  - pacer が0件のレースは START 不可。
  - `syncNeeded` バッジを表示し、同期が必要な状態を可視化。

## 状態フラグ
- `race.initialConfigSent`: 初期設定送信済み。`sendInitialConfigs` で true、`resetRace` で false。
- `race.syncNeeded`: pacer 変更・距離変更・startPos変更などで true。同期完了または START で再送したときに false。
- `race.status`: ready / running / review / finished。開始・停止の責務が UI とサービスに分散している点に留意。
- `isSyncing`: デバイス通知処理で同期中の通知を無視するためのフラグ。

## コマンド責務
- **同期**: 色・ペース設定のみ送る。stopRunner は送らない。
- **START**: 先行点灯 + startRunner の最小セット。設定未送信の場合のみ初期設定を同梱する（安全弁）。デフォルトでは stopRunner を送らない。

## リスクと再発防止（REMORSE 再掲）
- stopRunner 高優先度送信はキューを消すため、設定がない状態で START すると光らない。
- START/同期の責務を曖昧にすると送信タイミングが揺れてデグレを招く。必ず仕様を固定してから実装変更する。

## テスト/チェックリスト
- 最低限実行:  
  - `node --check js/ui/ui-controller.js`  
  - `node --check js/core/race-service.js`  
  - `node --check js/core/race-sync-service.js`  
  - `node js/test/ui-logic.test.js`  
  - `node js/test/race-service.test.js`
- 変更前後で BLE 未接続ガードの挙動と syncNeeded 表示の手動確認を行う。

## 運用上の意識付け
- START/同期/stopRunner/ペース送信ロジックに手を入れる前に **必ず本ファイルと REMORSE_LOG.md を読むこと**。
- 責務変更（たとえば START デフォルトで stopRunner を送る等）は要件確認なしに行わない。判断が曖昧なら必ず人間に確認。
- 新しい最適化を入れる場合は先にテストを追加し、送信本数・順序の変化をログで可視化する。***
