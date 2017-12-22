import _ol_Feature_ from '../../../../src/ol/Feature.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Map from '../../../../src/ol/Map.js';
import _ol_View_ from '../../../../src/ol/View.js';
import _ol_layer_Vector_ from '../../../../src/ol/layer/Vector.js';
import _ol_source_Vector_ from '../../../../src/ol/source/Vector.js';
import _ol_style_Style_ from '../../../../src/ol/style/Style.js';
import _ol_style_Stroke_ from '../../../../src/ol/style/Stroke.js';


describe('ol.rendering.style.LineString', function() {

  var map, vectorSource;

  function createMap(renderer, opt_pixelRatio) {
    vectorSource = new _ol_source_Vector_();
    var vectorLayer = new _ol_layer_Vector_({
      source: vectorSource
    });

    map = new Map({
      pixelRatio: opt_pixelRatio || 1,
      target: createMapDiv(50, 50),
      renderer: renderer,
      layers: [vectorLayer],
      view: new _ol_View_({
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

  describe('different strokes', function() {

    function createFeatures() {
      var feature;

      feature = new _ol_Feature_({
        geometry: new LineString(
            [[-20, 20], [15, 20]]
        )
      });
      feature.setStyle(new _ol_style_Style_({
        stroke: new _ol_style_Stroke_({color: '#DE213A', width: 3})
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new LineString(
            [[-20, 15], [15, 15]]
        )
      });
      feature.setStyle(new _ol_style_Style_({
        stroke: new _ol_style_Stroke_({color: '#9696EB', width: 1})
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new LineString(
            [[-20, 10], [15, 10]]
        )
      });
      feature.setStyle([new _ol_style_Style_({
        stroke: new _ol_style_Stroke_({color: '#F2F211', width: 5})
      }), new _ol_style_Style_({
        stroke: new _ol_style_Stroke_({color: '#292921', width: 1})
      })]);
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new LineString(
            [[-20, -20], [-2, 0], [15, -20]]
        )
      });
      feature.setStyle(new _ol_style_Style_({
        stroke: new _ol_style_Stroke_({
          color: '#000000',
          width: 2,
          lineCap: 'square',
          lineDash: [4, 8],
          lineJoin: 'round'
        })
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new LineString(
            [[-20, -15], [-2, 5], [15, -15]]
        )
      });
      feature.setStyle(new _ol_style_Style_({
        stroke: new _ol_style_Stroke_({
          color: '#000000',
          width: 2,
          lineCap: 'square',
          lineDash: [4, 8],
          lineDashOffset: 6,
          lineJoin: 'round'
        })
      }));
      vectorSource.addFeature(feature);
    }

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      createFeatures();
      expectResemble(
          map, 'rendering/ol/style/expected/linestring-strokes-canvas.png',
          3.0, done);
    });
    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      createFeatures();
      expectResemble(map, 'rendering/ol/style/expected/linestring-strokes-webgl.png',
          14.6, done);
    });

    it('tests the canvas renderer (HiDPI)', function(done) {
      createMap('canvas', 2);
      createFeatures();
      expectResemble(
          map, 'rendering/ol/style/expected/linestring-strokes-canvas-hidpi.png',
          3.0, done);
    });
  });
});
