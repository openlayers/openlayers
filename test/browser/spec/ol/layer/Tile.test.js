import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import TileLayer from '../../../../../src/ol/layer/Tile.js';
import OSM from '../../../../../src/ol/source/OSM.js';
import TileWMS from '../../../../../src/ol/source/TileWMS.js';
import XYZ from '../../../../../src/ol/source/XYZ.js';

describe('ol/layer/Tile', function () {
  describe('constructor (defaults)', function () {
    let layer;

    beforeEach(function () {
      layer = new TileLayer({
        source: new OSM(),
      });
    });

    afterEach(function () {
      layer.dispose();
    });

    it('creates an instance', function () {
      assert.instanceOf(layer, TileLayer);
    });

    it('provides default preload', function () {
      assert.strictEqual(layer.getPreload(), 0);
    });

    it('provides default useInterimTilesOnError', function () {
      assert.strictEqual(layer.getUseInterimTilesOnError(), true);
    });
  });

  describe('getData()', () => {
    let map, target, layer;
    beforeEach((done) => {
      target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);

      layer = new TileLayer({
        source: new XYZ({
          url: 'spec/ol/data/osm-0-0-0.png',
        }),
      });

      map = new Map({
        target: target,
        layers: [layer],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });

      map.once('rendercomplete', () => done());
    });

    afterEach(() => {
      disposeMap(map);
    });

    it('gets pixel data', () => {
      const data = layer.getData([50, 50]);
      assert.instanceOf(data, Uint8ClampedArray);
      assert.strictEqual(data.length, 4);
      assert.strictEqual(data[0], 181);
      assert.strictEqual(data[1], 208);
      assert.strictEqual(data[2], 208);
      assert.strictEqual(data[3], 255);
    });

    it('gets reprojected pixel data', (done) => {
      layer.setSource(
        new XYZ({
          url: 'spec/ol/data/osm-0-0-0.png',
          maxZoom: 0,
          interpolate: false,
        }),
      );
      map.setView(
        new View({
          center: [0, 0],
          zoom: 1,
          projection: 'EPSG:4326',
        }),
      );
      map.once('rendercomplete', () => {
        const data = layer.getData([50, 50]);
        assert.instanceOf(data, Uint8ClampedArray);
        assert.strictEqual(data.length, 4);
        assert.strictEqual(data[0], 181);
        assert.strictEqual(data[1], 208);
        assert.strictEqual(data[2], 208);
        assert.strictEqual(data[3], 255);
        done();
      });
    });

    it('gets pixel data', () => {
      layer.setVisible(false);
      map.renderSync();
      const data = layer.getData([50, 50]);
      assert.strictEqual(data, null);
    });
  });

  describe('gutter', () => {
    let map, target, layer, data;
    beforeEach((done) => {
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);

      layer = new TileLayer({
        source: new TileWMS({
          params: {
            LAYERS: 'layer',
          },
          gutter: 20,
          url: 'spec/ol/data/wms20.png',
        }),
      });

      map = new Map({
        target: target,
        pixelRatio: 1,
        layers: [layer],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });

      map.once('rendercomplete', () => done());
    });

    afterEach(() => {
      disposeMap(map);
    });

    it('gets pixel data', () => {
      data = layer.getData([76, 114]);
      assert.instanceOf(data, Uint8ClampedArray);
      assert.strictEqual(data.length, 4);
      assert.strictEqual(data[0], 77);
      assert.strictEqual(data[1], 255);
      assert.strictEqual(data[2], 77);
      assert.strictEqual(data[3], 179);

      data = layer.getData([76, 118]);
      assert.instanceOf(data, Uint8ClampedArray);
      assert.strictEqual(data.length, 4);
      assert.strictEqual(data[0], 255);
      assert.strictEqual(data[1], 77);
      assert.strictEqual(data[2], 77);
      assert.strictEqual(data[3], 179);

      data = layer.getData([80, 114]);
      assert.instanceOf(data, Uint8ClampedArray);
      assert.strictEqual(data.length, 4);
      assert.strictEqual(data[0], 255);
      assert.strictEqual(data[1], 77);
      assert.strictEqual(data[2], 77);
      assert.strictEqual(data[3], 179);

      data = layer.getData([80, 118]);
      assert.instanceOf(data, Uint8ClampedArray);
      assert.strictEqual(data.length, 4);
      assert.strictEqual(data[0], 77);
      assert.strictEqual(data[1], 255);
      assert.strictEqual(data[2], 77);
      assert.strictEqual(data[3], 179);
    });
  });

  describe('frameState.animate after tile transition with layer opacity', function () {
    let target, map;

    beforeEach(function (done) {
      target = document.createElement('div');
      Object.assign(target.style, {
        position: 'absolute',
        left: '-1000px',
        top: '-1000px',
        width: '256px',
        height: '256px',
      });
      document.body.appendChild(target);

      map = new Map({
        target: target,
        view: new View({center: [0, 0], zoom: 1}),
      });

      map.once('rendercomplete', function () {
        done();
      });
    });

    afterEach(function () {
      disposeMap(map);
    });

    it('sets frameState.animate to false when opacity is 1', function (done) {
      let lastFrameState;
      const layer = new TileLayer({
        opacity: 1,
        source: new XYZ({
          url: 'spec/ol/data/osm-0-0-0.png',
        }),
      });
      layer.on('postrender', function (event) {
        lastFrameState = event.frameState;
      });

      map.once('rendercomplete', function () {
        assert.strictEqual(lastFrameState.animate, false);
        done();
      });

      map.addLayer(layer);
    });

    it('sets frameState.animate to false when opacity is 0.5', function (done) {
      let lastFrameState;
      const layer = new TileLayer({
        opacity: 0.5,
        source: new XYZ({
          url: 'spec/ol/data/osm-0-0-0.png',
        }),
      });
      layer.on('postrender', function (event) {
        lastFrameState = event.frameState;
      });

      map.once('rendercomplete', function () {
        assert.strictEqual(lastFrameState.animate, false);
        done();
      });

      map.addLayer(layer);
    });
  });
});
