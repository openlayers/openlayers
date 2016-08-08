goog.provide('ol.test.source.RasterSource');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.proj.Projection');
goog.require('ol.source.ImageStatic');
goog.require('ol.source.Raster');
goog.require('ol.source.Source');
goog.require('ol.source.Tile');


var red = 'data:image/gif;base64,R0lGODlhAQABAPAAAP8AAP///yH5BAAAAAAALAAAAAA' +
    'BAAEAAAICRAEAOw==';

var green = 'data:image/gif;base64,R0lGODlhAQABAPAAAAD/AP///yH5BAAAAAAALAAAA' +
    'AABAAEAAAICRAEAOw==';

var blue = 'data:image/gif;base64,R0lGODlhAQABAPAAAAAA/////yH5BAAAAAAALAAAAA' +
    'ABAAEAAAICRAEAOw==';

where('Uint8ClampedArray').describe('ol.source.Raster', function() {

  var target, map, redSource, greenSource, blueSource, raster;

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

    redSource = new ol.source.ImageStatic({
      url: red,
      imageExtent: extent
    });

    greenSource = new ol.source.ImageStatic({
      url: green,
      imageExtent: extent
    });

    blueSource = new ol.source.ImageStatic({
      url: blue,
      imageExtent: extent
    });

    raster = new ol.source.Raster({
      threads: 0,
      sources: [redSource, greenSource, blueSource],
      operation: function(inputs) {
        return inputs[0];
      }
    });

    map = new ol.Map({
      target: target,
      view: new ol.View({
        resolutions: [1],
        projection: new ol.proj.Projection({
          code: 'image',
          units: 'pixels',
          extent: extent
        })
      }),
      layers: [
        new ol.layer.Image({
          source: raster
        })
      ]
    });
  });

  afterEach(function() {
    map.setTarget(null);
    map.dispose();
    raster.dispose();
    greenSource.dispose();
    redSource.dispose();
    blueSource.dispose();
    document.body.removeChild(target);
  });

  describe('constructor', function() {

    it('returns a tile source', function() {
      var source = new ol.source.Raster({
        threads: 0,
        sources: [new ol.source.Tile({})]
      });
      expect(source).to.be.a(ol.source.Source);
      expect(source).to.be.a(ol.source.Raster);
    });

    it('defaults to "pixel" operation', function(done) {

      var log = [];

      var source = new ol.source.Raster({
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

      var source = new ol.source.Raster({
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

});
