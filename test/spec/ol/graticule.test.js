import Graticule from '../../../src/ol/layer/Graticule.js';
import Map from '../../../src/ol/Map.js';
import {get as getProjection} from '../../../src/ol/proj.js';
import Stroke from '../../../src/ol/style/Stroke.js';
import Text from '../../../src/ol/style/Text.js';
import Feature from '../../../src/ol/Feature.js';

describe('ol.layer.Graticule', () => {
  let graticule;

  function createGraticule() {
    graticule = new Graticule();
    new Map({
      layers: [graticule]
    });
  }

  describe('#createGraticule', () => {
    test('creates a graticule without labels', () => {
      createGraticule();
      const extent = [-25614353.926475704, -7827151.696402049,
        25614353.926475704, 7827151.696402049];
      const projection = getProjection('EPSG:3857');
      const resolution = 39135.75848201024;
      const squaredTolerance = resolution * resolution / 4.0;
      graticule.updateProjectionInfo_(projection);
      graticule.createGraticule_(extent, [0, 0], resolution, squaredTolerance);
      expect(graticule.getMeridians().length).toBe(13);
      expect(graticule.getParallels().length).toBe(3);
      expect(graticule.meridiansLabels_).toBe(null);
      expect(graticule.parallelsLabels_).toBe(null);
    });

    test('creates a graticule with labels', () => {
      graticule = new Graticule({
        showLabels: true
      });
      new Map({
        layers: [graticule]
      });
      const extent = [-25614353.926475704, -7827151.696402049,
        25614353.926475704, 7827151.696402049];
      const projection = getProjection('EPSG:3857');
      const resolution = 39135.75848201024;
      const squaredTolerance = resolution * resolution / 4.0;
      graticule.updateProjectionInfo_(projection);
      graticule.createGraticule_(extent, [0, 0], resolution, squaredTolerance);
      expect(graticule.meridiansLabels_.length).toBe(13);
      expect(graticule.meridiansLabels_[0].text).toBe('0° 00′ 00″');
      expect(graticule.meridiansLabels_[0].geom.getCoordinates()[0]).to.roughlyEqual(0, 1e-9);
      expect(graticule.parallelsLabels_.length).toBe(3);
      expect(graticule.parallelsLabels_[0].text).toBe('0° 00′ 00″');
      expect(graticule.parallelsLabels_[0].geom.getCoordinates()[1]).to.roughlyEqual(0, 1e-9);
    });

    test('has a default stroke style', () => {
      createGraticule();
      const actualStyle = graticule.strokeStyle_;

      expect(actualStyle).not.toBe(undefined);
      expect(actualStyle instanceof Stroke).toBe(true);
    });

    test('can be configured with a stroke style', () => {
      createGraticule();
      const customStrokeStyle = new Stroke({
        color: 'rebeccapurple'
      });
      const styledGraticule = new Graticule({
        map: new Map({}),
        strokeStyle: customStrokeStyle
      });
      const actualStyle = styledGraticule.strokeStyle_;

      expect(actualStyle).not.toBe(undefined);
      expect(actualStyle).toBe(customStrokeStyle);
    });

    test('can be configured with label options', () => {
      const latLabelStyle = new Text();
      const lonLabelStyle = new Text();
      const feature = new Feature();
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
      const extent = [-25614353.926475704, -7827151.696402049,
        25614353.926475704, 7827151.696402049];
      const projection = getProjection('EPSG:3857');
      const resolution = 39135.75848201024;
      const squaredTolerance = resolution * resolution / 4.0;
      graticule.updateProjectionInfo_(projection);
      graticule.createGraticule_(extent, [0, 0], resolution, squaredTolerance);
      expect(graticule.meridiansLabels_[0].text).toBe('lon: 0');
      expect(graticule.parallelsLabels_[0].text).toBe('lat: 0');
      expect(graticule.lonLabelStyle_(feature).getText()).toEqual(lonLabelStyle);
      expect(graticule.latLabelStyle_(feature).getText()).toEqual(latLabelStyle);
      expect(graticule.lonLabelPosition_).toBe(0.9);
      expect(graticule.latLabelPosition_).toBe(0.1);
    });

    test('can be configured with interval limits', () => {
      graticule = new Graticule({
        showLabels: true,
        lonLabelFormatter: function(lon) {
          return lon.toString();
        },
        latLabelFormatter: function(lat) {
          return lat.toString();
        },
        intervals: [10]
      });
      new Map({
        layers: [graticule]
      });
      const extent = [-25614353.926475704, -7827151.696402049,
        25614353.926475704, 7827151.696402049];
      const projection = getProjection('EPSG:3857');
      const resolution = 4891.96981025128;
      const squaredTolerance = resolution * resolution / 4.0;
      graticule.updateProjectionInfo_(projection);
      graticule.createGraticule_(extent, [0, 0], resolution, squaredTolerance);

      expect(graticule.meridiansLabels_[0].text).toBe('0');
      expect(graticule.parallelsLabels_[0].text).toBe('0');
      expect(graticule.meridiansLabels_[1].text).toBe('-10');
      expect(graticule.parallelsLabels_[1].text).toBe('-10');
      expect(graticule.meridiansLabels_[2].text).toBe('-20');
      expect(graticule.parallelsLabels_[2].text).toBe('-20');

      expect(graticule.getMeridians().length).toBe(37);
      expect(graticule.getParallels().length).toBe(11);
    });


  });

});
