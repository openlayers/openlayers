import BingMaps, {quadKey} from '../../../../src/ol/source/BingMaps.js';
import {unByKey} from '../../../../src/ol/Observable.js';


describe('ol.source.BingMaps', function() {

  describe('quadKey()', function() {
    it('returns expected string', function() {
      const tileCoord = [3, 3, 5];
      const s = quadKey(tileCoord);
      expect(s).to.eql('213');
    });
  });

  describe('#tileUrlFunction()', function() {

    let source, tileGrid;

    beforeEach(function(done) {
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

    it('getImagerySet works correctly', function() {
      expect(source.getImagerySet()).to.equal('AerialWithLabelsOnDemand');
    });

    it('getApiKey works correctly', function() {
      expect(source.getApiKey()).to.equal('');
    });

    it('returns the expected URL', function() {

      const coordinate = [829330.2064098881, 5933916.615134273];
      const projection = source.getProjection();
      const regex = /\/tiles\/h(.*)\.jpeg/;
      let tileUrl;

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 1), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(quadKey([1, 1, 0]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 2), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(quadKey([2, 2, 1]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 3), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(quadKey([3, 4, 2]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 4), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(quadKey([4, 8, 5]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 5), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(quadKey(
        [5, 16, 11]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 6), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(quadKey(
        [6, 33, 22]));

    });


  });

});
