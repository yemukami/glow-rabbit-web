# Glow-Rabbit Web App - 可読性・保守性調査レポート

**調査日**: 2025-11-29
**対象バージョン**: v2.1.0-beta.3
**調査範囲**: 全ソースファイル (HTML/CSS/JS)

---

## 📊 総合評価

| 項目 | 評価 | 備考 |
|------|------|------|
| **アーキテクチャ** | ⭐⭐⭐⭐☆ (4/5) | ESMモジュール化は良好。一部責務分離不足 |
| **可読性** | ⭐⭐⭐☆☆ (3/5) | 関数が長大化、グローバル汚染あり |
| **保守性** | ⭐⭐⭐☆☆ (3/5) | 状態管理が分散、副作用が多い |
| **テスタビリティ** | ⭐⭐☆☆☆ (2/5) | DOM依存が強い、DI未使用 |
| **命名規則** | ⭐⭐⭐⭐☆ (4/5) | 概ね一貫性あり |

---

## 🔍 詳細分析

### 1. アーキテクチャ設計

#### ✅ 良い点
- **ESMモジュール化**: v2.0以降でモジュール分割が進んでいる
- **レイヤー分離**: `ui/`, `core/`, `ble/` の3層構造が明確
- **プロトコル抽象化**: `BluetoothCommunity` クラスでBLEコマンドをカプセル化

#### ⚠️ 改善余地

##### 1.1 状態の所在が不明確
```javascript
// 状態が4箇所に散在
js/ui/ui-controller.js:
  - expandedRaceId, editingPaces, modalState, elapsedTime (UI状態)

js/core/race-manager.js:
  - races[], activeRaceId (ビジネスロジック)

js/core/device-manager.js:
  - deviceList[], deviceSettings, deviceInteraction (デバイス状態)

localStorage:
  - 永続化データ
```

**問題点**: どれが「真実の源 (Source of Truth)」か不明確。UIとビジネスロジックの境界が曖昧。

**推奨**: 状態管理を一元化 (Flux/Reduxパターン、または単一Storeクラス)

##### 1.2 循環依存のリスク
```javascript
// ui-controller.js
import { races } from '../core/race-manager.js';

// race-manager.js
import { sendCommand } from '../ble/controller.js';

// 今後 race-manager が ui を import すると循環参照
```

**推奨**: 依存方向を一方向に (`UI → Core → BLE`)

---

### 2. コードの可読性

#### ⚠️ 主要な問題点

##### 2.1 超長大関数: `renderRace()` (ui-controller.js:275-438)
- **164行** の単一関数
- 条件分岐が深くネスト (最大5階層)
- HTML文字列生成、状態判定、イベントハンドリングが混在

**具体例**:
```javascript
function renderRace() {
    // 20行: データ検証
    // 60行: 非展開行のHTML生成
    // 80行: 展開行のペーサー制御UI
    // 40行: プログレスバー生成
    // 30行: ボタンエリア生成
}
```

**影響**:
- デバッグが困難
- 再利用不可能
- テスト不可能

**推奨**: 以下に分割
```javascript
renderRace() {
  ├─ renderCollapsedRow()
  ├─ renderExpandedRow()
  │   ├─ renderPacerControls()
  │   ├─ renderProgressBar()
  │   └─ renderActionButtons()
  └─ renderEmptyState()
```

##### 2.2 HTMLテンプレートのインライン文字列
```javascript
// ui-controller.js:223-233 (10行のHTML文字列)
tr.innerHTML = `
    <td><input type="time" class="input-cell" value="${r.time}" onchange="updateData(${r.id}, 'time', this.value)"></td>
    <td><input type="text" class="input-cell" value="${r.name}" onchange="updateData(${r.id}, 'name', this.value)"></td>
    ...
    <td><button class="btn-sm btn-danger" ... onclick="deleteRow(${r.id})">削除</button></td>
`;
```

**問題点**:
- XSS脆弱性のリスク (`${r.name}` 等に `<script>` が入る可能性)
- HTMLとロジックの混在で可読性低下
- `onclick` のインライン属性でデバッグ困難

**推奨**:
- Template literals を分離関数化
- `addEventListener` で動的バインド
- サニタイゼーション処理追加

##### 2.3 マジックナンバーの多用
```javascript
// ui-controller.js
const totalScale = (r.distance || 400) + 50;  // 50は何?
const PREP_MARGIN = 10;  // 10mはなぜ?
setTimeout(processQueue, 50);  // 50msの根拠は?
```

**推奨**: 定数として定義
```javascript
const CONFIG = {
  PROGRESS_BAR_PADDING_METERS: 50,
  PACE_COMMAND_PREPARATION_MARGIN: 10,
  COMMAND_QUEUE_INTERVAL_MS: 50,
};
```

---

### 3. 状態管理の問題

##### 3.1 グローバル変数の乱用
```javascript
// ui-controller.js (ファイルスコープ)
let expandedRaceId = null;
let editingPaces = {};
let raceInterval = null;
let elapsedTime = 0;
let modalState = { ... };
```

**問題点**:
- 複数のレース同時実行が不可能
- 状態の予測不可能な変更
- テスト時のモック化困難

**推奨**:
```javascript
class RaceUIState {
  constructor() {
    this.expandedRaceId = null;
    this.editingPaces = new Map();
    this.activeRaceTimer = null;
    this.elapsedTime = 0;
  }
  reset() { ... }
}
```

##### 3.2 副作用の多さ
```javascript
// addNewRow() の例
function addNewRow() {
    races.push({...});  // グローバル配列を直接変更
    saveRaces();        // 副作用1: localStorage書き込み
    renderSetup();      // 副作用2: DOM操作
}
```

**問題点**: 関数呼び出しだけで3つの副作用が発生し、予測困難。

**推奨**: 関数型アプローチ
```javascript
function createNewRace(currentRaces) {
  return [...currentRaces, { ... }];  // 新しい配列を返す
}

// 呼び出し側で副作用を制御
races = createNewRace(races);
saveRaces(races);
renderSetup(races);
```

---

### 4. 命名規則

#### ✅ 良い点
- 関数名は動詞始まりで一貫 (`renderRace`, `updateData`, `sendCommand`)
- ブール値は `is` / `has` プレフィックス (`isConnected`, `isListDirty`)

#### ⚠️ 改善余地

##### 4.1 省略形と冗長性の混在
```javascript
// 省略
const tb = document.getElementById('setup-tbody');  // tb は何?
const r = races.find(x=>x.id===id);  // r, x が不明瞭
const p = r.pacers[i];  // p は pacer?

// 冗長
updateReplaceModalUI()  // "Update" + "Modal" + "UI" は重複
```

**推奨**: 中間的な長さ
```javascript
const tbody = document.getElementById('setup-tbody');
const race = races.find(r => r.id === id);
const pacer = race.pacers[index];

// または関数名を簡潔に
updateReplaceModal()
```

##### 4.2 動詞の選択が不統一
```javascript
renderRace()     // 画面描画
updateData()     // データ更新
saveRaces()      // 保存
fillWithDummy()  // 埋める
```

**推奨**: CRUD に統一
- `create`, `read`, `update`, `delete`
- または `render`, `save`, `load`, `remove`

---

### 5. 関数の責務

##### 5.1 単一責任原則の違反例

**`startRaceWrapper()` (ui-controller.js:440-502)**
```javascript
function startRaceWrapper(id) {
    // 1. バリデーション
    if(activeRaceId && activeRaceId !== id) return alert(...);

    // 2. ビジネスロジック (runPlan 生成)
    r.pacers.forEach(p => {
        if (!p.runPlan) {
            p.runPlan = PaceCalculator.createPlanFromTargetTime(...);
        }
    });

    // 3. BLE通信
    sendCommand(BluetoothCommunity.commandSetColor(...));
    sendCommand(BluetoothCommunity.commandSetTimeDelay(...));

    // 4. 状態更新
    r.status = 'running';
    r.pacers.forEach(p => { p.currentDist=0; });

    // 5. 永続化
    saveRaces();

    // 6. UI更新
    renderRace();

    // 7. タイマー起動
    raceInterval = setInterval(() => updateState(r), 100);
}
```

**問題**: 7つの責務が1関数に集中 → デバッグ困難、テスト不可能

**推奨**: 責務を分離
```javascript
// UI Controller
function startRaceWrapper(id) {
    const race = validateRaceStart(id);
    const preparedRace = RaceManager.prepareRaceStart(race);
    BLEController.sendRaceConfig(preparedRace);
    UIState.startRaceTimer(preparedRace);
}
```

---

### 6. エラーハンドリング

##### 6.1 エラーが握りつぶされる
```javascript
// ble/controller.js:85-89
} catch (error) {
    console.error("Write Error:", error);
    if(error.message.includes("Timeout")) console.warn("Command timeout");
    resolve();  // ⚠️ エラーでも resolve → 呼び出し側がエラーを検知できない
    reject(error);  // この行は実行されない
}
```

**問題**: BLE通信エラーが無視され、レース開始に失敗しても気づかない。

**推奨**:
```javascript
} catch (error) {
    console.error("Write Error:", error);
    reject(error);  // 呼び出し側にエラー伝播
}
```

##### 6.2 try-catch の不在
```javascript
// device-manager.js:46-58
export function addDeviceToList(mac) {
    const maxDevices = Math.ceil(deviceSettings.totalDistance / deviceSettings.interval);
    // ⚠️ totalDistance が 0 だと Infinity になる
    // ⚠️ mac が null だと split エラー
}
```

**推奨**: ガード節追加
```javascript
export function addDeviceToList(mac) {
    if (!mac || typeof mac !== 'string') {
        throw new Error('Invalid MAC address');
    }
    if (deviceSettings.totalDistance <= 0) {
        throw new Error('Total distance must be positive');
    }
    // ...
}
```

---

### 7. テスタビリティ

##### 7.1 DOM依存が強い
```javascript
// ui-controller.js:217
function renderSetup() {
    const tb = document.getElementById('setup-tbody');
    if(!tb) return;  // ⚠️ DOM存在前提 → 単体テスト不可
    tb.innerHTML = '';
    // ...
}
```

**問題**: ブラウザ環境必須。Node.js 単体テストが困難。

**推奨**: View と Logic を分離
```javascript
// Pure Function (テスト可能)
function generateSetupTableHTML(races) {
    return races.map(r => `<tr>...</tr>`).join('');
}

// DOM操作 (薄いラッパー)
function renderSetup() {
    const tbody = document.getElementById('setup-tbody');
    if (tbody) {
        tbody.innerHTML = generateSetupTableHTML(races);
    }
}
```

##### 7.2 依存性注入 (DI) の不在
```javascript
// race-manager.js
import { sendCommand } from '../ble/controller.js';

export async function sendRaceConfig(race) {
    // sendCommand が直接呼ばれる → モック不可
    await sendCommand(BluetoothCommunity.commandSetColor(...));
}
```

**推奨**:
```javascript
export async function sendRaceConfig(race, commandSender = sendCommand) {
    await commandSender(BluetoothCommunity.commandSetColor(...));
}

// テスト時
const mockSender = jest.fn();
sendRaceConfig(race, mockSender);
expect(mockSender).toHaveBeenCalled();
```

---

### 8. ドキュメンテーション

#### ✅ 良い点
- `pace-calculator.js` に JSDoc あり
- `.codex/docs/` にアーキテクチャドキュメント整備

#### ⚠️ 改善余地

##### 8.1 関数コメントの欠如
```javascript
// ui-controller.js:440
function startRaceWrapper(id) {  // 何をする関数?引数は?
```

**推奨**: JSDoc 追加
```javascript
/**
 * レースを開始し、BLE通信でGlow-Cに設定を送信する
 * @param {number} id - レースID
 * @throws {Error} 他のレースが実行中の場合
 */
function startRaceWrapper(id) {
```

##### 8.2 コメントと実装の乖離
```javascript
// device-manager.js:60-64
export function expandListToIndex(index) {
    while(deviceList.length <= index) {
        deviceList.push({ mac: DUMMY_MAC, id: deviceList.length+1, status:'dummy' });
    }
}
```

コメントなし。関数名から「拡張する」ことは分かるが、**ダミーで埋める**仕様は読まないと分からない。

---

### 9. パフォーマンス

##### 9.1 不要な再レンダリング
```javascript
// ui-controller.js:501
raceInterval = setInterval(() => updateState(r), 100);

function updateState(race) {
    // 100ms ごとに以下を実行
    elapsedTime += 0.1;
    race.pacers.forEach(p => {
        // 距離更新
        // DOM更新 (getElementById を6回/pacer)
        const headEl = document.getElementById(`pacer-head-${p.id}`);
        const estEl = document.getElementById(`pacer-est-${p.id}`);
        // ...
    });
}
```

**問題**: 4人のペーサーで 100ms × 24回/秒 = 240回/秒 の DOM操作

**推奨**:
- Virtual DOM (React/Vue) 採用
- または差分更新のみ実行

##### 9.2 不要な計算の繰り返し
```javascript
// ui-controller.js:387-388 (renderRace内)
let maxDist = Math.max(0, ...race.pacers.map(p=>p.currentDist||0));
let fillPct = Math.min((maxDist / totalScale) * 100, 100);

// updateState 内でも同じ計算 (line 599-601)
let maxDist = 0;
if(race.pacers && race.pacers.length > 0)
    maxDist = Math.max(0, ...race.pacers.map(p=>p.currentDist||0));
```

**推奨**: 計算結果をキャッシュ

---

### 10. セキュリティ

##### 10.1 XSS 脆弱性
```javascript
// ui-controller.js:313
<strong style="font-size:16px;">${r.time} ${r.name}</strong>
```

`r.name` にユーザー入力 (`<script>alert('XSS')</script>`) が入る可能性。

**推奨**: サニタイゼーション
```javascript
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;',
        '"': '&quot;', "'": '&#39;'
    })[m]);
}

innerHTML = `<strong>${escapeHTML(r.name)}</strong>`;
```

---

## 📋 優先度別改善提案

### 🔴 高優先度 (即座に対処すべき)
1. **セキュリティ**: HTML エスケープ処理追加 (ui-controller.js 全体)
2. **バグリスク**: エラーハンドリング修正 (ble/controller.js:85-89)
3. **保守性**: `renderRace()` の分割 (164行 → 20行以下の関数群へ)

### 🟡 中優先度 (次フェーズで対処)
4. **可読性**: マジックナンバーを定数化
5. **テスタビリティ**: Pure Function 分離 (View/Logic分離)
6. **状態管理**: グローバル変数をクラス化

### 🟢 低優先度 (余裕があれば)
7. **パフォーマンス**: Virtual DOM 導入検討
8. **ドキュメント**: JSDoc 追加
9. **命名**: 変数名の統一ルール策定

---

## 📈 リファクタリング効果の試算

| 項目 | 現状 | 改善後 (想定) |
|------|------|---------------|
| 最長関数の行数 | 164行 | 20行以下 |
| テストカバレッジ | 0% | 60% 以上 |
| XSS脆弱性 | 高リスク | 対策済み |
| 新機能追加時間 | 2-3日 | 0.5-1日 |

---

## 🎯 結論

**現行コードは「動作する」が「保守しやすい」とは言えない状態**。
ESMモジュール化という良い基盤はあるが、以下が課題:

1. **UI層が肥大化** (ui-controller.js が 974行)
2. **責務の分離不足** (1関数で7つの仕事)
3. **状態管理の分散** (真実の源が曖昧)

**推奨アプローチ**:
- フルリライトではなく、**段階的リファクタリング**
- 高優先度3項目から着手
- テストコード整備を並行実施

---

## 📌 参考資料

### コード行数統計
```
ui-controller.js:    974行 (うち renderRace: 164行, startRaceWrapper: 63行)
device-manager.js:   153行
race-manager.js:      77行
ble/controller.js:    95行
ble/protocol.js:     206行
pace-calculator.js:  106行
index.html:          193行
style.css:           246行

合計: 約2,050行
```

### 技術的負債の定量化
- **関数複雑度**: Cyclomatic Complexity 推定 15+ (renderRace)
- **結合度**: 高 (UI層が Core層と BLE層に強結合)
- **凝集度**: 中 (一部の関数で責務が混在)

---

**調査者**: Claude (Sonnet 4.5)
**調査期間**: 2025-11-29
**ファイルバージョン**: 1.0
