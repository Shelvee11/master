# 我的 PWA 设计规范

> 基于 4 款自用打卡类 PWA 的复盘：**Spendex**（记账）、**Habit**（习惯打卡）、**ProFast**（蛋白质+断食）、**跡**（日语学习计时）。
> 用途：以后新建同类 App 时直接照此模板开工，保持个人风格一致。
> 部署：GitHub Pages `shelvee11.github.io/master/<app>/`，iPhone 添加到主屏幕使用。

---

## 一、四个 App 一览

|      | Spendex                   | Habit                | ProFast                   | 跡                              |
| ---- | ------------------------- | -------------------- | ------------------------- | ------------------------------ |
| 功能   | 记账 + 旅行账本                 | 习惯打卡/计数              | 蛋白质摄入 + 16:8 断食           | 学习计时 + 足迹                      |
| 技术   | 原生 JS                     | 原生 JS                | 原生 JS（2026-07 由 React 重写） | 原生 JS                          |
| 导航   | 顶部 tab（记一笔/明细/旅行）         | 无 tab，单页纵向滚动         | header 内分段控件切换双模块         | 底部 tab + SVG 线性图标（首页/计时/统计/设置） |
| 字体   | 系统 -apple-system          | Inter (Google Fonts) | Inter (Google Fonts)      | Noto Sans SC (Google Fonts)    |
| 主色   | #3d52d5                   | #3d52d5              | #3d52d5                   | #4853a7（变体）                    |
| 数据导出 | CSV（navigator.share 分享面板） | JSON                 | JSON                      | CSV + ICS 日历事件                 |
| 特色交互 | 待确认/忽略开关、周饮食预算条           | 长按删除、GitHub 热力图      | iOS 滚轮时间选择器、食材库长按编辑       | 话题 combo box 联想、键盘弹起锁定布局       |

---

## 二、共同架构（我的标准模板）

**单文件 PWA，零构建**。每个 App 就是一个文件夹：

```
app-name/
├── index.html        # 全部 HTML + CSS + JS 内联，1200~1900 行
├── manifest.json
├── service-worker.js # 或 sw.js
└── icon-192.png / icon-512.png / apple-touch-icon.png
```

核心原则：

1. **本地优先**：所有数据存 localStorage，无后端、无账号、无网络请求（除字体/CDN）。
2. **数据主权**：必配「导出 + 导入」，导入时按内容指纹去重合并（如 `date_cat_amount` 拼 key 进 Set），先 confirm 再合并。
3. **数据迁移**：结构变更时在 init 里写一次性迁移代码，用 localStorage 存迁移版本号（见 ProFast `foods-migration`）。
4. **预置种子数据**：首次打开不留白，直接给默认习惯/食材库（`seedDefaults()`）。
5. **中文 UI**，header 副标题显示 `2026年7月4日` 式日期。

### iOS PWA 必备 meta（四个 App 完全一致）

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="AppName">
<meta name="theme-color" content="#3d52d5">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="manifest.json">
```

### Service Worker 标准模板

```js
const CACHE_NAME = 'appname-v1';   // 每次发版手动 +1
const BASE = '/master/app-name/';
const ASSETS = [BASE, BASE + 'index.html', BASE + 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
// network-first：在线永远拿最新版（发版即生效），离线回退到最近一次成功加载的缓存
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).then(r => {
      const clone = r.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
```

---

## 三、视觉系统（Design Tokens）

iOS 原生质感是我的统一审美：白卡片 + 浅灰底 + 细分隔线 + 磨砂 header，**无重阴影、无渐变、克制用色**。

### CSS 变量（三个 App 逐字节相同，直接复制）

```css
:root {
  --accent:  #3d52d5;   /* 品牌蓝紫 */
  --accent2: #5b6fe8;
  --green:   #2a9d5c;   /* 达标/收入/成功 */
  --red:     #e03e3e;   /* 超标/删除/支出警告 */
  --orange:  #d97706;   /* 支出金额（Spendex） */
  --label:   #1d1d1f;   /* 主文字 */
  --label2:  #6e6e73;   /* 次级文字 */
  --label3:  #adadb8;   /* 弱化文字/占位符 */
  --fill:    #f0f0f5;   /* 内嵌填充块 */
  --fill2:   #e8e8f0;
  --bg:      #f5f5f7;   /* 页面底色（苹果官网灰） */
  --bg2:     #ffffff;   /* 卡片 */
  --sep:     #e2e2e8;   /* 分隔线 */
  --radius:  16px;
}
```

### 固定手法

- `* { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }`
- **磨砂 header**：`background:rgba(245,245,247,0.9); backdrop-filter:saturate(180%) blur(20px);` + `padding-top:calc(env(safe-area-inset-top) + 14px)` + 底部 1px sep。
- **内容列**：`main { max-width:430px; margin:0 auto; display:flex; flex-direction:column; gap:12px; }`
- **卡片**：白底 + `border:1px solid var(--sep)` + `border-radius:16px` + `overflow:hidden`；卡片内列表行用 `border-bottom:1px solid var(--sep)`，`:last-child` 去掉。
- **卡片标题** `.card-label`：11\~12px、`uppercase`、`letter-spacing:0.06~0.08em`、label2/label3 色，放在卡片外上方。
- 数字一律 `font-variant-numeric: tabular-nums`；大数字加负 letter-spacing（-0.5px \~ -2px）。
- 按压反馈只用 `:active`（`background:var(--fill)` 或 `opacity:0.75; transform:scale(0.98~0.99)`），不做 hover。
- 图标用 **emoji**（分类、习惯、食材）；导航/功能图标用**内联 SVG 描边**（stroke 1.6\~2.2, round cap）。
- 底部留 `padding-bottom: calc(env(safe-area-inset-bottom) + 20px)`。

---

## 四、交互模式库（可直接搬的组件）

| 模式                | 做法                                                                                  | 出处                    |
| ----------------- | ----------------------------------------------------------------------------------- | --------------------- |
| **Toast**         | 顶部下落黑色圆角胶囊，`cubic-bezier(0.32,0.72,0,1)`，1.5\~1.8s 自动消失                             | 全部                    |
| **Bottom Sheet**  | 全屏遮罩 `rgba(0,0,0,0.25~0.35)` + 底部圆角面板 `translateY(100%)→0`，同款贝塞尔曲线；头部「取消 / 标题 / 完成」 | Habit、ProFast、跡       |
| **Action Sheet**  | iOS 风格：说明条 + 红色破坏按钮一组，「取消」独立一组                                                      | Habit、ProFast         |
| **居中小 Modal**     | 输入单个数字用（预算、计数、目标），input 大号加粗居中显示                                                    | Spendex、Habit、ProFast |
| **长按编辑/删除**       | pointerdown 500ms 计时器，`'fired'` 哨兵值防止误触发 click                                      | Habit、ProFast         |
| **分段控件 seg-ctrl** | `--fill` 底 + 白色浮起选中块 + 微阴影                                                          | Habit、ProFast         |
| **周导航**           | `‹ 6/29 – 7/5 ›` 圆形边框按钮，未来周 disabled                                                | Habit、ProFast、跡       |
| **周目标点阵 fweek**   | 一行 7 个圆点：绿✓达标 / 红✗未达 / 灰空 / 虚线未来，今日加 accent 描边；下方进度条                                | ProFast（蛋白+断食两处）      |
| **GitHub 热力图**    | 7 行 × N 周列，13px 格子、月份标签、少→多图例；配色统一 `#c8cde8 → #8b93cc → #5c68c4 → #3a44a0`          | Habit、跡               |
| **手写 SVG 图表**     | 不引图表库：柱状图（达标绿/未达蓝/无数据灰短条）、折线+面积图、目标虚线 + 右端标注                                        | ProFast、跡             |
| **快速记录网格**        | 3\~4 列 emoji 大按钮网格，点击弹数量 Modal，一次点按完成记录                                             | Spendex、ProFast       |
| **空状态**           | 灰字居中一句话，如「还没有记录，点击上方食物开始」                                                           | 全部                    |
| **iOS 滚轮时间选择**    | scroll-snap 双列 + 中央高亮条                                                              | ProFast               |
| **Combo box 联想**  | 输入框 + 下拉最近使用话题（按最近使用排序）                                                             | 跡                     |

### 破坏性操作

一律先确认：Spendex 用原生 `confirm()`，Habit/跡 用自定义 sheet。删除主体（习惯/行程）时明确告知会连带删除记录。

---

## 五、数据层约定

- localStorage key 用 app 前缀：`expense_records`、`habit-tracker-data`、`protein-records`、`fasting-records`、`jp-study-sessions`。

- 日期 key 统一 `YYYY-MM-DD`（`pad()` 手拼，**不要用 \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*****`toISOString`**——有时区坑，Spendex 里专门做了偏移修正）。

- id：`Date.now()` 或 `Date.now().toString(36)+random`。

- **导入语义**（ProFast 已实施，2026-07）：**唯独主数据（食材库）不碰**——它有精心维护的排序和分类，导入追加只会打乱；历史记录按天合并、按条目 id 去重（幂等，重复导入不产生重复），能这样做是因为记录条目冗余存储快照（foodName/protein），历史统计不依赖主数据；目标值/模式等轻量设置随备份恢复（换机场景一步到位）。

- **周起始日统一为周日**（与热力图行序、iOS 日历默认一致）。标准写法：

  ```js
  function getWeekStart(d) {
    const dt = new Date(d);
    dt.setDate(dt.getDate() - dt.getDay());   // getDay(): 周日=0
    dt.setHours(0, 0, 0, 0);
    return dt;
  }
  const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
  ```

- **导出统一走 \*\*\*\*\*\*\*\*****`shareOrDownload()`**（四个 App 已统一）：`navigator.canShare({files})` 时用 `navigator.share` 弹 iOS 分享面板一步直达；不支持或分享失败退回 `<a download>`；用户取消（`AbortError`）不触发下载。CSV 另需：加 BOM `﻿`（Excel 中文兼容），备注里的英文逗号替换为中文逗号防串列。

  ```js
  function shareOrDownload(content, filename, mime) {
    const file = new File([content], filename, { type: mime });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: filename })
        .catch(err => { if (!err || err.name !== 'AbortError') fallbackDownload(content, filename, mime); });
    } else {
      fallbackDownload(content, filename, mime);
    }
  }
  ```

- 持久化：模块级 `let` 状态 + 每类数据一个 `saveXxx()`，每次变更后显式调用（原 React 版的 `useEffect` 同步已随重写移除）。

---

## 六、两点已知踩坑（写进模板）

1. **iOS 键盘弹起顶乱布局**：跡 的方案——`body { position:fixed; height:var(--app-h) }` 首次加载锁定高度 + `focusin` 时 `window.scrollTo(0,0)`。有固定底部 tab bar 且页面有输入框时采用。**注意两个连带坑**（2026-07 在跡上实修）：① body 带 `transform` 时它会成为内部 `position:fixed` 元素的定位基准，底部 tab bar 实际钉在 body 底边；② 因此 `--app-h` 不能只在首次加载锁定——浏览器工具栏收展/旋转/后台恢复后视口变了，tab bar 会「上浮」或被裁掉半截。必须在 `resize`/`orientationchange`/`pageshow` 时刷新 `--app-h`（输入框聚焦期间跳过，键盘不算）。
2. **fixed header 高度不定**（安全区不同机型不同）：Spendex 在 init 里 JS 量 `offsetHeight` 再设 main 的 padding-top；跡 用 CSS 变量 `--header-h`。**更简单的是学 Habit/ProFast 用 ************************************`position:sticky`************************************，无需 JS。**

---

## 七、四个 App 不一致的地方（新项目的收敛决策）

| 分歧点                     | 现状                                                                          | 新项目怎么选                                                                                 |
| ----------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **框架**                  | ✅ 已统一：2026-07 起四个 App 全部原生 JS（ProFast 从 React UMD + Babel 重写，启动更快、零 CDN 依赖） | 默认原生 JS + innerHTML 整段重渲；除非状态复杂到手动重渲频繁出 bug 才考虑 React，且那时应上 Vite 构建而非 Babel standalone |
| **字体**                  | 系统字体 / Inter / Noto Sans SC 三种                                              | 推荐 **Inter + 系统 fallback**（Habit/ProFast 款）；离线时 Google Fonts 拉不到，fallback 必须写全         |
| **配色**                  | 跡 自成一套（#4853a7、冷紫灰 label、radius 14px、卡片带阴影）                                 | 工具类 App 用标准 #3d52d5 系；想给单个 App 独立气质时允许像跡这样整体换调，但**变量名结构不变**                            |
| **导航**                  | 顶部 tab / 无 tab / header 分段控件 / 底部 tab 四种                                    | ≤2 个视图：单页滚动或 seg-ctrl；≥3 个视图：底部 tab + SVG 图标（跡款最完整）                                    |
| **header 标题**           | ✅ 已统一：2026-07 起四个 App 标题全部 **accent 色**（改了 Habit/ProFast）                   | `header h1 { color: var(--accent) }`，weight 700\~800                                   |
| **导出格式**                | 格式仍分 CSV/JSON；✅ 导出通道已统一：全部走 `shareOrDownload()`（iOS 分享面板优先，见第五节）            | 表格型数据（流水）用 CSV，结构化嵌套（习惯+打卡）用 JSON；跡 的 ICS 日历导出是好点子可复用                                  |
| **周起始日**                | ✅ 已统一：2026-07 起四个 App 全部**周日**起（改了 Spendex 周预算和 ProFast 三处周视图）              | 固定**周日**起，用第五节的 `getWeekStart()`；`DAY_LABELS` 以「日」开头                                   |
| **SW 缓存策略**             | ✅ 已统一：2026-07 起四个 App 全部 **network-first + 动态回填缓存**（第二节模板）                  | 直接用第二节 SW 模板：发版即生效；离线回退到最近一次成功加载的版本                                                    |
| **manifest start\_url** | ✅ 已统一：2026-07 起全部绝对路径（跡改为 `/master/Japanese%20Study%20Timer/`，空格需 URL 编码）   | GitHub Pages 子目录部署用**绝对路径**更稳；SW 的 BASE 常量同理；新项目目录名避免用空格                               |
| **XSS 转义**              | ✅ 已统一：2026-07 起四个 App 都有 `esc()` 且覆盖全部用户输入插值（含 CSV 导入字段、自定义 emoji）          | 凡用户可输入的字符串进 innerHTML 一律 `esc()`；写进属性值（如 `value="..."`）也要转义                            |
| **原生对话框**               | Spendex/ProFast 混用 `alert/confirm/prompt`，Habit/跡 全自定义                      | 破坏性确认用自定义 action sheet；快速开发期 `confirm()` 可接受，`prompt()` 尽量换成居中 Modal                   |

---

## 八、新 App 起步 Checklist

1. [ ] 复制第三节 CSS 变量 + meta 模板 + SW 模板（network-first，BASE 写死绝对路径）
2. [ ] manifest：name/short\_name/theme\_color `#3d52d5`/icons 192+512/start\_url 绝对路径
3. [ ] 布局骨架：磨砂 sticky header（**accent 色** 700\~800 标题 + 灰色日期副标题）→ max-width 430px 卡片流 → （视图多则）底部 SVG tab bar
4. [ ] localStorage：带 app 前缀的 key + `loadJSON(key, fallback)` + 种子数据
5. [ ] 核心记录动线控制在 **2 次点按内**（emoji 网格 → 数量 Modal → toast）
6. [ ] 统计三件套按需选：周目标点阵 / 手写 SVG 柱状图 / GitHub 热力图（统一紫蓝色阶）
7. [ ] 数据管理卡片：导出 + 导入（去重合并 + confirm）+（可选）清除全部
8. [ ] 破坏性操作走 action sheet；列表项长按编辑/删除
9. [ ] 真机检查：safe-area 上下、键盘弹起、离线打开、SW 版本号是否 +1
10. [ ] 发布后在 `myPWA.md` 登记链接

