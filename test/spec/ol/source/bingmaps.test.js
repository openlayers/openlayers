import BingMaps, {quadKey} from '../../../../src/ol/source/BingMaps.js';
import {unByKey} from '../../../../src/ol/Observable.js';


describe('ol.source.BingMaps', () => {

  describe('quadKey()', () => {
    test('returns expected string', () => {
      const tileCoord = [3, 3, 5];
      const s = quadKey(tileCoord);
      expect(s).toEqual('213');
    });
  });

  describe('#tileUrlFunction()', () => {

    let source, tileGrid;

    beforeEach(done => {
      source = new BingMaps({
        imagerySet: 'AerialWithLabelsOnDemand',
        key: ''
      });

      const client = new XMLHttpRequest();
      client.open('GET', 'spec/ol/data/bing_aerialwithlabels.json', true);
      client.onload = function() {
        source.handleImageryMetadataResponse(JSON.parse(client.responseText));
      };
      client.send();

      const key = source.on('change', function() {
        if (source.getState() === 'ready') {
          unByKey(key);
          tileGrid = source.getTileGrid();
          done();
        }
      });
    });

    test('getImagerySet works correctly', () => {
      expect(source.getImagerySet()).toBe('AerialWithLabelsOnDemand');
    });

    test('getApiKey works correctly', () => {
      expect(source.getApiKey()).toBe('');
    });

    test('returns the expected URL', () => {

      const coordinate = [829330.2064098881, 5933916.615134273];
      const projection = source.getProjection();
      const regex = /\/tiles\/h(.*)\.jpeg/;
      let tileUrl;

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 1), 1, projection);
      expect(tileUrl.match(regex)[1]).toBe(quadKey([1, 1, 0]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 2), 1, projection);
      expect(tileUrl.match(regex)[1]).toBe(quadKey([2, 2, 1]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 3), 1, projection);
      expect(tileUrl.match(regex)[1]).toBe(quadKey([3, 4, 2]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 4), 1, projection);
      expect(tileUrl.match(regex)[1]).toBe(quadKey([4, 8, 5]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 5), 1, projection);
      expect(tileUrl.match(regex)[1]).toBe(quadKey(
        [5, 16, 11]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 6), 1, projection);
      expect(tileUrl.match(regex)[1]).toBe(quadKey(
        [6, 33, 22]));

    });


  });

});
