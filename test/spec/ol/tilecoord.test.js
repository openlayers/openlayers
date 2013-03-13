goog.provide('ol.test.TileCoord');

describe('ol.TileCoord', function() {

  describe('create', function() {
    it('sets x y z properties as expected', function() {
      var tc = new ol.TileCoord(1, 2, 3);
      expect(tc.z).to.eql(1);
      expect(tc.x).to.eql(2);
      expect(tc.y).to.eql(3);
    });
  });

  describe('create from quad key', function() {
    it('sets x y z properties as expected', function() {
      var tc = ol.TileCoord.createFromQuadKey('213');
      expect(tc.z).to.eql(3);
      expect(tc.x).to.eql(3);
      expect(tc.y).to.eql(5);
    });
  });

  describe('create from string', function() {
    it('sets x y z properties as expected', function() {
      var str = '1/2/3';
      var tc = ol.TileCoord.createFromString(str);
      expect(tc.z).to.eql(1);
      expect(tc.x).to.eql(2);
      expect(tc.y).to.eql(3);
    });
  });

  describe('call quadKey', function() {
    it('returns expected string', function() {
      var tc = new ol.TileCoord(3, 3, 5);
      var s = tc.quadKey();
      expect(s).to.eql('213');
    });
  });

  describe('hash', function() {
    it('produces different hashes for different tile coords', function() {
      var tc1 = new ol.TileCoord(3, 2, 1);
      var tc2 = new ol.TileCoord(3, 1, 1);
      expect(tc1.hash()).not.to.eql(tc2.hash());
    });
  });
});

goog.require('ol.TileCoord');
