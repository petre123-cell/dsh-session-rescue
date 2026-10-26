// gen-badframe.mjs — 生成「好帧 + 假帧头垃圾 + 好帧」三明治测试文件
// 用途: 验证 session-rescue.mjs 的坏帧跳过能力;也可当仓库测试资产
// 用法: node gen-badframe.mjs [输出文件名]
import zlib from 'node:zlib';
import fs from 'node:fs';
const M = Buffer.from([0x28, 0xB5, 0x2F, 0xFD]); // zstd 帧头 magic
const mk = s => Buffer.concat([M, zlib.zstdCompressSync(Buffer.from(JSON.stringify({ type: 'agent/inbox/spliced', data: { inserted: [{ source: { kind: 'user' }, content: s }] } })))]);
const junk = Buffer.concat([M, Buffer.from('NOT-A-REAL-FRAME-'.repeat(30))]); // 假帧头:解压必失败
const out = process.argv[2] || 'badframe-test.jsonl.zstd';
fs.writeFileSync(out, Buffer.concat([mk('第一条:坏帧之前的消息'), junk, mk('第二条:跨过坏帧之后的消息')]));
console.log('已生成: ' + out + ' (结构: 好帧 + 假帧头垃圾 + 好帧)');
