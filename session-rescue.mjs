#!/usr/bin/env node
// session-rescue.mjs — DSH 会话抢救阅读器(不依赖 DSH 运行)
// 用途: DSH 崩掉后,从 session.v4.jsonl.zstd 里把对话原文抢救出来
// 用法:
//   node session-rescue.mjs <文件或目录> ...              概要模式
//   node session-rescue.mjs <文件或目录> ... --md out.md  对话原文完整导出为 Markdown
//   node session-rescue.mjs --help
// 要求: Node >= 22.15(内置 zstd);DSH 自带运行时里的 node.exe 也可以
// 隐私: 只读本地文件,不联网,不收集任何数据

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ZSTD_MAGIC = 0xFD2FB528;

function die(msg) { console.error('[session-rescue] ' + msg); process.exit(1); }

if (typeof zlib.zstdDecompressSync !== 'function') {
  die('当前 Node 缺少内置 zstd,需要 Node >= 22.15;也可以用 DSH 自带运行时里的 node.exe');
}

function collectFiles(args) {
  const out = [];
  for (const a of args) {
    let st;
    try { st = fs.statSync(a); } catch { console.error('跳过(打不开): ' + a); continue; }
    if (st.isDirectory()) {
      const kids = fs.readdirSync(a).filter(n => /\.jsonl\.zstd$/i.test(n));
      kids.sort((x, y) => fs.statSync(path.join(a, y)).mtimeMs - fs.statSync(path.join(a, x)).mtimeMs);
      for (const k of kids) out.push(path.join(a, k));
    } else {
      out.push(a);
    }
  }
  return out;
}

// 逐帧解码:坏帧跳过并记录,好帧照常抢救 —— 半截会话也能抢回前半截
function decodeFrames(buf) {
  let off = 0, frames = 0, bad = 0;
  const parts = [], errors = [];
  while (off + 4 <= buf.length) {
    if (buf.readUInt32LE(off) !== ZSTD_MAGIC) { off += 1; continue; }
    let end = off + 4;
    while (end + 4 <= buf.length && buf.readUInt32LE(end) !== ZSTD_MAGIC) end++;
    if (end + 4 > buf.length) end = buf.length;
    frames++;
    try {
      parts.push(zlib.zstdDecompressSync(buf.subarray(off, end)).toString('utf8'));
    } catch (e) {
      bad++;
      errors.push('帧 ' + frames + ' 解压失败: ' + String(e.message).slice(0, 80));
    }
    off = end;
  }
  return { text: parts.join('\n'), frames, bad, errors };
}

function extractUserMsgs(text) {
  const events = text.split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
  const msgs = [];
  for (const e of events) {
    if (e.type === 'agent/inbox/spliced' && Array.isArray(e.data && e.data.inserted)) {
      for (const ins of e.data.inserted) {
        if (!ins || !ins.source || ins.source.kind !== 'user') continue;
        let c = Array.isArray(ins.content) ? ins.content.map(p => (p && p.text) || '').join(' ')
              : (typeof ins.content === 'string' ? ins.content : '');
        c = c.trim();
        if (c && !c.startsWith('<system-reminder')) msgs.push(c);
      }
    }
  }
  return { events: events.length, msgs };
}

function rescue(f) {
  let buf;
  try { buf = fs.readFileSync(f); } catch (e) { return { file: f, error: '读不了: ' + e.message.slice(0, 80) }; }
  const d = decodeFrames(buf);
  const ex = extractUserMsgs(d.text);
  return { file: f, frames: d.frames, bad: d.bad, errors: d.errors, events: ex.events, msgs: ex.msgs };
}

function label(f) {
  return path.basename(path.dirname(f)) + '/' + path.basename(f);
}

function printSummary(r) {
  console.log('=== ' + label(r.file) + ' ===');
  if (r.error) { console.log('  ' + r.error); return; }
  console.log('帧 ' + r.frames + '(坏 ' + r.bad + '), 事件 ' + r.events + ' 条, 用户消息 ' + r.msgs.length + ' 条');
  for (const e of r.errors.slice(0, 5)) console.log('  [坏帧] ' + e);
  if (r.bad > 5) console.log('  ...(另有 ' + (r.bad - 5) + ' 个坏帧)');
  console.log('  首条: ' + (r.msgs[0] || '(无)').replace(/\s+/g, ' ').slice(0, 120));
  console.log('  末条: ' + ((r.msgs[r.msgs.length - 1] || '(无)').replace(/\s+/g, ' ').slice(0, 120)));
  r.msgs.forEach((m, i) => console.log('  ' + String(i + 1).padStart(2) + '. ' + m.replace(/\s+/g, ' ').slice(0, 90)));
}

function exportMarkdown(rs, outPath) {
  const secs = [];
  for (const r of rs) {
    if (r.error) { console.log('跳过: ' + label(r.file) + ' (' + r.error + ')'); continue; }
    const st = fs.statSync(r.file);
    let s = '# ' + label(r.file) + '\n\n';
    s += '- 抢救时间: ' + new Date().toISOString().slice(0, 19).replace('T', ' ') + '\n';
    s += '- 原文件修改时间: ' + st.mtime.toISOString().slice(0, 19).replace('T', ' ') + '\n';
    s += '- 帧 ' + r.frames + '(坏 ' + r.bad + '), 事件 ' + r.events + ' 条\n\n';
    s += '## 用户消息(共 ' + r.msgs.length + ' 条)\n\n';
    r.msgs.forEach((m, i) => { s += (i + 1) + '. ' + m.replace(/\n+/g, '\n   ') + '\n\n'; });
    secs.push(s);
  }
  fs.writeFileSync(outPath, '# DSH 会话抢救导出\n\n' + secs.join('\n---\n\n'));
  console.log('已导出: ' + outPath + ' (' + secs.length + ' 个会话)');
}

// ---- main ----
const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
  console.log([
    '用法: node session-rescue.mjs <文件或目录>... [--md 导出.md]',
    '  概要模式: 列出每个会话的用户消息',
    '  --md:     对话原文完整导出为 Markdown(抢救上下文用)',
    '  支持目录: 目录下所有 *.jsonl.zstd 按修改时间从新到旧依次处理',
    '  要求: Node >= 22.15(内置 zstd)。只读本地文件,不联网。'
  ].join('\n'));
  process.exit(0);
}
const mdIdx = argv.indexOf('--md');
let mdOut = null;
let rest = argv;
if (mdIdx >= 0) {
  mdOut = argv[mdIdx + 1];
  if (!mdOut) die('--md 后面要跟导出文件名');
  rest = argv.slice(0, mdIdx).concat(argv.slice(mdIdx + 2));
}
const files = collectFiles(rest);
if (files.length === 0) die('没有找到可处理的 .jsonl.zstd 文件');
const results = files.map(rescue);
if (mdOut) exportMarkdown(results, mdOut);
else results.forEach(printSummary);
