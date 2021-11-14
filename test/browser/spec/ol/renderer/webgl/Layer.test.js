import DataTileSource from '../../../../../../src/ol/source/DataTile.js';
import Layer from '../../../../../../src/ol/layer/Layer.js';
import Map from '../../../../../../src/ol/Map.js';
import TileLayer from '../../../../../../src/ol/layer/WebGLTile.js';
import VectorLayer from '../../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import View from '../../../../../../src/ol/View.js';
import WebGLLayerRenderer, {
  colorDecodeId,
  colorEncodeId,
  getBlankImageData,
  writePointFeatureToBuffers,
} from '../../../../../../src/ol/renderer/webgl/Layer.js';
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

  describe('writePointFeatureToBuffers', function () {
    let vertexBuffer, indexBuffer, instructions;

    beforeEach(function () {
      vertexBuffer = new Float32Array(100);
      indexBuffer = new Uint32Array(100);
      instructions = new Float32Array(100);

      instructions.set([0, 0, 0, 0, 10, 11]);
    });

    it('writes correctly to the buffers (without custom attributes)', function () {
      const stride = 3;
      const positions = writePointFeatureToBuffers(
        instructions,
        4,
        vertexBuffer,
        indexBuffer,
        0
      );

      expect(vertexBuffer[0]).to.eql(10);
      expect(vertexBuffer[1]).to.eql(11);
      expect(vertexBuffer[2]).to.eql(0);

      expect(vertexBuffer[stride + 0]).to.eql(10);
      expect(vertexBuffer[stride + 1]).to.eql(11);
      expect(vertexBuffer[stride + 2]).to.eql(1);

      expect(vertexBuffer[stride * 2 + 0]).to.eql(10);
      expect(vertexBuffer[stride * 2 + 1]).to.eql(11);
      expect(vertexBuffer[stride * 2 + 2]).to.eql(2);

      expect(vertexBuffer[stride * 3 + 0]).to.eql(10);
      expect(vertexBuffer[stride * 3 + 1]).to.eql(11);
      expect(vertexBuffer[stride * 3 + 2]).to.eql(3);

      expect(indexBuffer[0]).to.eql(0);
      expect(indexBuffer[1]).to.eql(1);
      expect(indexBuffer[2]).to.eql(3);
      expect(indexBuffer[3]).to.eql(1);
      expect(indexBuffer[4]).to.eql(2);
      expect(indexBuffer[5]).to.eql(3);

      expect(positions.indexPosition).to.eql(6);
      expect(positions.vertexPosition).to.eql(stride * 4);
    });

    it('writes correctly to the buffers (with 2 custom attributes)', function () {
      instructions.set([0, 0, 0, 0, 0, 0, 0, 0, 10, 11, 12, 13]);
      const stride = 5;
      const positions = writePointFeatureToBuffers(
        instructions,
        8,
        vertexBuffer,
        indexBuffer,
        2
      );

      expect(vertexBuffer[0]).to.eql(10);
      expect(vertexBuffer[1]).to.eql(11);
      expect(vertexBuffer[2]).to.eql(0);
      expect(vertexBuffer[3]).to.eql(12);
      expect(vertexBuffer[4]).to.eql(13);

      expect(vertexBuffer[stride + 0]).to.eql(10);
      expect(vertexBuffer[stride + 1]).to.eql(11);
      expect(vertexBuffer[stride + 2]).to.eql(1);
      expect(vertexBuffer[stride + 3]).to.eql(12);
      expect(vertexBuffer[stride + 4]).to.eql(13);

      expect(vertexBuffer[stride * 2 + 0]).to.eql(10);
      expect(vertexBuffer[stride * 2 + 1]).to.eql(11);
      expect(vertexBuffer[stride * 2 + 2]).to.eql(2);
      expect(vertexBuffer[stride * 2 + 3]).to.eql(12);
      expect(vertexBuffer[stride * 2 + 4]).to.eql(13);

      expect(vertexBuffer[stride * 3 + 0]).to.eql(10);
      expect(vertexBuffer[stride * 3 + 1]).to.eql(11);
      expect(vertexBuffer[stride * 3 + 2]).to.eql(3);
      expect(vertexBuffer[stride * 3 + 3]).to.eql(12);
      expect(vertexBuffer[stride * 3 + 4]).to.eql(13);

      expect(indexBuffer[0]).to.eql(0);
      expect(indexBuffer[1]).to.eql(1);
      expect(indexBuffer[2]).to.eql(3);
      expect(indexBuffer[3]).to.eql(1);
      expect(indexBuffer[4]).to.eql(2);
      expect(indexBuffer[5]).to.eql(3);

      expect(positions.indexPosition).to.eql(6);
      expect(positions.vertexPosition).to.eql(stride * 4);
    });

    it('correctly chains buffer writes', function () {
      instructions.set([10, 11, 20, 21, 30, 31]);
      const stride = 3;
      let positions = writePointFeatureToBuffers(
        instructions,
        0,
        vertexBuffer,
        indexBuffer,
        0
      );
      positions = writePointFeatureToBuffers(
        instructions,
        2,
        vertexBuffer,
        indexBuffer,
        0,
        positions
      );
      positions = writePointFeatureToBuffers(
        instructions,
        4,
        vertexBuffer,
        indexBuffer,
        0,
        positions
      );

      expect(vertexBuffer[0]).to.eql(10);
      expect(vertexBuffer[1]).to.eql(11);
      expect(vertexBuffer[2]).to.eql(0);

      expect(vertexBuffer[stride * 4 + 0]).to.eql(20);
      expect(vertexBuffer[stride * 4 + 1]).to.eql(21);
      expect(vertexBuffer[stride * 4 + 2]).to.eql(0);

      expect(vertexBuffer[stride * 8 + 0]).to.eql(30);
      expect(vertexBuffer[stride * 8 + 1]).to.eql(31);
      expect(vertexBuffer[stride * 8 + 2]).to.eql(0);

      expect(indexBuffer[6 + 0]).to.eql(4);
      expect(indexBuffer[6 + 1]).to.eql(5);
      expect(indexBuffer[6 + 2]).to.eql(7);
      expect(indexBuffer[6 + 3]).to.eql(5);
      expect(indexBuffer[6 + 4]).to.eql(6);
      expect(indexBuffer[6 + 5]).to.eql(7);

      expect(indexBuffer[6 * 2 + 0]).to.eql(8);
      expect(indexBuffer[6 * 2 + 1]).to.eql(9);
      expect(indexBuffer[6 * 2 + 2]).to.eql(11);
      expect(indexBuffer[6 * 2 + 3]).to.eql(9);
      expect(indexBuffer[6 * 2 + 4]).to.eql(10);
      expect(indexBuffer[6 * 2 + 5]).to.eql(11);

      expect(positions.indexPosition).to.eql(6 * 3);
      expect(positions.vertexPosition).to.eql(stride * 4 * 3);
    });
  });

  describe('getBlankImageData', function () {
    it('creates a 1x1 white texture', function () {
      const texture = getBlankImageData();
      expect(texture.height).to.eql(1);
      expect(texture.width).to.eql(1);
      expect(texture.data[0]).to.eql(255);
      expect(texture.data[1]).to.eql(255);
      expect(texture.data[2]).to.eql(255);
      expect(texture.data[3]).to.eql(255);
    });
  });

  describe('colorEncodeId and colorDecodeId', function () {
    it('correctly encodes and decodes ids', function () {
      expect(colorDecodeId(colorEncodeId(0))).to.eql(0);
      expect(colorDecodeId(colorEncodeId(1))).to.eql(1);
      expect(colorDecodeId(colorEncodeId(123))).to.eql(123);
      expect(colorDecodeId(colorEncodeId(12345))).to.eql(12345);
      expect(colorDecodeId(colorEncodeId(123456))).to.eql(123456);
      expect(colorDecodeId(colorEncodeId(91612))).to.eql(91612);
      expect(colorDecodeId(colorEncodeId(1234567890))).to.eql(1234567890);
    });

    it('correctly reuses array', function () {
      const arr = [];
      expect(colorEncodeId(123, arr)).to.be(arr);
    });

    it('is compatible with Uint8Array storage', function () {
      const encoded = colorEncodeId(91612);
      const typed = Uint8Array.of(
        encoded[0] * 255,
        encoded[1] * 255,
        encoded[2] * 255,
        encoded[3] * 255
      );
      const arr = [
        typed[0] / 255,
        typed[1] / 255,
        typed[2] / 255,
        typed[3] / 255,
      ];
      const decoded = colorDecodeId(arr);
      expect(decoded).to.eql(91612);
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
            return Promise.resolve(new ImageData(256, 256));
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
