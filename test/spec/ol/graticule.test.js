

import _ol_Graticule_ from '../../../src/ol/graticule';
import _ol_Map_ from '../../../src/ol/map';
import _ol_proj_ from '../../../src/ol/proj';
import _ol_style_Stroke_ from '../../../src/ol/style/stroke';
import _ol_style_Text_ from '../../../src/ol/style/text';

describe('ol.Graticule', function() {
  var graticule;

  function createGraticule() {
    graticule = new _ol_Graticule_({
      map: new _ol_Map_({})
    });
  }

  describe('#createGraticule', function() {
    it('creates a graticule without labels', function() {
      createGraticule();
      var extent = [-25614353.926475704, -7827151.696402049,
        25614353.926475704, 7827151.696402049];
      var projection = _ol_proj_.get('EPSG:3857');
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
      graticule = new _ol_Graticule_({
        map: new _ol_Map_({}),
        showLabels: true
      });
      var extent = [-25614353.926475704, -7827151.696402049,
        25614353.926475704, 7827151.696402049];
      var projection = _ol_proj_.get('EPSG:3857');
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
      expect(actualStyle instanceof _ol_style_Stroke_).to.be(true);
    });

    it('can be configured with a stroke style', function() {
      createGraticule();
      var customStrokeStyle = new _ol_style_Stroke_({
        color: 'rebeccapurple'
      });
      var styledGraticule = new _ol_Graticule_({
        map: new _ol_Map_({}),
        strokeStyle: customStrokeStyle
      });
      var actualStyle = styledGraticule.strokeStyle_;

      expect(actualStyle).not.to.be(undefined);
      expect(actualStyle).to.be(customStrokeStyle);
    });

    it('can be configured with label options', function() {
      var latLabelStyle = new _ol_style_Text_();
      var lonLabelStyle = new _ol_style_Text_();
      graticule = new _ol_Graticule_({
        map: new _ol_Map_({}),
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
      var projection = _ol_proj_.get('EPSG:3857');
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
