

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.geom.MultiPoint');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Style');
goog.require('ol.style.Stroke');


describe('ol.rendering.style.Circle', function() {

  var map, vectorSource;

  function createMap(renderer) {
    vectorSource = new ol.source.Vector();
    var vectorLayer = new ol.layer.Vector({
      source: vectorSource
    });

    map = new ol.Map({
      pixelRatio: 1,
      target: createMapDiv(50, 50),
      renderer: renderer,
      layers: [vectorLayer],
      view: new ol.View({
        projection: 'EPSG:4326',
        center: [0, 0],
        resolution: 1
      })
    });
  }

  afterEach(function() {
    if (map) {
      disposeMap(map);
      map = null;
    }
  });

  describe('#render', function() {

    function createFeatures(multi) {
      var feature;
      feature = new ol.Feature({
        geometry: multi ? new ol.geom.MultiPoint([[-20, 18]]) : new ol.geom.Point([-20, 18])
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
        geometry: multi ? new ol.geom.MultiPoint([[-10, 18]]) : new ol.geom.Point([-10, 18])
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
        geometry: multi ? new ol.geom.MultiPoint([[4, 18]]) : new ol.geom.Point([4, 18])
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
        geometry: multi ? new ol.geom.MultiPoint([[-20, 3]]) : new ol.geom.Point([-20, 3])
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
        geometry: multi ? new ol.geom.MultiPoint([[-10, 3]]) : new ol.geom.Point([-10, 3])
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
        geometry: multi ? new ol.geom.MultiPoint([[4, 3]]) : new ol.geom.Point([4, 3])
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
        geometry: multi ? new ol.geom.MultiPoint([[-20, -15]]) : new ol.geom.Point([-20, -15])
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
        geometry: multi ? new ol.geom.MultiPoint([[-10, -15]]) : new ol.geom.Point([-10, -15])
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
        geometry: multi ? new ol.geom.MultiPoint([[4, -15]]) : new ol.geom.Point([4, -15])
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

    it('renders point geometries', function(done) {
      createMap('canvas');
      createFeatures();
      expectResemble(map, 'rendering/ol/style/expected/circle-canvas.png',
          8.0, done);
    });

    it('renders multipoint geometries', function(done) {
      createMap('canvas');
      createFeatures(true);
      expectResemble(map, 'rendering/ol/style/expected/circle-canvas.png',
          8.0, done);
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      createFeatures();
      expectResemble(map, 'rendering/ol/style/expected/circle-webgl.png',
          8.0, done);
    });
  });
});
