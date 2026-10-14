import {assert} from 'chai';
import {SymbolIdentityIndex} from '../../../../../src/ol/render/webgpu/symbolIdentity.js';

/**
 * @param {string} key Content key.
 * @param {number} x Anchor x.
 * @param {number} y Anchor y.
 * @return {Object} Label.
 */
function label(key, x, y) {
  return {_identityKey: key, _anchor: [x, y]};
}

describe('ol/render/webgpu/SymbolIdentityIndex', () => {
  it('matches parent and child symbols by content and nearby anchor', () => {
    const index = new SymbolIdentityIndex();
    const parent = index.update([label('city', 100, 100)], [0], 1);
    const child = index.update([label('city', 102, 99)], [0], 1);
    assert.deepEqual(child, parent);
  });

  it('keeps nearby equal text instances one-to-one', () => {
    const index = new SymbolIdentityIndex();
    const first = index.update(
      [label('road', 0, 0), label('road', 20, 0)],
      [0, 0],
      1,
    );
    const second = index.update(
      [label('road', 19, 0), label('road', 1, 0)],
      [0, 0],
      1,
    );
    assert.deepEqual(second, [first[1], first[0]]);
  });

  it('deduplicates exact parent and child copies', () => {
    const index = new SymbolIdentityIndex();
    const ids = index.update(
      [label('place', 10, 10), label('place', 10, 10)],
      [0, 0],
      1,
    );
    assert.strictEqual(ids[0], ids[1]);
  });

  it('shares one id between nearly coincident parent and child copies', () => {
    const index = new SymbolIdentityIndex();
    const parent = index.update([label('ocean', 100, 100)], [0], 1);
    const both = index.update(
      [label('ocean', 100.5, 100), label('ocean', 100, 100)],
      [0, 0],
      1,
    );
    assert.deepEqual(both, [parent[0], parent[0]]);
  });

  it('matches across a wrapped-world jump', () => {
    const index = new SymbolIdentityIndex();
    const first = index.update([label('place', 2, 0)], [0], 1, 100);
    const wrapped = index.update([label('place', 2, 0)], [100], 1, 100);
    assert.deepEqual(wrapped, first);
  });

  it('keeps the id with the copy in the same world when a wrapped copy appears', () => {
    const index = new SymbolIdentityIndex();
    const [id] = index.update([label('country', 2, 0)], [0], 1, 100);
    const ids = index.update(
      [label('country', 2, 0), label('country', 2, 0)],
      [-100, 0],
      1,
      100,
    );
    assert.strictEqual(ids[1], id);
    assert.notStrictEqual(ids[0], id);
  });

  it('does not merge different style keys at the same anchor', () => {
    const index = new SymbolIdentityIndex();
    const ids = index.update(
      [label('place|style-1', 0, 0), label('place|style-2', 0, 0)],
      [0, 0],
      1,
    );
    assert.notStrictEqual(ids[0], ids[1]);
  });
});
