import Feature from '../../../../src/ol/Feature.js';
import Graticule from '../../../../src/ol/layer/Graticule.js';
import Map from '../../../../src/ol/Map.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Text from '../../../../src/ol/style/Text.js';
import {fromLonLat, get as getProjection} from '../../../../src/ol/proj.js';

describe('ol.layer.Graticule', function () {
  let graticule;

  function createGraticule() {
    graticule = new Graticule();
    new Map({
      layers: [graticule],
    });
  }

  describe('#createGraticule', function () {
    it('creates a graticule without labels', function () {
      createGraticule();
      const extent = [
        -25614353.926475704, -7827151.696402049, 25614353.926475704,
        7827151.696402049,
      ];
      const projection = getProjection('EPSG:3857');
      const resolution = 39135.75848201024;
      const squaredTolerance = (resolution * resolution) / 4.0;
      graticule.updateProjectionInfo_(projection);
      graticule.createGraticule_(extent, [0, 0], resolution, squaredTolerance);
      expect(graticule.getMeridians().length).to.be(13);
      expect(graticule.getParallels().length).to.be(3);
      expect(graticule.meridiansLabels_).to.be(null);
      expect(graticule.parallelsLabels_).to.be(null);
    });

    it('creates a graticule with normal world labels', function () {
      const feature = new Feature();
      graticule = new Graticule({
        showLabels: true,
        wrapX: false,
      });
      new Map({
        layers: [graticule],
      });
      const extent = [
        -25614353.926475704, -7827151.696402049, 25614353.926475704,
        7827151.696402049,
      ];
      const projection = getProjection('EPSG:3857');
      const resolution = 39135.75848201024;
      graticule.loaderFunction(extent, resolution, projection);
      const event = {
        context: document.createElement('canvas').getContext('2d'),
        inversePixelTransform: [1, 0, 0, 1, 0, 0],
        frameState: {
          coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
          extent: extent,
          pixelRatio: 1,
          viewState: {
            projection: projection,
            resolution: resolution,
            rotation: 0,
          },
        },
      };
      graticule.drawLabels_(event);
      expect(graticule.meridiansLabels_.length).to.be(13);
      expect(graticule.meridiansLabels_[0].text).to.be('0°');
      expect(
        graticule.meridiansLabels_[0].geom.getCoordinates()[0]
      ).to.roughlyEqual(0, 1e-9);
      expect(graticule.parallelsLabels_.length).to.be(3);
      expect(graticule.parallelsLabels_[0].text).to.be('0°');
      expect(
        graticule.parallelsLabels_[0].geom.getCoordinates()[1]
      ).to.roughlyEqual(0, 1e-9);
      feature.set('graticule_label', graticule.meridiansLabels_[0].text);
      expect(graticule.lonLabelStyle_(feature).getText().getText()).to.be('0°');
      feature.set('graticule_label', graticule.parallelsLabels_[0].text);
      expect(graticule.latLabelStyle_(feature).getText().getText()).to.be('0°');
    });

    it('creates a graticule with wrapped world labels', function () {
      const feature = new Feature();
      graticule = new Graticule({
        showLabels: true,
      });
      new Map({
        layers: [graticule],
      });
      const extent = [
        -25614353.926475704, -7827151.696402049, 25614353.926475704,
        7827151.696402049,
      ];
      const projection = getProjection('EPSG:3857');
      const resolution = 39135.75848201024;
      graticule.loaderFunction(extent, resolution, projection);
      const event = {
        context: document.createElement('canvas').getContext('2d'),
        inversePixelTransform: [1, 0, 0, 1, 0, 0],
        frameState: {
          coordinateToPixelTransform: [1, 0, 0, 1, 0, 0],
          extent: extent,
          pixelRatio: 1,
          viewState: {
            projection: projection,
            resolution: resolution,
            rotation: 0,
          },
        },
      };
      graticule.drawLabels_(event);
      expect(graticule.meridiansLabels_.length).to.be(13);
      expect(graticule.meridiansLabels_[0].text).to.be('0°');
      const coordinates = fromLonLat([360, 0]);
      expect(
        graticule.meridiansLabels_[0].geom.getCoordinates()[0]
      ).to.roughlyEqual(coordinates[0], 1e-9);
      expect(graticule.parallelsLabels_.length).to.be(3);
      expect(graticule.parallelsLabels_[0].text).to.be('0°');
      expect(
        graticule.parallelsLabels_[0].geom.getCoordinates()[1]
      ).to.roughlyEqual(0, 1e-9);
      feature.set('graticule_label', graticule.meridiansLabels_[0].text);
      expect(graticule.lonLabelStyle_(feature).getText().getText()).to.be('0°');
      feature.set('graticule_label', graticule.parallelsLabels_[0].text);
      expect(graticule.latLabelStyle_(feature).getText().getText()).to.be('0°');
    });

    it('has a default stroke style', function () {
      createGraticule();
      const actualStyle = graticule.strokeStyle_;

      expect(actualStyle).not.to.be(undefined);
      expect(actualStyle instanceof Stroke).to.be(true);
    });

    it('can be configured with a stroke style', function () {
      createGraticule();
      const customStrokeStyle = new Stroke({
        color: 'rebeccapurple',
      });
      const styledGraticule = new Graticule({
        map: new Map({}),
        strokeStyle: customStrokeStyle,
      });
      const actualStyle = styledGraticule.strokeStyle_;

      expect(actualStyle).not.to.be(undefined);
      expect(actualStyle).to.be(customStrokeStyle);
    });

    it('can be configured with label options', function () {
      const latLabelStyle = new Text();
      const lonLabelStyle = new Text();
      const feature = new Feature();
      graticule = new Graticule({
        map: new Map({}),
        showLabels: true,
        lonLabelFormatter: function (lon) {
          return 'lon: ' + lon.toString();
        },
        latLabelFormatter: function (lat) {
          return 'lat: ' + lat.toString();
        },
        lonLabelPosition: 0.9,
        latLabelPosition: 0.1,
        lonLabelStyle: lonLabelStyle,
        latLabelStyle: latLabelStyle,
      });
      const extent = [
        -25614353.926475704, -7827151.696402049, 25614353.926475704,
        7827151.696402049,
      ];
      const projection = getProjection('EPSG:3857');
      const resolution = 39135.75848201024;
      const squaredTolerance = (resolution * resolution) / 4.0;
      graticule.updateProjectionInfo_(projection);
      graticule.createGraticule_(extent, [0, 0], resolution, squaredTolerance);
      expect(graticule.meridiansLabels_[0].text).to.be('lon: 0');
      expect(graticule.parallelsLabels_[0].text).to.be('lat: 0');
      expect(graticule.lonLabelStyle_(feature).getText()).to.eql(lonLabelStyle);
      expect(graticule.latLabelStyle_(feature).getText()).to.eql(latLabelStyle);
      feature.set('graticule_label', graticule.meridiansLabels_[0].text);
      expect(graticule.lonLabelStyle_(feature).getText().getText()).to.be(
        'lon: 0'
      );
      feature.set('graticule_label', graticule.parallelsLabels_[0].text);
      expect(graticule.latLabelStyle_(feature).getText().getText()).to.be(
        'lat: 0'
      );
      expect(graticule.lonLabelPosition_).to.be(0.9);
      expect(graticule.latLabelPosition_).to.be(0.1);
    });

    it('can be configured with interval limits', function () {
      graticule = new Graticule({
        showLabels: true,
        lonLabelFormatter: function (lon) {
          return lon.toString();
        },
        latLabelFormatter: function (lat) {
          return lat.toString();
        },
        intervals: [10],
      });
      new Map({
        layers: [graticule],
      });
      const extent = [
        -25614353.926475704, -7827151.696402049, 25614353.926475704,
        7827151.696402049,
      ];
      const projection = getProjection('EPSG:3857');
      const resolution = 4891.96981025128;
      const squaredTolerance = (resolution * resolution) / 4.0;
      graticule.updateProjectionInfo_(projection);
      graticule.createGraticule_(extent, [0, 0], resolution, squaredTolerance);

      expect(graticule.meridiansLabels_[0].text).to.be('0');
      expect(graticule.parallelsLabels_[0].text).to.be('0');
      expect(graticule.meridiansLabels_[1].text).to.be('-10');
      expect(graticule.parallelsLabels_[1].text).to.be('-10');
      expect(graticule.meridiansLabels_[2].text).to.be('-20');
      expect(graticule.parallelsLabels_[2].text).to.be('-20');

      expect(graticule.getMeridians().length).to.be(37);
      expect(graticule.getParallels().length).to.be(11);
    });
  });
});
