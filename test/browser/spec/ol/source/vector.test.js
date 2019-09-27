import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import Collection from '../../../../../src/ol/Collection.js';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import {listen} from '../../../../../src/ol/events.js';
import {isEmpty} from '../../../../../src/ol/extent.js';
import GeoJSON from '../../../../../src/ol/format/GeoJSON.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import Point from '../../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import {bbox as bboxStrategy} from '../../../../../src/ol/loadingstrategy.js';
import {
  fromLonLat,
  get as getProjection,
  transformExtent,
} from '../../../../../src/ol/proj.js';
import RenderFeature from '../../../../../src/ol/render/Feature.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import {getUid} from '../../../../../src/ol/util.js';

describe('ol/source/Vector', function () {
  let pointFeature;
  let infiniteExtent;
  beforeEach(function () {
    pointFeature = new Feature(new Point([0, 0]));
    infiniteExtent = [-Infinity, -Infinity, Infinity, Infinity];
  });

  describe('when empty', function () {
    let vectorSource;
    beforeEach(function () {
      vectorSource = new VectorSource();
    });

    describe('#getExtent', function () {
      it('returns null when `useSpatialIndex` is `false`', () => {
        const source = new VectorSource({useSpatialIndex: false});
        assert.strictEqual(source.getExtent(), null);
      });
      it('returns an empty extent when no features', () => {
        assert.strictEqual(isEmpty(vectorSource.getExtent()), true);
      });
    });

    describe('#forEachFeatureInExtent', function () {
      it('does not call the callback', function () {
        const f = sinonSpy();
        vectorSource.forEachFeatureInExtent(infiniteExtent, f);
        assert.strictEqual(f.called, false);
      });
    });

    describe('#getFeaturesInExtent', function () {
      it('returns an empty array', function () {
        const features = vectorSource.getFeaturesInExtent(infiniteExtent);
        assert.instanceOf(features, Array);
        assert.isEmpty(features);
      });
    });

    describe('#isEmpty', function () {
      it('returns true', function () {
        assert.strictEqual(vectorSource.isEmpty(), true);
      });
      it('returns true without spatial index', function () {
        const source = new VectorSource({
          useSpatialIndex: false,
        });
        assert.strictEqual(source.isEmpty(), true);
      });
      it('returns false with geometry', function () {
        vectorSource.addFeature(new Feature(new Point([0, 0])));
        assert.strictEqual(vectorSource.isEmpty(), false);
      });
      it('returns false without spatial index and geometry', function () {
        const source = new VectorSource({
          useSpatialIndex: false,
        });
        source.addFeature(new Feature(new Point([0, 0])));
        assert.strictEqual(source.isEmpty(), false);
      });
      it('returns false with null geometry', function () {
        vectorSource.addFeature(new Feature());
        assert.strictEqual(vectorSource.isEmpty(), false);
      });
      it('returns false without spatial index and null geometry', function () {
        const source = new VectorSource({
          useSpatialIndex: false,
        });
        source.addFeature(new Feature());
        assert.strictEqual(source.isEmpty(), false);
      });
    });

    describe('#addFeature', function () {
      it('can add a single point feature', function () {
        vectorSource.addFeature(pointFeature);
        const features = vectorSource.getFeaturesInExtent(infiniteExtent);
        assert.instanceOf(features, Array);
        assert.lengthOf(features, 1);
        assert.strictEqual(features[0], pointFeature);
      });

      it('fires a change event', function () {
        const listener = sinonSpy();
        listen(vectorSource, 'change', listener);
        vectorSource.addFeature(pointFeature);
        assert.strictEqual(listener.called, true);
      });

      it('adds same id features only once', function () {
        const source = new VectorSource();
        const feature1 = new Feature();
        feature1.setId('1');
        const feature2 = new Feature();
        feature2.setId('1');
        source.addFeature(feature1);
        source.addFeature(feature2);
        assert.strictEqual(source.getFeatures().length, 1);
      });

      it('Render features with the same id are gathered in an array', function () {
        const source = new VectorSource();
        const feature1 = new RenderFeature('Point', [1, 1], [], 2, {}, 1);
        const feature2 = new RenderFeature('Point', [2, 2], [], 2, {}, 1);
        source.addFeature(feature1);
        source.addFeature(feature2);
        assert.strictEqual(source.getFeatures().length, 2);
        assert.deepEqual(source.getFeatureById(1), [feature1, feature2]);
      });
    });

    describe('#hasFeature', function () {
      it('returns true for added feature without id', function () {
        const feature = new Feature();
        vectorSource.addFeature(feature);
        assert.strictEqual(vectorSource.hasFeature(feature), true);
      });

      it('returns true for added feature with id', function () {
        const feature = new Feature();
        feature.setId('1');
        vectorSource.addFeature(feature);
        assert.strictEqual(vectorSource.hasFeature(feature), true);
      });

      it('return false for removed feature', function () {
        const feature = new Feature();
        vectorSource.addFeature(feature);
        vectorSource.removeFeature(feature);
        assert.strictEqual(vectorSource.hasFeature(feature), false);
      });

      it('returns false for non-added feature', function () {
        const feature = new Feature();
        assert.strictEqual(vectorSource.hasFeature(feature), false);
      });

      it('returns false for a different feature with the same id', function () {
        const feature = new Feature();
        feature.setId('1');
        vectorSource.addFeature(feature);
        const otherFeature = new Feature();
        otherFeature.setId('1');
        assert.strictEqual(vectorSource.hasFeature(otherFeature), false);
      });
    });
  });

  describe('when populated with 3 features', function () {
    const features = [];
    let vectorSource;
    beforeEach(function () {
      features.push(
        new Feature(
          new LineString([
            [0, 0],
            [10, 10],
          ]),
        ),
      );
      features.push(new Feature(new Point([0, 10])));
      features.push(new Feature(new Point([10, 5])));
      vectorSource = new VectorSource({
        features: features,
      });
    });

    describe('#getClosestFeatureToCoordinate', function () {
      it('returns the expected feature', function () {
        const feature = vectorSource.getClosestFeatureToCoordinate([1, 9]);
        assert.strictEqual(feature, features[1]);
      });

      it('returns the expected feature when a filter is used', function () {
        const feature = vectorSource.getClosestFeatureToCoordinate(
          [1, 9],
          function (feature) {
            return feature.getGeometry().getType() == 'LineString';
          },
        );
        assert.strictEqual(feature, features[0]);
      });
    });

    describe('#getFeatures', function () {
      it('does not return the internal array when useSpatialIndex is false', function () {
        const noSpatialIndexSource = new VectorSource({
          useSpatialIndex: false,
          features: vectorSource.getFeatures(),
        });
        assert.notEqual(
          noSpatialIndexSource.getFeatures(),
          noSpatialIndexSource.getFeaturesCollection().getArray(),
        );
      });
    });
  });

  describe('clear and refresh', function () {
    let map, source, spy;
    beforeEach(function (done) {
      source = new VectorSource({
        format: new GeoJSON(),
        url: 'spec/ol/source/vectorsource/single-feature.json',
      });
      const target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        layers: [
          new VectorLayer({
            source: source,
          }),
        ],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });
      map.once('rendercomplete', function () {
        spy = sinonSpy(source, 'loader_');
        done();
      });
    });

    afterEach(function () {
      if (spy) {
        source.loader_.restore();
      }
      disposeMap(map);
    });

    it('#refresh() reloads from server', function (done) {
      assert.lengthOf(source.getFeatures(), 1);
      map.once('rendercomplete', function () {
        assert.lengthOf(source.getFeatures(), 1);
        assert.strictEqual(spy.callCount, 1);
        done();
      });
      source.refresh();
    });

    it('#clear() removes all features from the source', function (done) {
      assert.lengthOf(source.getFeatures(), 1);
      map.once('rendercomplete', function () {
        assert.lengthOf(source.getFeatures(), 0);
        assert.strictEqual(spy.callCount, 0);
        done();
      });
      source.clear();
    });

    it('After #setUrl(), refresh() loads from the new url', function (done) {
      source.loader_.restore();
      spy = undefined;
      assert.lengthOf(source.getFeatures(), 1);
      const oldCoordinates = source
        .getFeatures()[0]
        .getGeometry()
        .getCoordinates();
      map.on('rendercomplete', function () {
        assert.lengthOf(source.getFeatures(), 1);
        const newCoordinates = source
          .getFeatures()[0]
          .getGeometry()
          .getCoordinates();
        assert.notDeepEqual(newCoordinates, oldCoordinates);
        done();
      });
      source.setUrl('spec/ol/data/point.json');
      source.refresh();
    });
  });

  describe('when populated with 10 random points and a null', function () {
    let features;
    let vectorSource;
    beforeEach(function () {
      features = [];
      let i;
      for (i = 0; i < 10; ++i) {
        features[i] = new Feature(new Point([Math.random(), Math.random()]));
      }
      features.push(new Feature(null));
      vectorSource = new VectorSource({
        features: features,
      });
    });

    describe('#clear', function () {
      it('removes all features using fast path', function () {
        const removeFeatureSpy = sinonSpy();
        listen(vectorSource, 'removefeature', removeFeatureSpy);
        const clearSourceSpy = sinonSpy();
        listen(vectorSource, 'clear', clearSourceSpy);
        vectorSource.clear(true);
        assert.deepEqual(vectorSource.getFeatures(), []);
        assert.strictEqual(vectorSource.isEmpty(), true);
        assert.strictEqual(removeFeatureSpy.called, false);
        assert.strictEqual(removeFeatureSpy.callCount, 0);
        assert.strictEqual(clearSourceSpy.called, true);
        assert.strictEqual(clearSourceSpy.callCount, 1);
      });

      it('removes all features using slow path', function () {
        const removeFeatureSpy = sinonSpy();
        listen(vectorSource, 'removefeature', removeFeatureSpy);
        const clearSourceSpy = sinonSpy();
        listen(vectorSource, 'clear', clearSourceSpy);
        vectorSource.clear();
        assert.deepEqual(vectorSource.getFeatures(), []);
        assert.strictEqual(vectorSource.isEmpty(), true);
        assert.strictEqual(removeFeatureSpy.called, true);
        assert.strictEqual(removeFeatureSpy.callCount, features.length);
        assert.strictEqual(clearSourceSpy.called, true);
        assert.strictEqual(clearSourceSpy.callCount, 1);
      });
    });

    describe('#forEachFeatureInExtent', function () {
      it('is called the expected number of times', function () {
        const f = sinonSpy();
        vectorSource.forEachFeatureInExtent(infiniteExtent, f);
        assert.strictEqual(f.callCount, 10);
      });

      it('allows breaking out', function () {
        let count = 0;
        const result = vectorSource.forEachFeatureInExtent(
          infiniteExtent,
          function (f) {
            return ++count == 5;
          },
        );
        assert.strictEqual(result, true);
        assert.strictEqual(count, 5);
      });
    });

    describe('#getFeaturesInExtent', function () {
      it('returns the expected number of features', function () {
        assert.lengthOf(vectorSource.getFeaturesInExtent(infiniteExtent), 10);
      });
    });

    describe('#isEmpty', function () {
      it('returns false', function () {
        assert.strictEqual(vectorSource.isEmpty(), false);
      });
    });

    describe('#removeFeature', function () {
      it('works as expected', function () {
        let i;
        for (i = features.length - 1; i >= 0; --i) {
          vectorSource.removeFeature(features[i]);
          assert.lengthOf(vectorSource.getFeaturesInExtent(infiniteExtent), i);
        }
      });

      it('works as expected for renderfeatures', function () {
        const feature1 = new RenderFeature(
          'Polygon',
          [1, 1, 1, 2, 2, 1, 2, 2],
          [],
          2,
          {},
          'foo',
        );
        const feature2 = new RenderFeature(
          'Polygon',
          [1, 1, 1, 2, 2, 1, 2, 2],
          [],
          2,
          {},
          'foo',
        );

        const vectorSource = new VectorSource({features: [feature1, feature2]});
        assert.deepEqual(vectorSource.getFeatureById('foo'), [
          feature1,
          feature2,
        ]);
        vectorSource.removeFeature(feature1);
        assert.strictEqual(vectorSource.getFeatureById('foo'), feature2);
        vectorSource.removeFeature(feature2);
        assert.strictEqual(vectorSource.getFeatureById('foo'), null);
      });

      it('fires a change event', function () {
        const listener = sinonSpy();
        listen(vectorSource, 'change', listener);
        vectorSource.removeFeature(features[0]);
        assert.strictEqual(listener.called, true);
      });

      it('fires a removefeature event', function () {
        const listener = sinonSpy();
        listen(vectorSource, 'removefeature', listener);
        vectorSource.removeFeature(features[0]);
        assert.strictEqual(listener.called, true);
      });

      it('accepts features that are not in the source', function () {
        const changeListener = sinonSpy();
        listen(vectorSource, 'change', changeListener);

        const removeFeatureListener = sinonSpy();
        listen(vectorSource, 'removefeature', removeFeatureListener);

        const feature = new Feature(new Point([0, 0]));
        vectorSource.removeFeature(feature);
        assert.strictEqual(changeListener.called, false);
        assert.strictEqual(removeFeatureListener.called, false);
      });
    });

    describe("modifying a feature's geometry", function () {
      it('keeps the R-Tree index up to date', function () {
        assert.lengthOf(vectorSource.getFeaturesInExtent([0, 0, 1, 1]), 10);
        features[0].getGeometry().setCoordinates([100, 100]);
        assert.lengthOf(vectorSource.getFeaturesInExtent([0, 0, 1, 1]), 9);
        features[0].getGeometry().setCoordinates([0.5, 0.5]);
        assert.lengthOf(vectorSource.getFeaturesInExtent([0, 0, 1, 1]), 10);
      });
    });

    describe('setting a features geometry', function () {
      it('keeps the R-Tree index up to date', function () {
        assert.lengthOf(vectorSource.getFeaturesInExtent([0, 0, 1, 1]), 10);
        features[0].setGeometry(new Point([100, 100]));
        assert.lengthOf(vectorSource.getFeaturesInExtent([0, 0, 1, 1]), 9);
      });
    });
  });

  describe('tracking changes to features', function () {
    let vectorSource;
    beforeEach(function () {
      vectorSource = new VectorSource();
    });

    it('keeps its index up-to-date', function () {
      const feature = new Feature(new Point([1, 1]));
      vectorSource.addFeature(feature);
      assert.deepEqual(vectorSource.getFeaturesInExtent([0, 0, 2, 2]), [
        feature,
      ]);
      feature.getGeometry().setCoordinates([3, 3]);
      assert.isEmpty(vectorSource.getFeaturesInExtent([0, 0, 2, 2]));
      assert.deepEqual(vectorSource.getFeaturesInExtent([2, 2, 4, 4]), [
        feature,
      ]);
    });

    it('handles features with null geometries', function () {
      const feature = new Feature(null);
      vectorSource.addFeature(feature);
      assert.deepEqual(vectorSource.getFeatures(), [feature]);
    });

    it('handles features with geometries changing from null', function () {
      const feature = new Feature(null);
      vectorSource.addFeature(feature);
      assert.deepEqual(vectorSource.getFeatures(), [feature]);
      feature.setGeometry(new Point([1, 1]));
      assert.deepEqual(vectorSource.getFeaturesInExtent([0, 0, 2, 2]), [
        feature,
      ]);
      assert.deepEqual(vectorSource.getFeatures(), [feature]);
    });

    it('handles features with geometries changing to null', function () {
      const feature = new Feature(new Point([1, 1]));
      vectorSource.addFeature(feature);
      assert.deepEqual(vectorSource.getFeatures(), [feature]);
      assert.deepEqual(vectorSource.getFeaturesInExtent([0, 0, 2, 2]), [
        feature,
      ]);
      feature.setGeometry(null);
      assert.isEmpty(vectorSource.getFeaturesInExtent([0, 0, 2, 2]));
      assert.deepEqual(vectorSource.getFeatures(), [feature]);
    });

    it("fires a change event when setting a feature's property", function () {
      const feature = new Feature(new Point([1, 1]));
      vectorSource.addFeature(feature);
      const listener = sinonSpy();
      listen(vectorSource, 'change', listener);
      feature.set('foo', 'bar');
      assert.strictEqual(listener.called, true);
    });

    it('fires a changefeature event when updating a feature', function () {
      const feature = new Feature(new Point([1, 1]));
      vectorSource.addFeature(feature);
      const listener = sinonSpy(function (event) {
        assert.strictEqual(event.feature, feature);
      });
      vectorSource.on('changefeature', listener);
      feature.setStyle(null);
      assert.strictEqual(listener.called, true);
    });
  });

  describe('#getFeatureById()', function () {
    let source;
    beforeEach(function () {
      source = new VectorSource();
    });

    it('returns a feature by id', function () {
      const feature = new Feature();
      feature.setId('foo');
      source.addFeature(feature);
      assert.strictEqual(source.getFeatureById('foo'), feature);
    });

    it('returns a feature by id (set after add)', function () {
      const feature = new Feature();
      source.addFeature(feature);
      assert.strictEqual(source.getFeatureById('foo'), null);
      feature.setId('foo');
      assert.strictEqual(source.getFeatureById('foo'), feature);
    });

    it('returns null when no feature is found', function () {
      const feature = new Feature();
      feature.setId('foo');
      source.addFeature(feature);
      assert.strictEqual(source.getFeatureById('bar'), null);
    });

    it('returns null after removing feature', function () {
      const feature = new Feature();
      feature.setId('foo');
      source.addFeature(feature);
      assert.strictEqual(source.getFeatureById('foo'), feature);
      source.removeFeature(feature);
      assert.strictEqual(source.getFeatureById('foo'), null);
    });

    it('returns null after unsetting id', function () {
      const feature = new Feature();
      feature.setId('foo');
      source.addFeature(feature);
      assert.strictEqual(source.getFeatureById('foo'), feature);
      feature.setId(undefined);
      assert.strictEqual(source.getFeatureById('foo'), null);
    });

    it('returns null after clear', function () {
      const feature = new Feature();
      feature.setId('foo');
      source.addFeature(feature);
      assert.strictEqual(source.getFeatureById('foo'), feature);
      source.clear();
      assert.strictEqual(source.getFeatureById('foo'), null);
    });

    it('returns null when no features are indexed', function () {
      assert.strictEqual(source.getFeatureById('foo'), null);
      source.addFeature(new Feature());
      assert.strictEqual(source.getFeatureById('foo'), null);
    });

    it('returns correct feature after add/remove/add', function () {
      assert.strictEqual(source.getFeatureById('foo'), null);
      const first = new Feature();
      first.setId('foo');
      source.addFeature(first);
      assert.strictEqual(source.getFeatureById('foo'), first);
      source.removeFeature(first);
      assert.strictEqual(source.getFeatureById('foo'), null);
      const second = new Feature();
      second.setId('foo');
      source.addFeature(second);
      assert.strictEqual(source.getFeatureById('foo'), second);
    });

    it('returns correct feature after add/change', function () {
      assert.strictEqual(source.getFeatureById('foo'), null);
      const feature = new Feature();
      feature.setId('foo');
      source.addFeature(feature);
      assert.strictEqual(source.getFeatureById('foo'), feature);
      feature.setId('bar');
      assert.strictEqual(source.getFeatureById('foo'), null);
      assert.strictEqual(source.getFeatureById('bar'), feature);
    });
  });

  describe('#getFeatureByUid()', function () {
    let source;
    beforeEach(function () {
      source = new VectorSource();
    });

    it('returns a feature with an id', function () {
      const feature = new Feature();
      feature.setId('abcd');
      source.addFeature(feature);
      assert.strictEqual(source.getFeatureByUid(getUid(feature)), feature);
    });

    it('returns a feature without id', function () {
      const feature = new Feature();
      source.addFeature(feature);
      assert.strictEqual(source.getFeatureByUid(getUid(feature)), feature);
    });

    it('returns null when no feature is found', function () {
      const feature = new Feature();
      feature.setId('abcd');
      source.addFeature(feature);
      const wrongId = 'abcd';
      assert.strictEqual(source.getFeatureByUid(wrongId), null);
    });

    it('returns null after removing feature', function () {
      const feature = new Feature();
      feature.setId('abcd');
      source.addFeature(feature);
      const uid = getUid(feature);
      assert.strictEqual(source.getFeatureByUid(uid), feature);
      source.removeFeature(feature);
      assert.strictEqual(source.getFeatureByUid(uid), null);
    });

    it('returns null after clear', function () {
      const feature = new Feature();
      feature.setId('abcd');
      source.addFeature(feature);
      const uid = getUid(feature);
      assert.strictEqual(source.getFeatureByUid(uid), feature);
      source.clear();
      assert.strictEqual(source.getFeatureByUid(uid), null);
    });

    it('returns null when no features are present', function () {
      assert.strictEqual(source.getFeatureByUid('abcd'), null);
    });
  });

  describe('#loadFeatures', function () {
    let map;
    beforeEach(() => {
      map = new Map({
        target: createMapDiv(100, 100),
        layers: [],
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });
    });
    afterEach(() => {
      disposeMap(map);
    });

    it('fires the FEATURESLOADSTART event', function (done) {
      const source = new VectorSource();
      source.on('featuresloadstart', function () {
        done();
      });
      source.loadFeatures(
        [-10000, -10000, 10000, 10000],
        1,
        getProjection('EPSG:3857'),
      );
    });

    it('fires the FEATURESLOADEND event after the features are added', function (done) {
      const source = new VectorSource({
        format: new GeoJSON(),
        url: 'spec/ol/source/vectorsource/single-feature.json',
      });
      source.on('featuresloadend', function () {
        const features = source.getFeatures();
        assert.isArray(features);
        assert.strictEqual(features.length, 1);
        done();
      });
      source.loadFeatures(
        [-10000, -10000, 10000, 10000],
        1,
        getProjection('EPSG:3857'),
      );
    });

    it('fires the FEATURESLOADEND event if the default load function is used', function (done) {
      const source = new VectorSource({
        format: new GeoJSON(),
        url: 'spec/ol/source/vectorsource/single-feature.json',
      });
      source.on('featuresloadend', function (event) {
        assert.isArray(event.features);
        assert.strictEqual(event.features.length, 1);
        done();
      });
      source.loadFeatures(
        [-10000, -10000, 10000, 10000],
        1,
        getProjection('EPSG:3857'),
      );
    });

    describe('with the "bbox" strategy', function () {
      it('requests the view extent plus render buffer', function (done) {
        const center = [-97.6114, 38.8403];
        const source = new VectorSource({
          strategy: bboxStrategy,
          loader: function (extent) {
            setTimeout(function () {
              const lonLatExtent = transformExtent(
                extent,
                'EPSG:3857',
                'EPSG:4326',
              );
              assert.approximately(lonLatExtent[0], -99.259349218, 1e-9);
              assert.approximately(lonLatExtent[2], -95.963450781, 1e-9);
              done();
            }, 0);
          },
        });
        const div = document.createElement('div');
        div.style.width = '100px';
        div.style.height = '100px';
        document.body.appendChild(div);
        const map = new Map({
          target: div,
          layers: [
            new VectorLayer({
              source: source,
            }),
          ],
          view: new View({
            center: fromLonLat(center),
            zoom: 7,
          }),
        });
        map.renderSync();
        disposeMap(map);
      });
    });

    describe('with no loader and the "all" strategy', function () {
      it('stores the infinity extent in the Rtree', function () {
        const source = new VectorSource();
        source.loadFeatures(
          [-10000, -10000, 10000, 10000],
          1,
          getProjection('EPSG:3857'),
        );
        const loadedExtents = source.loadedExtentsRtree_.getAll();
        assert.lengthOf(loadedExtents, 1);
        assert.deepEqual(loadedExtents[0].extent, [
          -Infinity,
          -Infinity,
          Infinity,
          Infinity,
        ]);
      });
    });

    describe('with setLoader', function () {
      it('it will change the loader function', function () {
        let count1 = 0;
        const loader1 = function (bbox, resolution, projection) {
          count1++;
        };
        let count2 = 0;
        const loader2 = function (bbox, resolution, projection) {
          count2++;
        };
        const source = new VectorSource({loader: loader1});
        source.loadFeatures(
          [-10000, -10000, 10000, 10000],
          1,
          getProjection('EPSG:3857'),
        );
        source.setLoader(loader2);
        source.refresh();
        source.loadFeatures(
          [-10000, -10000, 10000, 10000],
          1,
          getProjection('EPSG:3857'),
        );
        assert.deepEqual(count1, 1);
        assert.deepEqual(count2, 1);
      });

      it('removes extents with #removeLoadedExtent()', function (done) {
        const source = new VectorSource();
        source.setLoader(function (bbox, resolution, projection) {
          setTimeout(function () {
            assert.lengthOf(source.loadedExtentsRtree_.getAll(), 1);
            source.removeLoadedExtent(bbox);
            assert.lengthOf(source.loadedExtentsRtree_.getAll(), 0);
            done();
          }, 0);
        });
        source.loadFeatures(
          [-10000, -10000, 10000, 10000],
          1,
          getProjection('EPSG:3857'),
        );
      });

      it('removes infinite extent from loadedExtentsRtree after multiple load requests', function (done) {
        const source = new VectorSource();
        source.setLoader(async () => []);

        // Make multiple load requests with different extents
        source.loadFeatures([-10, -10, 10, 10], 1, getProjection('EPSG:3857'));
        source.loadFeatures([0, 0, 10, 10], 1, getProjection('EPSG:3857'));
        source.loadFeatures([10, 10, 20, 20], 1, getProjection('EPSG:3857'));

        // Wait for all loader callbacks to complete
        setTimeout(() => {
          // Verify we have loaded extents in the tree
          const initialExtents = source.loadedExtentsRtree_.getAll();
          assert.isAbove(initialExtents.length, 0);

          // Remove the infinite extent
          source.removeLoadedExtent([-Infinity, -Infinity, Infinity, Infinity]);

          assert.lengthOf(source.loadedExtentsRtree_.getAll(), 0);
          done();
        }, 0);
      });

      it('fires the FEATURESLOADEND event if the load function uses the callback', function (done) {
        const source = new VectorSource();
        const spy = sinonSpy();
        source.on('featuresloadend', spy);

        const features = [new Feature(), new Feature()];

        source.setLoader(function (bbox, resolution, projection, success) {
          success(features);
          setTimeout(function () {
            assert.strictEqual(spy.calledOnce, true);
            const event = spy.getCall(0).args[0];
            assert.strictEqual(event.features, features);
            done();
          }, 0);
        });
        source.loadFeatures(
          [-10000, -10000, 10000, 10000],
          1,
          getProjection('EPSG:3857'),
        );
      });

      it('fires the FEATURESLOADERROR event if the load function uses the callback', function (done) {
        const source = new VectorSource();
        const spy = sinonSpy();
        source.on('featuresloaderror', spy);

        source.setLoader(
          function (bbox, resolution, projection, success, failure) {
            failure();
            setTimeout(function () {
              assert.strictEqual(spy.calledOnce, true);
              done();
            }, 0);
          },
        );
        source.loadFeatures(
          [-10000, -10000, 10000, 10000],
          1,
          getProjection('EPSG:3857'),
        );
      });

      it('clears loading state and map fires loadend after failure [Promise]', function (done) {
        const source = new VectorSource();
        let error = false;
        source.on('featuresloaderror', () => {
          error = true;
          assert.strictEqual(!!source.loading, false);
        });
        source.setLoader(
          (extent, resolution, projection) =>
            new Promise((_, reject) => setTimeout(reject, 0)),
        );
        map.addLayer(new VectorLayer({source}));

        map.once('loadend', () => {
          assert.strictEqual(!!source.loading, false);
          assert.strictEqual(error, true);
          done();
        });
      });

      it('retries and fires loadend after removeLoadedExtent and failure [Promise]', function (done) {
        const source = new VectorSource();
        let failures = 0;
        let successes = 0;
        source.on('featuresloaderror', () => {
          ++failures;
        });
        source.on('featuresloadend', () => {
          ++successes;
        });
        map.addLayer(new VectorLayer({source}));
        let loadCount = 0;
        source.setLoader((extent, resolution, projection) => {
          loadCount++;
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              if (loadCount === 1) {
                source.removeLoadedExtent(extent);
                reject();
              } else {
                const features = [new Feature(new Point([0, 0]))];
                resolve(features);
              }
            }, 0);
          });
        });

        map.on('loadend', function onloadend() {
          assert.strictEqual(loadCount, 2);
          assert.strictEqual(failures, 1);
          assert.strictEqual(successes, 1);
          assert.lengthOf(source.getFeatures(), 1);
          done();
        });
      });

      it('clears loading state and map fires loadend with empty success [Promise]', function (done) {
        const source = new VectorSource();
        source.on('featuresloadend', function () {
          assert.strictEqual(!!source.loading, false);
        });
        source.setLoader(function (bbox, resolution, projection, success) {
          return new Promise((resolve) => setTimeout(() => resolve([]), 0));
        });
        map.addLayer(new VectorLayer({source}));

        map.once('loadend', function () {
          assert.strictEqual(!!source.loading, false);
          done();
        });
      });

      it('clears loading state and map fires loadend after failure [callback]', function (done) {
        const source = new VectorSource();
        let error = false;
        source.on('featuresloaderror', () => {
          error = true;
          assert.strictEqual(!!source.loading, false);
        });
        source.setLoader((extent, resolution, projection, success, failure) => {
          setTimeout(failure, 0);
        });
        map.addLayer(new VectorLayer({source}));

        map.once('loadend', () => {
          assert.strictEqual(!!source.loading, false);
          assert.strictEqual(error, true);
          done();
        });
      });

      it('retries and fires loadend after removeLoadedExtent and failure [callback]', function (done) {
        const source = new VectorSource();
        let failures = 0;
        let successes = 0;
        source.on('featuresloaderror', () => {
          ++failures;
        });
        source.on('featuresloadend', () => {
          ++successes;
        });
        map.addLayer(new VectorLayer({source}));
        let loadCount = 0;
        source.setLoader(
          function (extent, resolution, projection, success, failure) {
            loadCount++;
            if (loadCount === 1) {
              setTimeout(function () {
                source.removeLoadedExtent(extent);
                failure();
              }, 0);
            } else {
              setTimeout(function () {
                const features = [];
                source.addFeatures(features);
                success(features);
              }, 0);
            }
          },
        );

        map.once('loadend', function () {
          assert.strictEqual(loadCount, 2);
          assert.strictEqual(failures, 1);
          assert.strictEqual(successes, 1);
          done();
        });
      });

      it('clears loading state and map fires loadend with empty success [callback]', function (done) {
        const source = new VectorSource();
        source.on('featuresloadend', function () {
          assert.strictEqual(!!source.loading, false);
        });
        source.setLoader(function (bbox, resolution, projection, success) {
          setTimeout(() => {
            const features = [];
            source.addFeatures(features);
            success(features);
          }, 0);
        });
        map.addLayer(new VectorLayer({source}));

        map.once('loadend', function () {
          assert.strictEqual(!!source.loading, false);
          done();
        });
      });
    });
  });

  describe('the feature id index', function () {
    let source;
    beforeEach(function () {
      source = new VectorSource();
    });

    it('ignores features with the same id', function () {
      const feature = new Feature();
      feature.setId('foo');
      source.addFeature(feature);
      const dupe = new Feature();
      dupe.setId('foo');
      source.addFeature(dupe);
      assert.lengthOf(source.getFeatures(), 1);
      assert.strictEqual(source.getFeatureById('foo'), feature);
    });

    it('allows changing feature and set the same id', function () {
      const foo = new Feature();
      foo.setId('foo');
      source.addFeature(foo);
      const bar = new Feature();
      bar.setId('bar');
      source.addFeature(bar);
      bar.setId('foo');
      assert.strictEqual(source.getFeatureById('foo'), bar);
    });
  });

  describe('the undefined feature id index', function () {
    let source;
    beforeEach(function () {
      source = new VectorSource();
    });

    it('disallows adding the same feature twice', function () {
      const feature = new Feature();
      source.addFeature(feature);
      assert.throws(function () {
        source.addFeature(feature);
      });
    });
  });

  describe('with useSpatialIndex set to false', function () {
    let source;
    beforeEach(function () {
      source = new VectorSource({useSpatialIndex: false});
    });

    it('returns a features collection', function () {
      assert.instanceOf(source.getFeaturesCollection(), Collection);
    });

    it('#forEachFeatureInExtent loops through all features', function () {
      source.addFeatures([new Feature(), new Feature()]);
      const spy = sinonSpy();
      source.forEachFeatureInExtent([0, 0, 0, 0], spy);
      assert.strictEqual(spy.callCount, 2);
    });
  });

  describe('with a collection of features', function () {
    let collection, source;
    beforeEach(function () {
      source = new VectorSource({
        useSpatialIndex: false,
      });
      collection = source.getFeaturesCollection();
    });

    it('creates a features collection', function () {
      assert.notEqual(source.getFeaturesCollection(), null);
    });

    it('adding/removing features keeps the collection in sync', function () {
      const feature = new Feature();
      source.addFeature(feature);
      assert.strictEqual(collection.getLength(), 1);
      source.removeFeature(feature);
      assert.strictEqual(collection.getLength(), 0);
    });

    it('#clear() features keeps the collection in sync', function () {
      const feature = new Feature();
      source.addFeatures([feature]);
      assert.strictEqual(collection.getLength(), 1);
      source.clear();
      assert.strictEqual(collection.getLength(), 0);
      source.addFeatures([feature]);
      assert.strictEqual(collection.getLength(), 1);
      source.clear(true);
      assert.strictEqual(collection.getLength(), 0);
    });

    it("keeps the source's features in sync with the collection", function () {
      const feature = new Feature();
      collection.push(feature);
      assert.strictEqual(source.getFeatures().length, 1);
      collection.remove(feature);
      assert.strictEqual(source.getFeatures().length, 0);
      collection.extend([feature]);
      assert.strictEqual(source.getFeatures().length, 1);
      collection.clear();
      assert.strictEqual(source.getFeatures().length, 0);
    });

    it('prevents adding two features with a duplicate id in the collection', function () {
      source = new VectorSource({
        features: new Collection(),
      });
      const feature1 = new Feature();
      feature1.setId('1');
      const feature2 = new Feature();
      feature2.setId('1');
      const collection = source.getFeaturesCollection();
      collection.push(feature1);
      collection.push(feature2);
      assert.strictEqual(collection.getLength(), 1);
    });
  });

  describe('with a collection of features plus spatial index', function () {
    let collection, source;
    beforeEach(function () {
      collection = new Collection();
      source = new VectorSource({
        features: collection,
      });
    });

    it('#getFeaturesCollection returns the configured collection', function () {
      assert.equal(source.getFeaturesCollection(), collection);
    });

    it('adding/removing features keeps the collection in sync', function () {
      const feature = new Feature();
      source.addFeature(feature);
      assert.strictEqual(collection.getLength(), 1);
      source.removeFeature(feature);
      assert.strictEqual(collection.getLength(), 0);
    });

    it('#clear() features keeps the collection in sync', function () {
      const feature = new Feature();
      source.addFeatures([feature]);
      assert.strictEqual(collection.getLength(), 1);
      source.clear();
      assert.strictEqual(collection.getLength(), 0);
      source.addFeatures([feature]);
      assert.strictEqual(collection.getLength(), 1);
      source.clear(true);
      assert.strictEqual(collection.getLength(), 0);
    });

    it("keeps the source's features in sync with the collection", function () {
      const feature = new Feature();
      collection.push(feature);
      assert.strictEqual(source.getFeatures().length, 1);
      collection.remove(feature);
      assert.strictEqual(source.getFeatures().length, 0);
      collection.extend([feature]);
      assert.strictEqual(source.getFeatures().length, 1);
      collection.clear();
      assert.strictEqual(source.getFeatures().length, 0);
    });
  });

  describe('#getFeaturesInExtent()', function () {
    it('adjusts the extent if projection canWrapX', function () {
      const a = new Feature(new Point([0, 0]));
      const b = new Feature(new Point([179, 0]));
      const c = new Feature(new Point([-179, 0]));

      const source = new VectorSource({
        features: [a, b, c],
      });

      const projection = getProjection('EPSG:4326');

      assert.strictEqual(
        source.getFeaturesInExtent([-180, -90, 180, 90], projection).length,
        3,
      );
      const onlyB = source.getFeaturesInExtent([1, -90, 180, 90], projection);
      assert.strictEqual(onlyB.length, 1);
      assert.include(onlyB, b);
      const bAndC = source.getFeaturesInExtent([1, -90, 182, 90], projection);
      assert.strictEqual(bAndC.length, 2);
      assert.include(bAndC, b);
      assert.include(bAndC, c);

      const onlyC = source.getFeaturesInExtent([-180, -90, -1, 90], projection);
      assert.strictEqual(onlyC.length, 1);
      assert.include(onlyC, c);

      const bAndCAgain = source.getFeaturesInExtent(
        [-182, -90, -1, 90],
        projection,
      );
      assert.strictEqual(bAndCAgain.length, 2);
      assert.include(bAndCAgain, b);
      assert.include(bAndCAgain, c);

      const onlyA = source.getFeaturesInExtent([359, -90, 361, 90], projection);
      assert.strictEqual(onlyA.length, 1);
      assert.include(onlyA, a);
    });
  });
});
