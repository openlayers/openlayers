goog.provide('ol.test.rendering.style.Icon');

describe('ol.rendering.style.Icon', function() {

  var target, map, vectorSource;

  function createMap(renderer) {
    target = createMapDiv(50, 50);

    vectorSource = new ol.source.Vector();
    vectorLayer = new ol.layer.Vector({
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

    function createFeatures(callback) {
      var feature;
      feature = new ol.Feature({
        geometry: new ol.geom.Point([0, 0])
      });

      var img = new Image();
      img.onload = function() {
        feature.setStyle(new ol.style.Style({
          image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            opacity: 0.75,
            scale: 0.5,
            img: img,
            imgSize: [32, 48]
          }))
        }));
        vectorSource.addFeature(feature);
        callback();
      };
      img.src = 'spec/ol/data/icon.png';
    }

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      createFeatures(function() {
        expectResemble(map, 'spec/ol/style/expected/icon-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('tests the WebGL renderer', function(done) {
      assertWebGL();
      map = createMap('webgl');
      createFeatures(function() {
        expectResemble(map, 'spec/ol/style/expected/icon-webgl.png',
            IMAGE_TOLERANCE, done);
      });
    });
  });
});

goog.require('goog.dispose');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');
