import ImageWrapper from '../../../../src/ol/Image.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Layer from '../../../../src/ol/layer/Layer.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import LayerRenderer from '../../../../src/ol/renderer/Layer.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {fromKey} from '../../../../src/ol/tilecoord.js';


describe('ol.renderer.Layer', () => {
  let renderer;
  const eventType = 'change';

  beforeEach(() => {
    const layer = new Layer({});
    renderer = new LayerRenderer(layer);
  });

  describe('#loadImage', () => {
    let image;
    let imageLoadFunction;

    beforeEach(() => {
      const extent = [];
      const resolution = 1;
      const pixelRatio = 1;
      const src = '';
      const crossOrigin = '';
      imageLoadFunction = sinon.spy();
      image = new ImageWrapper(extent, resolution, pixelRatio, src, crossOrigin, imageLoadFunction);
    });

    describe('load IDLE image', () => {

      test('returns false', () => {
        const loaded = renderer.loadImage(image);
        expect(loaded).toBe(false);
      });

      test('registers a listener', () => {
        renderer.loadImage(image);
        const listeners = image.listeners_[eventType];
        expect(listeners).toHaveLength(1);
      });

    });

    describe('load LOADED image', () => {

      test('returns true', () => {
        image.state = 2; // LOADED
        const loaded = renderer.loadImage(image);
        expect(loaded).toBe(true);
      });

      test('does not register a listener', () => {
        image.state = 2; // LOADED
        const loaded = renderer.loadImage(image);
        expect(loaded).toBe(true);
      });

    });

    describe('load LOADING image', () => {

      beforeEach(() => {
        renderer.loadImage(image);
        expect(image.getState()).toBe(1);
      });

      test('returns false', () => {
        const loaded = renderer.loadImage(image);
        expect(loaded).toBe(false);
      });

      test('does not register a new listener', () => {
        renderer.loadImage(image);
        const listeners = image.listeners_[eventType];
        expect(listeners).toHaveLength(1);
      });

    });

  });

  describe('manageTilePyramid behavior', () => {
    let target, map, view, source;

    beforeEach(done => {
      target = document.createElement('div');
      Object.assign(target.style, {
        position: 'absolute',
        left: '-1000px',
        top: '-1000px',
        width: '360px',
        height: '180px'
      });
      document.body.appendChild(target);

      view = new View({
        center: [0, 0],
        multiWorld: true,
        zoom: 0
      });

      source = new XYZ({
        url: '#{x}/{y}/{z}'
      });

      map = new Map({
        target: target,
        view: view,
        layers: [
          new TileLayer({
            source: source
          })
        ]
      });
      map.once('postrender', function() {
        done();
      });
    });

    afterEach(() => {
      map.dispose();
      document.body.removeChild(target);
    });

    test('accesses tiles from current zoom level last', done => {
      // expect most recent tile in the cache to be from zoom level 0
      const key = source.tileCache.peekFirstKey();
      const tileCoord = fromKey(key);
      expect(tileCoord[0]).toBe(0);

      map.once('moveend', function() {
        // expect most recent tile in the cache to be from zoom level 4
        const key = source.tileCache.peekFirstKey();
        const tileCoord = fromKey(key);
        expect(tileCoord[0]).toBe(4);
        done();
      });
      view.setZoom(4);
    });
  });
});
