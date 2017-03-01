goog.provide('ol.test.style.AtlasManager');

goog.require('ol.style.Atlas');
goog.require('ol.style.AtlasManager');


describe('ol.style.Atlas', function() {

  var defaultRender = function(context, x, y) {
  };

  describe('#constructor', function() {

    it('inits the atlas', function() {
      var atlas = new ol.style.Atlas(256, 1);
      expect(atlas.emptyBlocks_).to.eql(
          [{x: 0, y: 0, width: 256, height: 256}]);
    });
  });

  describe('#add (squares with same size)', function() {

    it('adds one entry', function() {
      var atlas = new ol.style.Atlas(128, 1);
      var info = atlas.add('1', 32, 32, defaultRender);

      expect(info).to.eql(
          {offsetX: 1, offsetY: 1, image: atlas.canvas_});

      expect(atlas.get('1')).to.eql(info);
    });

    it('adds two entries', function() {
      var atlas = new ol.style.Atlas(128, 1);

      atlas.add('1', 32, 32, defaultRender);
      var info = atlas.add('2', 32, 32, defaultRender);

      expect(info).to.eql(
          {offsetX: 34, offsetY: 1, image: atlas.canvas_});

      expect(atlas.get('2')).to.eql(info);
    });

    it('adds three entries', function() {
      var atlas = new ol.style.Atlas(128, 1);

      atlas.add('1', 32, 32, defaultRender);
      atlas.add('2', 32, 32, defaultRender);
      var info = atlas.add('3', 32, 32, defaultRender);

      expect(info).to.eql(
          {offsetX: 67, offsetY: 1, image: atlas.canvas_});

      expect(atlas.get('3')).to.eql(info);
    });

    it('adds four entries (new row)', function() {
      var atlas = new ol.style.Atlas(128, 1);

      atlas.add('1', 32, 32, defaultRender);
      atlas.add('2', 32, 32, defaultRender);
      atlas.add('3', 32, 32, defaultRender);
      var info = atlas.add('4', 32, 32, defaultRender);

      expect(info).to.eql(
          {offsetX: 1, offsetY: 34, image: atlas.canvas_});

      expect(atlas.get('4')).to.eql(info);
    });

    it('returns null when an entry is too big', function() {
      var atlas = new ol.style.Atlas(128, 1);

      atlas.add('1', 32, 32, defaultRender);
      atlas.add('2', 32, 32, defaultRender);
      atlas.add('3', 32, 32, defaultRender);
      var info = atlas.add(4, 100, 100, defaultRender);

      expect(info).to.eql(null);
    });

    it('fills up the whole atlas', function() {
      var atlas = new ol.style.Atlas(128, 1);

      for (var i = 1; i <= 16; i++) {
        expect(atlas.add(i.toString(), 28, 28, defaultRender)).to.be.ok();
      }

      // there is no more space for items of this size, the next one will fail
      expect(atlas.add('17', 28, 28, defaultRender)).to.eql(null);
    });
  });

  describe('#add (rectangles with different sizes)', function() {

    it('adds a bunch of rectangles', function() {
      var atlas = new ol.style.Atlas(128, 1);

      expect(atlas.add('1', 64, 32, defaultRender)).to.eql(
          {offsetX: 1, offsetY: 1, image: atlas.canvas_});

      expect(atlas.add('2', 64, 32, defaultRender)).to.eql(
          {offsetX: 1, offsetY: 34, image: atlas.canvas_});

      expect(atlas.add('3', 64, 32, defaultRender)).to.eql(
          {offsetX: 1, offsetY: 67, image: atlas.canvas_});

      // this one can not be added anymore
      expect(atlas.add('4', 64, 32, defaultRender)).to.eql(null);

      // but there is still room for smaller ones
      expect(atlas.add('5', 40, 32, defaultRender)).to.eql(
          {offsetX: 66, offsetY: 1, image: atlas.canvas_});

      expect(atlas.add('6', 40, 32, defaultRender)).to.eql(
          {offsetX: 66, offsetY: 34, image: atlas.canvas_});
    });

    it('fills up the whole atlas (rectangles in portrait format)', function() {
      var atlas = new ol.style.Atlas(128, 1);

      for (var i = 1; i <= 32; i++) {
        expect(atlas.add(i.toString(), 28, 14, defaultRender)).to.be.ok();
      }

      // there is no more space for items of this size, the next one will fail
      expect(atlas.add('33', 28, 14, defaultRender)).to.eql(null);
    });

    it('fills up the whole atlas (rectangles in landscape format)', function() {
      var atlas = new ol.style.Atlas(128, 1);

      for (var i = 1; i <= 32; i++) {
        expect(atlas.add(i.toString(), 14, 28, defaultRender)).to.be.ok();
      }

      // there is no more space for items of this size, the next one will fail
      expect(atlas.add('33', 14, 28, defaultRender)).to.eql(null);
    });
  });

  describe('#add (rendering)', function() {

    it('calls the render callback with the right values', function() {
      var atlas = new ol.style.Atlas(128, 1);
      var rendererCallback = sinon.spy();
      atlas.add('1', 32, 32, rendererCallback);

      expect(rendererCallback.calledOnce).to.be.ok();
      expect(rendererCallback.calledWith(atlas.context_, 1, 1)).to.be.ok();

      rendererCallback = sinon.spy();
      atlas.add('2', 32, 32, rendererCallback);

      expect(rendererCallback.calledOnce).to.be.ok();
      expect(rendererCallback.calledWith(atlas.context_, 34, 1)).to.be.ok();
    });

    it('is possible to actually draw on the canvas', function() {
      var atlas = new ol.style.Atlas(128, 1);

      var rendererCallback = function(context, x, y) {
        context.fillStyle = '#FFA500';
        context.fillRect(x, y, 32, 32);
      };

      expect(atlas.add('1', 32, 32, rendererCallback)).to.be.ok();
      expect(atlas.add('2', 32, 32, rendererCallback)).to.be.ok();
      // no error, ok
    });
  });
});


describe('ol.style.AtlasManager', function() {

  var defaultRender = function(context, x, y) {
  };

  describe('#constructor', function() {

    it('inits the atlas manager', function() {
      var manager = new ol.style.AtlasManager();
      expect(manager.atlases_).to.not.be.empty();
    });
  });

  describe('#add', function() {

    it('adds one entry', function() {
      var manager = new ol.style.AtlasManager({initialSize: 128});
      var info = manager.add('1', 32, 32, defaultRender);

      expect(info).to.eql({
        offsetX: 1, offsetY: 1, image: manager.atlases_[0].canvas_,
        hitImage: manager.hitAtlases_[0].canvas_});

      expect(manager.getInfo('1')).to.eql(info);
    });

    it('adds one entry (also to the hit detection atlas)', function() {
      var manager = new ol.style.AtlasManager({initialSize: 128});
      var info = manager.add('1', 32, 32, defaultRender, defaultRender);

      expect(info).to.eql({
        offsetX: 1, offsetY: 1, image: manager.atlases_[0].canvas_,
        hitImage: manager.hitAtlases_[0].canvas_});

      expect(manager.getInfo('1')).to.eql(info);
    });

    it('creates a new atlas if needed', function() {
      var manager = new ol.style.AtlasManager({initialSize: 128});
      expect(manager.add('1', 100, 100, defaultRender, defaultRender))
          .to.be.ok();
      var info = manager.add('2', 100, 100, defaultRender, defaultRender);
      expect(info).to.be.ok();
      expect(info.image.width).to.eql(256);
      expect(manager.atlases_).to.have.length(2);
      expect(info.hitImage.width).to.eql(256);
      expect(manager.hitAtlases_).to.have.length(2);
    });

    it('creates new atlases until one is large enough', function() {
      var manager = new ol.style.AtlasManager({initialSize: 128});
      expect(manager.add('1', 100, 100, defaultRender, defaultRender))
          .to.be.ok();
      expect(manager.atlases_).to.have.length(1);
      expect(manager.hitAtlases_).to.have.length(1);
      var info = manager.add('2', 500, 500, defaultRender, defaultRender);
      expect(info).to.be.ok();
      expect(info.image.width).to.eql(512);
      expect(manager.atlases_).to.have.length(3);
      expect(info.hitImage.width).to.eql(512);
      expect(manager.hitAtlases_).to.have.length(3);
    });

    it('checks all existing atlases and create a new if needed', function() {
      var manager = new ol.style.AtlasManager({initialSize: 128});
      expect(manager.add('1', 100, 100, defaultRender, defaultRender))
          .to.be.ok();
      expect(manager.add('2', 100, 100, defaultRender, defaultRender))
          .to.be.ok();
      expect(manager.atlases_).to.have.length(2);
      expect(manager.hitAtlases_).to.have.length(2);
      var info = manager.add(3, 500, 500, defaultRender, defaultRender);
      expect(info).to.be.ok();
      expect(info.image.width).to.eql(512);
      expect(manager.atlases_).to.have.length(3);
      expect(info.hitImage.width).to.eql(512);
      expect(manager.hitAtlases_).to.have.length(3);
    });

    it('returns null if the size exceeds the maximum size', function() {
      var manager = new ol.style.AtlasManager(
          {initialSize: 128, maxSize: 2048});
      expect(manager.add('1', 100, 100, defaultRender, defaultRender))
          .to.be.ok();
      expect(manager.add('2', 2048, 2048, defaultRender, defaultRender))
          .to.eql(null);
    });

    it('always has the same offset for the hit-detection', function() {
      var manager = new ol.style.AtlasManager({initialSize: 128});
      // add one image without hit-detection callback
      var info = manager.add('1', 32, 32, defaultRender);
      // add then one with hit-detection callback
      info = manager.add('2', 32, 32, defaultRender, defaultRender);

      expect(info).to.eql({
        offsetX: 34, offsetY: 1, image: manager.atlases_[0].canvas_,
        hitImage: manager.hitAtlases_[0].canvas_});

      expect(manager.getInfo('2')).to.eql(info);
    });
  });

  describe('#getInfo', function() {

    it('returns null if no entry for the given id', function() {
      var manager = new ol.style.AtlasManager({initialSize: 128});
      expect(manager.getInfo('123456')).to.eql(null);
    });
  });
});
