import {
  asArray,
  asString,
  fromString,
  isStringColor,
  lchaToRgba,
  rgbaToLcha,
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
        // rgb(a) varieties
        ['rgb(30% 20% 50%)', [77, 51, 128, 1]],
        ['rgba(30%, 20%, 50%, 80%)', [77, 51, 128, 0.8]],
        ['rgba(255,122,127,0.8)', [255, 122, 127, 0.8]],
        ['rgb(255, 122, 127)', [255, 122, 127, 1]],
        ['rgb(255 122 127 / .2)', [255, 122, 127, 0.2]],
        ['rgb(255 122 127 / 80%)', [255, 122, 127, 0.8]],
        // other color spaces and formats require the DOM, see test/browser/spec/ol/color.test.js
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

  describe('with invalid colors', () => {
    const cases = [
      '#ab',
      '#xyz123',
      'rgb(0%,0,0)',
      'rgb(0 0,0)',
      'rgba(0,0,0/0)',
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

  describe('isValid()', () => {
    it('correctly detects valid colors', () => {
      expect(isStringColor('rgba(1,3,4,0.4)')).to.be(true);
      expect(isStringColor('rgb(1,3,4)')).to.be(true);
    });
  });

  describe('lch <-> rgb conversion yields same results as the reference implementation', () => {
    // Reference implementation from
    // https://stackoverflow.com/questions/7530627/hcl-color-to-rgb-and-backward/67219995#67219995
    const rgb255 = (v) => (v < 255 ? (v > 0 ? v : 0) : 255);
    const b1 = (v) =>
      v > 0.0031308 ? v ** (1 / 2.4) * 269.025 - 14.025 : v * 3294.6;
    const b2 = (v) => (v > 0.2068965 ? v ** 3 : (v - 4 / 29) * (108 / 841));
    const a1 = (v) =>
      v > 10.314724 ? ((v + 14.025) / 269.025) ** 2.4 : v / 3294.6;
    const a2 = (v) => (v > 0.0088564 ? v ** (1 / 3) : v / (108 / 841) + 4 / 29);

    function fromHCL(h, c, l) {
      const y = b2((l = (l + 16) / 116));
      const x = b2(l + (c / 500) * Math.cos((h *= Math.PI / 180)));
      const z = b2(l - (c / 200) * Math.sin(h));
      return [
        rgb255(b1(x * 3.021973625 - y * 1.617392459 - z * 0.404875592)),
        rgb255(b1(x * -0.943766287 + y * 1.916279586 + z * 0.027607165)),
        rgb255(b1(x * 0.069407491 - y * 0.22898585 + z * 1.159737864)),
      ];
    }

    function toHCL(r, g, b) {
      const y = a2(
        (r = a1(r)) * 0.222488403 +
          (g = a1(g)) * 0.716873169 +
          (b = a1(b)) * 0.06060791,
      );
      const l =
        500 * (a2(r * 0.452247074 + g * 0.399439023 + b * 0.148375274) - y);
      const q =
        200 * (y - a2(r * 0.016863605 + g * 0.117638439 + b * 0.865350722));
      const h = Math.atan2(q, l) * (180 / Math.PI);
      return [h < 0 ? h + 360 : h, Math.sqrt(l * l + q * q), 116 * y - 16];
    }

    it('returns the same values for rgb -> lch -> rgb', () => {
      const cases = [
        [255, 0, 0], // red
        [0, 255, 0], // green
        [0, 0, 255], // blue
        [255, 255, 0], // yellow
        [0, 255, 255], // cyan
        [255, 0, 255], // magenta
        [192, 192, 192], // silver
        [128, 128, 128], // gray
        [128, 0, 0], // maroon
        [128, 128, 0], // olive
        [0, 128, 0], // dark green
        [128, 0, 128], // purple
        [0, 128, 128], // teal
        [0, 0, 128], // navy
      ];
      for (const rgb of cases) {
        const [h, c, l] = toHCL(...rgb);
        const lch1 = [l, c, h];
        const lch2 = rgbaToLcha([...rgb, 1]).slice(0, 3);
        expect(lch2).to.eql(lch1);
        const rgb1 = fromHCL(lch1[2], lch1[1], lch1[0]).map(Math.round);
        const rgb2 = lchaToRgba([...lch1, 1]).slice(0, 3);
        expect(rgb2).to.eql(rgb1);
        expect(rgb1).to.eql(rgb);
      }
    });
  });
});
