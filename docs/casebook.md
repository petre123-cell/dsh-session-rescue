# DSH 崩溃病历库（casebook）

> 面向**中文用户优先**的 DSH 崩溃病历库：把散落的真实事故收成「症状 → 原因 → 确定性动作」三段式病历。
>
> 汇编：2026-10-26，petre123（细胞）。AI 生成初稿，出处逐条标注，可溯源。
> 修订：2026-10-27 —— 撤回早前「全网没有任何公开解法汇总」的说法：同期已存在多个同类/邻居项目（见文末延伸阅读），检索口径与盲区见下方声明框。

## 检索口径与盲区（先小人后君子，截至 2026-10-27）

- **已覆盖**：GitHub 站内搜索（deepseek-ai/deepseek-harness 与 dsh-tauri/deepseek-harness-desktop 的 issue/PR，关键词 corrupt / crash / session）、GitHub 生态仓库巡检（修复/抢救/备份类）、sandbaseai/deepseek-harness-handbook、dshbase.com 排错板块、linux.do（标题级）、掘金、知乎、npm 生态
- **未覆盖/不可搜**：V2EX（检索失败）、Reddit（未见相关帖）、Discord / QQ 群 / Twitter / 小红书 / 贴吧（登录墙或无公开检索入口）
- **规则**：本库不写「全网唯一 / 首发」；只写「截至某日、用某关键词、在哪些渠道未见」。新证据出现 → 改一行状态，那叫更新，不叫翻车。

## 症状速查索引 —— 按报错找病历，不按编号

> 手忙脚乱时先拿一页纸版：[FIRST-AID-CHECKLIST.md](FIRST-AID-CHECKLIST.md)

| 你看到的 | 去哪条 |
|---|---|
| 会话打不开 / 只读出 header / `corrupt session log` | #001 |
| 装完插件起不来（插件 import 失败） | #002 |
| 后端闪退、事件日志 ECONNRESET | #003 |
| DSH 内点链接空白 / ERR_CONNECTION_RESET | #004 |
| 手改 yml 越改越崩 | #005 |
| 想重装又怕丢数据 | #006 |
| 欢迎页 Web authentication failed / 官方恢复弹窗 | #007 |
| `JavaScript heap out of memory`、退出码 134 | #008 |
| `ERR_HTTP2_INVALID_SESSION` | #009 |
| 中文 Windows 卡 "Loading plugins"、退出码 1 | #010 |
| Linux 启动即崩、`ENOSPC: file watchers` | #011 |
| 启动抛栈 / `profile does not exist` / package.json 损坏 | #012 |
| 中文路径下文件/会话打不开（工作目录被截断） | #013 |

**状态图例**：✅ 官方已修（旧版本仍可能踩）／ ⚠️ 仍存在或设计如此 ／ 🔍 需复核。#001–#006 为作者本机病历（动作均经作者自测）；#007 起逐条标注。

## 病历 #001 会话文件单帧布局违规 → DSH 启动即崩

- **症状**：DSH 完全起不来；会话文件用普通 zstd 解码只能读出 header
- **原因**：`session.v4.jsonl.zstd` 是**多帧 zstd**，且存在单帧布局违规的写法；按单帧解或整文件解都会失败
- **确定性动作**：逐帧扫描帧头（0xFD2FB528）分别解压；「只读出 header」往往就是只解了第一帧
- **出处**：作者本机真实病历（2026-08）；dsh-undo-savepoint 的 undo_scan 文档（「修复单帧布局违规与 seq 重叠两类损伤」）

## 病历 #002 插件 import 失败 → 启动崩溃

- **症状**：装/改插件后 DSH 起不来；典型报错形如 `yield* (intermediate value) is not async iterable`
- **原因**：插件源码或依赖在启动期抛错；插件以 junction 直连时「改源码 = 改线上」
- **确定性动作**：进入安全模式（只留保底插件）→ 逐个启用定位 → 回滚该插件改动；动手前先看最近快照
- **出处**：作者本机真实病历；dsh-undo-savepoint「崩溃自愈 / 安全模式 / 插件代码快照」文档

## 病历 #003 后端闪退：ECONNRESET / worker 线程崩溃

- **症状**：后端控制台直接退出、页面无响应；下载大文件或网络波动时高发；事件日志出现 ECONNRESET
- **原因**：socket 的未处理 'error' 事件 + worker 线程崩溃传播到主进程（Worker 缺 error 处理器）
- **确定性动作**：安装 dsh-crash-guard 四层兜底补丁；v2 起错误写入日志并配守护启动器自动重启
- **出处**：[dsh-crash-guard](https://github.com/EXarchive/dsh-crash-guard) README（含 2026-08-29 事故复盘）

## 病历 #004 浏览器 ERR_CONNECTION_RESET / 页面空白 → 多半不是 DSH 的锅

- **症状**：DSH 内点链接空白、ERR_CONNECTION_RESET
- **原因**：默认浏览器或代理问题（hosts 污染 / 网络加速工具劫持常见）
- **确定性动作**：先查默认浏览器与代理设置；清 hosts 污染再试；别急着改 DSH 配置
- **出处**：作者本机真实病历（2026-10 记录）

## 病历 #005 手改配置文件把小病改成大病

- **症状**：崩溃后凭感觉手改 yml，越改越起不来
- **原因**：配置有层级与合并规则，盲改等于随机游走
- **确定性动作**：改配置前先快照；改崩了走「列出快照 → 回退」，不要手改 yml 猜
- **出处**：作者本机铁律（多次真实翻车）；dsh-undo-savepoint「升级护航 / 快照」设计动机

## 病历 #006 「必须重装」恐慌与数据保全

- **症状**：DSH 出问题后第一反应是「重装吧」，同时担心会话/配置/快照全丢；2026-10-26 检索时未见系统化的重装/保全指引（修订注 2026-10-27：现已有备份插件与 dshbase 恢复指引，见文末延伸阅读；本文决策树仍适用）
- **原因**：重装只动程序本体（安装目录），命根子都在外面——`.dsh\profiles\`（配置 + API key）、`.dsh\sessions\`（全部会话）、undo 快照库（独立目录）
- **确定性动作（决策树，从轻到重）**：
  1. **undo 三板斧**：回退 → 安全模式 → 会话扫描，治九成「以为要重装」
  2. **半重装 = 新开一个 profile**：配置层烂了就换配置，sessions 与快照库不动，效果等同全新安装
  3. **真全重装**：整体备份 → 手动复制 `profiles\` 与 `sessions\` 到独立盘 → 卸载重装程序本体 → 原样放回 → 核对快照库指向、重建插件 junction、健康检查验收
- **红线**：profiles 含 API key，备份只进本机/个人盘，永远不进公开仓库
- **出处**：作者本机环境梳理 + 决策树（2026-10-26 实战整理）；同类资料链接见文末延伸阅读

## 病历 #007 官方恢复弹窗第三按钮无声摘除第三方插件

- **状态**：⚠️ 设计行为（桌面版 0.4.10+），未修
- **症状**：DSH 起不来，弹官方恢复窗口；点第三按钮后界面恢复，但对话里 undo_* 工具消失、自动快照停摆
- **原因**：第三按钮 = 官方 sanitize——第三方插件被移出 `dsh.profile.bundles`、补丁改名留 `bak-<时间戳>`，界面零提示；junction 与代码本体不删，只摘挂载
- **确定性动作**：此弹窗先点 Restart；若已点第三按钮，用离线工具恢复挂载：`node tools/doctor.mjs --fix`（按最新 bak 写回，自带修前快照），重启生效
- **出处**：作者本机真实病历（2026-10-27；实锤三证：auto 快照停摆 + undo_* 工具消失 + doctor 报 sanitize 痕迹）

## 病历 #008 并发子代理撑爆 Node 堆 → 退出码 134

- **状态**：✅ 上游已关单（workaround 有效；旧版仍会踩）
- **症状**：多子代理 + 多会话并发时后端崩溃退出，日志 `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`，退出码 134
- **原因**：Node 默认堆上限约 4 GB，8 个子代理并发把堆吃满
- **确定性动作**：启动前 `$env:NODE_OPTIONS='--max-old-space-size=8192'` 提高堆上限；或减少并发子代理。报告者按此操作后未复现
- **出处**：[dsh-tauri/deepseek-harness-desktop#699](https://github.com/dsh-tauri/deepseek-harness-desktop/issues/699)（2026-09-23 报告、09-24 关单；本条已脱敏转述——原文日志含用户名与页面 token，引用必须先清除）

## 病历 #009 ERR_HTTP2_INVALID_SESSION → 别急着重装

- **状态**：⚠️ 传输层问题，按流程定位（非 DSH 单方 bug）
- **症状**：`dsh web` 退出，栈里有 `Error [ERR_HTTP2_INVALID_SESSION]: The session has been destroyed`；多在模型请求进行中发生
- **原因**：Node HTTP/2 栈的传输生命周期错误（经 undici 发起 provider 请求时）——代理 / VPN / TLS / HTTP2 协商或上游连接关闭，**不是内存不足**
- **确定性动作**：① `NODE_OPTIONS=--trace-uncaught` 抓完整栈；② 关代理/VPN 做 A/B/C 三跑；③ 换一个已配置 provider 跑同 prompt 对照；④ Node 24 / 26 各跑一次。按「哪条路稳定」定位环节，全程别关证书校验
- **出处**：[handbook: http2-invalid-session](https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/http2-invalid-session.md)（verified_at 2026-08-15）、[官方 Discussion #1655](https://github.com/deepseek-ai/deepseek-harness/discussions/1655)

## 病历 #010 中文 Windows 崩溃循环，卡死在 "Loading plugins"

- **状态**：✅ 上游已修（PR 合并于 2026-08-28；旧版桌面端仍会踩）
- **症状**：中文 Windows（ANSI 代码页 936）下 Harness 反复以退出码 1 崩溃，WebView 永远卡在 "Loading plugins…"；desktop.log 反复出现 `Failed to read dsh stderr: stream did not contain valid UTF-8`
- **原因**：插件子进程按 GBK 输出 stderr → 桌面壳按严格 UTF-8 逐行读取，遇非法行即 break 并关闭管道读端 → dsh 主进程写 stderr 收到 EPIPE → Node 无监听器静默退出（实测 ~25 ms 内 exit 1）
- **确定性动作**：升级桌面端至含该修复的版本；旧版临时规避：给会输出非 UTF-8 的插件子进程加 UTF-8 环境变量（如 `PYTHONIOENCODING=utf-8`），或停用该插件
- **出处**：[dsh-tauri/deepseek-harness-desktop PR #197](https://github.com/dsh-tauri/deepseek-harness-desktop/pull/197)（含根因链与回归测试）

## 病历 #011 Linux 启动即崩：inotify 监视数耗尽

- **状态**：✅ 上游已修（PR 合并于 2026-08-25：新增启动期探测与提示；旧参数配置仍会踩）
- **症状**：Linux 桌面端服务启动即退出，日志 `ENOSPC: System limit for number of file watchers reached`；同机 WebKitGTK 还可能 SIGSEGV（Wayland 渲染）
- **原因**：dsh web 用 chokidar 递归监视 profile 目录，耗尽内核 `fs.inotify.max_user_watches` 上限
- **确定性动作**：调高 inotify 上限（如 `sysctl` 设 `fs.inotify.max_user_watches=524288`）；Wayland 下补 `WEBKIT_DISABLE_COMPOSITING_MODE=1`、`WEBKIT_DISABLE_DMABUF_RENDERER=1`（新版桌面端自动补）
- **出处**：[dsh-tauri/deepseek-harness-desktop#116](https://github.com/dsh-tauri/deepseek-harness-desktop/issues/116) / [PR #119](https://github.com/dsh-tauri/deepseek-harness-desktop/pull/119)（Ubuntu 26.04 实报）

## 病历 #012 profile 损坏 / package.json 损坏 → 起不来

- **状态**：⚠️ 可恢复，重建优于硬修
- **症状**：启动直接抛栈，或报 `profile "<名称>" does not exist`；或 profile 的 `package.json` 被改坏
- **原因**：profile 是 `~/.dsh/profiles/<名称>/` 自包含目录，配置层损坏不影响会话数据（会话在 `~/.dsh/sessions`，相互分离）
- **确定性动作**：先备份再重建——停 dsh → 拷走整个 profile 目录 → `dsh plugin --profile <名称> add @deepseek-ai/dsh-base @deepseek-ai/dsh-web-app` 重建，不丢对话。改配置前先 `dsh --profile <名称> --dump-config > before.txt`，dump 是「当前实际装配」的唯一事实来源
- **出处**：[dshbase 排错：profile does not exist](https://dshbase.com/zh/troubleshooting/)、[handbook：corrupt-package-json-profile-boot](https://github.com/sandbaseai/deepseek-harness-handbook/blob/main/docs/en/troubleshooting/corrupt-package-json-profile-boot.md)（2026-10-27 收录）

## 病历 #013 Windows 中文路径被截断 → 其下文件/会话打不开

- **状态**：⚠️ 上游解码 bug，未修（建议绕行）
- **症状**：工作目录在某个汉字处被截断，其下的文件/会话无法打开；路径含 UTF-16 低字节为 0x00 的字符（如「言」）时触发
- **原因**：上游 `readUtf16` 把低字节 0x00 误判为 NUL 终止符
- **确定性动作**：工作区路径避开此类字符（纯 ASCII 最稳）；被截断目录先改名/挪位再访问；上报时附完整复现路径
- **出处**：[dshbase 排错：Windows 中文路径被截断](https://dshbase.com/zh/troubleshooting/)（与作者本机踩坑「中文路径 GBK 吞字符」同族；2026-10-27 收录）

## 延伸阅读（同行与上游，截至 2026-10-27）

会话修复/抢救工具（GitHub 站内检索所得，**未逐一深度审计**，使用前自担风险）：

- [po-et/dsh-session-rescue](https://github.com/po-et/dsh-session-rescue)：把官方 v0 格式会话修到可继续用（npx，doctor/repair/export）
- [Coprexist/dsh-session-recovery](https://github.com/Coprexist/dsh-session-recovery)：从原始磁盘恢复被删会话与记忆库（`rm -rf` 后的救命稻草，附实战手册）
- [imtokenxinluo/dsh-session-doctor](https://github.com/imtokenxinluo/dsh-session-doctor)：扫描并无损修复会话日志
- [xiaoshenming/dsh-session-surgeon](https://github.com/xiaoshenming/dsh-session-surgeon)：修打不开的会话文件
- [Semidia/dsh-session-repair-ui](https://github.com/Semidia/dsh-session-repair-ui)：会话头部「修复会话」按钮
- [aokamoaki/dsh-startup-guard](https://github.com/aokamoaki/dsh-startup-guard)：开机预检插件、隔离肇事插件
- 备份类：[having5548/dsh-backup](https://github.com/having5548/dsh-backup)、npm `@xiaoyuyu6420/dsh-backup`、npm `@dsh-toolbox/session-care`（未验证）

知识库与社区：

- [sandbaseai/deepseek-harness-handbook](https://github.com/sandbaseai/deepseek-harness-handbook)：英文排错手册（50+ 篇）
- [dshbase 排错板块](https://dshbase.com/zh/troubleshooting/)：中文「报错→原因→修复」速查
- 官方讨论：[#1497](https://github.com/deepseek-ai/deepseek-harness/discussions/1497)（两种会话损坏形态）、[#1655](https://github.com/deepseek-ai/deepseek-harness/discussions/1655)（总崩溃）、[#4807](https://github.com/deepseek-ai/deepseek-harness/discussions/4807)（macOS 崩溃循环）
- 中文社区：linux.do 有真实翻车帖（「自己运行着对话损坏，让它自己修把自己修崩」「Deepseek Harness 遇坑经历」等）；本库仅收标题线索，**正文未核实**

## 收录标准

1. 必须有可复现的症状描述
2. 必须有确定性动作（能照做，不是「试试看」）
3. 必须标出处（本机病历注明日期；他人成果必须给链接）
4. 「我觉得可能」不收
5. 新病历须标状态与核实日期；「未发现」类说法必须带日期、关键词与渠道范围（见开头声明框）
