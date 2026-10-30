// node site/components/steve-pricing/steve-pricing.check.mjs — confere a conta do preço anual.
import assert from 'node:assert/strict';
import { brl, priceView } from './steve-pricing.js';

const p1 = { monthlyAmount: 334700, annualAmount: 3347000 };
const p2 = { monthlyAmount: 524700, annualAmount: 5247000 };
const p3 = { monthlyAmount: 789700, annualAmount: 7897000 };

assert.equal(brl(334700).text, 'R$ 3.347');
assert.equal(priceView(p1, 'month').big.text, 'R$ 3.347');
assert.equal(priceView(p1, 'year').big.text, 'R$ 2.789,17');
assert.equal(priceView(p2, 'year').big.text, 'R$ 4.372,50');
assert.equal(priceView(p3, 'year').big.text, 'R$ 6.580,83');
assert.equal(priceView(p1, 'year').annual.text, 'R$ 33.470');
assert.equal(priceView(p1, 'year').savings.text, 'R$ 6.694');
assert.equal(priceView(p3, 'year').savings.text, 'R$ 15.794');
for (const p of [p1, p2, p3]) {
  assert.equal(priceView(p, 'year').monthsFree, 2);
  assert.equal(priceView(p, 'year').pct.toFixed(1), '16.7');
}
console.log('ok: 3 planos, mensal/anual, 2 meses grátis, 16,7%');
