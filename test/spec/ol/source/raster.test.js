import Map from '../../../../src/ol/Map.js';
import TileState from '../../../../src/ol/TileState.js';
import View from '../../../../src/ol/View.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import _ol_proj_Projection_ from '../../../../src/ol/proj/Projection.js';
import _ol_source_ImageStatic_ from '../../../../src/ol/source/ImageStatic.js';
import RasterSource from '../../../../src/ol/source/Raster.js';
import Source from '../../../../src/ol/source/Source.js';
import TileSource from '../../../../src/ol/source/Tile.js';
import _ol_source_XYZ_ from '../../../../src/ol/source/XYZ.js';

var red = 'data:image/gif;base64,R0lGODlhAQABAPAAAP8AAP///yH5BAAAAAAALAAAAAA' +
    'BAAEAAAICRAEAOw==';

var green = 'data:image/gif;base64,R0lGODlhAQABAPAAAAD/AP///yH5BAAAAAAALAAAA' +
    'AABAAEAAAICRAEAOw==';

var blue = 'data:image/gif;base64,R0lGODlhAQABAPAAAAAA/////yH5BAAAAAAALAAAAA' +
    'ABAAEAAAICRAEAOw==';

where('Uint8ClampedArray').describe('ol.source.Raster', function() {

  var map, target, redSource, greenSource, blueSource, raster;

  beforeEach(function() {
    target = document.createElement('div');

    var style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = '2px';
    style.height = '2px';
    document.body.appendChild(target);

    var extent = [-1, -1, 1, 1];

    redSource = new _ol_source_ImageStatic_({
      url: red,
      imageExtent: extent
    });

    greenSource = new _ol_source_ImageStatic_({
      url: green,
      imageExtent: extent
    });

    blueSource = new _ol_source_ImageStatic_({
      url: blue,
      imageExtent: extent
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
        projection: new _ol_proj_Projection_({
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

    it('returns a tile source', function() {
      var source = new RasterSource({
        threads: 0,
        sources: [new TileSource({})]
      });
      expect(source).to.be.a(Source);
      expect(source).to.be.a(RasterSource);
    });

    it('defaults to "pixel" operation', function(done) {

      var log = [];

      var source = new RasterSource({
        threads: 0,
        sources: [redSource, greenSource, blueSource],
        operation: function(inputs) {
          log.push(inputs);
          return inputs[0];
        }
      });

      source.once('afteroperations', function() {
        expect(log.length).to.equal(4);
        var inputs = log[0];
        var pixel = inputs[0];
        expect(pixel).to.be.an('array');
        done();
      });

      map.getLayers().item(0).setSource(source);
      var view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

    it('allows operation type to be set to "image"', function(done) {
      var log = [];

      var source = new RasterSource({
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
        var inputs = log[0];
        var imageData = inputs[0];
        expect(imageData.data).to.be.a(Uint8ClampedArray);
        expect(imageData.width).to.be(2);
        expect(imageData.height).to.be(2);
        done();
      });

      map.getLayers().item(0).setSource(source);
      var view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

  });

  describe('#setOperation()', function() {

    it('allows operation to be set', function(done) {

      var count = 0;
      raster.setOperation(function(pixels) {
        ++count;
        var redPixel = pixels[0];
        var greenPixel = pixels[1];
        var bluePixel = pixels[2];
        expect(redPixel).to.eql([255, 0, 0, 255]);
        expect(greenPixel).to.eql([0, 255, 0, 255]);
        expect(bluePixel).to.eql([0, 0, 255, 255]);
        return pixels[0];
      });

      var view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

      raster.once('afteroperations', function(event) {
        expect(count).to.equal(4);
        done();
      });

    });

    it('updates and re-runs the operation', function(done) {

      var view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

      var count = 0;
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

      var count = 0;
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

      var view = map.getView();
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

      var view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

  });

  describe('afteroperations', function() {

    it('gets called after operations are run', function(done) {

      var count = 0;
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

      var view = map.getView();
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

      var view = map.getView();
      view.setCenter([0, 0]);
      view.setZoom(0);

    });

  });

  describe('tile loading', function() {
    var map2;
    afterEach(function() {
      disposeMap(map2);
      map2 = null;
    });

    it('is initiated on the underlying source', function(done) {

      var source = new _ol_source_XYZ_({
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

      var tileCache = source.tileCache;

      expect(tileCache.getCount()).to.equal(0);

      map2.once('moveend', function() {
        expect(tileCache.getCount()).to.equal(1);
        var state = tileCache.peekLast().getState();
        expect(state === TileState.LOADED || state === TileState.LOADED).to.be(true);
        done();
      });

    });
  });

});
