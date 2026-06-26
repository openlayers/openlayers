import {assert} from 'chai';
import {
  fromString,
  isStringColor,
  lchaToRgba,
  rgbaToLcha,
} from '../../../../src/ol/color.js';
import {toFixed} from '../../../../src/ol/math.js';

describe('ol/color', () => {
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

        // hsl(a) varieties
        ['hsla(84, 51%, 87%, 0.7)', [225, 239, 205, 0.7]],
        ['hsl(46, 24%, 82%)', [220, 215, 198, 1]],
        ['hsl(50 80% 40%)', [184, 156, 20, 1]],
        ['hsl(150deg 30% 60%)', [122, 184, 153, 1]],
        ['hsl(0 80% 50% / 25%)', [230, 26, 26, 0.25]],
        ['hsl(210deg 68% 80.39%)', [171, 205, 239, 1]],

        // hwb
        ['hwb(50deg 30% 40%)', [153, 140, 77, 1]],

        // lch
        [
          'lch(from rgba(234 56 78 / 90%) l c h)',
          [234, 57, 78, toFixed(Math.round(0.9 * 255) / 255, 3)],
        ],
      ];
      for (const c of cases) {
        it(`works for ${c[0]}`, () => {
          assert.deepEqual(fromString(c[0]), c[1]);
        });
      }
    });

    describe('with invalid colors', () => {
      const cases = [
        'tuesday',
        'oops',
        'rgb(garbage)',
        'hsl(oops)',
        'rgba(42)',
        'hsla(5)',
      ];

      for (const c of cases) {
        it(`throws an error on ${c}`, () => {
          try {
            fromString(c);
            assert.fail();
          } catch (err) {
            assert.strictEqual(err.message, `failed to parse "${c}" as color`);
          }
        });
      }
    });
  });

  describe('isValid()', () => {
    it('correctly detects valid colors', () => {
      assert.strictEqual(isStringColor('lightgreen'), true);
      assert.strictEqual(isStringColor('yellow'), true);
      assert.strictEqual(isStringColor('GREEN'), true);
      assert.strictEqual(isStringColor('notacolor'), false);
      assert.strictEqual(isStringColor('red_'), false);
    });
  });

  describe('lch <=> rgb conversions', () => {
    const cases = [
      // lch to rgb
      'lch(54.29% 106.84 40.85)', // red
      'lch(87.73% 119.78 136.02)', // green
      'lch(29.57% 131.21 306.29)', // blue
      'lch(97.61% 94.48 102.85)', // yellow
      'lch(74.93% 106.84 70.85)', // orange
      'lch(29.78% 104.55 328.23)', // purple
      'lch(60.32% 96.98 328.23)', // violet
      'lch(100% 0 0)', // white
      'lch(0% 0 0)', // black
      'lch(90.14% 19.31 86.29)', // wheat
      'lch(51.87% 44.55 102.85)', // olive
    ];

    for (const lchString of cases) {
      it(`works for ${lchString}`, () => {
        let [l, c, h] = lchString.match(/lch\((.*)\)/)[1].split(' ');
        l = parseFloat(l.substring(0, l.length - 1));
        c = parseFloat(c);
        h = parseFloat(h);
        const rgba1 = fromString(lchString);
        const rgba2 = lchaToRgba([l, c, h, 1]);
        assert.deepEqual(rgba1, rgba2);

        const alpha = Math.random();
        const rgbaIn = [rgba1[0], rgba1[1], rgba1[2], alpha];
        const lcha = rgbaToLcha(rgbaIn);
        const rgbaOut = lchaToRgba(lcha);
        assert.deepEqual(rgbaOut, rgbaIn);
      });
    }
  });
});
