import {
  asArray,
  asString,
  fromString,
  isStringColor,
  normalize,
  toString,
} from '../../../src/ol/color.js';
import expect from '../expect.js';

describe('ol/color', () => {
  describe('asArray()', () => {
    it('returns the same for an array', () => {
      const color = [1, 2, 3, 0.4];
      const got = asArray(color);
      expect(got).to.be(color);
    });

    it('returns an array given an rgba string', () => {
      const color = asArray('rgba(1,2,3,0.4)');
      expect(color).to.eql([1, 2, 3, 0.4]);
    });

    it('returns an array given an rgb string', () => {
      const color = asArray('rgb(1,2,3)');
      expect(color).to.eql([1, 2, 3, 1]);
    });

    it('returns an array given a hex string', () => {
      const color = asArray('#00ccff');
      expect(color).to.eql([0, 204, 255, 1]);
    });

    it('returns an array given a hex string with alpha', () => {
      const color = asArray('#00ccffb0');
      expect(color).to.eql([0, 204, 255, 176 / 255]);
    });
  });

  describe('asString()', () => {
    it('returns the same for a string', () => {
      const color = 'rgba(0,1,2,0.3)';
      const got = asString(color);
      expect(got).to.be(color);
    });

    it('returns a string given an rgba array', () => {
      const color = asString([1, 2, 3, 0.4]);
      expect(color).to.eql('rgba(1,2,3,0.4)');
    });

    it('returns a string given an rgb array', () => {
      const color = asString([1, 2, 3]);
      expect(color).to.eql('rgba(1,2,3,1)');
    });
  });

  describe('fromString()', () => {
    describe('parses a variety of formats', () => {
      const cases = [
        // named colors
        ['red', [255, 0, 0, 1]],
        ['green', [0, 128, 0, 1]],
        ['blue', [0, 0, 255, 1]],
        ['yellow', [255, 255, 0, 1]],
        ['orange', [255, 165, 0, 1]],
        ['purple', [128, 0, 128, 1]],
        ['violet', [238, 130, 238, 1]],
        ['white', [255, 255, 255, 1]],
        ['black', [0, 0, 0, 1]],
        ['wheat', [245, 222, 179, 1]],
        ['olive', [128, 128, 0, 1]],
        ['transparent', [0, 0, 0, 0]],
        ['oops', 'failed to parse "oops" as color'],

        // rgb(a) varieties
        ['rgba(255,122,127,0.8)', [255, 122, 127, 0.8]],
        ['rgb(255 122 127 / 80%)', [255, 122, 127, 0.8]],
        ['rgb(255 122 127 / .2)', [255, 122, 127, 0.2]],
        ['rgb(30% 20% 50%)', [77, 51, 128, 1]],

        // hsl(a) varieties
        ['hsla(84, 51%, 87%, 0.7)', [225, 239, 205, 0.7]],
        ['hsl(46, 24%, 82%)', [220, 215, 198, 1]],
        ['hsl(50 80% 40%)', [184, 156, 20, 1]],
        ['hsl(150deg 30% 60%)', [122, 184, 153, 1]],
        ['hsl(0 80% 50% / 25%)', [230, 25, 25, 0.25]],

        // hwb
        ['hwb(50deg 30% 40%)', [133, 122, 71, 1]],
      ];
      for (const c of cases) {
        it(`works for ${c[0]}`, () => {
          const expected = c[1];
          if (typeof expected === 'string') {
            expect(() => {
              fromString(c[0]);
            }).to.throwException((e) => {
              expect(e.message).to.be(expected);
            });
            return;
          }
          expect(fromString(c[0])).to.eql(c[1]);
        });
      }
    });

    it('can parse 3-digit hex colors', () => {
      expect(fromString('#087')).to.eql([0, 136, 119, 1]);
    });

    it('can parse 4-digit hex colors', () => {
      expect(fromString('#0876')).to.eql([0, 136, 119, 102 / 255]);
    });

    it('can parse 6-digit hex colors', () => {
      expect(fromString('#56789a')).to.eql([86, 120, 154, 1]);
    });

    it('can parse 8-digit hex colors', () => {
      expect(fromString('#56789acc')).to.eql([86, 120, 154, 204 / 255]);
    });

    it('can parse rgb colors', () => {
      expect(fromString('rgb(0, 0, 255)')).to.eql([0, 0, 255, 1]);
    });

    it('ignores whitespace before, between & after numbers (rgb)', () => {
      expect(fromString('rgb( \t 0  ,   0 \n , 255  )')).to.eql([0, 0, 255, 1]);
    });

    it('can parse rgba colors', () => {
      // opacity 0
      expect(fromString('rgba(255, 255, 0, 0)')).to.eql([255, 255, 0, 0]);
      // opacity 0.0 (simple float)
      expect(fromString('rgba(255, 255, 0, 0.0)')).to.eql([255, 255, 0, 0]);
      // opacity 0.0000000000000000 (float with 16 digits)
      expect(fromString('rgba(255, 255, 0, 0.0000000000000000)')).to.eql([
        255, 255, 0, 0,
      ]);
      // opacity 0.1 (simple float)
      expect(fromString('rgba(255, 255, 0, 0.1)')).to.eql([255, 255, 0, 0.1]);
      // opacity 0.1111111111111111 (float with 16 digits)
      expect(fromString('rgba(255, 255, 0, 0.1111111111111111)')).to.eql([
        255, 255, 0, 0.1111111111111111,
      ]);
      // opacity 1
      expect(fromString('rgba(255, 255, 0, 1)')).to.eql([255, 255, 0, 1]);
      // opacity 1.0
      expect(fromString('rgba(255, 255, 0, 1.0)')).to.eql([255, 255, 0, 1]);
      // opacity 1.0000000000000000
      expect(fromString('rgba(255, 255, 0, 1.0000000000000000)')).to.eql([
        255, 255, 0, 1,
      ]);
      // with 30 decimal digits
      expect(
        fromString('rgba(255, 255, 0, 0.123456789012345678901234567890)'),
      ).to.eql([255, 255, 0, 0.12345678901234567890123456789]);
    });

    it('ignores whitespace before, between & after numbers (rgba)', () => {
      expect(fromString('rgba( \t 0  ,   0 \n ,   255  ,   0.4711   )')).to.eql(
        [0, 0, 255, 0.4711],
      );
    });

    describe('with invalid colors', () => {
      const cases = [
        'tuesday',
        'rgb(garbage)',
        'hsl(oops)',
        'rgba(42)',
        'hsla(5)',
      ];

      for (const c of cases) {
        it(`throws an error on ${c}`, () => {
          try {
            const color = fromString(c);
            expect().fail(`Expected an error, got ${color}`);
          } catch (err) {
            expect(err.message).to.be(`failed to parse "${c}" as color`);
          }
        });
      }
    });
  });

  describe('normalize()', () => {
    it('clamps out-of-range channels', () => {
      expect(normalize([-1, 256, 0, 2])).to.eql([0, 255, 0, 1]);
    });

    it('rounds color channels to integers', () => {
      expect(normalize([1.2, 2.5, 3.7, 1])).to.eql([1, 3, 4, 1]);
    });
  });

  describe('toString()', () => {
    it('converts valid colors', () => {
      expect(toString([1, 2, 3, 0.4])).to.be('rgba(1,2,3,0.4)');
    });

    it('rounds to integers if needed', () => {
      expect(toString([1.2, 2.5, 3.7, 0.4])).to.be('rgba(1,3,4,0.4)');
    });

    it('sets default alpha value if undefined', () => {
      expect(toString([0, 0, 0])).to.be('rgba(0,0,0,1)');
    });
  });

  describe('isValid()', () => {
    it('correctly detects valid colors', () => {
      expect(isStringColor('rgba(1,3,4,0.4)')).to.be(true);
      expect(isStringColor('rgb(1,3,4)')).to.be(true);
      expect(isStringColor('lightgreen')).to.be(true);
      expect(isStringColor('yellow')).to.be(true);
      expect(isStringColor('GREEN')).to.be(true);
      expect(isStringColor('notacolor')).to.be(false);
      expect(isStringColor('red_')).to.be(false);
    });
  });
});
