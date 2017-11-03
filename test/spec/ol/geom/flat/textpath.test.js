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
    expect(instructions).to.eql([[40, 0, 5, 0, 'foo']]);
  });

  it('left-aligns text on a horizontal line', function() {
    var instructions = ol.geom.flat.textpath.lineString(
        horizontal, 0, horizontal.length, 2, 'foo', measure, 0, Infinity);
    expect(instructions).to.eql([[5, 0, 5, 0, 'foo']]);
  });

  it('right-aligns text on a horizontal line', function() {
    var startM = 100 - 30;
    var instructions = ol.geom.flat.textpath.lineString(
        horizontal, 0, horizontal.length, 2, 'foo', measure, startM, Infinity);
    expect(instructions).to.eql([[75, 0, 5, 0, 'foo']]);
  });

  it('draws text on a vertical line', function() {
    var startM = 50 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        vertical, 0, vertical.length, 2, 'foo', measure, startM, Infinity);
    var a = 90 * Math.PI / 180;
    expect(instructions).to.eql([[0, 40, 5, a, 'foo']]);
  });

  it('draws text on a diagonal line', function() {
    var startM = Math.sqrt(2) * 50 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        diagonal, 0, diagonal.length, 2, 'foo', measure, startM, Infinity);
    expect(instructions[0][3]).to.be(45 * Math.PI / 180);
    expect(instructions.length).to.be(1);
  });

  it('draws reverse text on a diagonal line', function() {
    var startM = Math.sqrt(2) * 50 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        reverse, 0, reverse.length, 2, 'foo', measure, startM, Infinity);
    expect(instructions[0][3]).to.be(-45 * Math.PI / 180);
    expect(instructions.length).to.be(1);
  });

  it('renders long text with extrapolation', function() {
    var startM = 50 - 75;
    var instructions = ol.geom.flat.textpath.lineString(
        horizontal, 0, horizontal.length, 2, 'foo-foo-foo-foo', measure, startM, Infinity);
    expect(instructions[0]).to.eql([-20, 0, 5, 0, 'foo-foo-foo-foo']);
    expect(instructions.length).to.be(1);
  });

  it('renders angled text', function() {
    var length = ol.geom.flat.length.lineString(angled, 0, angled.length, 2);
    var startM = length / 2 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        angled, 0, angled.length, 2, 'foo', measure, startM, Infinity);
    expect(instructions[0][3]).to.eql(45 * Math.PI / 180);
    expect(instructions[0][4]).to.be('fo');
    expect(instructions[1][3]).to.eql(-45 * Math.PI / 180);
    expect(instructions[1][4]).to.be('o');
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

  it('respects the offset option', function() {
    var length = ol.geom.flat.length.lineString(angled, 2, angled.length, 2);
    var startM = length / 2 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        angled, 2, angled.length, 2, 'foo', measure, startM, Infinity);
    expect(instructions[0][3]).to.be(-45 * Math.PI / 180);
    expect(instructions.length).to.be(1);
  });

  it('respects the end option', function() {
    var length = ol.geom.flat.length.lineString(angled, 0, 4, 2);
    var startM = length / 2 - 15;
    var instructions = ol.geom.flat.textpath.lineString(
        angled, 0, 4, 2, 'foo', measure, startM, Infinity);
    expect(instructions[0][3]).to.be(45 * Math.PI / 180);
    expect(instructions.length).to.be(1);
  });

});
