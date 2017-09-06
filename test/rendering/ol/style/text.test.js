

import _ol_Feature_ from '../../../../src/ol/feature';
import _ol_geom_Point_ from '../../../../src/ol/geom/point';
import _ol_Map_ from '../../../../src/ol/map';
import _ol_View_ from '../../../../src/ol/view';
import _ol_layer_Vector_ from '../../../../src/ol/layer/vector';
import _ol_source_Vector_ from '../../../../src/ol/source/vector';
import _ol_style_Text_ from '../../../../src/ol/style/text';
import _ol_style_Fill_ from '../../../../src/ol/style/fill';
import _ol_style_Style_ from '../../../../src/ol/style/style';
import _ol_style_Stroke_ from '../../../../src/ol/style/stroke';

describe('ol.rendering.style.Text', function() {

  var map, vectorSource;

  function createMap(renderer) {
    vectorSource = new _ol_source_Vector_();
    var vectorLayer = new _ol_layer_Vector_({
      source: vectorSource
    });

    map = new _ol_Map_({
      pixelRatio: 1,
      target: createMapDiv(200, 200),
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

  describe('#render', function() {

    function createFeatures() {
      var feature;
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([-20, 18])
      });
      feature.setStyle(new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'hello',
          font: '10px'
        })
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([-10, 0])
      });
      feature.setStyle(new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'hello',
          fill: new _ol_style_Fill_({
            color: 'red',
            font: '12px'
          }),
          stroke: new _ol_style_Stroke_({
            color: '#000',
            width: 3
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([20, 10])
      });
      feature.setStyle(new _ol_style_Style_({
        text: new _ol_style_Text_({
          rotateWithView: true,
          text: 'hello',
          font: '10px',
          stroke: new _ol_style_Stroke_({
            color: [10, 10, 10, 0.5]
          })
        })
      }));
      vectorSource.addFeature(feature);
    }

    it('tests the canvas renderer without rotation', function(done) {
      createMap('canvas');
      createFeatures();
      expectResemble(map, 'rendering/ol/style/expected/text-canvas.png', IMAGE_TOLERANCE, done);
    });

    it('tests the canvas renderer with rotation', function(done) {
      createMap('canvas');
      createFeatures();
      map.getView().setRotation(Math.PI / 7);
      expectResemble(map, 'rendering/ol/style/expected/text-rotated-canvas.png', IMAGE_TOLERANCE, done);
    });

    it('renders multiline text with alignment options', function(done) {
      createMap('canvas');
      var feature;
      feature = new _ol_Feature_(new _ol_geom_Point_([25, 0]));
      feature.setStyle(new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'Hello world\nleft',
          font: 'bold 14px sans-serif',
          textAlign: 'left'
        })
      }));
      vectorSource.addFeature(feature);
      feature = new _ol_Feature_(new _ol_geom_Point_([-25, 0]));
      feature.setStyle(new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'Hello world\nright',
          font: 'bold 14px sans-serif',
          textAlign: 'right'
        })
      }));
      vectorSource.addFeature(feature);
      feature = new _ol_Feature_(new _ol_geom_Point_([0, 25]));
      feature.setStyle(new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'Hello world\nbottom',
          font: 'bold 14px sans-serif',
          textBaseline: 'bottom'
        })
      }));
      vectorSource.addFeature(feature);
      feature = new _ol_Feature_(new _ol_geom_Point_([0, -25]));
      feature.setStyle(new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'top\nHello world',
          font: 'bold 14px sans-serif',
          textBaseline: 'top'
        })
      }));
      vectorSource.addFeature(feature);
      expectResemble(map, 'rendering/ol/style/expected/text-align-offset-canvas.png', 5, done);
    });

    it('renders multiline text with positioning options', function(done) {
      createMap('canvas');
      var feature;
      feature = new _ol_Feature_(new _ol_geom_Point_([0, 0]));
      feature.setStyle(new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'Hello world\nleft',
          font: 'bold 14px sans-serif',
          textAlign: 'left',
          offsetX: 25
        })
      }));
      vectorSource.addFeature(feature);
      feature = new _ol_Feature_(new _ol_geom_Point_([0, 0]));
      feature.setStyle(new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'Hello world\nright',
          font: 'bold 14px sans-serif',
          textAlign: 'right',
          offsetX: -25
        })
      }));
      vectorSource.addFeature(feature);
      feature = new _ol_Feature_(new _ol_geom_Point_([0, 0]));
      feature.setStyle(new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'Hello world\nbottom',
          font: 'bold 14px sans-serif',
          textBaseline: 'bottom',
          offsetY: -25
        })
      }));
      vectorSource.addFeature(feature);
      feature = new _ol_Feature_(new _ol_geom_Point_([0, 0]));
      feature.setStyle(new _ol_style_Style_({
        text: new _ol_style_Text_({
          text: 'top\nHello world',
          font: 'bold 14px sans-serif',
          textBaseline: 'top',
          offsetY: 25
        })
      }));
      vectorSource.addFeature(feature);
      expectResemble(map, 'rendering/ol/style/expected/text-align-offset-canvas.png', 5, done);
    });

    where('WebGL').it('tests the webgl renderer without rotation', function(done) {
      createMap('webgl');
      createFeatures();
      expectResemble(map, 'rendering/ol/style/expected/text-webgl.png', 1.8, done);
    });

    where('WebGL').it('tests the webgl renderer with rotation', function(done) {
      createMap('webgl');
      createFeatures();
      map.getView().setRotation(Math.PI / 7);
      expectResemble(map, 'rendering/ol/style/expected/text-rotated-webgl.png', 1.8, done);
    });

  });
});
