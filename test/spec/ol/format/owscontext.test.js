goog.provide('ol.test.format.OWSContext');

describe('ol.test.OWSContext', function() {

  describe('when parsing ogcsample.xml', function() {

    var parser = new ol.format.OWSContext();
    var context;
    before(function(done) {
      afterLoadText(
          'spec/ol/format/owscontext/owscontextsample.xml',
          function(xml) {
            try {
              context = parser.read(xml);
            } catch (e) {
              done(e);
            }
            done();
          }
      );
    });

    it('can read version', function() {
      expect(context.version).to.eql('0.3.1');
    });

    it('can read General section', function() {
      var general = context.General;
      var boundingbox = general.BoundingBox;

      expect(general.Title).to.eql(
          'OWS Context version 0.3.1 showing nested layers');

      expect(boundingbox.crs).to.eql('urn:ogc:def:crs:EPSG:6.6:4326');
      expect(boundingbox.LowerCorner).to.eql([
        -117.44667178362664,
        32.57086210449395
      ]);
      expect(boundingbox.UpperCorner).to.eql([
        -116.74066794885977,
        32.921986352104064
      ]);
    });

    it('can read ResourceList section', function() {
      var resources = context.ResourceList;
      var layers = resources.Layer;

      expect(layers.length).to.eql(1);

      var layer = layers[0];
      expect(layer.name).to.eql('topp:major_roads');
      expect(layer.queryable).to.be(true);
      expect(layer.hidden).to.be(true);
      expect(layer.Title).to.eql('Tiger 2005fe major roads');
      expect(layer.OutputFormat).to.eql('image/png');
      var server = layer.Server;
      expect(server.service).to.eql('urn:ogc:serviceType:WMS');
      expect(server.version).to.eql('1.1.1');
      expect(server.OnlineResource).to.eql(
          'http://sigma.openplans.org:8080/geoserver/wms?SERVICE=WMS');

      var nestedLayers = layer.Layer;
      expect(nestedLayers.length).to.eql(1);

      layer = nestedLayers[0];
      expect(layer.name).to.eql('topp:gnis_pop');
      expect(layer.hidden).to.be(false);
      expect(layer.Title).to.eql('GNIS Population');
      server = layer.Server;
      expect(server.service).to.eql('urn:ogc:serviceType:WFS');
      expect(server.version).to.eql('1.0.0');
      expect(server.OnlineResource).to.eql(
          'http://sigma.openplans.org:8080/geoserver/wfs?');
    });
  });
});

goog.require('ol.format.OWSContext');
