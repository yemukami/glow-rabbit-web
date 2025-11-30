# 懺悔ログ

## 2025-11-30 (全削除時のランタイムエラー)
- 事象: デバイス全削除→同期で `Assignment to constant variable` が発生（isListDirty を直接再代入）。
- 原因: device-manager から import した `isListDirty` が const エクスポートであるのに、UI側で再代入を試みた。
- 対応: `markDeviceListDirty` を導入し、dirtyフラグの更新を専用関数経由に変更。clear時に保存＆dirty化を実施。
- 再発防止: 共有状態を直接再代入しない。mutator関数を用意する。変更後は `node --check` と対象機能の手動確認をセットで行う。
