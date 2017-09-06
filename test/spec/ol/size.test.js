

import _ol_size_ from '../../../src/ol/size';


describe('ol.size', function() {

  describe('buffer()', function() {

    it('buffers a size', function() {
      var size = [50, 75];
      var bufferedSize = _ol_size_.buffer(size, 20);
      expect(bufferedSize).to.eql([90, 115]);
    });

    it('reuses an existing array', function() {
      var reuse = [0, 0];
      var size = [50, 50];
      var bufferedSize = _ol_size_.buffer(size, 20, reuse);
      expect(bufferedSize).to.equal(reuse);
    });

  });

  describe('hasArea()', function() {

    it('determines if a size has a positive area', function() {
      expect(_ol_size_.hasArea([50, 75])).to.equal(true);
      expect(_ol_size_.hasArea([0, 75])).to.equal(false);
      expect(_ol_size_.hasArea([50, 0])).to.equal(false);
      expect(_ol_size_.hasArea([0, 0])).to.equal(false);
      expect(_ol_size_.hasArea([-1, 75])).to.equal(false);
      expect(_ol_size_.hasArea([50, -1])).to.equal(false);
      expect(_ol_size_.hasArea([-1, -1])).to.equal(false);
    });

  });

  describe('scale()', function() {

    it('scales a size and rounds the result', function() {
      var size = [50, 75];
      var scaledSize = _ol_size_.scale(size, 1.75);
      expect(scaledSize).to.eql([88, 131]);
    });

    it('reuses an existing array', function() {
      var reuse = [0, 0];
      var size = [50, 50];
      var scaledSize = _ol_size_.scale(size, 1.75, reuse);
      expect(scaledSize).to.equal(reuse);
    });

  });

  describe('toSize()', function() {

    it('creates a size array from a number', function() {
      var size = _ol_size_.toSize(512);
      expect(size).to.eql([512, 512]);
    });

    it('reuses an existing array', function() {
      var sizeArray = [0, 0];
      var size = _ol_size_.toSize(512, sizeArray);
      expect(size).to.equal(sizeArray);
    });

    it('returns a size array unaltered', function() {
      var sizeArray = [512, 256];
      var size = _ol_size_.toSize(sizeArray);
      expect(size).to.equal(sizeArray);
      size = _ol_size_.toSize(sizeArray, [0, 0]);
      expect(size).to.equal(sizeArray);
    });

  });

});
