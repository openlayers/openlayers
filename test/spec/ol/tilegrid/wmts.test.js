goog.provide('ol.test.tilegrid.WMTS');

goog.require('ol.format.WMTSCapabilities');
goog.require('ol.tilegrid.WMTS');


describe('ol.tilegrid.WMTS', function() {

  describe('when creating tileGrid from capabilities', function() {
    var parser = new ol.format.WMTSCapabilities();
    var capabilities;
    before(function(done) {
      afterLoadText('spec/ol/format/wmts/ogcsample.xml', function(xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can create tileGrid for EPSG:3857',
        function() {
          var matrixSetObj = capabilities.Contents.TileMatrixSet[0];
          var tileGrid;
          tileGrid = ol.tilegrid.WMTS.createFromCapabilitiesMatrixSet(
              matrixSetObj);
          expect(tileGrid.matrixIds_).to.be.an('array');
          expect(tileGrid.matrixIds_).to.have.length(20);
          expect(tileGrid.matrixIds_).to.eql(
              ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11',
               '12', '13', '14', '15', '16', '17', '18', '19']);

          expect(tileGrid.resolutions_).to.be.an('array');
          expect(tileGrid.resolutions_).to.have.length(20);
          expect(tileGrid.resolutions_).to.eql(
              [156543.03392811998, 78271.51696419998, 39135.758481959994,
               19567.879241008, 9783.939620504, 4891.969810252, 2445.984905126,
               1222.9924525644, 611.4962262807999, 305.74811314039994,
               152.87405657047998, 76.43702828523999, 38.21851414248,
               19.109257071295996, 9.554628535647998, 4.777314267823999,
               2.3886571339119995, 1.1943285669559998, 0.5971642834779999,
               0.29858214174039993]);

          expect(tileGrid.origins_).to.be.an('array');
          expect(tileGrid.origins_).to.have.length(20);
          expect(tileGrid.origins_).to.eql(
              Array.apply(null, Array(20)).map(Array.prototype.valueOf,
                  [-20037508.3428, 20037508.3428]));

          expect(tileGrid.tileSizes_).to.be.an('array');
          expect(tileGrid.tileSizes_).to.have.length(20);
          expect(tileGrid.tileSizes_).to.eql(
              Array.apply(null, Array(20)).map(Number.prototype.valueOf, 256));

        });
  });
});
