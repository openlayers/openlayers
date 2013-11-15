goog.provide('ol.test.source.Vector');


describe('ol.source.Vector', function() {

  describe('constructor', function() {
    it('creates an instance', function() {
      var source = new ol.source.Vector();
      expect(source).to.be.a(ol.source.Vector);
      expect(source).to.be.a(ol.source.Source);
    });
  });

  describe('#addFeatures()', function() {

    it('allows adding features', function() {
      var source = new ol.source.Vector();
      source.addFeatures([new ol.Feature(), new ol.Feature()]);
      expect(goog.object.getCount(source.featureCache_.getFeaturesObject()))
          .to.eql(2);
    });
  });

  describe('#groupFeaturesBySymbolizerLiteral()', function() {

    var source = new ol.source.Vector({
      projection: ol.proj.get('EPSG:4326')
    });

    var style = new ol.style.Style({
      symbolizers: [
        new ol.style.Stroke({
          width: 2,
          color: ol.expr.parse('colorProperty'),
          opacity: 1
        })
      ]
    });
    var features;

    it('groups equal symbolizers', function() {
      features = [
        new ol.Feature({
          g: new ol.geom.LineString([[-10, -10], [10, 10]]),
          colorProperty: '#BADA55'
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[-10, 10], [10, -10]]),
          colorProperty: '#013'
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[10, -10], [-10, -10]]),
          colorProperty: '#013'
        })
      ];

      var groups = source.groupFeaturesBySymbolizerLiteral(style, features, 1);
      expect(groups.length).to.be(2);
      expect(groups[0][0].length).to.be(1);
      expect(groups[0][1].color).to.be('#BADA55');
      expect(groups[1][0].length).to.be(2);
      expect(groups[1][1].color).to.be('#013');
    });

    it('groups equal symbolizers also when defined on features', function() {
      var symbolizer = new ol.style.Stroke({
        width: 3,
        color: ol.expr.parse('colorProperty'),
        opacity: 1
      });
      var anotherSymbolizer = new ol.style.Stroke({
        width: 3,
        color: '#BADA55',
        opacity: 1
      });
      var featureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, -10], [-10, 10]]),
        colorProperty: '#BADA55'
      });
      featureWithSymbolizers.setSymbolizers([symbolizer]);
      var anotherFeatureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, 10], [-10, -10]])
      });
      anotherFeatureWithSymbolizers.setSymbolizers([anotherSymbolizer]);
      features.push(featureWithSymbolizers, anotherFeatureWithSymbolizers);

      var groups = source.groupFeaturesBySymbolizerLiteral(style, features, 1);
      expect(groups).to.have.length(3);
      expect(groups[2][0].length).to.be(2);
      expect(groups[2][1].width).to.be(3);

    });

    it('sorts groups by zIndex', function() {
      var symbolizer = new ol.style.Stroke({
        width: 3,
        color: '#BADA55',
        opacity: 1,
        zIndex: 1
      });
      var anotherSymbolizer = new ol.style.Stroke({
        width: 3,
        color: '#BADA55',
        opacity: 1
      });
      var featureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, -10], [-10, 10]])
      });
      featureWithSymbolizers.setSymbolizers([symbolizer]);
      var anotherFeatureWithSymbolizers = new ol.Feature({
        g: new ol.geom.LineString([[-10, 10], [-10, -10]])
      });
      anotherFeatureWithSymbolizers.setSymbolizers([anotherSymbolizer]);
      features = [featureWithSymbolizers, anotherFeatureWithSymbolizers];

      var groups = source.groupFeaturesBySymbolizerLiteral(style, features, 1);
      expect(groups).to.have.length(2);
      expect(groups[0][1].zIndex).to.be(0);
      expect(groups[1][1].zIndex).to.be(1);
    });

  });

  describe('#prepareFeatures', function() {
    it('loads and parses data from a file', function(done) {
      var source = new ol.source.Vector({
        url: 'spec/ol/parser/geojson/countries.geojson',
        parser: new ol.parser.GeoJSON()
      });
      source.prepareFeatures([-180, -90, 180, 90],
          ol.proj.get('EPSG:4326'),
          function() {
            expect(source.loadState_).to.be(ol.source.VectorLoadState.LOADED);
            expect(goog.object.getCount(
                source.featureCache_.getFeaturesObject())).to.be(179);
            done();
          });
    });

    it('parses inline data', function() {
      var source = new ol.source.Vector({
        data: {
          'type': 'FeatureCollection',
          'features': [{
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [0, -6000000]
            }
          }, {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [-6000000, 0]
            }
          }, {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [0, 6000000]
            }
          }, {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [6000000, 0]
            }
          }]
        },
        parser: new ol.parser.GeoJSON(),
        projection: ol.proj.get('EPSG:4326')
      });
      source.prepareFeatures([-180, -90, 180, 90],
          ol.proj.get('EPSG:4326'),
          function() {
            expect(source.loadState_).to.be(ol.source.VectorLoadState.LOADED);
            expect(goog.object.getCount(
                source.featureCache_.getFeaturesObject())).to.be(4);
            done();
          });
    });



  });

  describe('featurechange event', function() {

    var source, features;

    beforeEach(function() {
      features = [
        new ol.Feature({
          g: new ol.geom.Point([16.0, 48.0])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[17.0, 49.0], [17.1, 49.1]])
        })
      ];
      source = new ol.source.Vector();
      source.addFeatures(features);
    });

    it('is dispatched on attribute changes', function(done) {
      goog.events.listen(source, ol.source.VectorEventType.CHANGE,
          function(evt) {
            var expected = features[0];
            expect(evt.features[0]).to.be(expected);
            expect(evt.extents[0]).to.eql(expected.getGeometry().getBounds());
            done();

          });

      features[0].set('foo', 'bar');
    });

  });

});

describe('ol.source.FeatureCache', function() {

  describe('#getFeaturesObject()', function() {
    var source, features;

    beforeEach(function() {
      features = [
        new ol.Feature({
          g: new ol.geom.Point([16.0, 48.0])
        }),
        new ol.Feature({
          g: new ol.geom.LineString([[17.0, 49.0], [17.1, 49.1]])
        })
      ];
      source = new ol.source.Vector();
      source.addFeatures(features);
    });

    it('returns the features in an object', function() {
      var featuresObject = source.featureCache_.getFeaturesObject();
      expect(goog.object.getCount(featuresObject)).to.eql(features.length);
    });

  });

});

goog.require('goog.dispose');
goog.require('goog.events');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.parser.GeoJSON');
goog.require('ol.proj');
goog.require('ol.source.FeatureCache');
goog.require('ol.source.Source');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
