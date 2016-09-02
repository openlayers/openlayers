goog.provide('ol.test.rendering.style.Circle');

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Style');
goog.require('ol.style.Stroke');


describe('ol.rendering.style.Circle', function() {

  var target, map, vectorSource;

  function createMap(renderer) {
    target = createMapDiv(50, 50);

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
        image: new ol.style.Circle({
          radius: 2,
          fill: new ol.style.Fill({
            color: '#91E339'
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.Point([-10, 18])
      });
      feature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 4,
          fill: new ol.style.Fill({
            color: '#5447E6'
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.Point([4, 18])
      });
      feature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: '#92A8A6'
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.Point([-20, 3])
      });
      feature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 2,
          fill: new ol.style.Fill({
            color: '#91E339'
          }),
          stroke: new ol.style.Stroke({
            color: '#000000',
            width: 1
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.Point([-10, 3])
      });
      feature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 4,
          fill: new ol.style.Fill({
            color: '#5447E6'
          }),
          stroke: new ol.style.Stroke({
            color: '#000000',
            width: 2
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.Point([4, 3])
      });
      feature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: '#92A8A6'
          }),
          stroke: new ol.style.Stroke({
            color: '#000000',
            width: 3
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.Point([-20, -15])
      });
      feature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 2,
          stroke: new ol.style.Stroke({
            color: '#256308',
            width: 1
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.Point([-10, -15])
      });
      feature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 4,
          fill: new ol.style.Fill({
            color: 'rgba(0, 0, 255, 0.3)'
          }),
          stroke: new ol.style.Stroke({
            color: '#256308',
            width: 2
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new ol.Feature({
        geometry: new ol.geom.Point([4, -15])
      });
      feature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: 'rgba(235, 45, 70, 0.6)'
          }),
          stroke: new ol.style.Stroke({
            color: '#256308',
            width: 3
          })
        })
      }));
      vectorSource.addFeature(feature);
    }

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      createFeatures();
      expectResemble(map, 'spec/ol/style/expected/circle-canvas.png',
          8.0, done);
    });

    it('tests the WebGL renderer', function(done) {
      assertWebGL();
      map = createMap('webgl');
      createFeatures();
      expectResemble(map, 'spec/ol/style/expected/circle-webgl.png',
          8.0, done);
    });
  });
});
