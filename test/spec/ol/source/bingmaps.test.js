

import _ol_net_ from '../../../../src/ol/net';
import _ol_source_BingMaps_ from '../../../../src/ol/source/bingmaps';
import _ol_tilecoord_ from '../../../../src/ol/tilecoord';
import _ol_Observable_ from '../../../../src/ol/observable';


describe('ol.source.BingMaps', function() {

  describe('#tileUrlFunction()', function() {

    var source, tileGrid;

    beforeEach(function(done) {
      var olNetJsonp = _ol_net_.jsonp;
      // mock ol.net.Jsonp (used in the ol.source.TileJSON constructor)
      _ol_net_.jsonp = function(url, callback) {
        var client = new XMLHttpRequest();
        client.open('GET', 'spec/ol/data/bing_aerialwithlabels.json', true);
        client.onload = function() {
          callback(JSON.parse(client.responseText));
        };
        client.send();
      };
      source = new _ol_source_BingMaps_({
        imagerySet: 'AerialWithLabels',
        key: ''
      });
      _ol_net_.jsonp = olNetJsonp;
      var key = source.on('change', function() {
        if (source.getState() === 'ready') {
          _ol_Observable_.unByKey(key);
          tileGrid = source.getTileGrid();
          done();
        }
      });
    });

    it('getImagerySet works correctly', function() {
      expect(source.getImagerySet()).to.equal('AerialWithLabels');
    });

    it('getApiKey works correctly', function() {
      expect(source.getApiKey()).to.equal('');
    });

    it('returns the expected URL', function() {

      var coordinate = [829330.2064098881, 5933916.615134273];
      var projection = source.getProjection();
      var regex = /\/tiles\/h(.*)\.jpeg/;
      var tileUrl;

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 1), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(_ol_tilecoord_.quadKey([1, 1, 0]));

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 2), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(_ol_tilecoord_.quadKey([2, 2, 1]));

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 3), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(_ol_tilecoord_.quadKey([3, 4, 2]));

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 4), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(_ol_tilecoord_.quadKey([4, 8, 5]));

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 5), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(_ol_tilecoord_.quadKey(
          [5, 16, 11]));

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 6), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(_ol_tilecoord_.quadKey(
          [6, 33, 22]));

    });


  });

});
