goog.provide('ol.test.TileUrlFunction');

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
    it('creates expected URL', function() {
      var tileUrl = ol.TileUrlFunction.createFromTemplate('{z}/{x}/{y}');
      expect(tileUrl([3, 2, 1])).to.eql('3/2/1');
      expect(tileUrl(null)).to.be(undefined);
    });
    it('accepts {-y} placeholder', function() {
      var tileUrl = ol.TileUrlFunction.createFromTemplate('{z}/{x}/{-y}');
      expect(tileUrl([3, 2, 2])).to.eql('3/2/5');
    });
    it('replaces multiple placeholder occurrences', function() {
      var tileUrl = ol.TileUrlFunction.createFromTemplate('{z}/{z}{x}{y}');
      expect(tileUrl([3, 2, 1])).to.eql('3/321');
    });
  });

  describe('createFromTemplates', function() {
    it('creates expected URL', function() {
      var templates = [
        'http://tile-1/{z}/{x}/{y}',
        'http://tile-2/{z}/{x}/{y}',
        'http://tile-3/{z}/{x}/{y}'
      ];
      var tileUrlFunction = ol.TileUrlFunction.createFromTemplates(templates);
      var tileCoord = [3, 2, 1];

      sinon.stub(ol.tilecoord, 'hash', function() { return 3; });
      expect(tileUrlFunction(tileCoord)).to.eql('http://tile-1/3/2/1');
      ol.tilecoord.hash.restore();

      sinon.stub(ol.tilecoord, 'hash', function() { return 2; });
      expect(tileUrlFunction(tileCoord)).to.eql('http://tile-3/3/2/1');
      ol.tilecoord.hash.restore();

      sinon.stub(ol.tilecoord, 'hash', function() { return 1; });
      expect(tileUrlFunction(tileCoord)).to.eql('http://tile-2/3/2/1');
      ol.tilecoord.hash.restore();
    });
  });

  describe('withTileCoordTransform', function() {
    it('creates expected URL', function() {
      var tileUrl = ol.TileUrlFunction.withTileCoordTransform(
          function(tileCoord) {
            return [tileCoord[0], tileCoord[1], -tileCoord[2]];
          },
          ol.TileUrlFunction.createFromTemplate('{z}/{x}/{y}'));
      expect(tileUrl([3, 2, -1])).to.eql('3/2/1');
      expect(tileUrl(null)).to.be(undefined);
    });
  });

  describe('createFromTileUrlFunctions', function() {
    it('creates expected URL', function() {
      var tileUrl = ol.TileUrlFunction.createFromTileUrlFunctions([
        ol.TileUrlFunction.createFromTemplate('a'),
        ol.TileUrlFunction.createFromTemplate('b')
      ]);
      var tileUrl1 = tileUrl([1, 0, 0]);
      var tileUrl2 = tileUrl([1, 0, 1]);
      expect(tileUrl1).not.to.be(tileUrl2);
      expect(tileUrl(null)).to.be(undefined);
    });
  });

});

goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
