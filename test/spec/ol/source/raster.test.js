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

  beforeEach(function() {
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

  afterEach(function() {
    if (map) {
      disposeMap(map);
    }
    map = null;
    raster.dispose();
    greenSource.dispose();
    redSource.dispose();
    blueSource.dispose();
  });

  describe('constructor', function() {

    it('returns a raster source', function() {
      const source = new RasterSource({
        threads: 0,
        sources: [new TileSource({})]
      });
      expect(source).to.be.a(Source);
      expect(source).to.be.a(RasterSource);
    });

    it('defaults to "pixel" operation', function(done) {

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
        expect(log.length).to.equal(4);
        const inputs = log[0];
        const pixel = inputs[0];
        expect(pixel).to.be.an('array');
        done();
      });

      map.getLayers().item(0).setSource(source);
      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

    it('allows operation type to be set to "image"', function(done) {
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
        expect(log.length).to.equal(1);
        const inputs = log[0];
        const imageData = inputs[0];
        expect(imageData.data).to.be.a(Uint8ClampedArray);
        expect(imageData.width).to.be(2);
        expect(imageData.height).to.be(2);
        done();
      });

      map.getLayers().item(0).setSource(source);
      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

  });

  describe('config option `attributions`', function() {
    it('handles empty attributions', function() {
      const blue = new RasterSource({
        operationType: 'image',
        threads: 0,
        sources: [blueSource],
        operation: function(inputs) {
          return inputs[0];
        }
      });
      const blueAttributions = blue.getAttributions();
      expect(blueAttributions()).to.be(null);
    });

    it('shows single attributions', function() {
      const red = new RasterSource({
        operationType: 'image',
        threads: 0,
        sources: [redSource],
        operation: function(inputs) {
          return inputs[0];
        }
      });
      const redAttribtuions = red.getAttributions();

      expect(redAttribtuions()).to.not.be(null);
      expect(typeof redAttribtuions).to.be('function');
      expect(redAttribtuions()).to.eql(['red raster source']);
    });

    it('concatinates multiple attributions', function() {
      const redGreen = new RasterSource({
        operationType: 'image',
        threads: 0,
        sources: [redSource, greenSource],
        operation: function(inputs) {
          return inputs[0];
        }
      });
      const redGreenAttributions = redGreen.getAttributions();

      expect(redGreenAttributions()).to.not.be(null);
      expect(typeof redGreenAttributions).to.be('function');
      expect(redGreenAttributions()).to.eql(['red raster source', 'green raster source']);
    });

  });

  describe('#setOperation()', function() {

    it('allows operation to be set', function(done) {

      let count = 0;
      raster.setOperation(function(pixels) {
        ++count;
        const redPixel = pixels[0];
        const greenPixel = pixels[1];
        const bluePixel = pixels[2];
        expect(redPixel).to.eql([255, 0, 0, 255]);
        expect(greenPixel).to.eql([0, 255, 0, 255]);
        expect(bluePixel).to.eql([0, 0, 255, 255]);
        return pixels[0];
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

      raster.once('afteroperations', function(event) {
        expect(count).to.equal(4);
        done();
      });

    });

    it('updates and re-runs the operation', function(done) {

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

  describe('beforeoperations', function() {

    it('gets called before operations are run', function(done) {

      let count = 0;
      raster.setOperation(function(inputs) {
        ++count;
        return inputs[0];
      });

      raster.once('beforeoperations', function(event) {
        expect(count).to.equal(0);
        expect(!!event).to.be(true);
        expect(event.extent).to.be.an('array');
        expect(event.resolution).to.be.a('number');
        expect(event.data).to.be.an('object');
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });


    it('allows data to be set for the operation', function(done) {

      raster.setOperation(function(inputs, data) {
        ++data.count;
        return inputs[0];
      });

      raster.on('beforeoperations', function(event) {
        event.data.count = 0;
      });

      raster.once('afteroperations', function(event) {
        expect(event.data.count).to.equal(4);
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

  });

  describe('afteroperations', function() {

    it('gets called after operations are run', function(done) {

      let count = 0;
      raster.setOperation(function(inputs) {
        ++count;
        return inputs[0];
      });

      raster.once('afteroperations', function(event) {
        expect(count).to.equal(4);
        expect(!!event).to.be(true);
        expect(event.extent).to.be.an('array');
        expect(event.resolution).to.be.a('number');
        expect(event.data).to.be.an('object');
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

    it('receives data set by the operation', function(done) {

      raster.setOperation(function(inputs, data) {
        data.message = 'hello world';
        return inputs[0];
      });

      raster.once('afteroperations', function(event) {
        expect(event.data.message).to.equal('hello world');
        done();
      });

      const view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

  });

  describe('tile loading', function() {
    let map2;
    afterEach(function() {
      disposeMap(map2);
      map2 = null;
    });

    it('is initiated on the underlying source', function(done) {

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

      expect(tileCache.getCount()).to.equal(0);

      map2.once('moveend', function() {
        expect(tileCache.getCount()).to.equal(1);
        const state = tileCache.peekLast().getState();
        expect(state === TileState.LOADING || state === TileState.LOADED).to.be(true);
        done();
      });

    });
  });

});
