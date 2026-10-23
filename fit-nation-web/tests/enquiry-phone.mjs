import {strict as assert} from 'node:assert';
import {normalizeIndianPhone} from '../lib/enquiry.ts';

for (const value of ['9000000000', '+91 90000 00000', '919000000000', '(900) 000-0000', '09000000000']) {
  assert.equal(normalizeIndianPhone(value), '+919000000000', `normalize ${value}`);
}
for (const value of ['', '1111111111', '900000000', '90000000000', '+1 9000000000', 'number9000000000', '9000000000 ext2']) {
  assert.equal(normalizeIndianPhone(value), null, `reject ${value}`);
}
console.log('12 phone normalization checks passed');
