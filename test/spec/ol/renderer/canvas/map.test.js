

import _ol_ from '../../../../../src/ol';
import _ol_Feature_ from '../../../../../src/ol/feature';
import _ol_Map_ from '../../../../../src/ol/map';
import _ol_View_ from '../../../../../src/ol/view';
import _ol_geom_Point_ from '../../../../../src/ol/geom/point';
import _ol_layer_Tile_ from '../../../../../src/ol/layer/tile';
import _ol_layer_Vector_ from '../../../../../src/ol/layer/vector';
import _ol_renderer_canvas_Layer_ from '../../../../../src/ol/renderer/canvas/layer';
import _ol_renderer_canvas_Map_ from '../../../../../src/ol/renderer/canvas/map';
import _ol_source_Vector_ from '../../../../../src/ol/source/vector';
import _ol_style_Icon_ from '../../../../../src/ol/style/icon';
import _ol_style_Style_ from '../../../../../src/ol/style/style';

describe('ol.renderer.canvas.Map', function() {

  describe('constructor', function() {

    it('creates a new instance', function() {
      var map = new _ol_Map_({
        target: document.createElement('div')
      });
      var renderer = new _ol_renderer_canvas_Map_(map.viewport_, map);
      expect(renderer).to.be.a(_ol_renderer_canvas_Map_);
    });

  });

  describe('#forEachFeatureAtCoordinate', function() {

    var layer, map, target;

    beforeEach(function(done) {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new _ol_Map_({
        pixelRatio: 1,
        target: target,
        view: new _ol_View_({
          center: [0, 0],
          zoom: 0
        })
      });

      // 1 x 1 pixel black icon
      var img = document.createElement('img');
      img.onload = function() {
        done();
      };
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg==';

      layer = new _ol_layer_Vector_({
        source: new _ol_source_Vector_({
          features: [
            new _ol_Feature_({
              geometry: new _ol_geom_Point_([0, 0])
            })
          ]
        }),
        style: new _ol_style_Style_({
          image: new _ol_style_Icon_({
            img: img,
            imgSize: [1, 1]
          })
        })
      });
    });

    afterEach(function() {
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('calls callback with layer for managed layers', function() {
      map.addLayer(layer);
      map.renderSync();
      var cb = sinon.spy();
      map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]), cb);
      expect(cb).to.be.called();
      expect(cb.firstCall.args[1]).to.be(layer);
    });

    it('calls callback with null for unmanaged layers', function() {
      layer.setMap(map);
      map.renderSync();
      var cb = sinon.spy();
      map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]), cb);
      expect(cb).to.be.called();
      expect(cb.firstCall.args[1]).to.be(null);
    });

    it('calls callback with main layer when skipped feature on unmanaged layer', function() {
      var feature = layer.getSource().getFeatures()[0];
      var managedLayer = new _ol_layer_Vector_({
        source: new _ol_source_Vector_({
          features: [feature]
        })
      });
      map.addLayer(managedLayer);
      map.skipFeature(feature);
      layer.setMap(map);
      map.renderSync();
      var cb = sinon.spy();
      map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]), cb);
      expect(cb.callCount).to.be(1);
      expect(cb.firstCall.args[1]).to.be(managedLayer);
    });

    it('filters managed layers', function() {
      map.addLayer(layer);
      map.renderSync();
      var cb = sinon.spy();
      map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]), cb, {
        layerFilter: function() {
          return false;
        }
      });
      expect(cb).to.not.be.called();
    });

    it('doesn\'t fail with layer with no source', function() {
      map.addLayer(new _ol_layer_Tile_());
      map.renderSync();
      expect(function() {
        map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]),
            function() {});
      }).to.not.throwException();
    });

    it('calls callback for clicks inside of the hitTolerance', function() {
      map.addLayer(layer);
      map.renderSync();
      var cb1 = sinon.spy();
      var cb2 = sinon.spy();

      var pixel = map.getPixelFromCoordinate([0, 0]);

      var pixelsInside = [
        [pixel[0] + 9, pixel[1]],
        [pixel[0] - 9, pixel[1]],
        [pixel[0], pixel[1] + 9],
        [pixel[0], pixel[1] - 9]
      ];

      var pixelsOutside = [
        [pixel[0] + 9, pixel[1] + 9],
        [pixel[0] - 9, pixel[1] + 9],
        [pixel[0] + 9, pixel[1] - 9],
        [pixel[0] - 9, pixel[1] - 9]
      ];

      for (var i = 0; i < 4; i++) {
        map.forEachFeatureAtPixel(pixelsInside[i], cb1, {hitTolerance: 10});
      }
      expect(cb1.callCount).to.be(4);
      expect(cb1.firstCall.args[1]).to.be(layer);

      for (var j = 0; j < 4; j++) {
        map.forEachFeatureAtPixel(pixelsOutside[j], cb2, {hitTolerance: 10});
      }
      expect(cb2).not.to.be.called();
    });
  });

  describe('#renderFrame()', function() {
    var layer, map, renderer;

    beforeEach(function() {
      map = new _ol_Map_({});
      map.on('postcompose', function() {});
      layer = new _ol_layer_Vector_({
        source: new _ol_source_Vector_({wrapX: true})
      });
      renderer = map.getRenderer();
      renderer.layerRenderers_ = {};
      var layerRenderer = new _ol_renderer_canvas_Layer_(layer);
      layerRenderer.prepareFrame = function() {
        return true;
      };
      layerRenderer.getImage = function() {
        return null;
      };
      renderer.layerRenderers_[_ol_.getUid(layer)] = layerRenderer;
    });

  });

});
