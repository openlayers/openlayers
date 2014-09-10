goog.provide('ol.test.source.ServerVector');


describe('ol.source.ServerVector', function() {

  describe('when empty', function() {

    var vectorSource;
    beforeEach(function() {
      vectorSource = new ol.source.ServerVector({});
    });

    describe('#addFeatures', function() {

      it('adds features with the same id only once', function() {
        var addfeatureSpy = sinon.spy();
        vectorSource.on('addfeature', addfeatureSpy);
        features = [];
        var i;
        var feature;
        for (i = 0; i < 5; i++) {
          feature = new ol.Feature();
          feature.setId(0);
          features.push(feature);
        }
        vectorSource.addFeatures(features);
        expect(vectorSource.getFeatures().length).to.be(1);
        expect(addfeatureSpy.callCount).to.be(1);
      });

      it('adds features all features with distinct ids', function() {
        var addfeatureSpy = sinon.spy();
        vectorSource.on('addfeature', addfeatureSpy);
        features = [];
        var i;
        var feature;
        for (i = 0; i < 5; i++) {
          feature = new ol.Feature();
          feature.setId(i);
          features.push(feature);
        }
        vectorSource.addFeatures(features);
        expect(vectorSource.getFeatures().length).to.be(5);
        expect(addfeatureSpy.callCount).to.be(5);
      });

      it('adds features without ids', function() {
        var addfeatureSpy = sinon.spy();
        vectorSource.on('addfeature', addfeatureSpy);
        features = [];
        var i;
        for (i = 0; i < 10; i++) {
          features.push(new ol.Feature());
        }
        vectorSource.addFeatures(features);
        expect(vectorSource.getFeatures().length).to.be(10);
        expect(addfeatureSpy.callCount).to.be(10);
      });

    });

  });

});


goog.require('ol.Feature');
goog.require('ol.source.ServerVector');
