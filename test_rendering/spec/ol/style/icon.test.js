goog.provide('ol.test.rendering.style.Icon');

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');


describe('ol.rendering.style.Icon', function() {

  var target, map, vectorSource;

  var imgInfo = {
    anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    opacity: 0.75,
    scale: 0.5,
    imgSize: [32, 48]
  };

  function createMap(renderer, width, height) {
    target = createMapDiv(width ? width : 50, height ? height : 50);

    vectorSource = new ol.source.Vector();
    var vectorLayer = new ol.layer.Vector({
      source: vectorSource
    });

    map = new ol.Map({
      target: target,
      renderer: renderer,
      layers: [vectorLayer],
      view: new ol.View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
    return map;
  }

  describe('#render', function() {
    afterEach(function() {
      disposeMap(map);
    });

    function createFeatures(src, imgInfo, callback) {
      var feature;
      feature = new ol.Feature({
        geometry: new ol.geom.Point([0, 0])
      });

      var img = new Image();
      img.onload = function() {
        imgInfo.img = img;
        feature.setStyle(new ol.style.Style({
          image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ (imgInfo))
        }));
        vectorSource.addFeature(feature);
        callback();
      };
      img.src = src;
    }

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      createFeatures('spec/ol/data/icon.png', imgInfo, function() {
        expectResemble(map, 'spec/ol/style/expected/icon-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('scales svg correctly in the canvas renderer', function(done) {
      map = createMap('canvas', 512, 512);
      createFeatures('spec/ol/data/me0.svg', {
        scale: 96 / 512,
        imgSize: [512, 512]
      }, function() {
        expectResemble(map, 'spec/ol/style/expected/icon-canvas-svg-scale.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('uses offset correctly in the canvas renderer', function(done) {
      map = createMap('canvas', 256, 512);
      createFeatures('spec/ol/data/me0.svg', {
        offset: [0, 256],
        size: [256, 256],
        imgSize: [512, 512]
      }, function() {
        expectResemble(map, 'spec/ol/style/expected/icon-canvas-svg-offset.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('uses offset correctly if it is larger than size in the canvas renderer', function(done) {
      map = createMap('canvas', 256, 512);
      createFeatures('spec/ol/data/me0.svg', {
        offset: [0, 374],
        size: [256, 256],
        imgSize: [512, 512]
      }, function() {
        expectResemble(map, 'spec/ol/style/expected/icon-canvas-svg-offset2.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('tests the WebGL renderer', function(done) {
      assertWebGL();
      map = createMap('webgl');
      createFeatures('spec/ol/data/icon.png', imgInfo, function() {
        expectResemble(map, 'spec/ol/style/expected/icon-webgl.png',
            2.0, done);
      });
    });
  });
});
