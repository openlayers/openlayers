describe('ol.TileCoord', function() {

  describe('create', function() {
    it('sets x y z properties as expected', function() {
      var tc = new ol.TileCoord(1, 2, 3);
      expect(tc.z).toEqual(1);
      expect(tc.x).toEqual(2);
      expect(tc.y).toEqual(3);
    });
  });

  describe('create from quad key', function() {
    it('sets x y z properties as expected', function() {
      var tc = ol.TileCoord.createFromQuadKey('213');
      expect(tc.z).toEqual(3);
      expect(tc.x).toEqual(3);
      expect(tc.y).toEqual(5);
    });
  });

  describe('create from string', function() {
    it('sets x y z properties as expected', function() {
      var str = '1/2/3';
      var tc = ol.TileCoord.createFromString(str);
      expect(tc.z).toEqual(1);
      expect(tc.x).toEqual(2);
      expect(tc.y).toEqual(3);
    });
  });

  describe('call quadKey', function() {
    it('returns expected string', function() {
      var tc = new ol.TileCoord(3, 3, 5);
      var s = tc.quadKey();
      expect(s).toEqual('213');
    });
  });

  describe('hash', function() {
    it('produces different hashes for different tile coords', function() {
      var tc1 = new ol.TileCoord(3, 2, 1);
      var tc2 = new ol.TileCoord(3, 1, 1);
      expect(tc1.hash()).not.toEqual(tc2.hash());
    });
  });
});

goog.require('ol.TileCoord');
