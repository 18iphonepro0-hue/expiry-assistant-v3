import {test} from 'node:test';import assert from 'node:assert/strict';import {today,iso,candidates,calendar} from '../src/dates.js';
test('台灣午夜與跨年，午夜當天即下架',()=>{assert.equal(today(new Date('2026-12-31T15:59:59Z')),'2026-12-31');assert.equal(today(new Date('2026-12-31T16:00:00Z')),'2027-01-01');});
test('閏年及不存在日期',()=>{assert.equal(iso(2028,2,29),'2028-02-29');assert.equal(iso(2027,2,29),null);assert.equal(iso(2026,4,31),null);});
test('多個日期不代選並保留無年份日期',()=>{assert.deepEqual(candidates('MFG 2026/12/30 EXP 2027.01.02 01/03').map(c=>[c.year,c.month,c.day]),[[2026,12,30],[2027,1,2],[null,1,3]]);});
test('民國、中文、緊湊、全形日期',()=>{assert.equal(candidates('115年11月20日')[0].year,2026);assert.equal(candidates('２０２６／１１／２１')[0].day,21);assert.equal(candidates('20270102')[0].year,2027);});
test('拒絕無效完整日期',()=>assert.deepEqual(candidates('2026/02/30'),[]));
test('行事曆下架當天，逸出特殊字元',()=>{const c=calendar([{id:'x',expiry:'2027-01-01',name:'茶,蛋;\n'}]);assert.match(c,/DTSTART:20261231T160500Z/);assert.match(c,/茶\\,蛋\\;\\n/);assert.match(c,/BEGIN:VALARM/);});

test('兩位數年份不猜測世紀',()=>{const cs=candidates('26.11.20');assert.equal(cs[0].year,null);assert.equal(cs[0].month,11);assert.equal(cs[0].day,20);});
