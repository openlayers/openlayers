goog.provide('ol.test.size');

goog.require('ol.size');


describe('ol.size', function() {

  describe('buffer()', function() {

    it('buffers a size', function() {
      var size = [50, 75];
      var bufferedSize = ol.size.buffer(size, 20);
      expect(bufferedSize).to.eql([90, 115]);
    });

    it('reuses an existing array', function() {
      var reuse = [0, 0];
      var size = [50, 50];
      var bufferedSize = ol.size.buffer(size, 20, reuse);
      expect(bufferedSize).to.equal(reuse);
    });

  });

  describe('hasArea()', function() {

    it('determines if a size has a positive area', function() {
      expect(ol.size.hasArea([50, 75])).to.equal(true);
      expect(ol.size.hasArea([0, 75])).to.equal(false);
      expect(ol.size.hasArea([50, 0])).to.equal(false);
      expect(ol.size.hasArea([0, 0])).to.equal(false);
      expect(ol.size.hasArea([-1, 75])).to.equal(false);
      expect(ol.size.hasArea([50, -1])).to.equal(false);
      expect(ol.size.hasArea([-1, -1])).to.equal(false);
    });

  });

  describe('scale()', function() {

    it('scales a size and rounds the result', function() {
      var size = [50, 75];
      var scaledSize = ol.size.scale(size, 1.75);
      expect(scaledSize).to.eql([88, 131]);
    });

    it('reuses an existing array', function() {
      var reuse = [0, 0];
      var size = [50, 50];
      var scaledSize = ol.size.scale(size, 1.75, reuse);
      expect(scaledSize).to.equal(reuse);
    });

  });

  describe('toSize()', function() {

    it('creates a size array from a number', function() {
      var size = ol.size.toSize(512);
      expect(size).to.eql([512, 512]);
    });

    it('reuses an existing array', function() {
      var sizeArray = [0, 0];
      var size = ol.size.toSize(512, sizeArray);
      expect(size).to.equal(sizeArray);
    });

    it('returns a size array unaltered', function() {
      var sizeArray = [512, 256];
      var size = ol.size.toSize(sizeArray);
      expect(size).to.equal(sizeArray);
      size = ol.size.toSize(sizeArray, [0, 0]);
      expect(size).to.equal(sizeArray);
    });

  });

});
