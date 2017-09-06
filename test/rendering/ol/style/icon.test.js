

import _ol_Feature_ from '../../../../src/ol/feature';
import _ol_geom_Point_ from '../../../../src/ol/geom/point';
import _ol_Map_ from '../../../../src/ol/map';
import _ol_View_ from '../../../../src/ol/view';
import _ol_layer_Vector_ from '../../../../src/ol/layer/vector';
import _ol_source_Vector_ from '../../../../src/ol/source/vector';
import _ol_style_Icon_ from '../../../../src/ol/style/icon';
import _ol_style_Style_ from '../../../../src/ol/style/style';


describe('ol.rendering.style.Icon', function() {

  var map, vectorSource;

  var imgInfo = {
    anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    opacity: 0.75,
    scale: 0.5,
    imgSize: [32, 48]
  };

  function createMap(renderer, width, height) {
    vectorSource = new _ol_source_Vector_();
    var vectorLayer = new _ol_layer_Vector_({
      source: vectorSource
    });

    map = new _ol_Map_({
      pixelRatio: 1,
      target: createMapDiv(width ? width : 50, height ? height : 50),
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

    function createFeatures(src, imgInfo, callback) {
      var feature;
      feature = new _ol_Feature_({
        geometry: new _ol_geom_Point_([0, 0])
      });

      var img = new Image();
      img.onload = function() {
        imgInfo.img = img;
        feature.setStyle(new _ol_style_Style_({
          image: new _ol_style_Icon_(/** @type {olx.style.IconOptions} */ (imgInfo))
        }));
        vectorSource.addFeature(feature);
        callback();
      };
      img.src = src;
    }

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      createFeatures('rendering/ol/data/icon.png', imgInfo, function() {
        expectResemble(map, 'rendering/ol/style/expected/icon-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('scales svg correctly in the canvas renderer', function(done) {
      createMap('canvas', 512, 512);
      createFeatures('rendering/ol/data/me0.svg', {
        scale: 96 / 512,
        imgSize: [512, 512]
      }, function() {
        expectResemble(map, 'rendering/ol/style/expected/icon-canvas-svg-scale.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('uses offset correctly in the canvas renderer', function(done) {
      createMap('canvas', 256, 512);
      createFeatures('rendering/ol/data/me0.svg', {
        offset: [0, 256],
        size: [256, 256],
        imgSize: [512, 512]
      }, function() {
        expectResemble(map, 'rendering/ol/style/expected/icon-canvas-svg-offset.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('uses offset correctly if it is larger than size in the canvas renderer', function(done) {
      createMap('canvas', 256, 512);
      createFeatures('rendering/ol/data/me0.svg', {
        offset: [0, 374],
        size: [256, 256],
        imgSize: [512, 512]
      }, function() {
        expectResemble(map, 'rendering/ol/style/expected/icon-canvas-svg-offset2.png',
            IMAGE_TOLERANCE, done);
      });
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      createFeatures('rendering/ol/data/icon.png', imgInfo, function() {
        expectResemble(map, 'rendering/ol/style/expected/icon-webgl.png',
            2.0, done);
      });
    });
  });
});
