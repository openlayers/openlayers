goog.require('ol');
goog.require('ol.ImageTile');
goog.require('ol.Tile');
goog.require('ol.TileState');


describe('ol.Tile', function() {
  describe('constructor', function()  {
    it('sets a default transition', function() {
      var coord = [0, 0, 0];
      var tile = new ol.Tile(coord, ol.TileState.IDLE);
      expect(tile.transition_).to.equal(250);
    });

    it('allows the transition to be set', function() {
      var coord = [0, 0, 0];
      var transition = 500;
      var tile = new ol.Tile(coord, ol.TileState.IDLE, {transition: transition});
      expect(tile.transition_).to.equal(transition);
    });
  });

  describe('#getAlpha()', function() {
    it('returns the alpha value for a tile in transition', function() {
      var coord = [0, 0, 0];
      var tile = new ol.Tile(coord, ol.TileState.IDLE);
      var id = 'test';
      var time = Date.now();

      var startAlpha = tile.getAlpha(id, time);
      expect(startAlpha > 0).to.be(true);
      expect(startAlpha < 1).to.be(true);

      time += tile.transition_ / 2;
      var midAlpha = tile.getAlpha(id, time);
      expect(midAlpha > startAlpha).to.be(true);
      expect(midAlpha < 1).to.be(true);

      time += tile.transition_ / 2;
      var endAlpha = tile.getAlpha(id, time);
      expect(endAlpha).to.be(1);
    });
  });

  describe('#inTransition()', function() {
    it('determines if the tile is in transition', function() {
      var coord = [0, 0, 0];
      var tile = new ol.Tile(coord, ol.TileState.IDLE);
      var id = 'test';

      expect(tile.inTransition(id)).to.be(true);
      tile.endTransition(id);
      expect(tile.inTransition(id)).to.be(false);
    });
  });

  describe('interimChain', function() {
    var head, renderTile;
    beforeEach(function() {
      var tileCoord = [0, 0, 0];
      head = new ol.ImageTile(tileCoord, ol.TileState.IDLE);
      ol.getUid(head);

      var addToChain = function(tile, state) {
        var next = new ol.ImageTile(tileCoord, state);
        ol.getUid(next);
        tile.interimTile = next;
        return next;
      };
      var tail = addToChain(head, ol.TileState.IDLE); //discard, deprecated by head
      tail = addToChain(tail, ol.TileState.LOADING); //keep, request already going
      tail = addToChain(tail, ol.TileState.IDLE); //discard, deprecated by head
      tail = addToChain(tail, ol.TileState.LOADED); //keep, use for rendering
      renderTile = tail; //store this tile for later tests
      tail = addToChain(tail, ol.TileState.IDLE);  //rest of list outdated by tile above
      tail = addToChain(tail, ol.TileState.LOADED);
      tail = addToChain(tail, ol.TileState.LOADING);
      tail = addToChain(tail, ol.TileState.LOADED);

    });

    it('shrinks tile chain correctly', function(done) {
      var chainLength = function(tile) {
        var c = 0;
        while (tile) {
          ++c;
          tile = tile.interimTile;
        }
        return c;
      };

      expect(chainLength(head)).to.be(9);
      head.refreshInterimChain();
      expect(chainLength(head)).to.be(3);
      done();
    });

    it('gives the right tile to render', function(done) {
      expect(head.getInterimTile()).to.be(renderTile);
      head.refreshInterimChain();
      expect(head.getInterimTile()).to.be(renderTile);
      done();
    });

    it('discards everything after the render tile', function(done) {
      head.refreshInterimChain();
      expect(renderTile.interimTile).to.be(null);
      done();
    });

    it('preserves order of tiles', function(done) {
      head.refreshInterimChain();
      while (head.interimTile !== null) {
        //use property of ol.getUid returning increasing id's.
        expect(ol.getUid(head) < ol.getUid(head.interimTile));
        head = head.interimTile;
      }
      done();
    });
  });

});
