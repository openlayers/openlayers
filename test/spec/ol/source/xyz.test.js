import TileSource from '../../../../src/ol/source/Tile.js';
import TileImage from '../../../../src/ol/source/TileImage.js';
import UrlTile from '../../../../src/ol/source/UrlTile.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';


describe('ol.source.XYZ', function() {

  describe('constructor', function() {

    it('can be constructed without options', function() {
      const source = new XYZ();
      expect(source).to.be.an(XYZ);
      expect(source).to.be.an(TileImage);
      expect(source).to.be.an(UrlTile);
      expect(source).to.be.an(TileSource);
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
          xyzTileSource.getTileCoordForTileUrlFunction(
            [6, -31, -23], projection));
        expect(tileUrl).to.eql('6/33/22');

        tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction(
            [6, 33, -23], projection));
        expect(tileUrl).to.eql('6/33/22');

        tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction(
            [6, 97, -23], projection));
        expect(tileUrl).to.eql('6/33/22');
      });

    });

    describe('crop y', function() {

      it('returns the expected URL', function() {
        const projection = xyzTileSource.getProjection();
        let tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction(
            [6, 33, 0], projection));
        expect(tileUrl).to.be(undefined);

        tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction(
            [6, 33, -23], projection));
        expect(tileUrl).to.eql('6/33/22');

        tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction(
            [6, 33, -65], projection));
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

});
