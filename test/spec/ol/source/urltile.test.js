goog.provide('ol.test.source.UrlTile');

goog.require('ol.proj');
goog.require('ol.source.UrlTile');
goog.require('ol.tilegrid');


describe('ol.source.UrlTile', function() {

  describe('#setUrl()', function() {
    it('sets the URL for the source', function() {
      var source = new ol.source.UrlTile({});

      var url = 'https://example.com/';
      source.setUrl(url);

      expect(source.getUrls()).to.eql([url]);
    });

    it('updates the key for the source', function() {
      var source = new ol.source.UrlTile({});

      var url = 'https://example.com/';
      source.setUrl(url);

      expect(source.getKey()).to.eql(url);
    });
  });

  describe('#setUrls()', function() {
    it('sets the URL for the source', function() {
      var source = new ol.source.UrlTile({});

      var urls = [
        'https://a.example.com/',
        'https://b.example.com/',
        'https://c.example.com/'
      ];
      source.setUrls(urls);

      expect(source.getUrls()).to.eql(urls);
    });

    it('updates the key for the source', function() {
      var source = new ol.source.UrlTile({});

      var urls = [
        'https://a.example.com/',
        'https://b.example.com/',
        'https://c.example.com/'
      ];
      source.setUrls(urls);

      expect(source.getKey()).to.eql(urls.join('\n'));
    });
  });

  describe('url option', function() {
    it('expands url template', function() {
      var tileSource = new ol.source.UrlTile({
        url: '{1-3}'
      });

      var urls = tileSource.getUrls();
      expect(urls).to.eql(['1', '2', '3']);
    });
  });

  describe('tileUrlFunction', function() {

    var tileSource, tileGrid;

    beforeEach(function() {
      tileSource = new ol.source.UrlTile({
        projection: 'EPSG:3857',
        tileGrid: ol.tilegrid.createXYZ({maxZoom: 6}),
        url: '{z}/{x}/{y}',
        wrapX: true
      });
      tileGrid = tileSource.getTileGrid();
    });

    it('returns the expected URL', function() {

      var coordinate = [829330.2064098881, 5933916.615134273];
      var tileUrl;

      tileUrl = tileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 0));
      expect(tileUrl).to.eql('0/0/0');

      tileUrl = tileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 1));
      expect(tileUrl).to.eql('1/1/0');

      tileUrl = tileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 2));
      expect(tileUrl).to.eql('2/2/1');

      tileUrl = tileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 3));
      expect(tileUrl).to.eql('3/4/2');

      tileUrl = tileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 4));
      expect(tileUrl).to.eql('4/8/5');

      tileUrl = tileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 5));
      expect(tileUrl).to.eql('5/16/11');

      tileUrl = tileSource.tileUrlFunction(
          tileGrid.getTileCoordForCoordAndZ(coordinate, 6));
      expect(tileUrl).to.eql('6/33/22');

    });

    describe('wrap x', function() {

      it('returns the expected URL', function() {
        var projection = tileSource.getProjection();
        var tileUrl = tileSource.tileUrlFunction(
            tileSource.getTileCoordForTileUrlFunction(
                [6, -31, -23], projection));
        expect(tileUrl).to.eql('6/33/22');

        tileUrl = tileSource.tileUrlFunction(
            tileSource.getTileCoordForTileUrlFunction(
                [6, 33, -23], projection));
        expect(tileUrl).to.eql('6/33/22');

        tileUrl = tileSource.tileUrlFunction(
            tileSource.getTileCoordForTileUrlFunction(
                [6, 97, -23], projection));
        expect(tileUrl).to.eql('6/33/22');
      });

    });

    describe('crop y', function() {

      it('returns the expected URL', function() {
        var projection = tileSource.getProjection();
        var tileUrl = tileSource.tileUrlFunction(
            tileSource.getTileCoordForTileUrlFunction(
                [6, 33, 0], projection));
        expect(tileUrl).to.be(undefined);

        tileUrl = tileSource.tileUrlFunction(
            tileSource.getTileCoordForTileUrlFunction(
                [6, 33, -23], projection));
        expect(tileUrl).to.eql('6/33/22');

        tileUrl = tileSource.tileUrlFunction(
            tileSource.getTileCoordForTileUrlFunction(
                [6, 33, -65], projection));
        expect(tileUrl).to.be(undefined);
      });

    });

  });

  describe('#getUrls', function() {

    var sourceOptions;
    var source;
    var url = 'http://geo.nls.uk/maps/towns/glasgow1857/{z}/{x}/{-y}.png';

    beforeEach(function() {
      sourceOptions = {
        tileGrid: ol.tilegrid.createXYZ({
          extent: ol.proj.get('EPSG:4326').getExtent()
        })
      };
    });

    describe('using a "url" option', function() {
      beforeEach(function() {
        sourceOptions.url = url;
        source = new ol.source.UrlTile(sourceOptions);
      });

      it('returns the XYZ URL', function() {
        var urls = source.getUrls();
        expect(urls).to.be.eql([url]);
      });

    });

    describe('using a "urls" option', function() {
      beforeEach(function() {
        sourceOptions.urls = ['some_xyz_url1', 'some_xyz_url2'];
        source = new ol.source.UrlTile(sourceOptions);
      });

      it('returns the XYZ URLs', function() {
        var urls = source.getUrls();
        expect(urls).to.be.eql(['some_xyz_url1', 'some_xyz_url2']);
      });

    });

    describe('using a "tileUrlFunction"', function() {
      beforeEach(function() {
        sourceOptions.tileUrlFunction = function() {
          return 'some_xyz_url';
        };
        source = new ol.source.UrlTile(sourceOptions);
      });

      it('returns null', function() {
        var urls = source.getUrls();
        expect(urls).to.be(null);
      });

    });

  });

});
