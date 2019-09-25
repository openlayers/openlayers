import {drawTextOnPath} from '../../../../../src/ol/geom/flat/textpath.js';
import {lineStringLength} from '../../../../../src/ol/geom/flat/length.js';

describe('ol.geom.flat.drawTextOnPath', () => {

  const horizontal = [0, 0, 100, 0];
  const vertical = [0, 0, 0, 100];
  const diagonal = [0, 0, 100, 100];
  const reverse = [100, 0, 0, 100];
  const angled = [0, 0, 100, 100, 200, 0];
  const reverseangled = [151, 17, 163, 22, 159, 30, 150, 30, 143, 24, 151, 17];

  function measureAndCacheTextWidth(font, text, cache) {
    return 10 * text.length;
  }

  test('center-aligns text on a horizontal line', () => {
    const startM = 50 - 15;
    const instructions = drawTextOnPath(
      horizontal, 0, horizontal.length, 2, 'foo', startM, Infinity, 1, measureAndCacheTextWidth, '', {});
    expect(instructions).toEqual([[40, 0, 5, 0, 'foo']]);
  });

  test('left-aligns text on a horizontal line', () => {
    const instructions = drawTextOnPath(
      horizontal, 0, horizontal.length, 2, 'foo', 0, Infinity, 1, measureAndCacheTextWidth, '', {});
    expect(instructions).toEqual([[5, 0, 5, 0, 'foo']]);
  });

  test('right-aligns text on a horizontal line', () => {
    const startM = 100 - 30;
    const instructions = drawTextOnPath(
      horizontal, 0, horizontal.length, 2, 'foo', startM, Infinity, 1, measureAndCacheTextWidth, '', {});
    expect(instructions).toEqual([[75, 0, 5, 0, 'foo']]);
  });

  test('draws text on a vertical line', () => {
    const startM = 50 - 15;
    const instructions = drawTextOnPath(
      vertical, 0, vertical.length, 2, 'foo', startM, Infinity, 1, measureAndCacheTextWidth, '', {});
    const a = 90 * Math.PI / 180;
    expect(instructions).toEqual([[0, 40, 5, a, 'foo']]);
  });

  test('draws text on a diagonal line', () => {
    const startM = Math.sqrt(2) * 50 - 15;
    const instructions = drawTextOnPath(
      diagonal, 0, diagonal.length, 2, 'foo', startM, Infinity, 1, measureAndCacheTextWidth, '', {});
    expect(instructions[0][3]).toBe(45 * Math.PI / 180);
    expect(instructions.length).toBe(1);
  });

  test('draws reverse text on a diagonal line', () => {
    const startM = Math.sqrt(2) * 50 - 15;
    const instructions = drawTextOnPath(
      reverse, 0, reverse.length, 2, 'foo', startM, Infinity, 1, measureAndCacheTextWidth, '', {});
    expect(instructions[0][3]).toBe(-45 * Math.PI / 180);
    expect(instructions.length).toBe(1);
  });

  test('renders long text with extrapolation', () => {
    const startM = 50 - 75;
    const instructions = drawTextOnPath(
      horizontal, 0, horizontal.length, 2, 'foo-foo-foo-foo', startM, Infinity, 1, measureAndCacheTextWidth, '', {});
    expect(instructions[0]).toEqual([-20, 0, 5, 0, 'foo-foo-foo-foo']);
    expect(instructions.length).toBe(1);
  });

  test('renders angled text', () => {
    const length = lineStringLength(angled, 0, angled.length, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      angled, 0, angled.length, 2, 'foo', startM, Infinity, 1, measureAndCacheTextWidth, '', {});
    expect(instructions[0][3]).toEqual(45 * Math.PI / 180);
    expect(instructions[0][4]).toBe('f');
    expect(instructions[1][3]).toEqual(45 * Math.PI / 180);
    expect(instructions[1][4]).toBe('o');
    expect(instructions[2][3]).toEqual(-45 * Math.PI / 180);
    expect(instructions[2][4]).toBe('o');
  });

  test('respects maxAngle', () => {
    const length = lineStringLength(angled, 0, angled.length, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      angled, 0, angled.length, 2, 'foo', startM, Math.PI / 4, 1, measureAndCacheTextWidth, '', {});
    expect(instructions).toBe(null);
  });

  test('uses the smallest angle for maxAngleDelta', () => {
    const length = lineStringLength(reverseangled, 0, reverseangled.length, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      reverseangled, 0, reverseangled.length, 2, 'foo', startM, Math.PI, 1, measureAndCacheTextWidth, '', {});
    expect(instructions).not.toBe(undefined);
  });

  test('respects the offset option', () => {
    const length = lineStringLength(angled, 2, angled.length, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      angled, 2, angled.length, 2, 'foo', startM, Infinity, 1, measureAndCacheTextWidth, '', {});
    expect(instructions[0][3]).toBe(-45 * Math.PI / 180);
    expect(instructions.length).toBe(1);
  });

  test('respects the end option', () => {
    const length = lineStringLength(angled, 0, 4, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      angled, 0, 4, 2, 'foo', startM, Infinity, 1, measureAndCacheTextWidth, '', {});
    expect(instructions[0][3]).toBe(45 * Math.PI / 180);
    expect(instructions.length).toBe(1);
  });

});
