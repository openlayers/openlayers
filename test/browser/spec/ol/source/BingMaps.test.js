import {assert} from 'chai';
import {unByKey} from '../../../../../src/ol/Observable.js';
import BingMaps, {quadKey} from '../../../../../src/ol/source/BingMaps.js';

describe('ol/source/BingMaps', function () {
  describe('quadKey()', function () {
    it('returns expected string', function () {
      const tileCoord = [3, 3, 5];
      const s = quadKey(tileCoord);
      assert.deepEqual(s, '213');
    });
  });

  describe('#getInterpolate()', function () {
    it('is true by default', function () {
      const source = new BingMaps({});
      assert.strictEqual(source.getInterpolate(), true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new BingMaps({interpolate: false});
      assert.strictEqual(source.getInterpolate(), false);
    });
  });

  describe('#tileUrlFunction()', function () {
    let source, tileGrid;

    beforeEach(function (done) {
      source = new BingMaps({
        imagerySet: 'AerialWithLabelsOnDemand',
        key: '',
        placeholderTiles: false,
        hidpi: true,
      });

      const client = new XMLHttpRequest();
      client.open('GET', 'spec/ol/data/bing_aerialwithlabels.json', true);
      client.onload = function () {
        source.handleImageryMetadataResponse(JSON.parse(client.responseText));
      };
      client.send();

      const key = source.on('change', function () {
        if (source.getState() === 'ready') {
          unByKey(key);
          tileGrid = source.getTileGrid();
          done();
        }
      });
    });

    it('getImagerySet works correctly', function () {
      assert.equal(source.getImagerySet(), 'AerialWithLabelsOnDemand');
    });

    it('getApiKey works correctly', function () {
      assert.equal(source.getApiKey(), '');
    });

    it('returns the expected URL', function () {
      const coordinate = [829330.2064098881, 5933916.615134273];
      const projection = source.getProjection();
      const regex = /\/tiles\/h(.*)\.jpeg/;
      let tileUrl;

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 1),
        1,
        projection,
      );
      assert.equal(tileUrl.match(regex)[1], quadKey([1, 1, 0]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 2),
        1,
        projection,
      );
      assert.equal(tileUrl.match(regex)[1], quadKey([2, 2, 1]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 3),
        1,
        projection,
      );
      assert.equal(tileUrl.match(regex)[1], quadKey([3, 4, 2]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 4),
        1,
        projection,
      );
      assert.equal(tileUrl.match(regex)[1], quadKey([4, 8, 5]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 5),
        1,
        projection,
      );
      assert.equal(tileUrl.match(regex)[1], quadKey([5, 16, 11]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 6),
        1,
        projection,
      );
      assert.equal(tileUrl.match(regex)[1], quadKey([6, 33, 22]));

      const url = new URL(tileUrl);
      assert.equal(url.searchParams.get('dpi'), 'd1');
      assert.equal(url.searchParams.get('device'), 'mobile');
      assert.equal(url.searchParams.get('n'), 'z');
    });
  });
});
