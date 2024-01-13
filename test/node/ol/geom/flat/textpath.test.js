import expect from '../../../expect.js';
import {drawTextOnPath} from '../../../../../src/ol/geom/flat/textpath.js';
import {lineStringLength} from '../../../../../src/ol/geom/flat/length.js';

describe('ol/geom/flat/drawTextOnPath.js', function () {
  const horizontal = [0, 0, 100, 0];
  const vertical = [0, 0, 0, 100];
  const diagonal = [0, 0, 100, 100];
  const reverse = [100, 0, 0, 100];
  const angled = [0, 0, 100, 100, 200, 0];
  const reverseangled = [151, 17, 163, 22, 159, 30, 150, 30, 143, 24, 151, 17];

  function measureAndCacheTextWidth(font, text, cache) {
    return 10 * text.length;
  }

  it('center-aligns text on a horizontal line', function () {
    const startM = 50 - 15;
    const instructions = drawTextOnPath(
      horizontal,
      0,
      horizontal.length,
      2,
      'foo',
      startM,
      Infinity,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions).to.eql([[50, 0, 15, 0, 'foo']]);
  });

  it('left-aligns text on a horizontal line', function () {
    const instructions = drawTextOnPath(
      horizontal,
      0,
      horizontal.length,
      2,
      'foo',
      0,
      Infinity,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions).to.eql([[15, 0, 15, 0, 'foo']]);
  });

  it('right-aligns text on a horizontal line', function () {
    const startM = 100 - 30;
    const instructions = drawTextOnPath(
      horizontal,
      0,
      horizontal.length,
      2,
      'foo',
      startM,
      Infinity,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions).to.eql([[85, 0, 15, 0, 'foo']]);
  });

  it('draws text on a vertical line', function () {
    const startM = 50 - 15;
    const instructions = drawTextOnPath(
      vertical,
      0,
      vertical.length,
      2,
      'foo',
      startM,
      Infinity,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    const a = (90 * Math.PI) / 180;
    expect(instructions).to.eql([[0, 50, 15, a, 'foo']]);
  });

  it('draws text on a diagonal line', function () {
    const startM = Math.sqrt(2) * 50 - 15;
    const instructions = drawTextOnPath(
      diagonal,
      0,
      diagonal.length,
      2,
      'foo',
      startM,
      Infinity,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions[0][3]).to.be((45 * Math.PI) / 180);
    expect(instructions.length).to.be(1);
  });

  it('draws reverse text on a diagonal line', function () {
    const startM = Math.sqrt(2) * 50 - 15;
    const instructions = drawTextOnPath(
      reverse,
      0,
      reverse.length,
      2,
      'foo',
      startM,
      Infinity,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions[0][3]).to.be((-45 * Math.PI) / 180);
    expect(instructions.length).to.be(1);
  });

  it('renders long text with extrapolation', function () {
    const startM = 50 - 75;
    const instructions = drawTextOnPath(
      horizontal,
      0,
      horizontal.length,
      2,
      'foo-foo-foo-foo',
      startM,
      Infinity,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions[0]).to.eql([50, 0, 75, 0, 'foo-foo-foo-foo']);
    expect(instructions.length).to.be(1);
  });

  it('renders angled text', function () {
    const length = lineStringLength(angled, 0, angled.length, 2);
    const startM = length / 2 - 20;
    const instructions = drawTextOnPath(
      angled,
      0,
      angled.length,
      2,
      'fooo',
      startM,
      Infinity,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions[0][3]).to.eql((45 * Math.PI) / 180);
    expect(instructions[0][4]).to.be('fo');
    expect(instructions[1][3]).to.eql((-45 * Math.PI) / 180);
    expect(instructions[1][4]).to.be('oo');
  });

  it('respects maxAngle', function () {
    const length = lineStringLength(angled, 0, angled.length, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      angled,
      0,
      angled.length,
      2,
      'foo',
      startM,
      Math.PI / 4,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions).to.be(null);
  });

  it('uses the smallest angle for maxAngleDelta', function () {
    const length = lineStringLength(reverseangled, 0, reverseangled.length, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      reverseangled,
      0,
      reverseangled.length,
      2,
      'foo',
      startM,
      Math.PI,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions).to.not.be(undefined);
  });

  it('respects the offset option', function () {
    const length = lineStringLength(angled, 2, angled.length, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      angled,
      2,
      angled.length,
      2,
      'foo',
      startM,
      Infinity,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions[0][3]).to.be((-45 * Math.PI) / 180);
    expect(instructions.length).to.be(1);
  });

  it('respects the end option', function () {
    const length = lineStringLength(angled, 0, 4, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      angled,
      0,
      4,
      2,
      'foo',
      startM,
      Infinity,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions[0][3]).to.be((45 * Math.PI) / 180);
    expect(instructions.length).to.be(1);
  });

  it('renders multi-line in one segment', function () {
    const foo = 'foo';
    const bar = 'bar';
    const text = foo + '\n' + bar;
    const pathLength = lineStringLength(angled, 2, angled.length, 2);
    const textLength = measureAndCacheTextWidth('', bar);
    const textAlign = 0.5;
    const startM = (pathLength - textLength) * textAlign;
    const instructions = drawTextOnPath(
      angled,
      0,
      angled.length,
      2,
      text,
      startM,
      Infinity,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions[0][3]).to.be((45 * Math.PI) / 180);
    expect(instructions[0][4]).to.be(text);
    expect(instructions.length).to.be(1);
  });

  it('renders multi-line as single-line across segments', function () {
    const foo = 'foo-foo-foo';
    const bar = 'bar-bar-bar-bar-bar-bar-bar';
    const text = foo + '\n' + bar;
    const pathLength = lineStringLength(angled, 2, angled.length, 2);
    const textLength = measureAndCacheTextWidth('', bar);
    const textAlign = 0.5;
    const startM = (pathLength - textLength) * textAlign;

    const instructions = drawTextOnPath(
      angled,
      0,
      angled.length,
      2,
      text,
      startM,
      Infinity,
      1,
      measureAndCacheTextWidth,
      '',
      {},
    );
    expect(instructions[0][3]).to.be((45 * Math.PI) / 180);
    expect(instructions[0][4]).to.be('foo-foo-foo bar-bar-b');
    expect(instructions.length).to.be(2);
    expect(instructions[1][3]).to.be((-45 * Math.PI) / 180);
    expect(instructions[1][4]).to.be('ar-bar-bar-bar-bar');
  });
});
