goog.provide('ol.test.Graticule');

describe('ol.Graticule', function() {
  var graticule;

  beforeEach(function() {
    graticule = new ol.Graticule({
      map: new ol.Map({})
    });
  });

  describe('#createGraticule', function() {
    it('creates the graticule', function() {
      var extent = [-25614353.926475704, -7827151.696402049,
        25614353.926475704, 7827151.696402049];
      var projection = ol.proj.get('EPSG:3857');
      var resolution = 39135.75848201024;
      var squaredTolerance = resolution * resolution / 4.0;
      graticule.updateProjectionInfo_(projection);
      graticule.createGraticule_(extent, [0, 0], resolution, squaredTolerance);
      expect(graticule.getMeridians().length).to.be(13);
      expect(graticule.getParallels().length).to.be(3);
    });

    it('has a default stroke style', function() {
      var actualStyle = graticule.strokeStyle_;

      expect(actualStyle).not.to.be(undefined);
      expect(actualStyle instanceof ol.style.Stroke).to.be(true);
    });

    it('can be configured with a stroke style', function() {
      var customStrokeStyle = new ol.style.Stroke({
        color: 'rebeccapurple'
      });
      var styledGraticule = new ol.Graticule({
        map: new ol.Map({}),
        strokeStyle: customStrokeStyle
      });
      var actualStyle = styledGraticule.strokeStyle_;

      expect(actualStyle).not.to.be(undefined);
      expect(actualStyle).to.be(customStrokeStyle);
    });

  });

});

goog.require('ol.Graticule');
goog.require('ol.Map');
goog.require('ol.proj');
goog.require('ol.style.Stroke');
