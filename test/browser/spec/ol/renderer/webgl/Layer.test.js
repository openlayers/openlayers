import DataTileSource from '../../../../../../src/ol/source/DataTile.js';
import Layer from '../../../../../../src/ol/layer/Layer.js';
import Map from '../../../../../../src/ol/Map.js';
import TileLayer from '../../../../../../src/ol/layer/WebGLTile.js';
import VectorLayer from '../../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import View from '../../../../../../src/ol/View.js';
import WebGLLayerRenderer from '../../../../../../src/ol/renderer/webgl/Layer.js';
import {getUid} from '../../../../../../src/ol/util.js';

describe('ol/renderer/webgl/Layer', function () {
  describe('constructor', function () {
    let target;

    beforeEach(function () {
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
    });

    afterEach(function () {
      document.body.removeChild(target);
    });

    it('creates a new instance', function () {
      const layer = new Layer({});
      const renderer = new WebGLLayerRenderer(layer);
      expect(renderer).to.be.a(WebGLLayerRenderer);
    });
  });

  describe('context sharing', () => {
    let target;
    beforeEach(() => {
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
    });

    afterEach(() => {
      document.body.removeChild(target);
    });

    function getWebGLLayer(className) {
      return new TileLayer({
        className: className,
        source: new DataTileSource({
          loader(z, x, y) {
            return new ImageData(256, 256);
          },
        }),
      });
    }

    function getCanvasLayer(className) {
      return new VectorLayer({
        className: className,
        source: new VectorSource(),
      });
    }

    function expectCacheKeyMatches(layer, key) {
      expect(layer.getRenderer().helper.canvasCacheKeyMatches(key)).to.be(true);
    }

    function dispose(map) {
      map.setLayers([]);
      map.setTarget(null);
    }

    it('allows sequences of WebGL layers to share a canvas', () => {
      const layer1 = getWebGLLayer();
      const layer2 = getWebGLLayer();
      const layer3 = getWebGLLayer();
      const layer4 = getCanvasLayer();
      const layer5 = getCanvasLayer();
      const layer6 = getWebGLLayer();

      const map = new Map({
        target: target,
        layers: [layer1, layer2, layer3, layer4, layer5, layer6],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });

      map.renderSync();

      const mapId = getUid(map);

      expectCacheKeyMatches(layer1, `map/${mapId}/group/0`);
      expectCacheKeyMatches(layer1, `map/${mapId}/group/0`);
      expectCacheKeyMatches(layer2, `map/${mapId}/group/0`);
      expectCacheKeyMatches(layer3, `map/${mapId}/group/0`);
      // layer4 and layer5 cannot be grouped
      expectCacheKeyMatches(layer6, `map/${mapId}/group/1`);

      dispose(map);
    });

    it('does not group layers with different className', () => {
      const layer1 = getWebGLLayer();
      const layer2 = getWebGLLayer();
      const layer3 = getWebGLLayer('foo');
      const layer4 = getWebGLLayer('foo');
      const layer5 = getWebGLLayer();

      const map = new Map({
        target: target,
        layers: [layer1, layer2, layer3, layer4, layer5],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });

      map.renderSync();

      const mapId = getUid(map);

      expectCacheKeyMatches(layer1, `map/${mapId}/group/0`);
      expectCacheKeyMatches(layer2, `map/${mapId}/group/0`);
      expectCacheKeyMatches(layer3, `map/${mapId}/group/1`);
      expectCacheKeyMatches(layer4, `map/${mapId}/group/1`);
      expectCacheKeyMatches(layer5, `map/${mapId}/group/2`);

      dispose(map);
    });

    it('collapses groups when a layer is removed', () => {
      const layer1 = getWebGLLayer();
      const layer2 = getWebGLLayer('foo');
      const layer3 = getWebGLLayer();

      const map = new Map({
        target: target,
        layers: [layer1, layer2, layer3],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });

      map.renderSync();

      const mapId = getUid(map);

      expectCacheKeyMatches(layer1, `map/${mapId}/group/0`);
      expectCacheKeyMatches(layer2, `map/${mapId}/group/1`);
      expectCacheKeyMatches(layer3, `map/${mapId}/group/2`);

      map.removeLayer(layer2);
      map.renderSync();

      expectCacheKeyMatches(layer1, `map/${mapId}/group/0`);
      expect(layer2.getRenderer().helper).to.be(undefined);
      expectCacheKeyMatches(layer3, `map/${mapId}/group/0`);

      dispose(map);
    });

    it('regroups when layer order changes', () => {
      const layer1 = getWebGLLayer();
      const layer2 = getWebGLLayer();
      const layer3 = getCanvasLayer();
      const layer4 = getWebGLLayer();

      const map = new Map({
        target: target,
        layers: [layer1, layer2, layer3, layer4],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });

      map.renderSync();

      const mapId = getUid(map);

      expectCacheKeyMatches(layer1, `map/${mapId}/group/0`);
      expectCacheKeyMatches(layer2, `map/${mapId}/group/0`);
      // layer3 cannot be grouped
      expectCacheKeyMatches(layer4, `map/${mapId}/group/1`);

      map.removeLayer(layer2);
      map.addLayer(layer2);
      map.renderSync();

      expectCacheKeyMatches(layer1, `map/${mapId}/group/0`);
      // layer3 cannot be grouped
      expectCacheKeyMatches(layer4, `map/${mapId}/group/1`);
      expectCacheKeyMatches(layer2, `map/${mapId}/group/1`);

      dispose(map);
    });

    it('changes groups based on z-index', () => {
      const layer1 = getWebGLLayer();
      const layer2 = getWebGLLayer('foo');
      const layer3 = getWebGLLayer();

      const map = new Map({
        target: target,
        layers: [layer1, layer2, layer3],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });

      map.renderSync();

      const mapId = getUid(map);

      expectCacheKeyMatches(layer1, `map/${mapId}/group/0`);
      expectCacheKeyMatches(layer2, `map/${mapId}/group/1`);
      expectCacheKeyMatches(layer3, `map/${mapId}/group/2`);

      layer1.setZIndex(1);
      map.renderSync();

      expectCacheKeyMatches(layer2, `map/${mapId}/group/0`);
      expectCacheKeyMatches(layer3, `map/${mapId}/group/1`);
      expectCacheKeyMatches(layer1, `map/${mapId}/group/1`);

      dispose(map);
    });
  });
});
