import Feature from '../../../../src/ol/Feature.js';
import Point from '../../../../src/ol/geom/Point.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Style from '../../../../src/ol/style/Style.js';
import Stroke from '../../../../src/ol/style/Stroke.js';


describe('ol.rendering.style.Circle', function() {

  let map, vectorSource;

  function createMap(renderer) {
    vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    map = new Map({
      pixelRatio: 1,
      target: createMapDiv(50, 50),
      renderer: renderer,
      layers: [vectorLayer],
      view: new View({
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
      let feature;
      feature = new Feature({
        geometry: multi ? new MultiPoint([[-20, 18]]) : new Point([-20, 18])
      });
      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: 2,
          fill: new Fill({
            color: '#91E339'
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new Feature({
        geometry: multi ? new MultiPoint([[-10, 18]]) : new Point([-10, 18])
      });
      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: 4,
          fill: new Fill({
            color: '#5447E6'
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new Feature({
        geometry: multi ? new MultiPoint([[4, 18]]) : new Point([4, 18])
      });
      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: '#92A8A6'
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new Feature({
        geometry: multi ? new MultiPoint([[-20, 3]]) : new Point([-20, 3])
      });
      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: 2,
          fill: new Fill({
            color: '#91E339'
          }),
          stroke: new Stroke({
            color: '#000000',
            width: 1
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new Feature({
        geometry: multi ? new MultiPoint([[-10, 3]]) : new Point([-10, 3])
      });
      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: 4,
          fill: new Fill({
            color: '#5447E6'
          }),
          stroke: new Stroke({
            color: '#000000',
            width: 2
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new Feature({
        geometry: multi ? new MultiPoint([[4, 3]]) : new Point([4, 3])
      });
      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: '#92A8A6'
          }),
          stroke: new Stroke({
            color: '#000000',
            width: 3
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new Feature({
        geometry: multi ? new MultiPoint([[-20, -15]]) : new Point([-20, -15])
      });
      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: 2,
          stroke: new Stroke({
            color: '#256308',
            width: 1
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new Feature({
        geometry: multi ? new MultiPoint([[-10, -15]]) : new Point([-10, -15])
      });
      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: 4,
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.3)'
          }),
          stroke: new Stroke({
            color: '#256308',
            width: 2
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new Feature({
        geometry: multi ? new MultiPoint([[4, -15]]) : new Point([4, -15])
      });
      feature.setStyle(new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: 'rgba(235, 45, 70, 0.6)'
          }),
          stroke: new Stroke({
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
