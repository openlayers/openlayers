goog.provide('ol.test.TileCoord');

goog.require('ol.tilecoord');
goog.require('ol.tilegrid.TileGrid');


describe('ol.TileCoord', function() {

  describe('create', function() {
    it('sets x y z properties as expected', function() {
      var tileCoord = [1, 2, 3];
      expect(tileCoord[0]).to.eql(1);
      expect(tileCoord[1]).to.eql(2);
      expect(tileCoord[2]).to.eql(3);
    });
  });

  describe('create from string', function() {
    it('sets x y z properties as expected', function() {
      var str = '1/2/3';
      var tileCoord = ol.tilecoord.createFromString(str);
      expect(tileCoord[0]).to.eql(1);
      expect(tileCoord[1]).to.eql(2);
      expect(tileCoord[2]).to.eql(3);
    });
  });

  describe('call quadKey', function() {
    it('returns expected string', function() {
      var tileCoord = [3, 3, 5];
      var s = ol.tilecoord.quadKey(tileCoord);
      expect(s).to.eql('213');
    });
  });

  describe('hash', function() {
    it('produces different hashes for different tile coords', function() {
      var tileCoord1 = [3, 2, 1];
      var tileCoord2 = [3, 1, 1];
      expect(ol.tilecoord.hash(tileCoord1)).not.to.eql(
          ol.tilecoord.hash(tileCoord2));
    });
  });

  describe('withinExtentAndZ', function() {

    it('restricts by z', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        extent: [10, 20, 30, 40],
        tileSize: 10,
        resolutions: [2, 1],
        minZoom: 1
      });
      expect(ol.tilecoord.withinExtentAndZ([0, 0, -1], tileGrid)).to.be(false);
      expect(ol.tilecoord.withinExtentAndZ([1, 0, -1], tileGrid)).to.be(true);
      expect(ol.tilecoord.withinExtentAndZ([2, 0, -1], tileGrid)).to.be(false);
    });

    it('restricts by extent when extent defines tile ranges', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        extent: [10, 20, 30, 40],
        sizes: [[3, -3]],
        tileSize: 10,
        resolutions: [1]
      });
      expect(ol.tilecoord.withinExtentAndZ([0, 1, -2], tileGrid)).to.be(true);
      expect(ol.tilecoord.withinExtentAndZ([0, 2, -1], tileGrid)).to.be(false);
      expect(ol.tilecoord.withinExtentAndZ([0, 0, -3], tileGrid)).to.be(false);
    });

    it('restricts by extent when sizes define tile ranges', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        origin: [10, 20],
        sizes: [[3, 3]],
        tileSize: 10,
        resolutions: [1]
      });
      expect(ol.tilecoord.withinExtentAndZ([0, 0, 0], tileGrid)).to.be(true);
      expect(ol.tilecoord.withinExtentAndZ([0, -1, 0], tileGrid)).to.be(false);
      expect(ol.tilecoord.withinExtentAndZ([0, 0, -1], tileGrid)).to.be(false);
      expect(ol.tilecoord.withinExtentAndZ([0, 2, 2], tileGrid)).to.be(true);
      expect(ol.tilecoord.withinExtentAndZ([0, 3, 0], tileGrid)).to.be(false);
      expect(ol.tilecoord.withinExtentAndZ([0, 0, 3], tileGrid)).to.be(false);
    });

    it('restricts by extent when sizes (neg y) define tile ranges', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        origin: [10, 40],
        sizes: [[3, -3]],
        tileSize: 10,
        resolutions: [1]
      });
      expect(ol.tilecoord.withinExtentAndZ([0, 0, -1], tileGrid)).to.be(true);
      expect(ol.tilecoord.withinExtentAndZ([0, -1, -1], tileGrid)).to.be(false);
      expect(ol.tilecoord.withinExtentAndZ([0, 0, 0], tileGrid)).to.be(false);
      expect(ol.tilecoord.withinExtentAndZ([0, 2, -3], tileGrid)).to.be(true);
      expect(ol.tilecoord.withinExtentAndZ([0, 3, -1], tileGrid)).to.be(false);
      expect(ol.tilecoord.withinExtentAndZ([0, 0, -4], tileGrid)).to.be(false);
    });

    it('does not restrict by extent with no extent or sizes', function() {
      var tileGrid = new ol.tilegrid.TileGrid({
        origin: [10, 20],
        tileSize: 10,
        resolutions: [1]
      });
      expect(ol.tilecoord.withinExtentAndZ([0, Infinity, 0], tileGrid))
          .to.be(true);
      expect(ol.tilecoord.withinExtentAndZ([0, 0, Infinity], tileGrid))
          .to.be(true);
      expect(ol.tilecoord.withinExtentAndZ([0, -Infinity, 0], tileGrid))
          .to.be(true);
      expect(ol.tilecoord.withinExtentAndZ([0, 0, Infinity], tileGrid))
          .to.be(true);
    });
  });

});
