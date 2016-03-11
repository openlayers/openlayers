goog.provide('ol.test.source.Source');

describe('ol.source.Source', function() {

  describe('constructor', function() {
    it('returns a source', function() {
      var source = new ol.source.Source({
        projection: ol.proj.get('EPSG:4326')
      });
      expect(source).to.be.a(ol.source.Source);
    });
  });

  describe('#refresh()', function() {
    it('dispatches the change event', function() {
      var source = new ol.source.Source({
        projection: ol.proj.get('EPSG:4326')
      });
      var changedSpy = sinon.spy();
      source.on('change', changedSpy);
      source.refresh();
      expect(changedSpy.called).to.be.ok();
    });
  });

});

goog.require('ol.proj');
goog.require('ol.source.Source');
