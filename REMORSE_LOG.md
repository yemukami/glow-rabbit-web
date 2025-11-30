# 懺悔ログ

## 2025-11-30 (全削除時のランタイムエラー)
- 事象: デバイス全削除→同期で `Assignment to constant variable` が発生（isListDirty を直接再代入）。
- 原因: device-manager から import した `isListDirty` が const エクスポートであるのに、UI側で再代入を試みた。
- 対応: `markDeviceListDirty` を導入し、dirtyフラグの更新を専用関数経由に変更。clear時に保存＆dirty化を実施。
- 再発防止: 共有状態を直接再代入しない。mutator関数を用意する。変更後は `node --check` と対象機能の手動確認をセットで行う。

## 2025-11-30 (START時の0m遅れへのワークアラウンド)
- 事象: Glow-R #1 が0mではなく数m先で初点灯するように見える。fw側が startDevIdx を使わず RunnerPointer を初期化しないため、UIの設定が効かない。
- 原因: Glow-Cの startRunner(0x0007) はポインタ/開始位置をリセットせず、初回点灯までDelayがかかる仕様。UI側だけではポインタ位置を制御できない。
- 対応: START前に `commandStopRunner` を送りリセットし、さらに startDevIdx のデバイスに `commandMakeLightUp` で先行点灯（v2.1.0-beta.30）。startPosはfwが無視する可能性をコメントで明示。
- 再発防止/根本策: fw側で startDevIdx を尊重し RunnerPointer を初期化するのが筋。UI側の先行点灯は暫定。fw対応が必要なら別途PR/確認を行う。
