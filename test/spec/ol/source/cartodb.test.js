goog.provide('ol.test.source.CartoDBSource');

goog.require('ol.source.CartoDB');
goog.require('ol.source.XYZ');

describe('ol.source.CartoDB', function() {

  describe('constructor', function() {
    it('returns a CartoDB source', function() {
      var source = new ol.source.CartoDB({
        account: 'documentation',
        config: {}
      });
      expect(source).to.be.a(ol.source.XYZ);
      expect(source).to.be.a(ol.source.CartoDB);
    });
  });
});
