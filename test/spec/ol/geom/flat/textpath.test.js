goog.require('ol.geom.flat.textpath');
goog.require('ol.geom.flat.length');

describe('textpath', function() {

  var horizontal = [0, 0, 100, 0];
  var vertical = [0, 0, 0, 100];
  var diagonal = [0, 0, 100, 100];
  var reverse = [100, 0, 0, 100];
  var angled = [0, 0, 100, 100, 200, 0];
  var reverseangled = [151, 17, 163, 22, 159, 30, 150, 30, 143, 24, 151, 17];

  function measure(text) {
    return 10 * text.length;
  }

  it('center-aligns text on a horizontal line', function() {
    var startM = 50 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        horizontal, 0, horizontal.length, 2, 'foo', measure, startM, Infinity);
    expect(instructions).to.eql([[40, 0, 0], [50, 0, 0], [60, 0, 0]]);
  });

  it('left-aligns text on a horizontal line', function() {
    var instructions = ol.geom.flat.textpath.lineString(
        horizontal, 0, horizontal.length, 2, 'foo', measure, 0, Infinity);
    expect(instructions).to.eql([[5, 0, 0], [15, 0, 0], [25, 0, 0]]);
  });

  it('right-aligns text on a horizontal line', function() {
    var startM = 100 - 30;
    var instructions = ol.geom.flat.textpath.lineString(
        horizontal, 0, horizontal.length, 2, 'foo', measure, startM, Infinity);
    expect(instructions).to.eql([[75, 0, 0], [85, 0, 0], [95, 0, 0]]);
  });

  it('draws text on a vertical line', function() {
    var startM = 50 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        vertical, 0, vertical.length, 2, 'foo', measure, startM, Infinity);
    var a = 90 * Math.PI / 180;
    expect(instructions).to.eql([[0, 40, a], [0, 50, a], [0, 60, a]]);
  });

  it('draws text on a diagonal line', function() {
    var startM = Math.sqrt(2) * 50 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        diagonal, 0, diagonal.length, 2, 'foo', measure, startM, Infinity);
    expect(instructions[0][2]).to.be(45 * Math.PI / 180);
    expect(instructions[0][0]).to.be.lessThan(instructions[2][0]);
    expect(instructions[0][1]).to.be.lessThan(instructions[2][1]);
  });

  it('draws reverse text on a diagonal line', function() {
    var startM = Math.sqrt(2) * 50 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        reverse, 0, reverse.length, 2, 'foo', measure, startM, Infinity);
    expect(instructions[0][2]).to.be(-45 * Math.PI / 180);
    expect(instructions[0][0]).to.be.lessThan(instructions[2][0]);
    expect(instructions[0][1]).to.be.greaterThan(instructions[2][1]);
  });

  it('renders long text with extrapolation', function() {
    var startM = 50 - 75;
    var instructions = ol.geom.flat.textpath.lineString(
        horizontal, 0, horizontal.length, 2, 'foo-foo-foo-foo', measure, startM, Infinity);
    expect(instructions[0]).to.eql([-20, 0, 0]);
    expect(instructions[14]).to.eql([120, 0, 0]);
  });

  it('renders angled text', function() {
    var length = ol.geom.flat.length.lineString(angled, 0, angled.length, 2);
    var startM = length / 2 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        angled, 0, angled.length, 2, 'foo', measure, startM, Infinity);
    expect(instructions[0][2]).to.be(45 * Math.PI / 180);
    expect(instructions[2][2]).to.be(-45 * Math.PI / 180);
  });

  it('respects maxAngle', function() {
    var length = ol.geom.flat.length.lineString(angled, 0, angled.length, 2);
    var startM = length / 2 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        angled, 0, angled.length, 2, 'foo', measure, startM, Math.PI / 4);
    expect(instructions).to.be(null);
  });

  it('uses the smallest angle for maxAngleDelta', function() {
    var length = ol.geom.flat.length.lineString(reverseangled, 0, reverseangled.length, 2);
    var startM = length / 2 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        reverseangled, 0, reverseangled.length, 2, 'foo', measure, startM, Math.PI);
    expect(instructions).to.not.be(undefined);
  });

  it('respects the begin option', function() {
    var length = ol.geom.flat.length.lineString(angled, 2, angled.length, 2);
    var startM = length / 2 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        angled, 2, angled.length, 2, 'foo', measure, startM, Infinity);
    expect(instructions[1][0]).to.be(150);
  });

  it('respects the end option', function() {
    var length = ol.geom.flat.length.lineString(angled, 0, 4, 2);
    var startM = length / 2 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        angled, 0, 4, 2, 'foo', measure, startM, Infinity);
    expect(instructions[1][0]).to.be(50);
  });

  it('uses the provided result array', function() {
    var result = [];
    result[3] = undefined;
    var startM = 50 - 15;
    ol.geom.flat.textpath.lineString(
        horizontal, 0, horizontal.length, 2, 'foo', measure, startM, Infinity, result);
    expect(result).to.eql([[40, 0, 0], [50, 0, 0], [60, 0, 0], undefined]);
  });

});
