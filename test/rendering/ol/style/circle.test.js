

import _ol_Feature_ from '../../../../src/ol/feature';
import _ol_geom_Point_ from '../../../../src/ol/geom/point';
import _ol_Map_ from '../../../../src/ol/map';
import _ol_View_ from '../../../../src/ol/view';
import _ol_layer_Vector_ from '../../../../src/ol/layer/vector';
import _ol_source_Vector_ from '../../../../src/ol/source/vector';
import _ol_style_Circle_ from '../../../../src/ol/style/circle';
import _ol_style_Fill_ from '../../../../src/ol/style/fill';
import _ol_style_Style_ from '../../../../src/ol/style/style';
import _ol_style_Stroke_ from '../../../../src/ol/style/stroke';


describe('ol.rendering.style.Circle', function() {

  var map, vectorSource;

  function createMap(renderer) {
    vectorSource = new _ol_source_Vector_();
    var vectorLayer = new _ol_layer_Vector_({
      source: vectorSource
    });

    map = new _ol_Map_({
      pixelRatio: 1,
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

  describe('#render', function() {

    function createFeatures() {
      var feature;
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([-20, 18])
      });
      feature.setStyle(new _ol_style_Style_({
        image: new _ol_style_Circle_({
          radius: 2,
          fill: new _ol_style_Fill_({
            color: '#91E339'
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([-10, 18])
      });
      feature.setStyle(new _ol_style_Style_({
        image: new _ol_style_Circle_({
          radius: 4,
          fill: new _ol_style_Fill_({
            color: '#5447E6'
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([4, 18])
      });
      feature.setStyle(new _ol_style_Style_({
        image: new _ol_style_Circle_({
          radius: 6,
          fill: new _ol_style_Fill_({
            color: '#92A8A6'
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([-20, 3])
      });
      feature.setStyle(new _ol_style_Style_({
        image: new _ol_style_Circle_({
          radius: 2,
          fill: new _ol_style_Fill_({
            color: '#91E339'
          }),
          stroke: new _ol_style_Stroke_({
            color: '#000000',
            width: 1
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([-10, 3])
      });
      feature.setStyle(new _ol_style_Style_({
        image: new _ol_style_Circle_({
          radius: 4,
          fill: new _ol_style_Fill_({
            color: '#5447E6'
          }),
          stroke: new _ol_style_Stroke_({
            color: '#000000',
            width: 2
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([4, 3])
      });
      feature.setStyle(new _ol_style_Style_({
        image: new _ol_style_Circle_({
          radius: 6,
          fill: new _ol_style_Fill_({
            color: '#92A8A6'
          }),
          stroke: new _ol_style_Stroke_({
            color: '#000000',
            width: 3
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([-20, -15])
      });
      feature.setStyle(new _ol_style_Style_({
        image: new _ol_style_Circle_({
          radius: 2,
          stroke: new _ol_style_Stroke_({
            color: '#256308',
            width: 1
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([-10, -15])
      });
      feature.setStyle(new _ol_style_Style_({
        image: new _ol_style_Circle_({
          radius: 4,
          fill: new _ol_style_Fill_({
            color: 'rgba(0, 0, 255, 0.3)'
          }),
          stroke: new _ol_style_Stroke_({
            color: '#256308',
            width: 2
          })
        })
      }));
      vectorSource.addFeature(feature);

      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([4, -15])
      });
      feature.setStyle(new _ol_style_Style_({
        image: new _ol_style_Circle_({
          radius: 6,
          fill: new _ol_style_Fill_({
            color: 'rgba(235, 45, 70, 0.6)'
          }),
          stroke: new _ol_style_Stroke_({
            color: '#256308',
            width: 3
          })
        })
      }));
      vectorSource.addFeature(feature);
    }

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      createFeatures();
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
