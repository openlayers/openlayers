import TileSource from '../../../../src/ol/source/Tile.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import TileImage from '../../../../src/ol/source/TileImage.js';
import UrlTile from '../../../../src/ol/source/UrlTile.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';
import View from '../../../../src/ol/View.js';
import Map from '../../../../src/ol/Map.js';


describe('ol.source.XYZ', () => {

  describe('constructor', () => {

    test('can be constructed without options', () => {
      const source = new XYZ();
      expect(source).toBeInstanceOf(XYZ);
      expect(source).toBeInstanceOf(TileImage);
      expect(source).toBeInstanceOf(UrlTile);
      expect(source).toBeInstanceOf(TileSource);
    });

    test('can be constructed with a custom zDirection', () => {
      const source = new XYZ({
        zDirection: -1
      });
      expect(source.zDirection).toBe(-1);
    });

    test('can be constructed with a custom tile grid', () => {
      const tileGrid = createXYZ();
      const tileSource = new XYZ({
        tileGrid: tileGrid
      });
      expect(tileSource.getTileGrid()).toBe(tileGrid);
    });

    test('can be constructed with a custom tile size', () => {
      const tileSource = new XYZ({
        tileSize: 512
      });
      expect(tileSource.getTileGrid().getTileSize(0)).toBe(512);
    });

    test('can be constructed with a custom min zoom', () => {
      const tileSource = new XYZ({
        minZoom: 2
      });
      expect(tileSource.getTileGrid().getMinZoom()).toBe(2);
    });

  });

  describe('tileUrlFunction', () => {

    let xyzTileSource, tileGrid;

    beforeEach(() => {
      xyzTileSource = new XYZ({
        maxZoom: 6,
        url: '{z}/{x}/{y}'
      });
      tileGrid = xyzTileSource.getTileGrid();
    });

    test('returns the expected URL', () => {

      const coordinate = [829330.2064098881, 5933916.615134273];
      let tileUrl;

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 0));
      expect(tileUrl).toEqual('0/0/0');

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 1));
      expect(tileUrl).toEqual('1/1/0');

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 2));
      expect(tileUrl).toEqual('2/2/1');

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 3));
      expect(tileUrl).toEqual('3/4/2');

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 4));
      expect(tileUrl).toEqual('4/8/5');

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 5));
      expect(tileUrl).toEqual('5/16/11');

      tileUrl = xyzTileSource.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 6));
      expect(tileUrl).toEqual('6/33/22');

    });

    describe('wrap x', () => {

      test('returns the expected URL', () => {
        const projection = xyzTileSource.getProjection();
        let tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction([6, -31, 22], projection));
        expect(tileUrl).toEqual('6/33/22');

        tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction([6, 33, 22], projection));
        expect(tileUrl).toEqual('6/33/22');

        tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction([6, 97, 22], projection));
        expect(tileUrl).toEqual('6/33/22');
      });

    });

    describe('crop y', () => {

      test('returns the expected URL', () => {
        const projection = xyzTileSource.getProjection();
        let tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction([6, 33, -1], projection));
        expect(tileUrl).toBe(undefined);

        tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction([6, 33, 22], projection));
        expect(tileUrl).toEqual('6/33/22');

        tileUrl = xyzTileSource.tileUrlFunction(
          xyzTileSource.getTileCoordForTileUrlFunction([6, 33, 64], projection));
        expect(tileUrl).toBe(undefined);
      });

    });

  });

  describe('#getUrls', () => {

    let sourceOptions;
    let source;
    const url = 'http://geo.nls.uk/maps/towns/glasgow1857/{z}/{x}/{-y}.png';

    beforeEach(() => {
      sourceOptions = {
        projection: 'EPSG:4326'
      };
    });

    describe('using a "url" option', () => {
      beforeEach(() => {
        sourceOptions.url = url;
        source = new XYZ(sourceOptions);
      });

      test('returns the XYZ URL', () => {
        const urls = source.getUrls();
        expect(urls).toEqual([url]);
      });

    });

    describe('using a "urls" option', () => {
      beforeEach(() => {
        sourceOptions.urls = ['some_xyz_url1', 'some_xyz_url2'];
        source = new XYZ(sourceOptions);
      });

      test('returns the XYZ URLs', () => {
        const urls = source.getUrls();
        expect(urls).toEqual(['some_xyz_url1', 'some_xyz_url2']);
      });

    });

    describe('using a "tileUrlFunction"', () => {
      beforeEach(() => {
        sourceOptions.tileUrlFunction = function() {
          return 'some_xyz_url';
        };
        source = new XYZ(sourceOptions);
      });

      test('returns null', () => {
        const urls = source.getUrls();
        expect(urls).toBe(null);
      });

    });

  });

  describe('clear and refresh', () => {

    let map, source;
    let callCount = 0;
    beforeEach(done => {
      source = new XYZ({
        url: 'spec/ol/data/osm-{z}-{x}-{y}.png',
        tileLoadFunction: function(image, src) {
          ++callCount;
          image.getImage().src = src;
        }
      });
      const target = document.createElement('div');
      target.style.width = target.style.height = '100px';
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

    afterEach(() => {
      document.body.removeChild(map.getTargetElement());
      map.setTarget(null);
    });

    test('#refresh() reloads from server', done => {
      map.once('rendercomplete', function() {
        expect(callCount).toBe(1);
        done();
      });
      source.refresh();
    });

    test('#clear() clears the tile cache', done => {
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
