import expect from 'expect.js';
import LabelsArray from '../../../../src/ol/webgl/LabelsArray.js';

describe('ol/webgl/LabelsArray.js', () => {
  let labelsArray;

  beforeEach(() => {
    labelsArray = new LabelsArray();
  });

  describe('#push()', () => {
    it('returns the start position for each label pushed', () => {
      const pos1 = labelsArray.push('hello');
      const pos2 = labelsArray.push('world');
      assert.deepEqual(pos1, [0, 5]);
      assert.deepEqual(pos2, [5, 5]); // 'hello' is 5 bytes
    });

    it('returns the same position when pushing a duplicate label', () => {
      labelsArray.push('foo bar');
      const pos1 = labelsArray.push('hello');
      const pos2 = labelsArray.push('hello');
      assert.deepEqual(pos1, pos2);
    });

    it('handles empty string by not changing the underlying array and returning a start position of 0', () => {
      labelsArray.push('hello world');
      assert.deepEqual(labelsArray.push(''), [0, 0]);
      assert.deepEqual(labelsArray.push('foo'), [11, 3]);
      assert.deepEqual(labelsArray.push('bar'), [14, 3]);
    });

    it('grows the internal array when capacity is exceeded', () => {
      labelsArray.push('a'.repeat(50_000));
      labelsArray.push('b'.repeat(50_001));
      assert.equal(labelsArray.getArray().length, 200_000);
    });

    it('handles international characters with multiple subsequent UTF-8 chars', () => {
      const pos1 = labelsArray.push('café');
      const pos2 = labelsArray.push('Grüße');
      const pos3 = labelsArray.push('你好');
      const pos4 = labelsArray.push('こんにちは');
      const pos5 = labelsArray.push('안녕하세요');
      const pos6 = labelsArray.push('Привет');

      const array = labelsArray.getArray();
      assert.deepEqual(
        array.slice(pos1[0], pos1[0] + pos1[1]),
        new TextEncoder().encode('café'),
      );
      assert.deepEqual(
        array.slice(pos2[0], pos2[0] + pos2[1]),
        new TextEncoder().encode('Grüße'),
      );
      assert.deepEqual(
        array.slice(pos3[0], pos3[0] + pos3[1]),
        new TextEncoder().encode('你好'),
      );
      assert.deepEqual(
        array.slice(pos4[0], pos4[0] + pos4[1]),
        new TextEncoder().encode('こんにちは'),
      );
      assert.deepEqual(
        array.slice(pos5[0], pos5[0] + pos5[1]),
        new TextEncoder().encode('안녕하세요'),
      );
      assert.deepEqual(
        array.slice(pos6[0], pos6[0] + pos6[1]),
        new TextEncoder().encode('Привет'),
      );
    });
  });

  describe('#getArray()', () => {
    it('returns a Uint8Array containing the labels', () => {
      labelsArray.push('foo');
      labelsArray.push('bar');
      expect(labelsArray.getArray()).to.be.a(Uint8Array);

      const array = labelsArray.getArray();
      assert.equal(array[0], 'f'.charCodeAt(0));
      assert.equal(array[1], 'o'.charCodeAt(0));
      assert.equal(array[2], 'o'.charCodeAt(0));
      assert.equal(array[3], 'b'.charCodeAt(0));
      assert.equal(array[4], 'a'.charCodeAt(0));
      assert.equal(array[5], 'r'.charCodeAt(0));
    });
  });
});
