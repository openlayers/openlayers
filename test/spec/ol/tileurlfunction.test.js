goog.provide('ol.test.TileUrlFunction');

goog.require('ol.TileUrlFunction');
goog.require('ol.tilegrid');
goog.require('ol.tilegrid.TileGrid');


describe('ol.TileUrlFunction', function() {

  describe('expandUrl', function() {
    describe('with number range', function() {
      it('creates expected URLs', function() {
        var template = 'http://tile-{1-3}/{z}/{x}/{y}';
        var urls = ol.TileUrlFunction.expandUrl(template);
        expect(urls).to.eql([
          'http://tile-1/{z}/{x}/{y}',
          'http://tile-2/{z}/{x}/{y}',
          'http://tile-3/{z}/{x}/{y}'
        ]);
      });
    });
    describe('with character range', function() {
      it('creates expected URLs', function() {
        var template = 'http://tile-{c-e}/{z}/{x}/{y}';
        var urls = ol.TileUrlFunction.expandUrl(template);
        expect(urls).to.eql([
          'http://tile-c/{z}/{x}/{y}',
          'http://tile-d/{z}/{x}/{y}',
          'http://tile-e/{z}/{x}/{y}'
        ]);
      });
    });
  });

  describe('createFromTemplate', function() {
    var tileGrid = ol.tilegrid.createXYZ();
    it('creates expected URL', function() {
      var tileUrl = ol.TileUrlFunction.createFromTemplate(
          '{z}/{x}/{y}', tileGrid);
      expect(tileUrl([3, 2, -2])).to.eql('3/2/1');
      expect(tileUrl(null)).to.be(undefined);
    });
    it('accepts {-y} placeholder', function() {
      var tileUrl = ol.TileUrlFunction.createFromTemplate(
          '{z}/{x}/{-y}', tileGrid);
      expect(tileUrl([3, 2, -3])).to.eql('3/2/5');
    });
    it('returns correct value for {-y} with custom tile grids', function() {
      var customTileGrid = new ol.tilegrid.TileGrid({
        extent: [-180, -90, 180, 90],
        origin: [-180, -90],
        resolutions: [360 / 256, 360 / 512, 360 / 1024, 360 / 2048]
      });
      var tileUrl = ol.TileUrlFunction.createFromTemplate(
          '{z}/{x}/{-y}', customTileGrid);
      expect(tileUrl([3, 2, -3])).to.eql('3/2/1');
    });
    it('replaces multiple placeholder occurrences', function() {
      var tileUrl = ol.TileUrlFunction.createFromTemplate(
          '{z}/{z}{x}{y}', tileGrid);
      expect(tileUrl([3, 2, -2])).to.eql('3/321');
    });
  });

  describe('createFromTemplates', function() {
    var tileGrid = ol.tilegrid.createXYZ();
    it('creates expected URL', function() {
      var templates = [
        'http://tile-1/{z}/{x}/{y}',
        'http://tile-2/{z}/{x}/{y}',
        'http://tile-3/{z}/{x}/{y}'
      ];
      var tileUrlFunction = ol.TileUrlFunction.createFromTemplates(
          templates, tileGrid);
      var tileCoord = [3, 2, -2];

      /* eslint-disable openlayers-internal/no-missing-requires */
      sinon.stub(ol.tilecoord, 'hash', function() {
        return 3;
      });
      expect(tileUrlFunction(tileCoord)).to.eql('http://tile-1/3/2/1');
      ol.tilecoord.hash.restore();

      sinon.stub(ol.tilecoord, 'hash', function() {
        return 2;
      });
      expect(tileUrlFunction(tileCoord)).to.eql('http://tile-3/3/2/1');
      ol.tilecoord.hash.restore();

      sinon.stub(ol.tilecoord, 'hash', function() {
        return 1;
      });
      expect(tileUrlFunction(tileCoord)).to.eql('http://tile-2/3/2/1');
      ol.tilecoord.hash.restore();
      /* eslint-enable */
    });
  });

  describe('createFromTileUrlFunctions', function() {
    var tileGrid = ol.tilegrid.createXYZ();
    it('creates expected URL', function() {
      var tileUrl = ol.TileUrlFunction.createFromTileUrlFunctions([
        ol.TileUrlFunction.createFromTemplate('a', tileGrid),
        ol.TileUrlFunction.createFromTemplate('b', tileGrid)
      ]);
      var tileUrl1 = tileUrl([1, 0, 0]);
      var tileUrl2 = tileUrl([1, 0, 1]);
      expect(tileUrl1).not.to.be(tileUrl2);
      expect(tileUrl(null)).to.be(undefined);
    });
  });

});
