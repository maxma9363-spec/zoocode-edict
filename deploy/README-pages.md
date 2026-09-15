# Demo 静态站点部署说明（GitHub Pages）

> 兵部 · 基础设施与部署运维
> 适用对象：zoocode-edict 仓库内 `demo/`（Deepwater Horizon 事件档案静态 Demo）
> 文档状态：**已产出部署配置；线上发布尚未生效，需用户手动执行 3 步（见第 4 节）**

---

## 1. 部署方案取舍

### 采用方案A：GitHub Actions + `demo/` 直接作为站点根

| 维度 | 方案A（Actions，从 `demo/` 发布） | 方案B（分支 `/docs` 目录发布） |
| --- | --- | --- |
| 文件侵入性 | **零侵入**：`demo/` 原地不动 | 需把 `demo/` 内容复制/移动到 `docs/`，产生重复副本 |
| 站点根路径 | `demo/` 即站点根，`index.html` 落在 `/` | `/docs` 内容成为站点根，但源码目录多一份拷贝 |
| 维护成本 | 只需维护一处源文件，推送即发布 | 两份副本易漂移，需人工同步 |
| 与本仓约定 | 符合「`demo/` 属工部产物、不复制不改动」的约束 | 与前述约束冲突 |
| 适用性 | 推荐（本次采用） | 备选（若组织策略禁止 Actions 发布时回退使用） |

**决策：采用方案A。** 理由：

1. 满足硬约束——`demo/` 下数据与前端逻辑属工部产物，兵部不得改动；方案A 通过 `actions/upload-pages-artifact` 的 `path: demo` 参数让 `demo/` 直接成为站点根，**不产生任何副本**。
2. 演示 URL 干净：站点根即 Demo 首页，访问 `https://maxma9363-spec.github.io/zoocode-edict/` 直接打开 Demo，无额外路径段。
3. 避免方案B 的双份文件漂移风险（后续工部若更新 `demo/`，方案B 需人工同步 `docs/`，易漏）。

方案B 仅在「仓库禁止使用 Actions 部署 Pages」时才回退启用，届时做法为：将 `demo/` 内容复制到 `docs/`，Settings → Pages → Source 选 `Deploy from a branch` → 分支 `main`、目录 `/docs`。

### 已落盘的部署配置

- [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) — Pages 发布工作流

工作流要点：

- 触发：`push` 到 `main` 分支 + `workflow_dispatch`（手动触发）
- 权限：`contents: read`、`pages: write`、`id-token: write`（最小权限集）
- 并发：`group: pages` + `cancel-in-progress: true`（避免部署竞态）
- 步骤：`actions/checkout@v4` → `actions/configure-pages@v5` → `actions/upload-pages-artifact@v3`（`path: demo`）→ `actions/deploy-pages@v4`

---

## 2. 演示 URL

| 用途 | 地址 | 当前状态 |
| --- | --- | --- |
| **线上演示（Pages）** | `https://maxma9363-spec.github.io/zoocode-edict/` | ⏳ 待用户开启 Pages 并推送后生效 |
| 仓库内相对路径兜底 | `demo/index.html`（浅克隆后本地打开时须经 HTTP 服务，见第 3 节） | ✅ 本机已验证可用 |

> **诚实标注**：本机环境未执行 `git push`，也未有权限在 GitHub 仓库设置中开启 Pages，因此**线上 URL 当前尚未激活**，不是「已部署成功」。第 4 节列出使其生效的 3 个手动步骤；第 5 节区分「已实测」与「未验证」项。

---

## 3. 本地预览保障（已实测）

### 推荐命令（端口 8000，与 `demo/app.js` 降级提示文案一致）

```bash
cd "/Users/maxma/Documents/AI workspace/zoocode-edict/zoocode-edict"
python3 -m http.server 8000 --directory demo
# 浏览器访问 http://localhost:8000/
```

### 若 8000 被占用

```bash
python3 -m http.server 8017 --directory demo
# 浏览器访问 http://localhost:8017/
```

### 重要：不要用 `file://` 直接打开

`demo/app.js` 通过 `fetch()` 加载 `./data/findings.json`；浏览器对 `file://` 协议下的 `fetch()` 施加同源限制，会导致数据加载失败。`demo/app.js` 第 325–332 行已内置该场景的降级提示。

---

## 4. 需要用户在 GitHub 上手动执行的步骤

以下步骤兵部在本机环境**无权限执行**（涉及远端仓库设置与推送），必须由用户在 GitHub 侧完成，Pages 才会真正上线：

### 步骤 1 · 提交并推送本地产物

本次新增/未跟踪的文件需先入版本库并推送至 `main`：

```bash
git add .github/workflows/pages.yml deploy/README-pages.md demo/
git commit -m "ci(pages): deploy demo/ via GitHub Actions"
git push origin main
```

> 说明：侦察时 `git status` 显示 `demo/` 与 `zoocode-edict.code-workspace` 处于未跟踪状态，`demo/` 尚未进入版本库——**这也是线上 URL 目前不可用的直接原因之一**。

### 步骤 2 · 开启 Pages 并使用 Actions 作为来源

1. 打开仓库 `https://github.com/maxma9363-spec/zoocode-edict`
2. 进入 **Settings** → 左侧 **Pages**
3. 在 **Build and deployment** → **Source** 下拉框中选择 **GitHub Actions**
   （若当前为 `Deploy from a branch`，必须改选 `GitHub Actions`，否则本 workflow 的部署步骤不会接管站点）

### 步骤 3 · 观察部署结果

1. 进入仓库 **Actions** 标签页，等待 `Deploy Demo to GitHub Pages` 工作流运行完成（约 1 分钟内）
2. 工作流 `deploy` job 的 environment 会显示站点地址；访问 `https://maxma9363-spec.github.io/zoocode-edict/` 应打开 Demo 首页
3. 首次开启后线上生效可能有 1–5 分钟 CDN 传播延迟

---

## 5. 验证结果

### 5.1 已实测项（本机，2026-09-15）

**（a）本地静态可用性检查** — 由 `python3 -m http.server` 提供 HTTP 服务后 curl 实测：

```
=== HTTP 状态码实测 (localhost:8017) ===
/                      -> HTTP 200  3248 bytes  0.004044s
/index.html            -> HTTP 200  3248 bytes  0.000674s
/styles.css            -> HTTP 200  8102 bytes  0.000979s
/app.js                -> HTTP 200  12974 bytes  0.000759s
/data/findings.json    -> HTTP 200  25635 bytes  0.000816s
--- 负向用例（应 404）---
/__missing__.txt       -> HTTP 404
/data/nope.json        -> HTTP 404
--- 内容校验 ---
index title: <title>Deepwater Horizon — Causes, Timeline & Key Figures</title>
findings.json 顶层键: dict ['title', 'summary', 'causes', 'timeline', 'figures', 'sources']
--- 关闭服务 ---
8017 已释放（无遗留后台进程）
```

**结论**：5 条关键路径全部 `HTTP 200`，**0 个 404**；负向用例正确返回 `404`（说明服务确实按路径解析，非无差别 200 兜底）；`findings.json` 可被解析为合法 JSON 且结构完整（含 `title`/`summary`/`causes`/`timeline`/`figures`/`sources`）；实测结束后端口已释放，无遗留后台进程。

**（b）资源引用方式核验**（兵部独立复核）

- `demo/index.html` 第 8 行：`<link rel="stylesheet" href="./styles.css" />` — 相对路径
- `demo/index.html` 第 66 行：`<script src="./app.js"></script>` — 相对路径
- `demo/app.js` 第 8 行：`var DATA_URL = "./data/findings.json";` — 相对路径

**相对路径结论**：三项引用均为 `./` 开头的相对路径，站点根变为 `demo/` 时解析结果不变（`/styles.css`、`/app.js`、`/data/findings.json`），与第 5.1(a) 实测路径一致 —— 这正是方案A「`demo/` 作为站点根」可行性的依据。

**（c）零 CDN 外链核验**

对 `demo/` 全目录执行正则扫描（`https?://`、`//cdn`、`unpkg`、`jsdelivr`、`googleapis`、`cdnjs`）：

- 命中项全部位于 `demo/data/findings.json` 第 253–361 行的 `sources[].url` 字段，属**引用来源数据**（NOAA / govinfo / BSEE / CSB / EPA / congress.gov 等官方报告链接），**不是页面加载依赖**；
- `demo/app.js` 第 330 行命中为 `file://` 降级提示中的文案字符串 `http://localhost:8000/`；
- `demo/index.html` 与 `demo/styles.css`：**零命中**。

**结论**：Demo 运行期不拉取任何外部 CSS/JS/字体资源，页面可离线自持渲染，无第三方 CDN 单点故障风险。

**（d）站点体积**

| 路径 | 体积 |
| --- | --- |
| `demo/`（总计） | 56 KB |
| `demo/data/` | 28 KB |
| `demo/index.html` | 3,248 B |
| `demo/styles.css` | 8,102 B |
| `demo/app.js` | 12,974 B |
| `demo/data/findings.json` | 25,635 B |

站点总量约 56 KB，**远低于 GitHub Pages 单站点 1 GB 软上限**，无体积风险。

**（e）仓库远端与分支**

```
origin  https://github.com/maxma9363-spec/zoocode-edict.git (fetch)
origin  https://github.com/maxma9363-spec/zoocode-edict.git (push)
当前分支: main
```

远端与默认分支 `main` 与预期一致，workflow 的 `branches: [main]` 触发条件与之一致。

### 5.2 未验证项（本环境无法完成，诚实标注）

| # | 未验证项 | 原因 | 影响 / 缓解 |
| --- | --- | --- | --- |
| 1 | **线上 URL 可达性** | 无仓库 Settings 权限、未执行推送，Pages 未开启 | 第 4 节步骤 1–3 完成后即可访问；**当前不得对外宣称已上线** |
| 2 | **Actions 工作流实际运行结果** | 同上，workflow 未在 GitHub Runner 上执行过 | YAML 语法已本地校验（见 5.3）；运行时依赖官方 Action 版本号 |
| 3 | **`actions/configure-pages@v5` 等版本号可用性** | 未联网核对各 Action 最新版本 | 均为主流稳定的主版本标签；若 Runner 报版本不存在，改 `@v4`/`@v3` 即可 |
| 4 | **Pages 站点 HTTPS 证书签发** | 依赖 GitHub 侧自动签发 | GitHub Pages 默认自动签发 Let's Encrypt 证书，通常开启后数分钟生效 |
| 5 | **浏览器端真实渲染（DOM/交互）** | 兵部仅做 HTTP 层与静态资源层检查 | 第 3 节本地命令可人工目视确认；属刑部/工部验收范畴 |

### 5.3 workflow 语法校验（已实测）

本机 `python3` 环境**未安装 PyYAML**，改用 macOS 自带 Ruby 的 YAML 解析器校验，解析通过：

```
name       : Deploy Demo to GitHub Pages
permissions: {"contents"=>"read", "pages"=>"write", "id-token"=>"write"}
concurrency: {"group"=>"pages", "cancel-in-progress"=>true}
runs-on    : ubuntu-latest
environment: {"name"=>"github-pages", "url"=>"${{ steps.deployment.outputs.page_url }}"}
steps      : 4
   1. actions/checkout@v4
   2. actions/configure-pages@v5
   3. actions/upload-pages-artifact@v3
   4. actions/deploy-pages@v4
artifact path: demo
```

**关于 `on:` 键的解析说明（重要，避免误判）**：Ruby 的 YAML 解析器实现为 YAML 1.1 规范，会把裸键 `on` 按布尔真值处理，故其键名显示为 `true`。已做定点确认，该键的**值与语义完整无损**：

```
布尔键 true 对应值: {"push"=>{"branches"=>["main"]}, "workflow_dispatch"=>nil}
```

即 `on.push.branches = [main]` 与 `on.workflow_dispatch` 均被正确解析。GitHub Actions 使用符合 YAML 1.2 规范的解析器，`on` 会被正确识别为字符串键（这也是所有官方 workflow 文件的通用写法），**不存在兼容性问题**。文本层面亦已核对：`on:` 下挂 `push: branches: [main]` 与 `workflow_dispatch:`，缩进为 2 空格，结构正确。

**结论**：workflow 文件语法无误，4 个步骤、权限集、并发组、artifact 路径（`demo`）与 environment 配置均符合预期。

---

## 6. 回滚方案

### 6.1 快速回滚（推荐，30 秒内完成，不影响 `demo/`）

**停止发布，但保留配置文件：**

1. 打开仓库 **Settings** → **Pages**
2. 将 **Source** 从 `GitHub Actions` 切回 **None**
3. 站点立即停止发布；已发布的页面在短暂 CDN 缓存后失效

**完全回滚（删除部署配置）：**

```bash
git rm .github/workflows/pages.yml deploy/README-pages.md
git commit -m "revert(pages): remove Pages deployment workflow"
git push origin main
```

### 6.2 回滚影响面

| 对象 | 回滚后状态 |
| --- | --- |
| `demo/` 目录及其全部文件 | **完全不受影响** —— 方案A 全程未复制、未移动、未修改 `demo/` 内任何文件，回滚仅是移除「发布动作」，源文件原样保留，本地预览（第 3 节）照常可用 |
| `README.md` / `README.zh-CN.md` | 不受影响（本任务未改动） |
| 仓库其他文件 | 不受影响 |
| 已删除的 workflow | 若日后需恢复，重新执行第 4 节步骤 2 即可再次发布 |

### 6.3 紧急情况处置

- **误发布敏感内容**：立即执行 6.1 的 Settings 切回 `None`，Pages 站点随即下线；随后在仓库设置中处理敏感文件与提交历史。
- **部署失败反复重试**：在 Actions 页面手动 `Cancel workflow`，或临时将 `pages.yml` 的 `on.push` 移除，仅保留 `workflow_dispatch`，改为手动发布。

---

## 7. 附录：完整本地验证命令（可复现）

```bash
cd "/Users/maxma/Documents/AI workspace/zoocode-edict/zoocode-edict" && \
(python3 -m http.server 8017 --directory demo >/tmp/zoocode-pages-http.log 2>&1 & echo $! > /tmp/zoocode-pages-http.pid) && \
sleep 1.5 && \
for p in / /index.html /styles.css /app.js /data/findings.json; do \
  printf "%-22s -> " "$p"; \
  curl -s -o /dev/null -w "HTTP %{http_code}  %{size_download} bytes\n" "http://localhost:8017$p"; \
done && \
printf "%-22s -> " "/__missing__.txt"; \
curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://localhost:8017/__missing__.txt"; \
kill "$(cat /tmp/zoocode-pages-http.pid)"
```

该命令为单条串联命令，自带进程 PID 记录与末尾 `kill`，**不会遗留后台进程**。

---

## 8. 职责边界声明

- 本任务**未修改** `demo/` 下任何文件（数据与前端逻辑属工部产物）
- 本任务**未修改** `README.md` / `README.zh-CN.md`（属阶段4 礼部职责）
- 本任务**未执行**任何破坏性 git 操作（无 `push --force`、无 `reset`、无删除）；git 操作仅限只读侦察（`status` / `log` / `remote -v` / `branch`）
- 工作区根目录的 `zoocode-edict.code-workspace` 处于未跟踪状态且未被 `.gitignore` 覆盖，**兵部仅记录，未纳入本任务范围**
