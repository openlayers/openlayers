import Triangulation from '../../../../../src/ol/reproj/Triangulation.js';
import {
  addCommon,
  clearAllProjections,
  get as getProjection,
} from '../../../../../src/ol/proj.js';
import {register} from '../../../../../src/ol/proj/proj4.js';

describe('ol.reproj.Triangulation', function () {
  beforeEach(function () {
    proj4.defs(
      'EPSG:27700',
      '+proj=tmerc +lat_0=49 +lon_0=-2 ' +
        '+k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy ' +
        '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
        '+units=m +no_defs',
    );
    register(proj4);
    const proj27700 = getProjection('EPSG:27700');
    proj27700.setExtent([0, 0, 700000, 1300000]);
  });

  afterEach(function () {
    delete proj4.defs['EPSG:27700'];
    clearAllProjections();
    addCommon();
  });

  describe('constructor', function () {
    it('is trivial for identity', function () {
      const proj4326 = getProjection('EPSG:4326');
      const triangulation = new Triangulation(
        proj4326,
        proj4326,
        [20, 20, 30, 30],
        [-180, -90, 180, 90],
        0,
      );
      expect(triangulation.getTriangles().length).to.be(2);
    });

    it('is empty when outside source extent', function () {
      const proj4326 = getProjection('EPSG:4326');
      const proj27700 = getProjection('EPSG:27700');
      const triangulation = new Triangulation(
        proj27700,
        proj4326,
        [0, 0, 10, 10],
        proj27700.getExtent(),
        0,
      );
      expect(triangulation.getTriangles().length).to.be(0);
    });

    it('can handle null source extent', function () {
      const proj4326 = getProjection('EPSG:4326');
      const triangulation = new Triangulation(
        proj4326,
        proj4326,
        [20, 20, 30, 30],
        null,
        0,
      );
      expect(triangulation.getTriangles().length).to.be(2);
    });
  });
});
