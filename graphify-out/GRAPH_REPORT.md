# Graph Report - Expense-Management-Project  (2026-11-08)

## Corpus Check
- Corpus is ~32,772 words - fits in a single context window. You may not need a graph.

## Summary
- 418 nodes · 706 edges · 32 communities (20 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 3,800 input · 620 output

## Community Hubs (Navigation)
- Android Core Navigation, Zoom & Dashboard
- Android WebView Host & Back Navigation
- Web App State, Pinch Zoom & Navigation
- Android Custom Category Management
- Web Custom Category Management
- MoMo Accessibility Payment Capture
- Android Monthly Budget & Ledger Zoom
- Web Monthly Budget & Ledger Zoom
- MoMo Accessibility Payment Capture
- Legacy Android RecyclerView Adapter
- Android Firestore Real-Time Sync & Persistence
- Web Firestore Real-Time Sync & Persistence
- Module Community 12
- Module Community 13
- MoMo Accessibility Payment Capture
- Module Community 15
- Module Community 16
- Module Community 17
- Module Community 18
- Android Instrumented Tests
- Module Community 22
- Module Community 23
- Android Unit Tests
- Module Community 28

## God Nodes (most connected - your core abstractions)
1. `renderBudget()` - 13 edges
2. `renderBudget()` - 13 edges
3. `MainActivity` - 12 edges
4. `WebAppBridge` - 12 edges
5. `normalizeAppData()` - 10 edges
6. `MomoAccessibilityService` - 10 edges
7. `normalizeAppData()` - 10 edges
8. `ExpenseAdapter` - 9 edges
9. `MomoNotificationService` - 9 edges
10. `initApp()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Expense Management Cross-Platform Architecture` --documents_android_host--> `MainActivity`  [EXTRACTED]
  README.md → Android-App/app/src/main/java/com/example/expensemanagement/MainActivity.kt
- `Android WebView HTML Shell & MoMo Auto-Import Panel` --embeds_brand_icon--> `Luminous Smart Wallet Brand Icon (SVG/Adaptive)`  [EXTRACTED]
  Android-App/app/src/main/assets/index.html → Web-App/public/icon-192.svg
- `Android WebView HTML Shell & MoMo Auto-Import Panel` --loaded_by_webview--> `MainActivity`  [EXTRACTED]
  Android-App/app/src/main/assets/index.html → Android-App/app/src/main/java/com/example/expensemanagement/MainActivity.kt
- `renderCharts()` --indirect_call--> `fmtMonthLabel()`  [INFERRED]
  Android-App/app/src/main/assets/assets/js/charts.js → Android-App/app/src/main/assets/assets/js/app.js
- `requestRemoveCategory()` --indirect_call--> `closeModal()`  [INFERRED]
  Android-App/app/src/main/assets/assets/js/categories.js → Android-App/app/src/main/assets/assets/js/transactions.js

## Import Cycles
- None detected.

## Communities (32 total, 12 thin omitted)

### Community 0 - "Android Core Navigation, Zoom & Dashboard"
Cohesion: 0.08
Nodes (31): adjustUiZoom(), applyChartThemeDefaults(), applyUiZoom(), _charts, closeSidebar(), fmtMonthLabel(), initAmountInputFormatting(), initApp() (+23 more)

### Community 1 - "Android WebView Host & Back Navigation"
Cohesion: 0.09
Nodes (10): MainActivity, OnBackPressedCallback, WebChromeClient, WebChromeClient, WebViewClient, WebViewClient, BroadcastReceiver, Release Changelog (v1.0.0 - v1.1.0) (+2 more)

### Community 2 - "Web App State, Pinch Zoom & Navigation"
Cohesion: 0.10
Nodes (25): adjustUiZoom(), applyChartThemeDefaults(), applyUiZoom(), _charts, closeSidebar(), fmtMonthLabel(), initAmountInputFormatting(), initApp() (+17 more)

### Community 3 - "Android Custom Category Management"
Cohesion: 0.15
Nodes (28): addCategory(), buildCategoryRow(), CATEGORY_TYPES, categoryHtml(), cloneDefaultCategories(), createCategoryId(), createEmptyAppData(), DEFAULT_CATEGORIES (+20 more)

### Community 4 - "Web Custom Category Management"
Cohesion: 0.15
Nodes (28): addCategory(), buildCategoryRow(), CATEGORY_TYPES, categoryHtml(), cloneDefaultCategories(), createCategoryId(), createEmptyAppData(), DEFAULT_CATEGORIES (+20 more)

### Community 6 - "Android Monthly Budget & Ledger Zoom"
Cohesion: 0.25
Nodes (18): adjustLedgerZoom(), applyLedgerZoom(), fitLedgerToScreen(), formatBudgetInput(), getCurrentYm(), getEffectiveBudget(), getRemainingBudgetMonths(), hasAnyBudgetForCategory() (+10 more)

### Community 7 - "Web Monthly Budget & Ledger Zoom"
Cohesion: 0.25
Nodes (18): adjustLedgerZoom(), applyLedgerZoom(), fitLedgerToScreen(), formatBudgetInput(), getCurrentYm(), getEffectiveBudget(), getRemainingBudgetMonths(), hasAnyBudgetForCategory() (+10 more)

### Community 8 - "MoMo Accessibility Payment Capture"
Cohesion: 0.18
Nodes (4): WebAppBridge, Luminous Smart Wallet Brand Icon (SVG/Adaptive), Android WebView HTML Shell & MoMo Auto-Import Panel, Web App HTML Shell & Mobile Bottom Nav

### Community 9 - "Legacy Android RecyclerView Adapter"
Cohesion: 0.17
Nodes (3): Expense, ExpenseAdapter, ExpenseViewHolder

### Community 10 - "Android Firestore Real-Time Sync & Persistence"
Cohesion: 0.32
Nodes (13): checkLegacyMigration(), commitPendingSave(), flushPendingSave(), getData(), getEmptyAppData(), getUserDocRef(), hideSyncIndicator(), loadAppData() (+5 more)

### Community 11 - "Web Firestore Real-Time Sync & Persistence"
Cohesion: 0.32
Nodes (13): checkLegacyMigration(), commitPendingSave(), flushPendingSave(), getData(), getEmptyAppData(), getUserDocRef(), hideSyncIndicator(), loadAppData() (+5 more)

### Community 12 - "Module Community 12"
Cohesion: 0.27
Nodes (9): applyChartRange(), fillMissing(), getMonthData(), getMonthRangeFromTo(), initChartDateRange(), monthDiff(), onPresetChange(), PIE_COLORS (+1 more)

### Community 13 - "Module Community 13"
Cohesion: 0.27
Nodes (9): applyChartRange(), fillMissing(), getMonthData(), getMonthRangeFromTo(), initChartDateRange(), monthDiff(), onPresetChange(), PIE_COLORS (+1 more)

### Community 14 - "MoMo Accessibility Payment Capture"
Cohesion: 0.29
Nodes (9): _addMomoTransaction(), initMomoSettings(), _momoProcessed, openAccessibilitySettings(), openNotifSettings(), processPendingMomoTransactions(), saveMomoDedup(), toggleMomoAutoAdd() (+1 more)

### Community 15 - "Module Community 15"
Cohesion: 0.44
Nodes (8): clearFilters(), closeModal(), deleteTransaction(), editTransaction(), openModal(), renderList(), setType(), submitTransaction()

### Community 16 - "Module Community 16"
Cohesion: 0.36
Nodes (6): getGreetingText(), onDashMonthChange(), renderDashboard(), renderDashDailyChart(), renderDashMiniChart(), renderDashPieChart()

### Community 17 - "Module Community 17"
Cohesion: 0.44
Nodes (8): clearFilters(), closeModal(), deleteTransaction(), editTransaction(), openModal(), renderList(), setType(), submitTransaction()

### Community 18 - "Module Community 18"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 22 - "Module Community 22"
Cohesion: 0.40
Nodes (3): auth, db, firebaseConfig

### Community 23 - "Module Community 23"
Cohesion: 0.40
Nodes (3): auth, db, firebaseConfig

## Knowledge Gaps
- **3 isolated node(s):** `PWA & Firestore Schema v2 Specification`, `Release Changelog (v1.0.0 - v1.1.0)`, `Web App HTML Shell & Mobile Bottom Nav`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 96 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MainActivity` connect `Android WebView Host & Back Navigation` to `MoMo Accessibility Payment Capture`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `PWA & Firestore Schema v2 Specification`, `Release Changelog (v1.0.0 - v1.1.0)`, `Web App HTML Shell & Mobile Bottom Nav` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Android Core Navigation, Zoom & Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.07665505226480836 - nodes in this community are weakly interconnected._
- **Why does `fmtMonthLabel()` connect `Android Core Navigation, Zoom & Dashboard` to `Module Community 12`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Should `Android WebView Host & Back Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.08846153846153847 - nodes in this community are weakly interconnected._
- **Why does `fmtMonthLabel()` connect `Web App State, Pinch Zoom & Navigation` to `Module Community 16`, `Module Community 13`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Should `Web App State, Pinch Zoom & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.09848484848484848 - nodes in this community are weakly interconnected._