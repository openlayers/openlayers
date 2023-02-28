import BingMaps, {quadKey} from '../../../../../src/ol/source/BingMaps.js';
import View from '../../../../../src/ol/View.js';
import {getCenter} from '../../../../../src/ol/extent.js';
import {
  get as getProjection,
  transformExtent,
} from '../../../../../src/ol/proj.js';
import {unByKey} from '../../../../../src/ol/Observable.js';

describe('ol/source/BingMaps', function () {
  describe('quadKey()', function () {
    it('returns expected string', function () {
      const tileCoord = [3, 3, 5];
      const s = quadKey(tileCoord);
      expect(s).to.eql('213');
    });
  });

  describe('#getInterpolate()', function () {
    it('is true by default', function () {
      const source = new BingMaps({});
      expect(source.getInterpolate()).to.be(true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new BingMaps({interpolate: false});
      expect(source.getInterpolate()).to.be(false);
    });
  });

  describe('#tileUrlFunction()', function () {
    let source, tileGrid;

    beforeEach(function (done) {
      source = new BingMaps({
        imagerySet: 'AerialWithLabelsOnDemand',
        key: '',
      });

      const client = new XMLHttpRequest();
      client.open('GET', 'spec/ol/data/bing_aerialwithlabels.json', true);
      client.onload = function () {
        source.handleImageryMetadataResponse(JSON.parse(client.responseText));
      };
      client.send();

      const key = source.on('change', function () {
        if (source.getState() === 'ready') {
          unByKey(key);
          tileGrid = source.getTileGrid();
          done();
        }
      });
    });

    it('getImagerySet works correctly', function () {
      expect(source.getImagerySet()).to.equal('AerialWithLabelsOnDemand');
    });

    it('getApiKey works correctly', function () {
      expect(source.getApiKey()).to.equal('');
    });

    it('returns the expected URL', function () {
      const coordinate = [829330.2064098881, 5933916.615134273];
      const projection = source.getProjection();
      const regex = /\/tiles\/h(.*)\.jpeg/;
      let tileUrl;

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 1),
        1,
        projection
      );
      expect(tileUrl.match(regex)[1]).to.equal(quadKey([1, 1, 0]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 2),
        1,
        projection
      );
      expect(tileUrl.match(regex)[1]).to.equal(quadKey([2, 2, 1]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 3),
        1,
        projection
      );
      expect(tileUrl.match(regex)[1]).to.equal(quadKey([3, 4, 2]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 4),
        1,
        projection
      );
      expect(tileUrl.match(regex)[1]).to.equal(quadKey([4, 8, 5]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 5),
        1,
        projection
      );
      expect(tileUrl.match(regex)[1]).to.equal(quadKey([5, 16, 11]));

      tileUrl = source.tileUrlFunction(
        tileGrid.getTileCoordForCoordAndZ(coordinate, 6),
        1,
        projection
      );
      expect(tileUrl.match(regex)[1]).to.equal(quadKey([6, 33, 22]));
    });
  });

  describe('#getAttributions()', function () {
    let attributions;

    beforeEach(function (done) {
      const source = new BingMaps({
        imagerySet: 'AerialWithLabelsOnDemand',
        key: '',
      });

      const client = new XMLHttpRequest();
      client.open('GET', 'spec/ol/data/bing_aerialwithlabels.json', true);
      client.onload = function () {
        source.handleImageryMetadataResponse(JSON.parse(client.responseText));
      };
      client.send();

      const key = source.on('change', function () {
        if (source.getState() === 'ready') {
          unByKey(key);
          attributions = source.getAttributions();
          done();
        }
      });
    });

    it('returns attributions, but not when outside bounds', function () {
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      const projection = getProjection('EPSG:3857');
      const view = new View({projection: projection});
      const expected = '© Province of British Columbia';
      const frameState = {};
      let extent;

      extent = transformExtent([-115, 59, -114, 61], 'EPSG:4326', 'EPSG:3857');
      frameState.viewState = {
        center: getCenter(extent),
        projection: projection,
        resolution: view.getResolutionForZoom(18.4),
      };
      frameState.extent = extent;
      expect(attributions(frameState)).to.contain(expected);

      frameState.viewState = {
        center: getCenter(extent),
        projection: projection,
        resolution: view.getResolutionForZoom(18.5),
      };
      frameState.extent = extent;
      expect(attributions(frameState)).to.not.contain(expected);

      extent = transformExtent([-114, 59, -113, 61], 'EPSG:4326', 'EPSG:3857');
      frameState.viewState = {
        center: getCenter(extent),
        projection: projection,
        resolution: view.getResolutionForZoom(18.4),
      };
      frameState.extent = extent;
      expect(attributions(frameState)).to.not.contain(expected);

      extent = transformExtent([-475, 59, -474, 61], 'EPSG:4326', 'EPSG:3857');
      frameState.viewState = {
        center: getCenter(extent),
        projection: projection,
        resolution: view.getResolutionForZoom(18.4),
      };
      frameState.extent = extent;
      expect(attributions(frameState)).to.contain(expected);
    });

    it('returns attributions when reprojected, but not when outside bounds', function () {
      const projection = getProjection('EPSG:4326');
      const view = new View({projection: projection});
      const expected = '© Province of British Columbia';
      const frameState = {};
      let extent;

      extent = [-115, 59, -114, 61];
      frameState.viewState = {
        center: getCenter(extent),
        projection: projection,
        resolution: view.getResolutionForZoom(19.4),
      };
      frameState.extent = extent;
      expect(attributions(frameState)).to.contain(expected);

      frameState.viewState = {
        center: getCenter(extent),
        projection: projection,
        resolution: view.getResolutionForZoom(19.5),
      };
      frameState.extent = extent;
      expect(attributions(frameState)).to.not.contain(expected);

      extent = [-114, 59, -113, 61];
      frameState.viewState = {
        center: getCenter(extent),
        projection: projection,
        resolution: view.getResolutionForZoom(19.4),
      };
      frameState.extent = extent;
      expect(attributions(frameState)).to.not.contain(expected);

      extent = [-475, 59, -474, 61];
      frameState.viewState = {
        center: getCenter(extent),
        projection: projection,
        resolution: view.getResolutionForZoom(19.4),
      };
      frameState.extent = extent;
      expect(attributions(frameState)).to.contain(expected);
    });
  });

  describe('wrapX', function () {
    let attributions;

    beforeEach(function (done) {
      const source = new BingMaps({
        imagerySet: 'AerialWithLabelsOnDemand',
        key: '',
        wrapX: false,
      });

      const client = new XMLHttpRequest();
      client.open('GET', 'spec/ol/data/bing_aerialwithlabels.json', true);
      client.onload = function () {
        source.handleImageryMetadataResponse(JSON.parse(client.responseText));
      };
      client.send();

      const key = source.on('change', function () {
        if (source.getState() === 'ready') {
          unByKey(key);
          attributions = source.getAttributions();
          done();
        }
      });
    });

    it('returns attributions, but not in wrapped worlds if wrapX false', function () {
      expect(attributions).to.not.be(null);
      expect(typeof attributions).to.be('function');
      const projection = getProjection('EPSG:3857');
      const view = new View({projection: projection});
      const expected = '© Province of British Columbia';
      const frameState = {};
      let extent;

      extent = transformExtent([-115, 59, -114, 61], 'EPSG:4326', 'EPSG:3857');
      frameState.viewState = {
        center: getCenter(extent),
        projection: projection,
        resolution: view.getResolutionForZoom(18.4),
      };
      frameState.extent = extent;
      expect(attributions(frameState)).to.contain(expected);

      extent = transformExtent([-475, 59, -474, 61], 'EPSG:4326', 'EPSG:3857');
      frameState.viewState = {
        center: getCenter(extent),
        projection: projection,
        resolution: view.getResolutionForZoom(18.4),
      };
      frameState.extent = extent;
      expect(attributions(frameState)).to.not.contain(expected);
    });
  });
});
