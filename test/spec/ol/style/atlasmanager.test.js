import Atlas from '../../../../src/ol/style/Atlas.js';
import AtlasManager from '../../../../src/ol/style/AtlasManager.js';


describe('ol.style.Atlas', function() {

  const defaultRender = function(context, x, y) {
  };

  describe('#constructor', function() {

    it('inits the atlas', function() {
      const atlas = new Atlas(256, 1);
      expect(atlas.emptyBlocks_).to.eql(
        [{x: 0, y: 0, width: 256, height: 256}]);
    });
  });

  describe('#add (squares with same size)', function() {

    it('adds one entry', function() {
      const atlas = new Atlas(128, 1);
      const info = atlas.add('1', 32, 32, defaultRender);

      expect(info).to.eql(
        {offsetX: 1, offsetY: 1, image: atlas.canvas_});

      expect(atlas.get('1')).to.eql(info);
    });

    it('adds two entries', function() {
      const atlas = new Atlas(128, 1);

      atlas.add('1', 32, 32, defaultRender);
      const info = atlas.add('2', 32, 32, defaultRender);

      expect(info).to.eql(
        {offsetX: 34, offsetY: 1, image: atlas.canvas_});

      expect(atlas.get('2')).to.eql(info);
    });

    it('adds three entries', function() {
      const atlas = new Atlas(128, 1);

      atlas.add('1', 32, 32, defaultRender);
      atlas.add('2', 32, 32, defaultRender);
      const info = atlas.add('3', 32, 32, defaultRender);

      expect(info).to.eql(
        {offsetX: 67, offsetY: 1, image: atlas.canvas_});

      expect(atlas.get('3')).to.eql(info);
    });

    it('adds four entries (new row)', function() {
      const atlas = new Atlas(128, 1);

      atlas.add('1', 32, 32, defaultRender);
      atlas.add('2', 32, 32, defaultRender);
      atlas.add('3', 32, 32, defaultRender);
      const info = atlas.add('4', 32, 32, defaultRender);

      expect(info).to.eql(
        {offsetX: 1, offsetY: 34, image: atlas.canvas_});

      expect(atlas.get('4')).to.eql(info);
    });

    it('returns null when an entry is too big', function() {
      const atlas = new Atlas(128, 1);

      atlas.add('1', 32, 32, defaultRender);
      atlas.add('2', 32, 32, defaultRender);
      atlas.add('3', 32, 32, defaultRender);
      const info = atlas.add(4, 100, 100, defaultRender);

      expect(info).to.eql(null);
    });

    it('fills up the whole atlas', function() {
      const atlas = new Atlas(128, 1);

      for (let i = 1; i <= 16; i++) {
        expect(atlas.add(i.toString(), 28, 28, defaultRender)).to.be.ok();
      }

      // there is no more space for items of this size, the next one will fail
      expect(atlas.add('17', 28, 28, defaultRender)).to.eql(null);
    });
  });

  describe('#add (rectangles with different sizes)', function() {

    it('adds a bunch of rectangles', function() {
      const atlas = new Atlas(128, 1);

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
      const atlas = new Atlas(128, 1);

      for (let i = 1; i <= 32; i++) {
        expect(atlas.add(i.toString(), 28, 14, defaultRender)).to.be.ok();
      }

      // there is no more space for items of this size, the next one will fail
      expect(atlas.add('33', 28, 14, defaultRender)).to.eql(null);
    });

    it('fills up the whole atlas (rectangles in landscape format)', function() {
      const atlas = new Atlas(128, 1);

      for (let i = 1; i <= 32; i++) {
        expect(atlas.add(i.toString(), 14, 28, defaultRender)).to.be.ok();
      }

      // there is no more space for items of this size, the next one will fail
      expect(atlas.add('33', 14, 28, defaultRender)).to.eql(null);
    });
  });

  describe('#add (rendering)', function() {

    it('calls the render callback with the right values', function() {
      const atlas = new Atlas(128, 1);
      let rendererCallback = sinon.spy();
      atlas.add('1', 32, 32, rendererCallback);

      expect(rendererCallback.calledOnce).to.be.ok();
      expect(rendererCallback.calledWith(atlas.context_, 1, 1)).to.be.ok();

      rendererCallback = sinon.spy();
      atlas.add('2', 32, 32, rendererCallback);

      expect(rendererCallback.calledOnce).to.be.ok();
      expect(rendererCallback.calledWith(atlas.context_, 34, 1)).to.be.ok();
    });

    it('is possible to actually draw on the canvas', function() {
      const atlas = new Atlas(128, 1);

      const rendererCallback = function(context, x, y) {
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

  const defaultRender = function(context, x, y) {
  };

  describe('#constructor', function() {

    it('inits the atlas manager', function() {
      const manager = new AtlasManager();
      expect(manager.atlases_).to.not.be.empty();
    });
  });

  describe('#add', function() {

    it('adds one entry', function() {
      const manager = new AtlasManager({initialSize: 128});
      const info = manager.add('1', 32, 32, defaultRender);

      expect(info).to.eql({
        offsetX: 1, offsetY: 1, image: manager.atlases_[0].canvas_,
        hitImage: manager.hitAtlases_[0].canvas_});

      expect(manager.getInfo('1')).to.eql(info);
    });

    it('adds one entry (also to the hit detection atlas)', function() {
      const manager = new AtlasManager({initialSize: 128});
      const info = manager.add('1', 32, 32, defaultRender, defaultRender);

      expect(info).to.eql({
        offsetX: 1, offsetY: 1, image: manager.atlases_[0].canvas_,
        hitImage: manager.hitAtlases_[0].canvas_});

      expect(manager.getInfo('1')).to.eql(info);
    });

    it('creates a new atlas if needed', function() {
      const manager = new AtlasManager({initialSize: 128});
      expect(manager.add('1', 100, 100, defaultRender, defaultRender))
        .to.be.ok();
      const info = manager.add('2', 100, 100, defaultRender, defaultRender);
      expect(info).to.be.ok();
      expect(info.image.width).to.eql(256);
      expect(manager.atlases_).to.have.length(2);
      expect(info.hitImage.width).to.eql(256);
      expect(manager.hitAtlases_).to.have.length(2);
    });

    it('creates new atlases until one is large enough', function() {
      const manager = new AtlasManager({initialSize: 128});
      expect(manager.add('1', 100, 100, defaultRender, defaultRender))
        .to.be.ok();
      expect(manager.atlases_).to.have.length(1);
      expect(manager.hitAtlases_).to.have.length(1);
      const info = manager.add('2', 500, 500, defaultRender, defaultRender);
      expect(info).to.be.ok();
      expect(info.image.width).to.eql(512);
      expect(manager.atlases_).to.have.length(3);
      expect(info.hitImage.width).to.eql(512);
      expect(manager.hitAtlases_).to.have.length(3);
    });

    it('checks all existing atlases and create a new if needed', function() {
      const manager = new AtlasManager({initialSize: 128});
      expect(manager.add('1', 100, 100, defaultRender, defaultRender))
        .to.be.ok();
      expect(manager.add('2', 100, 100, defaultRender, defaultRender))
        .to.be.ok();
      expect(manager.atlases_).to.have.length(2);
      expect(manager.hitAtlases_).to.have.length(2);
      const info = manager.add(3, 500, 500, defaultRender, defaultRender);
      expect(info).to.be.ok();
      expect(info.image.width).to.eql(512);
      expect(manager.atlases_).to.have.length(3);
      expect(info.hitImage.width).to.eql(512);
      expect(manager.hitAtlases_).to.have.length(3);
    });

    it('returns null if the size exceeds the maximum size', function() {
      const manager = new AtlasManager(
        {initialSize: 128, maxSize: 2048});
      expect(manager.add('1', 100, 100, defaultRender, defaultRender))
        .to.be.ok();
      expect(manager.add('2', 2048, 2048, defaultRender, defaultRender))
        .to.eql(null);
    });

    it('always has the same offset for the hit-detection', function() {
      const manager = new AtlasManager({initialSize: 128});
      // add one image without hit-detection callback
      let info = manager.add('1', 32, 32, defaultRender);
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
      const manager = new AtlasManager({initialSize: 128});
      expect(manager.getInfo('123456')).to.eql(null);
    });
  });
});
