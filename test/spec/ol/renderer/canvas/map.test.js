import {getUid} from '../../../../../src/ol/util.js';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import Point from '../../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import CanvasLayerRenderer from '../../../../../src/ol/renderer/canvas/Layer.js';
import CanvasMapRenderer from '../../../../../src/ol/renderer/canvas/Map.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import Icon from '../../../../../src/ol/style/Icon.js';
import Style from '../../../../../src/ol/style/Style.js';

describe('ol.renderer.canvas.Map', function() {

  describe('constructor', function() {

    it('creates a new instance', function() {
      const map = new Map({
        target: document.createElement('div')
      });
      const renderer = new CanvasMapRenderer(map);
      expect(renderer).to.be.a(CanvasMapRenderer);
    });

  });

  describe('#forEachFeatureAtCoordinate', function() {

    let layer, map, target;

    beforeEach(function(done) {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        pixelRatio: 1,
        target: target,
        view: new View({
          center: [0, 0],
          zoom: 0
        })
      });

      // 1 x 1 pixel black icon
      const img = document.createElement('img');
      img.onload = function() {
        done();
      };
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg==';

      layer = new VectorLayer({
        source: new VectorSource({
          features: [
            new Feature({
              geometry: new Point([0, 0])
            })
          ]
        }),
        style: new Style({
          image: new Icon({
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
      const cb = sinon.spy();
      map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]), cb);
      expect(cb).to.be.called();
      expect(cb.firstCall.args[1]).to.be(layer);
    });

    it('calls callback with null for unmanaged layers', function() {
      layer.setMap(map);
      map.renderSync();
      const cb = sinon.spy();
      map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]), cb);
      expect(cb).to.be.called();
      expect(cb.firstCall.args[1]).to.be(null);
    });

    it('calls callback with main layer when skipped feature on unmanaged layer', function() {
      const feature = layer.getSource().getFeatures()[0];
      const managedLayer = new VectorLayer({
        source: new VectorSource({
          features: [feature]
        })
      });
      map.addLayer(managedLayer);
      map.skipFeature(feature);
      layer.setMap(map);
      map.renderSync();
      const cb = sinon.spy();
      map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]), cb);
      expect(cb.callCount).to.be(1);
      expect(cb.firstCall.args[1]).to.be(managedLayer);
    });

    it('filters managed layers', function() {
      map.addLayer(layer);
      map.renderSync();
      const cb = sinon.spy();
      map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]), cb, {
        layerFilter: function() {
          return false;
        }
      });
      expect(cb).to.not.be.called();
    });

    it('doesn\'t fail with layer with no source', function() {
      map.addLayer(new TileLayer());
      map.renderSync();
      expect(function() {
        map.forEachFeatureAtPixel(map.getPixelFromCoordinate([0, 0]),
          function() {});
      }).to.not.throwException();
    });

    it('calls callback for clicks inside of the hitTolerance', function() {
      map.addLayer(layer);
      map.renderSync();
      const cb1 = sinon.spy();
      const cb2 = sinon.spy();

      const pixel = map.getPixelFromCoordinate([0, 0]);

      const pixelsInside = [
        [pixel[0] + 9, pixel[1]],
        [pixel[0] - 9, pixel[1]],
        [pixel[0], pixel[1] + 9],
        [pixel[0], pixel[1] - 9]
      ];

      const pixelsOutside = [
        [pixel[0] + 9, pixel[1] + 9],
        [pixel[0] - 9, pixel[1] + 9],
        [pixel[0] + 9, pixel[1] - 9],
        [pixel[0] - 9, pixel[1] - 9]
      ];

      for (let i = 0; i < 4; i++) {
        map.forEachFeatureAtPixel(pixelsInside[i], cb1, {hitTolerance: 10});
      }
      expect(cb1.callCount).to.be(4);
      expect(cb1.firstCall.args[1]).to.be(layer);

      for (let j = 0; j < 4; j++) {
        map.forEachFeatureAtPixel(pixelsOutside[j], cb2, {hitTolerance: 10});
      }
      expect(cb2).not.to.be.called();
    });
  });

  describe('#forEachLayerAtCoordinate', function() {

    let layer, map, target;

    beforeEach(function(done) {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        pixelRatio: 1,
        target: target,
        view: new View({
          center: [0, 0],
          zoom: 0
        })
      });

      // 1 x 1 pixel black icon
      const img = document.createElement('img');
      img.onload = function() {
        done();
      };
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgADNjd8qAAAAABJRU5ErkJggg==';

      layer = new VectorLayer({
        source: new VectorSource({
          features: [
            new Feature({
              geometry: new Point([0, 0])
            })
          ]
        }),
        style: new Style({
          image: new Icon({
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

    it('calls callback for clicks inside of the hitTolerance', function() {
      map.addLayer(layer);
      map.renderSync();
      const cb1 = sinon.spy();
      const cb2 = sinon.spy();

      const pixel = map.getPixelFromCoordinate([0, 0]);

      const pixelsInside = [
        [pixel[0] + 9, pixel[1]],
        [pixel[0] - 9, pixel[1]],
        [pixel[0], pixel[1] + 9],
        [pixel[0], pixel[1] - 9]
      ];

      const pixelsOutside = [
        [pixel[0] + 9, pixel[1] + 9],
        [pixel[0] - 9, pixel[1] + 9],
        [pixel[0] + 9, pixel[1] - 9],
        [pixel[0] - 9, pixel[1] - 9]
      ];

      for (let i = 0; i < 4; i++) {
        map.forEachLayerAtPixel(pixelsInside[i], cb1, {hitTolerance: 10});
      }
      expect(cb1.callCount).to.be(4);
      expect(cb1.firstCall.args[0]).to.be(layer);

      for (let j = 0; j < 4; j++) {
        map.forEachLayerAtPixel(pixelsOutside[j], cb2, {hitTolerance: 10});
      }
      expect(cb2).not.to.be.called();
    });
  });

  describe('#renderFrame()', function() {
    let layer, map, renderer;

    beforeEach(function() {
      map = new Map({});
      map.on('postcompose', function() {});
      layer = new VectorLayer({
        source: new VectorSource({wrapX: true})
      });
      renderer = map.getRenderer();
      renderer.layerRenderers_ = {};
      const layerRenderer = new CanvasLayerRenderer(layer);
      layerRenderer.prepareFrame = function() {
        return true;
      };
      layerRenderer.getImage = function() {
        return null;
      };
      renderer.layerRenderers_[getUid(layer)] = layerRenderer;
    });

  });

});
