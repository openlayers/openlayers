

import _ol_ImageTile_ from '../../../../src/ol/imagetile';
import _ol_events_ from '../../../../src/ol/events';
import _ol_proj_ from '../../../../src/ol/proj';
import _ol_reproj_Tile_ from '../../../../src/ol/reproj/tile';
import _ol_tilegrid_ from '../../../../src/ol/tilegrid';


describe('ol.reproj.Tile', function() {
  beforeEach(function() {
    proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 ' +
        '+k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy ' +
        '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
        '+units=m +no_defs');
    var proj27700 = _ol_proj_.get('EPSG:27700');
    proj27700.setExtent([0, 0, 700000, 1300000]);
  });

  afterEach(function() {
    delete proj4.defs['EPSG:27700'];
  });


  function createTile(pixelRatio, opt_tileSize) {
    var proj4326 = _ol_proj_.get('EPSG:4326');
    var proj3857 = _ol_proj_.get('EPSG:3857');
    return new _ol_reproj_Tile_(
        proj3857, _ol_tilegrid_.createForProjection(proj3857), proj4326,
        _ol_tilegrid_.createForProjection(proj4326, 3, opt_tileSize),
        [3, 2, -2], null, pixelRatio, 0, function(z, x, y, pixelRatio) {
          return new _ol_ImageTile_([z, x, y], 0, // IDLE
              'data:image/gif;base64,' +
              'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=', null,
              function(tile, src) {
                tile.getImage().src = src;
              });
        });
  }

  it('changes state as expected', function(done) {
    var tile = createTile(1);
    expect(tile.getState()).to.be(0); // IDLE
    _ol_events_.listen(tile, 'change', function() {
      if (tile.getState() == 2) { // LOADED
        done();
      }
    });
    tile.load();
  });

  it('is empty when outside target tile grid', function() {
    var proj4326 = _ol_proj_.get('EPSG:4326');
    var proj3857 = _ol_proj_.get('EPSG:3857');
    var tile = new _ol_reproj_Tile_(
        proj3857, _ol_tilegrid_.createForProjection(proj3857),
        proj4326, _ol_tilegrid_.createForProjection(proj4326),
        [0, -1, 0], null, 1, 0, function() {
          expect().fail('No tiles should be required');
        });
    expect(tile.getState()).to.be(4); // EMPTY
  });

  it('is empty when outside source tile grid', function() {
    var proj4326 = _ol_proj_.get('EPSG:4326');
    var proj27700 = _ol_proj_.get('EPSG:27700');
    var tile = new _ol_reproj_Tile_(
        proj27700, _ol_tilegrid_.createForProjection(proj27700),
        proj4326, _ol_tilegrid_.createForProjection(proj4326),
        [3, 2, -2], null, 1, 0, function() {
          expect().fail('No tiles should be required');
        });
    expect(tile.getState()).to.be(4); // EMPTY
  });

  it('respects tile size of target tile grid', function(done) {
    var tile = createTile(1, [100, 40]);
    _ol_events_.listen(tile, 'change', function() {
      if (tile.getState() == 2) { // LOADED
        var canvas = tile.getImage();
        expect(canvas.width).to.be(100);
        expect(canvas.height).to.be(40);
        done();
      }
    });
    tile.load();
  });

  it('respects pixelRatio', function(done) {
    var tile = createTile(3, [60, 20]);
    _ol_events_.listen(tile, 'change', function() {
      if (tile.getState() == 2) { // LOADED
        var canvas = tile.getImage();
        expect(canvas.width).to.be(180);
        expect(canvas.height).to.be(60);
        done();
      }
    });
    tile.load();
  });
});
