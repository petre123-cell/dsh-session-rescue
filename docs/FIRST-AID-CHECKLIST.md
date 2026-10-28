# DSH 急救检查单 / First-Aid Checklist

> 崩溃时人只读得进一张纸。上半页适用于**任何** AI CLI 工具，下半页是 DSH 专属对照。
> Top half works for **any** AI CLI tool; bottom half is DSH-specific. 社区维护，非官方，截至 2026-10-27。

## 通用急救六步 / Universal six steps

1. **停**：先停一切写入（关进程、关会话），防止损坏扩大 — Stop all writes first.
2. **备份**：动手修任何东西之前，先原样拷贝数据目录（DSH：整个 `~/.dsh/`，尤其凭据与 `sessions/`） — Copy the data dir before any repair.
3. **抄原文**：完整报错原文抄下来（截图/复制），别凭记忆描述 — Capture the exact error text.
4. **一步一变**：一次只改一个变量，改前记下原值，改崩了能退回 — One variable at a time.
5. **别急着重装**：重装排最后；数据目录通常在程序目录之外，重装救不了数据 — Reinstall is the LAST resort.
6. **查时效**：任何修法都可能过时——对照你的版本号与修法标注的核实日期 — Check versions & verify dates.

## DSH 专属对照 / DSH-specific quick map

| 报错关键词 / 症状 | 病历 |
|---|---|
| `corrupt session log` / 只读出 header / 会话打不开 | [#001](#病历-001-会话文件单帧布局违规--dsh-启动即崩) |
| 装插件后起不来 / `import failed` | #002 |
| 后端闪退 / 事件日志 `ECONNRESET` | #003 |
| 点链接空白 / `ERR_CONNECTION_RESET` | #004 |
| 手改 yml 后起不来 | #005 |
| 想重装又怕丢数据 | #006 |
| 欢迎页 `Web authentication failed` / 官方恢复弹窗 | #007 |
| `JavaScript heap out of memory` / 退出码 134 | #008 |
| `ERR_HTTP2_INVALID_SESSION` | #009 |
| 中文 Windows 卡 "Loading plugins" / 退出码 1 | #010 |
| Linux 启动即崩 / `ENOSPC: file watchers` | #011 |
| `profile does not exist` / 启动抛栈 | #012 |
| 中文路径下文件/会话打不开 | #013 |

完整病历（原因 + 确定性动作 + 出处）：[casebook.md](casebook.md)

> ⚠️ 官方恢复弹窗**先点 Restart**；第三按钮会无声摘除第三方插件（病历 #007）。
> ⚠️ The official recovery dialog: click **Restart** first; the third button silently unloads third-party plugins.
