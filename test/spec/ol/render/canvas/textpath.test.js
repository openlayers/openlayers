import {drawTextOnPath} from '../../../../../src/ol/render/canvas/textpath.js';
import {lineStringLength} from '../../../../../src/ol/geom/flat/length.js';
import {isEmpty} from '../../../../../src/ol/obj.js';

describe('ol.geom.flat.drawTextOnPath', function() {

  const horizontal = [0, 0, 100, 0];
  const vertical = [0, 0, 0, 100];
  const diagonal = [0, 0, 100, 100];
  const reverse = [100, 0, 0, 100];
  const angled = [0, 0, 100, 100, 200, 0];
  const reverseangled = [151, 17, 163, 22, 159, 30, 150, 30, 143, 24, 151, 17];
  const font = '10px sans-serif';
  const textScale = 1;
  const measurePixelRatio = 1;

  /**
  * @param {string} text Thet text to measure.
  * @param {number} _textScale The scale.
  * @param {number} _measurePixelRatio The pixel ratio.
  * @param {string} _font The font.
  * @param {Object<string, number>} _widths Already measured widths.
  * @return {number} The width of the text.
  */
  function measure(text, _textScale, _measurePixelRatio, _font, _widths) {
    expect(_textScale).to.equal(textScale);
    expect(_font).to.equal(font);
    expect(isEmpty(_widths)).to.be(true);
    return 10 * text.length;
  }

  beforeEach(function() {
    // Use a stubbed measure to get predictable results.
    sinon.stub(drawTextOnPath, 'measure_').callsFake(measure);
  });

  this.afterEach(function() {
    drawTextOnPath.measure_.restore();
  });

  it('center-aligns text on a horizontal line', function() {
    const startM = 50 - 15;
    const instructions = drawTextOnPath(
      horizontal, 0, horizontal.length, 2, 'foo', textScale, measurePixelRatio, font, {}, startM, Infinity);
    expect(instructions).to.eql([[40, 0, 5, 0, 'foo']]);
  });

  it('left-aligns text on a horizontal line', function() {
    const instructions = drawTextOnPath(
      horizontal, 0, horizontal.length, 2, 'foo', textScale, measurePixelRatio, font, {}, 0, Infinity);
    expect(instructions).to.eql([[5, 0, 5, 0, 'foo']]);
  });

  it('right-aligns text on a horizontal line', function() {
    const startM = 100 - 30;
    const instructions = drawTextOnPath(
      horizontal, 0, horizontal.length, 2, 'foo', textScale, measurePixelRatio, font, {}, startM, Infinity);
    expect(instructions).to.eql([[75, 0, 5, 0, 'foo']]);
  });

  it('draws text on a vertical line', function() {
    const startM = 50 - 15;
    const instructions = drawTextOnPath(
      vertical, 0, vertical.length, 2, 'foo', textScale, measurePixelRatio, font, {}, startM, Infinity);
    const a = 90 * Math.PI / 180;
    expect(instructions).to.eql([[0, 40, 5, a, 'foo']]);
  });

  it('draws text on a diagonal line', function() {
    const startM = Math.sqrt(2) * 50 - 15;
    const instructions = drawTextOnPath(
      diagonal, 0, diagonal.length, 2, 'foo', textScale, measurePixelRatio, font, {}, startM, Infinity);
    expect(instructions[0][3]).to.be(45 * Math.PI / 180);
    expect(instructions.length).to.be(1);
  });

  it('draws reverse text on a diagonal line', function() {
    const startM = Math.sqrt(2) * 50 - 15;
    const instructions = drawTextOnPath(
      reverse, 0, reverse.length, 2, 'foo', textScale, measurePixelRatio, font, {}, startM, Infinity);
    expect(instructions[0][3]).to.be(-45 * Math.PI / 180);
    expect(instructions.length).to.be(1);
  });

  it('renders long text with extrapolation', function() {
    const startM = 50 - 75;
    const instructions = drawTextOnPath(
      horizontal, 0, horizontal.length, 2, 'foo-foo-foo-foo', textScale, measurePixelRatio, font, {}, startM, Infinity);
    expect(instructions[0]).to.eql([-20, 0, 5, 0, 'foo-foo-foo-foo']);
    expect(instructions.length).to.be(1);
  });

  it('renders angled text', function() {
    const length = lineStringLength(angled, 0, angled.length, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      angled, 0, angled.length, 2, 'foo', textScale, measurePixelRatio, font, {}, startM, Infinity);
    expect(instructions[0][3]).to.eql(45 * Math.PI / 180);
    expect(instructions[0][4]).to.be('fo');
    expect(instructions[1][3]).to.eql(-45 * Math.PI / 180);
    expect(instructions[1][4]).to.be('o');
  });

  it('respects maxAngle', function() {
    const length = lineStringLength(angled, 0, angled.length, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      angled, 0, angled.length, 2, 'foo', textScale, measurePixelRatio, font, {}, startM, Math.PI / 4);
    expect(instructions).to.be(null);
  });

  it('uses the smallest angle for maxAngleDelta', function() {
    const length = lineStringLength(reverseangled, 0, reverseangled.length, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      reverseangled, 0, reverseangled.length, 2, 'foo', textScale, measurePixelRatio, font, {}, startM, Math.PI);
    expect(instructions).to.not.be(undefined);
  });

  it('respects the offset option', function() {
    const length = lineStringLength(angled, 2, angled.length, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      angled, 2, angled.length, 2, 'foo', textScale, measurePixelRatio, font, {}, startM, Infinity);
    expect(instructions[0][3]).to.be(-45 * Math.PI / 180);
    expect(instructions.length).to.be(1);
  });

  it('respects the end option', function() {
    const length = lineStringLength(angled, 0, 4, 2);
    const startM = length / 2 - 15;
    const instructions = drawTextOnPath(
      angled, 0, 4, 2, 'foo', textScale, measurePixelRatio, font, {}, startM, Infinity);
    expect(instructions[0][3]).to.be(45 * Math.PI / 180);
    expect(instructions.length).to.be(1);
  });

});
