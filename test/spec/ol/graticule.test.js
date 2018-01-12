import Graticule from '../../../src/ol/Graticule.js';
import Map from '../../../src/ol/Map.js';
import {get as getProjection} from '../../../src/ol/proj.js';
import Stroke from '../../../src/ol/style/Stroke.js';
import Text from '../../../src/ol/style/Text.js';

describe('ol.Graticule', function() {
  var graticule;

  function createGraticule() {
    graticule = new Graticule({
      map: new Map({})
    });
  }

  describe('#createGraticule', function() {
    it('creates a graticule without labels', function() {
      createGraticule();
      var extent = [-25614353.926475704, -7827151.696402049,
        25614353.926475704, 7827151.696402049];
      var projection = getProjection('EPSG:3857');
      var resolution = 39135.75848201024;
      var squaredTolerance = resolution * resolution / 4.0;
      graticule.updateProjectionInfo_(projection);
      graticule.createGraticule_(extent, [0, 0], resolution, squaredTolerance);
      expect(graticule.getMeridians().length).to.be(13);
      expect(graticule.getParallels().length).to.be(3);
      expect(graticule.meridiansLabels_).to.be(null);
      expect(graticule.parallelsLabels_).to.be(null);
    });

    it('creates a graticule with labels', function() {
      graticule = new Graticule({
        map: new Map({}),
        showLabels: true
      });
      var extent = [-25614353.926475704, -7827151.696402049,
        25614353.926475704, 7827151.696402049];
      var projection = getProjection('EPSG:3857');
      var resolution = 39135.75848201024;
      var squaredTolerance = resolution * resolution / 4.0;
      graticule.updateProjectionInfo_(projection);
      graticule.createGraticule_(extent, [0, 0], resolution, squaredTolerance);
      expect(graticule.meridiansLabels_.length).to.be(13);
      expect(graticule.meridiansLabels_[0].text).to.be('0° 00′ 00″');
      expect(graticule.meridiansLabels_[0].geom.getCoordinates()[0]).to.roughlyEqual(0, 1e-9);
      expect(graticule.parallelsLabels_.length).to.be(3);
      expect(graticule.parallelsLabels_[0].text).to.be('0° 00′ 00″');
      expect(graticule.parallelsLabels_[0].geom.getCoordinates()[1]).to.roughlyEqual(0, 1e-9);
    });

    it('has a default stroke style', function() {
      createGraticule();
      var actualStyle = graticule.strokeStyle_;

      expect(actualStyle).not.to.be(undefined);
      expect(actualStyle instanceof Stroke).to.be(true);
    });

    it('can be configured with a stroke style', function() {
      createGraticule();
      var customStrokeStyle = new Stroke({
        color: 'rebeccapurple'
      });
      var styledGraticule = new Graticule({
        map: new Map({}),
        strokeStyle: customStrokeStyle
      });
      var actualStyle = styledGraticule.strokeStyle_;

      expect(actualStyle).not.to.be(undefined);
      expect(actualStyle).to.be(customStrokeStyle);
    });

    it('can be configured with label options', function() {
      var latLabelStyle = new Text();
      var lonLabelStyle = new Text();
      graticule = new Graticule({
        map: new Map({}),
        showLabels: true,
        lonLabelFormatter: function(lon) {
          return 'lon: ' + lon.toString();
        },
        latLabelFormatter: function(lat) {
          return 'lat: ' + lat.toString();
        },
        lonLabelPosition: 0.9,
        latLabelPosition: 0.1,
        lonLabelStyle: lonLabelStyle,
        latLabelStyle: latLabelStyle
      });
      var extent = [-25614353.926475704, -7827151.696402049,
        25614353.926475704, 7827151.696402049];
      var projection = getProjection('EPSG:3857');
      var resolution = 39135.75848201024;
      var squaredTolerance = resolution * resolution / 4.0;
      graticule.updateProjectionInfo_(projection);
      graticule.createGraticule_(extent, [0, 0], resolution, squaredTolerance);
      expect(graticule.meridiansLabels_[0].text).to.be('lon: 0');
      expect(graticule.parallelsLabels_[0].text).to.be('lat: 0');
      expect(graticule.lonLabelStyle_).to.eql(lonLabelStyle);
      expect(graticule.latLabelStyle_).to.eql(latLabelStyle);
      expect(graticule.lonLabelPosition_).to.be(0.9);
      expect(graticule.latLabelPosition_).to.be(0.1);
    });

  });

});
