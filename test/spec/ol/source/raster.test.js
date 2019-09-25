import Map from '../../../../src/ol/Map.js';
import TileState from '../../../../src/ol/TileState.js';
import View from '../../../../src/ol/View.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import VectorImageLayer from '../../../../src/ol/layer/VectorImage.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import Static from '../../../../src/ol/source/ImageStatic.js';
import RasterSource from '../../../../src/ol/source/Raster.js';
import Source from '../../../../src/ol/source/Source.js';
import TileSource from '../../../../src/ol/source/Tile.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Feature from '../../../../src/ol/Feature.js';
import Point from '../../../../src/ol/geom/Point.js';
import {Style, Circle, Fill} from '../../../../src/ol/style.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

const red = 'data:image/gif;base64,R0lGODlhAQABAPAAAP8AAP///yH5BAAAAAAALAAAAAA' +
    'BAAEAAAICRAEAOw==';

const green = 'data:image/gif;base64,R0lGODlhAQABAPAAAAD/AP///yH5BAAAAAAALAAAA' +
    'AABAAEAAAICRAEAOw==';

where('Uint8ClampedArray').describe('ol.source.Raster', function() {

  let map, target, redSource, greenSource, blueSource, raster;

  beforeEach(() => {
    target = document.createElement('div');

    const style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = '2px';
    style.height = '2px';
    document.body.appendChild(target);

    const extent = [-1, -1, 1, 1];

    redSource = new Static({
      url: red,
      imageExtent: extent,
      attributions: ['red raster source']
    });

    greenSource = new Static({
      url: green,
      imageExtent: extent,
      attributions: ['green raster source']
    });

    blueSource = new VectorImageLayer({
      source: new VectorSource({
        features: [new Feature(new Point([0, 0]))]
      }),
      style: new Style({
        image: new Circle({
          radius: 3,
          fill: new Fill({color: 'blue'})
        })
      })
    });

    raster = new RasterSource({
      threads: 0,
      sources: [redSource, greenSource, blueSource],
      operation: function(inputs) {
        return inputs[0];
      }
    });

    map = new Map({
      target: target,
      view: new View({
        resolutions: [1],
        projection: new Projection({
          code: 'image',
          units: 'pixels',
          extent: extent
        })
      }),
      layers: [
        new ImageLayer({
          source: raster
        })
      ]
    });
  });

  afterEach(() => {
    if (map) {
      disposeMap(map);
    }
    map = null;
    raster.dispose();
    greenSource.dispose();
    redSource.dispose();
    blueSource.dispose();
  });

  describe('constructor', () => {

    test('returns a raster source', () => {
      const source = new RasterSource({
        threads: 0,
        sources: [new TileSource({})]
      });
      expect(source).toBeInstanceOf(Source);
      expect(source).toBeInstanceOf(RasterSource);
    });

    test('defaults to "pixel" operation', done => {

      const log = [];

      const source = new RasterSource({
        threads: 0,
        sources: [redSource, greenSource, blueSource],
        operation: function(inputs) {
          log.push(inputs);
          return inputs[0];
        }
      });

      source.once('afteroperations', function() {
        expect(log.length).toBe(4);
        const inputs = log[0];
        const pixel = inputs[0];
        expect(pixel).toBeInstanceOf(Array);
        done();
      });

      map.getLayers().item(0).setSource(source);
      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

    test('allows operation type to be set to "image"', done => {
      const log = [];

      const source = new RasterSource({
        operationType: 'image',
        threads: 0,
        sources: [redSource, greenSource, blueSource],
        operation: function(inputs) {
          log.push(inputs);
          return inputs[0];
        }
      });

      source.once('afteroperations', function() {
        expect(log.length).toBe(1);
        const inputs = log[0];
        const imageData = inputs[0];
        expect(imageData.data).toBeInstanceOf(Uint8ClampedArray);
        expect(imageData.width).toBe(2);
        expect(imageData.height).toBe(2);
        done();
      });

      map.getLayers().item(0).setSource(source);
      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

  });

  describe('config option `attributions`', () => {
    test('handles empty attributions', () => {
      const blue = new RasterSource({
        operationType: 'image',
        threads: 0,
        sources: [blueSource],
        operation: function(inputs) {
          return inputs[0];
        }
      });
      const blueAttributions = blue.getAttributions();
      expect(blueAttributions()).toBe(null);
    });

    test('shows single attributions', () => {
      const red = new RasterSource({
        operationType: 'image',
        threads: 0,
        sources: [redSource],
        operation: function(inputs) {
          return inputs[0];
        }
      });
      const redAttribtuions = red.getAttributions();

      expect(redAttribtuions()).not.toBe(null);
      expect(typeof redAttribtuions).toBe('function');
      expect(redAttribtuions()).toEqual(['red raster source']);
    });

    test('concatinates multiple attributions', () => {
      const redGreen = new RasterSource({
        operationType: 'image',
        threads: 0,
        sources: [redSource, greenSource],
        operation: function(inputs) {
          return inputs[0];
        }
      });
      const redGreenAttributions = redGreen.getAttributions();

      expect(redGreenAttributions()).not.toBe(null);
      expect(typeof redGreenAttributions).toBe('function');
      expect(redGreenAttributions()).toEqual(['red raster source', 'green raster source']);
    });

  });

  describe('#setOperation()', () => {

    test('allows operation to be set', done => {

      let count = 0;
      raster.setOperation(function(pixels) {
        ++count;
        const redPixel = pixels[0];
        const greenPixel = pixels[1];
        const bluePixel = pixels[2];
        expect(redPixel).toEqual([255, 0, 0, 255]);
        expect(greenPixel).toEqual([0, 255, 0, 255]);
        expect(bluePixel).toEqual([0, 0, 255, 255]);
        return pixels[0];
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

      raster.once('afteroperations', function(event) {
        expect(count).toBe(4);
        done();
      });

    });

    test('updates and re-runs the operation', done => {

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

      let count = 0;
      raster.on('afteroperations', function(event) {
        ++count;
        if (count === 1) {
          raster.setOperation(function(inputs) {
            return inputs[0];
          });
        } else {
          done();
        }
      });

    });

  });

  describe('beforeoperations', () => {

    test('gets called before operations are run', done => {

      let count = 0;
      raster.setOperation(function(inputs) {
        ++count;
        return inputs[0];
      });

      raster.once('beforeoperations', function(event) {
        expect(count).toBe(0);
        expect(!!event).toBe(true);
        expect(event.extent).toBeInstanceOf(Array);
        expect(typeof event.resolution).toBe('number');
        expect(typeof event.data).toBe('object');
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });


    test('allows data to be set for the operation', done => {

      raster.setOperation(function(inputs, data) {
        ++data.count;
        return inputs[0];
      });

      raster.on('beforeoperations', function(event) {
        event.data.count = 0;
      });

      raster.once('afteroperations', function(event) {
        expect(event.data.count).toBe(4);
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

  });

  describe('afteroperations', () => {

    test('gets called after operations are run', done => {

      let count = 0;
      raster.setOperation(function(inputs) {
        ++count;
        return inputs[0];
      });

      raster.once('afteroperations', function(event) {
        expect(count).toBe(4);
        expect(!!event).toBe(true);
        expect(event.extent).toBeInstanceOf(Array);
        expect(typeof event.resolution).toBe('number');
        expect(typeof event.data).toBe('object');
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

    test('receives data set by the operation', done => {

      raster.setOperation(function(inputs, data) {
        data.message = 'hello world';
        return inputs[0];
      });

      raster.once('afteroperations', function(event) {
        expect(event.data.message).toBe('hello world');
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

  });

  describe('tile loading', () => {
    let map2;
    afterEach(() => {
      disposeMap(map2);
      map2 = null;
    });

    test('is initiated on the underlying source', done => {

      const source = new XYZ({
        url: 'spec/ol/data/osm-{z}-{x}-{y}.png'
      });

      raster = new RasterSource({
        threads: 0,
        sources: [source],
        operation: function(inputs) {
          return inputs[0];
        }
      });

      map2 = new Map({
        target: target,
        view: new View({
          center: [0, 0],
          zoom: 0
        }),
        layers: [
          new ImageLayer({
            source: raster
          })
        ]
      });

      const tileCache = source.tileCache;

      expect(tileCache.getCount()).toBe(0);

      map2.once('moveend', function() {
        expect(tileCache.getCount()).toBe(1);
        const state = tileCache.peekLast().getState();
        expect(state === TileState.LOADING || state === TileState.LOADED).toBe(true);
        done();
      });

    });
  });

});
