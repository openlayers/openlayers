import TileLayer from '../../../../../src/ol/layer/Tile.js';
import {Map, View} from '../../../../../src/ol/index.js';
import {OSM, TileWMS, XYZ} from '../../../../../src/ol/source.js';

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
      expect(layer).to.be.a(TileLayer);
    });

    it('provides default preload', function () {
      expect(layer.getPreload()).to.be(0);
    });

    it('provides default useInterimTilesOnError', function () {
      expect(layer.getUseInterimTilesOnError()).to.be(true);
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
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('gets pixel data', () => {
      const data = layer.getData([50, 50]);
      expect(data).to.be.a(Uint8ClampedArray);
      expect(data.length).to.be(4);
      expect(data[0]).to.be(181);
      expect(data[1]).to.be(208);
      expect(data[2]).to.be(208);
      expect(data[3]).to.be(255);
    });

    it('gets pixel data', () => {
      layer.setVisible(false);
      map.renderSync();
      const data = layer.getData([50, 50]);
      expect(data).to.be(null);
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
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('gets pixel data', () => {
      data = layer.getData([76, 114]);
      expect(data).to.be.a(Uint8ClampedArray);
      expect(data.length).to.be(4);
      expect(data[0]).to.be(77);
      expect(data[1]).to.be(255);
      expect(data[2]).to.be(77);
      expect(data[3]).to.be(179);

      data = layer.getData([76, 118]);
      expect(data).to.be.a(Uint8ClampedArray);
      expect(data.length).to.be(4);
      expect(data[0]).to.be(255);
      expect(data[1]).to.be(77);
      expect(data[2]).to.be(77);
      expect(data[3]).to.be(179);

      data = layer.getData([80, 114]);
      expect(data).to.be.a(Uint8ClampedArray);
      expect(data.length).to.be(4);
      expect(data[0]).to.be(255);
      expect(data[1]).to.be(77);
      expect(data[2]).to.be(77);
      expect(data[3]).to.be(179);

      data = layer.getData([80, 118]);
      expect(data).to.be.a(Uint8ClampedArray);
      expect(data.length).to.be(4);
      expect(data[0]).to.be(77);
      expect(data[1]).to.be(255);
      expect(data[2]).to.be(77);
      expect(data[3]).to.be(179);
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
      map.dispose();
      document.body.removeChild(target);
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
        expect(lastFrameState.animate).to.be(false);
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
        expect(lastFrameState.animate).to.be(false);
        done();
      });

      map.addLayer(layer);
    });
  });
});
