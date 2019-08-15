import {Map, View} from '../../../../src/ol/index.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import {OSM, XYZ} from '../../../../src/ol/source.js';


describe('ol.layer.Tile', function() {

  describe('constructor (defaults)', function() {

    let layer;

    beforeEach(function() {
      layer = new TileLayer({
        source: new OSM()
      });
    });

    afterEach(function() {
      layer.dispose();
    });

    it('creates an instance', function() {
      expect(layer).to.be.a(TileLayer);
    });

    it('provides default preload', function() {
      expect(layer.getPreload()).to.be(0);
    });

    it('provides default useInterimTilesOnError', function() {
      expect(layer.getUseInterimTilesOnError()).to.be(true);
    });

  });

  describe('frameState.animate after tile transition with layer opacity', function() {
    let target, map;

    beforeEach(function(done) {
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

    afterEach(function() {
      map.dispose();
      document.body.removeChild(target);
    });

    it('sets frameState.animate to false when opacity is 1', function(done) {
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
        expect(lastFrameState.animate).to.be(false);
        done();
      });

      map.addLayer(layer);
    });

    it('sets frameState.animate to false when opacity is 0.5', function(done) {
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
        expect(lastFrameState.animate).to.be(false);
        done();
      });

      map.addLayer(layer);
    });
  });
});
