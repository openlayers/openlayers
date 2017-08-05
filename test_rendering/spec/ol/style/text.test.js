goog.provide('ol.test.rendering.style.Text');

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Text');
goog.require('ol.style.Fill');
goog.require('ol.style.Style');
goog.require('ol.style.Stroke');

describe('ol.rendering.style.Text', function() {

  var target, map, vectorSource;

  function createMap(renderer) {
    target = createMapDiv(200, 200);

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

    function createFeatures() {
      var feature;
      feature = new ol.Feature({
        geometry: new ol.geom.Point([-20, 18])
      });
      feature.setStyle(new ol.style.Style({
        text: new ol.style.Text({
          text: 'hello',
          font: '10px'
        })
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.Point([-10, 0])
      });
      feature.setStyle(new ol.style.Style({
        text: new ol.style.Text({
          text: 'hello',
          fill: new ol.style.Fill({
            color: 'red',
            font: '12px'
          }),
          stroke: new ol.style.Stroke({
            color: '#000',
            width: 3
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.Point([20, 10])
      });
      feature.setStyle(new ol.style.Style({
        text: new ol.style.Text({
          rotateWithView: true,
          text: 'hello',
          font: '10px',
          stroke: new ol.style.Stroke({
            color: [10, 10, 10, 0.5]
          })
        })
      }));
      vectorSource.addFeature(feature);

    }

    it('tests the canvas renderer without rotation', function(done) {
      map = createMap('canvas');
      createFeatures();
      expectResemble(map, 'spec/ol/style/expected/text-canvas.png', IMAGE_TOLERANCE, done);
    });

    it('tests the canvas renderer with rotation', function(done) {
      map = createMap('canvas');
      createFeatures();
      map.getView().setRotation(Math.PI / 7);
      expectResemble(map, 'spec/ol/style/expected/text-rotated-canvas.png', IMAGE_TOLERANCE, done);
    });

  });
});
