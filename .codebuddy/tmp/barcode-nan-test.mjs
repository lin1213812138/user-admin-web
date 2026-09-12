import * as bwipjs from 'bwip-js/node';
import { writeFileSync } from 'node:fs';

function pngSize(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

// 复现：旧数据 barcode options 缺 fontSize → textsize: Math.max(4, Math.round(undefined)) = NaN
try {
  const nan = await bwipjs.toBuffer({
    bcid: 'code128',
    text: '321321321',
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: 'center',
    textsize: Math.max(4, Math.round(undefined))
  });
  writeFileSync(new URL('./nan-textsize.png', import.meta.url), nan);
  console.log('NaN textsize OK:', pngSize(nan));
} catch (e) {
  console.log('NaN textsize THROWS:', e.message);
}

// 对照：fontSize 有值
const ok = await bwipjs.toBuffer({
  bcid: 'code128',
  text: '321321321',
  scale: 3,
  height: 10,
  includetext: true,
  textxalign: 'center',
  textsize: Math.max(4, Math.round(10))
});
writeFileSync(new URL('./ok-textsize.png', import.meta.url), ok);
console.log('normal textsize:', pngSize(ok));
