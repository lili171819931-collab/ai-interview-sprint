/* CreatorOS 测试运行器：node tests/run-tests.mjs（或 npm test） */
import { CASES } from './test-cases.mjs';

let passAll = true;
let total = 0, passed = 0;

for (const c of CASES) {
  console.log(`\n━━━ ${c.id} ${c.name} ━━━`);
  console.log(`  target: ${c.target}`);
  let asserts;
  try { asserts = c.run(); } catch (err) { asserts = [{ name: '用例抛出异常', ok: false, detail: err.message }]; }
  for (const x of asserts) {
    total++; x.ok ? passed++ : (passAll = false);
    console.log(`  ${x.ok ? '✓' : '✗'} ${x.name}${x.detail ? '  (' + x.detail + ')' : ''}`);
  }
}

console.log(`\n══════════════════════════════`);
console.log(`结果：${passed}/${total} 断言通过 ${passAll ? '✅ 全部通过' : '❌ 存在失败'}`);
process.exit(passAll ? 0 : 1);
