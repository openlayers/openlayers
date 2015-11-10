goog.provide('ol.test.source.TileJSON');


describe('ol.source.TileJSON', function() {

  describe('#getState', function() {
    it('returns ol.source.State.ERROR on HTTP 404', function() {
      var changeSpy = sinon.spy(function(event) {
        expect(event.target.getState()).to.eql('error');
      });
      var source = new ol.source.TileJSON({
        url: 'invalid.jsonp'
      });
      goog.events.listen(source, 'change', changeSpy);
    });

  });

  describe('tileUrlFunction', function() {

    var source, tileGrid;

    beforeEach(function(done) {
      var googNetJsonp = goog.net.Jsonp;
      // mock goog.net.Jsonp (used in the ol.source.TileJSON constructor)
      goog.net.Jsonp = function() {
        this.send = function() {
          var callback = arguments[1];
          var client = new XMLHttpRequest();
          client.open('GET', 'spec/ol/data/tilejson.json', true);
          client.onload = function() {
            callback(JSON.parse(client.responseText));
          };
          client.send();
        };
      };
      source = new ol.source.TileJSON({
        url: 'http://api.tiles.mapbox.com/v3/mapbox.geography-class.jsonp'
      });
      goog.net.Jsonp = googNetJsonp;
      var key = source.on('change', function() {
        if (source.getState() === 'ready') {
          ol.Observable.unByKey(key);
          tileGrid = source.getTileGrid();
          done();
        }
      });
    });

    it('uses the correct tile coordinates', function() {

      var coordinate = [829330.2064098881, 5933916.615134273];
      var regex = /\/([0-9]*\/[0-9]*\/[0-9]*)\.png$/;
      var tileUrl;

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 0));
      expect(tileUrl.match(regex)[1]).to.eql('0/0/0');

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 1));
      expect(tileUrl.match(regex)[1]).to.eql('1/1/0');

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 2));
      expect(tileUrl.match(regex)[1]).to.eql('2/2/1');

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 3));
      expect(tileUrl.match(regex)[1]).to.eql('3/4/2');

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 4));
      expect(tileUrl.match(regex)[1]).to.eql('4/8/5');

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 5));
      expect(tileUrl.match(regex)[1]).to.eql('5/16/11');

      tileUrl = source.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 6));
      expect(tileUrl.match(regex)[1]).to.eql('6/33/22');

    });

  });

});

goog.require('goog.events');
goog.require('goog.net.Jsonp');
goog.require('ol.source.State');
goog.require('ol.source.TileJSON');
goog.require('ol.Observable');
