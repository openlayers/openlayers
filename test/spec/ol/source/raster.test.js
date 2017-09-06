

import _ol_Map_ from '../../../../src/ol/map';
import _ol_TileState_ from '../../../../src/ol/tilestate';
import _ol_View_ from '../../../../src/ol/view';
import _ol_layer_Image_ from '../../../../src/ol/layer/image';
import _ol_proj_Projection_ from '../../../../src/ol/proj/projection';
import _ol_source_ImageStatic_ from '../../../../src/ol/source/imagestatic';
import _ol_source_Raster_ from '../../../../src/ol/source/raster';
import _ol_source_Source_ from '../../../../src/ol/source/source';
import _ol_source_Tile_ from '../../../../src/ol/source/tile';
import _ol_source_XYZ_ from '../../../../src/ol/source/xyz';

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

    raster = new _ol_source_Raster_({
      threads: 0,
      sources: [redSource, greenSource, blueSource],
      operation: function(inputs) {
        return inputs[0];
      }
    });

    map = new _ol_Map_({
      target: target,
      view: new _ol_View_({
        resolutions: [1],
        projection: new _ol_proj_Projection_({
          code: 'image',
          units: 'pixels',
          extent: extent
        })
      }),
      layers: [
        new _ol_layer_Image_({
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
      var source = new _ol_source_Raster_({
        threads: 0,
        sources: [new _ol_source_Tile_({})]
      });
      expect(source).to.be.a(_ol_source_Source_);
      expect(source).to.be.a(_ol_source_Raster_);
    });

    it('defaults to "pixel" operation', function(done) {

      var log = [];

      var source = new _ol_source_Raster_({
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

      var source = new _ol_source_Raster_({
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

      raster = new _ol_source_Raster_({
        threads: 0,
        sources: [source],
        operation: function(inputs) {
          return inputs[0];
        }
      });

      map2 = new _ol_Map_({
        target: target,
        view: new _ol_View_({
          center: [0, 0],
          zoom: 0
        }),
        layers: [
          new _ol_layer_Image_({
            source: raster
          })
        ]
      });

      var tileCache = source.tileCache;

      expect(tileCache.getCount()).to.equal(0);

      map2.once('moveend', function() {
        expect(tileCache.getCount()).to.equal(1);
        var state = tileCache.peekLast().getState();
        expect(state === _ol_TileState_.LOADED || state === _ol_TileState_.LOADED).to.be(true);
        done();
      });

    });
  });

});
