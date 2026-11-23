'use strict';
// Phase 24 Skilltree runtime smoke test. Run: node tests/skilltree_runtime_phase24.js
const fs = require('fs');
const vm = require('vm');
const SW = { Data: JSON.parse(fs.readFileSync('data/skills.json', 'utf8')), t: (k, n) => String(k).replace('{n}', n) };
SW.Char = { level: 40, sp: 200 };
SW.Essence = { n: 250, has: n => SW.Essence.n >= n, spend: n => (SW.Essence.n -= n, true) };
SW.Karma = { v: 100 };
SW.YinYang = {
  yin: 100, yang: 100,
  balanced: n => Math.min(SW.YinYang.yin, SW.YinYang.yang) >= n && Math.abs(SW.YinYang.yin - SW.YinYang.yang) <= 12,
  spend: (k, n) => SW.YinYang[k] -= n
};
SW.Save = { touch() {} };
SW.UI = { banner() {} };
vm.runInNewContext(fs.readFileSync('js/skills.js', 'utf8'), { SW });
const S = SW.Skills;
if (S.nodes.length !== 80 || S.specials.length !== 10) throw new Error('wrong node count');
for (const id of ['sm_p1_1', 'sm_p1_2', 'sm_p1_3', 'sm_p5_1', 'sm_a5']) {
  if (!S.learn(id)) throw new Error('cannot learn ' + id);
}
if (!S.canSpecial('sm_s1') || !S.unlockSpecial('sm_s1')) throw new Error('tree special unlock failed');
if (!S.markSpecialQuest('sm_will')) throw new Error('quest flag failed');
const saved = S.dump();
S.learned = {}; S.specialLearned = {}; S.load(saved);
if (!S.learned.sm_p1_3 || !S.specialLearned.sm_s1 || !S.specialQuest.sm_will) throw new Error('save/load failed');
if (S.slots.length !== 2) throw new Error('slot count changed');
console.log('PASS Skilltree runtime: learning, prerequisites, special unlock, quest flag, save/load and two slots.');
