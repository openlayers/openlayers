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
      expect(pos1).to.be(0);
      expect(pos2).to.be(5); // 'hello' is 5 bytes
    });

    it('returns the same position when pushing a duplicate label', () => {
      labelsArray.push('foo bar');
      const pos1 = labelsArray.push('hello');
      const pos2 = labelsArray.push('hello');
      expect(pos1).to.be(pos2);
    });

    it('handles empty string by not changing the underlying array and returning a start position of 0', () => {
      labelsArray.push('hello world');
      expect(labelsArray.push('')).to.be(0);
      expect(labelsArray.push('foo')).to.be(11);
      expect(labelsArray.push('bar')).to.be(14);
    });

    it('grows the internal array when capacity is exceeded', () => {
      labelsArray.push('a'.repeat(50_000));
      labelsArray.push('b'.repeat(50_001));
      expect(labelsArray.getArray().length).to.be(200_000);
    });

    it('handles international characters with multiple subsequent UTF-8 chars', () => {
      const pos1 = labelsArray.push('café');
      const pos2 = labelsArray.push('Grüße');
      const pos3 = labelsArray.push('你好');
      const pos4 = labelsArray.push('こんにちは');
      const pos5 = labelsArray.push('안녕하세요');
      const pos6 = labelsArray.push('Привет');
      const pos7 = labelsArray.push('end');

      const array = labelsArray.getArray();
      expect(array.slice(pos1, pos2)).to.eql(new TextEncoder().encode('café'));
      expect(array.slice(pos2, pos3)).to.eql(new TextEncoder().encode('Grüße'));
      expect(array.slice(pos3, pos4)).to.eql(new TextEncoder().encode('你好'));
      expect(array.slice(pos4, pos5)).to.eql(
        new TextEncoder().encode('こんにちは'),
      );
      expect(array.slice(pos5, pos6)).to.eql(
        new TextEncoder().encode('안녕하세요'),
      );
      expect(array.slice(pos6, pos7)).to.eql(
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
      expect(array[0]).to.be('f'.charCodeAt(0));
      expect(array[1]).to.be('o'.charCodeAt(0));
      expect(array[2]).to.be('o'.charCodeAt(0));
      expect(array[3]).to.be('b'.charCodeAt(0));
      expect(array[4]).to.be('a'.charCodeAt(0));
      expect(array[5]).to.be('r'.charCodeAt(0));
    });
  });
});
