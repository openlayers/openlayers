import Feature from '../../../../src/ol/Feature.js';
import Point from '../../../../src/ol/geom/Point.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import _ol_style_Icon_ from '../../../../src/ol/style/Icon.js';
import _ol_style_Style_ from '../../../../src/ol/style/Style.js';


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
    vectorSource = new VectorSource();
    var vectorLayer = new VectorLayer({
      source: vectorSource
    });

    map = new Map({
      pixelRatio: 1,
      target: createMapDiv(width ? width : 50, height ? height : 50),
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

    function createFeatures(src, imgInfo, callback) {
      var feature;
      feature = new Feature({
        geometry: new Point([0, 0])
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
