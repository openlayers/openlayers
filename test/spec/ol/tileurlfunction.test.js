goog.provide('ol.test.TileURLFunction');

describe('ol.TileURLFunction', function() {

  describe('expandUrl', function() {
    describe('with number range', function() {
      it('creates expected URLs', function() {
        var template = 'http://tile-{1-3}/{z}/{x}/{y}';
        var urls = ol.TileURLFunction.expandUrl(template);
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
        var urls = ol.TileURLFunction.expandUrl(template);
        expect(urls).to.eql([
          'http://tile-c/{z}/{x}/{y}',
          'http://tile-d/{z}/{x}/{y}',
          'http://tile-e/{z}/{x}/{y}'
        ]);
      });
    });
  });

  describe('createFromTemplate', function() {
    it('creates expected URL', function() {
      var tileURL = ol.TileURLFunction.createFromTemplate('{z}/{x}/{y}');
      expect(tileURL(new ol.TileCoord(3, 2, 1))).to.eql('3/2/1');
      expect(tileURL(null)).to.be(undefined);
    });
  });

  describe('createFromTemplates', function() {
    it('creates expected URL', function() {
      var templates = [
        'http://tile-1/{z}/{x}/{y}',
        'http://tile-2/{z}/{x}/{y}',
        'http://tile-3/{z}/{x}/{y}'
      ];
      var tileURLFunction = ol.TileURLFunction.createFromTemplates(templates);
      var tileCoord = new ol.TileCoord(3, 2, 1);
      tileCoord.hash = function() { return 3; };
      expect(tileURLFunction(tileCoord)).to.eql('http://tile-1/3/2/1');
      tileCoord.hash = function() { return 2; };
      expect(tileURLFunction(tileCoord)).to.eql('http://tile-3/3/2/1');
      tileCoord.hash = function() { return 1; };
      expect(tileURLFunction(tileCoord)).to.eql('http://tile-2/3/2/1');
    });
  });

  describe('withTileCoordTransform', function() {
    it('creates expected URL', function() {
      var tileURL = ol.TileURLFunction.withTileCoordTransform(
          function(tileCoord) {
            return new ol.TileCoord(tileCoord.z, tileCoord.x, -tileCoord.y);
          },
          ol.TileURLFunction.createFromTemplate('{z}/{x}/{y}'));
      expect(tileURL(new ol.TileCoord(3, 2, -1))).to.eql('3/2/1');
      expect(tileURL(null)).to.be(undefined);
    });
  });

  describe('createFromTileURLFunctions', function() {
    it('creates expected URL', function() {
      var tileURL = ol.TileURLFunction.createFromTileURLFunctions([
        ol.TileURLFunction.createFromTemplate('a'),
        ol.TileURLFunction.createFromTemplate('b')
      ]);
      var tileURL1 = tileURL(new ol.TileCoord(1, 0, 0));
      var tileURL2 = tileURL(new ol.TileCoord(1, 0, 1));
      expect(tileURL1).not.to.be(tileURL2);
      expect(tileURL(null)).to.be(undefined);
    });
  });

  describe('createFromParamsFunction', function() {
    var paramsFunction = function(url, params) { return arguments; };
    var projection = ol.proj.get('EPSG:3857');
    var fakeTileSource = {getTileGrid: function() {return null;}};
    var params = {foo: 'bar'};
    var tileURLFunction = ol.TileURLFunction.createFromParamsFunction(
        'url', params, paramsFunction);
    it('calls the passed function with the correct arguments', function() {
      var args = tileURLFunction.call(fakeTileSource,
          new ol.TileCoord(0, 0, 0), projection);
      expect(args[0]).to.eql('url');
      expect(args[1]).to.be(params);
      expect(args[2]).to.eql(projection.getExtent());
      expect(args[3]).to.eql([256, 256]);
      expect(args[4]).to.eql(projection);
    });
  });

});

goog.require('ol.TileCoord');
goog.require('ol.TileURLFunction');
goog.require('ol.proj');
