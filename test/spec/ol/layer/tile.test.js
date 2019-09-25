import {Map, View} from '../../../../src/ol/index.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import {OSM, XYZ} from '../../../../src/ol/source.js';


describe('ol.layer.Tile', () => {

  describe('constructor (defaults)', () => {

    let layer;

    beforeEach(() => {
      layer = new TileLayer({
        source: new OSM()
      });
    });

    afterEach(() => {
      layer.dispose();
    });

    test('creates an instance', () => {
      expect(layer).toBeInstanceOf(TileLayer);
    });

    test('provides default preload', () => {
      expect(layer.getPreload()).toBe(0);
    });

    test('provides default useInterimTilesOnError', () => {
      expect(layer.getUseInterimTilesOnError()).toBe(true);
    });

  });

  describe('frameState.animate after tile transition with layer opacity', () => {
    let target, map;

    beforeEach(done => {
      target = document.createElement('div');
      Object.assign(target.style, {
        position: 'absolute',
        left: '-1000px',
        top: '-1000px',
        width: '256px',
        height: '256px'
      });
      document.body.appendChild(target);

      map = new Map({
        target: target,
        view: new View({center: [0, 0], zoom: 1})
      });

      map.once('rendercomplete', function() {
        done();
      });
    });

    afterEach(() => {
      map.dispose();
      document.body.removeChild(target);
    });

    test('sets frameState.animate to false when opacity is 1', done => {
      let lastFrameState;
      const layer = new TileLayer({
        opacity: 1,
        source: new XYZ({
          url: 'spec/ol/data/osm-0-0-0.png'
        })
      });
      layer.on('postrender', function(event) {
        lastFrameState = event.frameState;
      });

      map.once('rendercomplete', function() {
        expect(lastFrameState.animate).toBe(false);
        done();
      });

      map.addLayer(layer);
    });

    test('sets frameState.animate to false when opacity is 0.5', done => {
      let lastFrameState;
      const layer = new TileLayer({
        opacity: 0.5,
        source: new XYZ({
          url: 'spec/ol/data/osm-0-0-0.png'
        })
      });
      layer.on('postrender', function(event) {
        lastFrameState = event.frameState;
      });

      map.once('rendercomplete', function() {
        expect(lastFrameState.animate).toBe(false);
        done();
      });

      map.addLayer(layer);
    });
  });
});
