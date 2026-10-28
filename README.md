# dsh-session-rescue

> 中文 | [English](README.en.md)

**DSH 崩了，会话文件还在 —— 把里面的对话抢回来。**

[DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 崩溃后，配置可以回退、文件结构可以修复（见下方同行地图），但崩掉会话里的**对话原文**，截至 2026-10-26 检索（GitHub 站内：`session.v4.jsonl.zstd` / DSH 会话读取）未见针对桌面版 v4 格式的公开读取工具。本工具逐帧解码 `session.v4.jsonl.zstd`，把对话上下文抢救成 Markdown。

## 症状决策表 —— 先对症状，再动手

| 症状 | 该用什么 |
|---|---|
| DSH 整个起不来（改配置/装插件之后） | [dsh-undo-savepoint](https://github.com/lire1131/dsh-undo-savepoint)：一键回退 / 安全模式 |
| 网络波动导致后端闪退 | [dsh-crash-guard](https://github.com/EXarchive/dsh-crash-guard)：事前防护补丁 |
| 会话文件打不开 / 普通解压只读出 header | **本工具**：逐帧解码，坏帧跳过继续读 |
| 想抢回崩死会话里的对话原文 | **本工具** `--md` 导出 Markdown |
| DSH 没崩，只想导出/翻看历史会话 | 也用**本工具**，日常可用 |
| 中文 Windows 反复崩溃 / Linux 启动即崩 / 中文路径打不开 | [docs/casebook.md](docs/casebook.md) 病历 #010 / #011 / #013 |
| 想知道「为什么会崩」 | [docs/casebook.md](docs/casebook.md)：崩溃病历库 |
| 想重装又怕丢数据 | [docs/casebook.md](docs/casebook.md) 病历 #006：分层决策树 + 保全清单 |

## 快速开始

零依赖，单文件。要求 Node ≥ 22.15（终端跑 `node -v` 自查版本）。

### 第 0 步：文件和 node 在哪

- **会话文件**：`C:\Users\<你的用户名>\.dsh\sessions\<目录名>\session.v4.jsonl.zstd`（macOS/Linux 在 `~/.dsh/sessions/`）。目录名是编码过的路径，认不出来没关系——下面第三种跑法整个目录一起扫
- **node**：DSH 崩了它多半还活着——自带运行时在 `C:\Users\<你的用户名>\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe`（`.dsh` 独立于程序本体）；或任何独立安装的 Node ≥ 22.15

### 三种跑法（Windows 路径示例；macOS/Linux 把反斜杠换成 `/` 即可）

```bash
# 概要：列出会话里的用户消息——<文件> 换成你的 session.v4.jsonl.zstd 完整路径
node session-rescue.mjs "<文件>"

# 抢救：对话原文完整导出为 Markdown（真崩了用这个）
node session-rescue.mjs "<文件或目录>" --md 抢救导出.md

# 认不出哪个会话是你要的？整个 sessions 目录跑概要，按修改时间从新到旧认领
node session-rescue.mjs "C:\Users\你\.dsh\sessions"
```

只读本地文件，不联网，不收集任何数据。

## 已知限制（说实话版）

- v1 只抢救**用户消息**（已在真实会话文件验证）；助手消息的事件结构尚未吃透，v2 再说
- 帧定位用帧头 magic 扫描：压缩数据里若偶然出现帧头字节，该帧判坏跳过——宁可漏一帧，不错报一段（已有三明治测试覆盖：`test/gen-badframe.mjs` 可复现，坏帧前后的消息实测完整抢回）
- 会话格式随 DSH 版本演进；报错请先对照你的 DSH 版本
- 只对**官方** [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的会话格式负责；第三方壳与同名应用（如 DSH Desktop by Dataelem）格式不保证，不在支持范围
- 解压失败的帧全部列为坏帧输出，不会静默丢内容

## 给 AI / 自动化代理的使用说明

本工具是零依赖单文件 Node 脚本，任何有终端权限的 AI 代理都可以直接调用：

- **调用**：`node session-rescue.mjs <文件或目录> [--md 输出.md]`
- **退出码**：`0` 成功；`1` 参数错误、环境不支持（如 Node 缺 zstd）或未找到文件
- **输出**：结果写 stdout，报错写 stderr（带 `[session-rescue]` 前缀）
- **错误语义**：`没有找到可处理的 .jsonl.zstd` = 路径下无匹配文件；`跳过(打不开)` = 单个路径不可读，其余继续；`解压失败` = 坏帧，已跳过并列出
- **安全边界**：只读输入文件，仅写入 `--md` 指定的输出路径；不联网，不执行会话内容
- 只解析官方 DeepSeek Harness 的会话格式；其他生态的 JSONL 会话能读但解析出 0 条消息

## 同行地图与鸣谢（截至 2026-10-27，GitHub 站内检索）

会话损坏后的分工，先对号入座：

| 需求 | 去哪 |
|---|---|
| 修官方 v0 格式会话到能继续用 | [po-et/dsh-session-rescue](https://github.com/po-et/dsh-session-rescue) |
| rm -rf 后从原始磁盘捞会话/记忆库 | [Coprexist/dsh-session-recovery](https://github.com/Coprexist/dsh-session-recovery) |
| 更多修复/备份工具（未逐一审计，用前自担风险） | [docs/casebook.md](docs/casebook.md) 延伸阅读 |
| **桌面版 v4 多帧 zstd 会话的内容抢救** + 中文急救病历库 | **本工具** |

老邻居：

- [dsh-undo-savepoint](https://github.com/lire1131/dsh-undo-savepoint)：安全管家——自动快照、一键回退、安全模式、会话结构修复，管「修文件」
- [dsh-crash-guard](https://github.com/EXarchive/dsh-crash-guard)：崩溃防护补丁——防 ECONNRESET / worker 崩溃，管「不崩」

## 维护声明（先小人后君子）

- 本项目按作者自身需要更新，不承诺周期、不接 feature request
- **修 bug 的 PR 欢迎**：feature 不接，但哪儿坏了欢迎报修
- 格式随 DSH 版本变动，报错请先对照你的 DSH 版本
- 用不了就关掉，作者不欠你

## 免责声明

- **非官方工具**：本项目为社区个人作品，与 DeepSeek 官方无任何隶属或合作关系；「DeepSeek」「DeepSeek Harness」名称及商标归其权利人所有
- **按原样提供**：不附带任何形式的担保；是否使用、如何使用，风险自担（详见 [MIT License](LICENSE)）
- **数据安全**：本工具只读输入文件，但**不替你做备份**——重要会话请先自行复制一份再折腾
- **隐私自持**：`--md` 导出的 Markdown 含对话原文，请自行妥善保管，勿公开传播
- **内容归属**：病历库中引用的第三方项目描述，版权与观点归原作者，引用仅为说明目的且均已标注出处

## License

[MIT](LICENSE)
