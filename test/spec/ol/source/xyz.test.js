import TileSource from '../../../../src/ol/source/Tile.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import TileImage from '../../../../src/ol/source/TileImage.js';
import UrlTile from '../../../../src/ol/source/UrlTile.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';
import View from '../../../../src/ol/View.js';
import Map from '../../../../src/ol/Map.js';


describe('ol.source.XYZ', function() {

  describe('constructor', function() {

    it('can be constructed without options', function() {
      const source = new XYZ();
      expect(source).to.be.an(XYZ);
      expect(source).to.be.an(TileImage);
      expect(source).to.be.an(UrlTile);
      expect(source).to.be.an(TileSource);
    });

    it('can be constructed with a custom zDirection', function() {
      const source = new XYZ({
        zDirection: -1
      });
      expect(source.zDirection).to.be(-1);
    });

    it('can be constructed with a custom tile grid', function() {
      const tileGrid = createXYZ();
      const tileSource = new XYZ({
        tileGrid: tileGrid
      });
      expect(tileSource.getTileGrid()).to.be(tileGrid);
    });

    it('can be constructed with a custom tile size', function() {
      const tileSource = new XYZ({
        tileSize: 512
      });
      expect(tileSource.getTileGrid().getTileSize(0)).to.be(512);
    });

    it('can be constructed with a custom min zoom', function() {
      const tileSource = new XYZ({
        minZoom: 2
      });
      expect(tileSource.getTileGrid().getMinZoom()).to.be(2);
    });

  });

  describe('tileUrlFunction', function() {

    let xyzTileSource, tileGrid;

    beforeEach(function() {
      xyzTileSource = new XYZ({
        maxZoom: 6,
        url: '{z}/{x}/{y}'
      });
      tileGrid = xyzTileSource.getTileGrid();
    });

    it('returns the expected URL', function() {

      const coordinate = [829330.2064098881, 5933916.615134273];
      let tileUrl;

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 0));
      expect(tileUrl).to.eql('0/0/0');

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 1));
      expect(tileUrl).to.eql('1/1/0');

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 2));
      expect(tileUrl).to.eql('2/2/1');

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 3));
      expect(tileUrl).to.eql('3/4/2');

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 4));
      expect(tileUrl).to.eql('4/8/5');

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 5));
      expect(tileUrl).to.eql('5/16/11');

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 6));
      expect(tileUrl).to.eql('6/33/22');

    });

    describe('wrap x', function() {

      it('returns the expected URL', function() {
        const projection = xyzTileSource.getProjection();
        let tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction([6, -31, 22], projection));
        expect(tileUrl).to.eql('6/33/22');

        tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction([6, 33, 22], projection));
        expect(tileUrl).to.eql('6/33/22');

        tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction([6, 97, 22], projection));
        expect(tileUrl).to.eql('6/33/22');
      });

    });

    describe('crop y', function() {

      it('returns the expected URL', function() {
        const projection = xyzTileSource.getProjection();
        let tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction([6, 33, -1], projection));
        expect(tileUrl).to.be(undefined);

        tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction([6, 33, 22], projection));
        expect(tileUrl).to.eql('6/33/22');

        tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction([6, 33, 64], projection));
        expect(tileUrl).to.be(undefined);
      });

    });

  });

  describe('#getUrls', function() {

    let sourceOptions;
    let source;
    const url = 'http://geo.nls.uk/maps/towns/glasgow1857/{z}/{x}/{-y}.png';

    beforeEach(function() {
      sourceOptions = {
        projection: 'EPSG:4326'
      };
    });

    describe('using a "url" option', function() {
      beforeEach(function() {
        sourceOptions.url = url;
        source = new XYZ(sourceOptions);
      });

      it('returns the XYZ URL', function() {
        const urls = source.getUrls();
        expect(urls).to.be.eql([url]);
      });

    });

    describe('using a "urls" option', function() {
      beforeEach(function() {
        sourceOptions.urls = ['some_xyz_url1', 'some_xyz_url2'];
        source = new XYZ(sourceOptions);
      });

      it('returns the XYZ URLs', function() {
        const urls = source.getUrls();
        expect(urls).to.be.eql(['some_xyz_url1', 'some_xyz_url2']);
      });

    });

    describe('using a "tileUrlFunction"', function() {
      beforeEach(function() {
        sourceOptions.tileUrlFunction = function() {
          return 'some_xyz_url';
        };
        source = new XYZ(sourceOptions);
      });

      it('returns null', function() {
        const urls = source.getUrls();
        expect(urls).to.be(null);
      });

    });

  });

  describe('clear and refresh', function() {

    let map, source;
    let callCount = 0;
    beforeEach(function(done) {
      source = new XYZ({
        url: 'spec/ol/data/osm-{z}-{x}-{y}.png',
        tileLoadFunction: function(image, src) {
          ++callCount;
          image.getImage().src = src;
        }
      });
      const target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        layers: [
          new TileLayer({
            source: source
          })
        ],
        view: new View({
          center: [0, 0],
          zoom: 0
        })
      });
      map.once('rendercomplete', function() {
        callCount = 0;
        done();
      });
    });

    afterEach(function() {
      document.body.removeChild(map.getTargetElement());
      map.setTarget(null);
    });

    it('#refresh() reloads from server', function(done) {
      map.once('rendercomplete', function() {
        expect(callCount).to.be(1);
        done();
      });
      source.refresh();
    });

    it('#clear() clears the tile cache', function(done) {
      map.once('rendercomplete', function() {
        done(new Error('should not re-render'));
      });
      source.clear();
      setTimeout(function() {
        done();
      }, 1000);
    });

  });

});
