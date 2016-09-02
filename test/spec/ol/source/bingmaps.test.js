goog.provide('ol.test.source.BingMaps');

goog.require('ol.net');
goog.require('ol.source.BingMaps');
goog.require('ol.tilecoord');
goog.require('ol.Observable');


describe('ol.source.BingMaps', function() {

  describe('#tileUrlFunction()', function() {

    var source, tileGrid;

    beforeEach(function(done) {
      var olNetJsonp = ol.net.jsonp;
      // mock ol.net.Jsonp (used in the ol.source.TileJSON constructor)
      ol.net.jsonp = function(url, callback) {
        var client = new XMLHttpRequest();
        client.open('GET', 'spec/ol/data/bing_aerialwithlabels.json', true);
        client.onload = function() {
          callback(JSON.parse(client.responseText));
        };
        client.send();
      };
      source = new ol.source.BingMaps({
        imagerySet: 'AerialWithLabels',
        key: ''
      });
      ol.net.jsonp = olNetJsonp;
      var key = source.on('change', function() {
        if (source.getState() === 'ready') {
          ol.Observable.unByKey(key);
          tileGrid = source.getTileGrid();
          done();
        }
      });
    });

    it('returns the expected URL', function() {

      var coordinate = [829330.2064098881, 5933916.615134273];
      var projection = source.getProjection();
      var regex = /\/tiles\/h(.*)\.jpeg/;
      var tileUrl;

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 1), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(ol.tilecoord.quadKey([1, 1, 0]));

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 2), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(ol.tilecoord.quadKey([2, 2, 1]));

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 3), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(ol.tilecoord.quadKey([3, 4, 2]));

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 4), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(ol.tilecoord.quadKey([4, 8, 5]));

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 5), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(ol.tilecoord.quadKey(
          [5, 16, 11]));

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 6), 1, projection);
      expect(tileUrl.match(regex)[1]).to.equal(ol.tilecoord.quadKey(
          [6, 33, 22]));

    });


  });

});
