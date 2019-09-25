import {getUid} from '../../../src/ol/util.js';

describe('getUid()', () => {
  test('is constant once generated', () => {
    const a = {};
    expect(getUid(a)).toBe(getUid(a));
  });

  test('generates a strictly increasing sequence', () => {
    const a = {};
    const b = {};
    const c = {};
    getUid(a);
    getUid(c);
    getUid(b);

    expect(getUid(a)).toBeLessThan(getUid(c));
    expect(getUid(c)).toBeLessThan(getUid(b));
    expect(getUid(a)).toBeLessThan(getUid(b));
  });
});
