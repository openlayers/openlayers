goog.provide('ol.test.TileCoord');

describe('ol.TileCoord', function() {

  describe('create', function() {
    it('sets x y z properties as expected', function() {
      var tileCoord = [1, 2, 3];
      expect(tileCoord[0]).to.eql(1);
      expect(tileCoord[1]).to.eql(2);
      expect(tileCoord[2]).to.eql(3);
    });
  });

  describe('create from quad key', function() {
    it('sets x y z properties as expected', function() {
      var tileCoord = ol.tilecoord.createFromQuadKey('213');
      expect(tileCoord[0]).to.eql(3);
      expect(tileCoord[1]).to.eql(3);
      expect(tileCoord[2]).to.eql(5);
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
});

goog.require('ol.TileCoord');
goog.require('ol.tilecoord');
