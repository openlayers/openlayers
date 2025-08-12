import {spy as sinonSpy} from 'sinon';
import Feature from '../../../../../../src/ol/Feature.js';
import Map from '../../../../../../src/ol/Map.js';
import View from '../../../../../../src/ol/View.js';
import ViewHint from '../../../../../../src/ol/ViewHint.js';
import {createCanvasContext2D} from '../../../../../../src/ol/dom.js';
import GeoJSON from '../../../../../../src/ol/format/GeoJSON.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../../../../src/ol/layer/Vector.js';
import WebGLPointsLayer from '../../../../../../src/ol/layer/WebGLPoints.js';
import {get as getProjection} from '../../../../../../src/ol/proj.js';
import {ShaderBuilder} from '../../../../../../src/ol/render/webgl/ShaderBuilder.js';
import {WebGLWorkerMessageType} from '../../../../../../src/ol/render/webgl/constants.js';
import WebGLPointsLayerRenderer from '../../../../../../src/ol/renderer/webgl/PointsLayer.js';
import OSM from '../../../../../../src/ol/source/OSM.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import {
  compose as composeTransform,
  create as createTransform,
} from '../../../../../../src/ol/transform.js';
import {getUid} from '../../../../../../src/ol/util.js';

const baseFrameState = {
  viewHints: [],
  viewState: {
    projection: getProjection('EPSG:3857'),
    resolution: 1,
    rotation: 0,
    center: [0, 0],
  },
  layerStatesArray: [{}],
  layerIndex: 0,
  pixelRatio: 1,
  renderTargets: {},
};

const builder = new ShaderBuilder().setSymbolSizeExpression('vec2(4.)');
const simpleVertexShader = builder.getSymbolVertexShader();
const simpleFragmentShader = builder.getSymbolFragmentShader();

describe('ol/renderer/webgl/PointsLayer', function () {
  describe('constructor', function () {
    let target;

    beforeEach(function () {
      target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
    });

    afterEach(function () {
      target.remove();
    });

    it('creates a new instance', function () {
      const layer = new VectorLayer({
        source: new VectorSource(),
      });
      const renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
      });
      expect(renderer).to.be.a(WebGLPointsLayerRenderer);
      renderer.dispose();
    });
  });

  describe('#prepareFrame', function () {
    let layer, renderer, frameState;

    beforeEach(function () {
      layer = new VectorLayer({
        source: new VectorSource(),
        renderBuffer: 10,
      });
      renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
        hitDetectionEnabled: false,
      });
      frameState = Object.assign({}, baseFrameState, {
        size: [2, 2],
        extent: [-100, -100, 100, 100],
        layerStatesArray: [layer.getLayerState()],
      });
    });

    afterEach(function () {
      renderer.dispose();
    });

    it('calls WebGlHelper#prepareDraw', function () {
      renderer.prepareFrame(frameState);

      const spy = sinonSpy(renderer.helper, 'prepareDraw');
      renderer.prepareFrame(frameState);
      expect(spy.called).to.be(true);
    });

    it('fills up a buffer with 2 triangles per point', function (done) {
      layer.getSource().addFeature(
        new Feature({
          geometry: new Point([10, 20]),
        }),
      );
      layer.getSource().addFeature(
        new Feature({
          geometry: new Point([30, 40]),
        }),
      );
      renderer.prepareFrame(frameState);

      const attributePerVertex = 2;

      renderer.worker_.addEventListener('message', function (event) {
        if (event.data.type !== WebGLWorkerMessageType.GENERATE_POINT_BUFFERS) {
          return;
        }
        expect(renderer.verticesBuffer_.getArray().length).to.eql(8);
        expect(renderer.instanceAttributesBuffer_.getArray().length).to.eql(
          2 * attributePerVertex,
        );
        expect(renderer.indicesBuffer_.getArray().length).to.eql(6);

        expect(renderer.instanceAttributesBuffer_.getArray()).to.eql([
          10, 20, 30, 40,
        ]);
        done();
      });
    });

    it('fills up the hit render buffer with 2 triangles per point', function (done) {
      renderer.dispose();
      renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
        hitDetectionEnabled: true,
      });
      layer.getSource().addFeature(
        new Feature({
          geometry: new Point([10, 20]),
        }),
      );
      layer.getSource().addFeature(
        new Feature({
          geometry: new Point([30, 40]),
        }),
      );
      renderer.prepareFrame(frameState);

      const attributePerVertex = 5;

      renderer.worker_.addEventListener('message', function (event) {
        if (event.data.type !== WebGLWorkerMessageType.GENERATE_POINT_BUFFERS) {
          return;
        }
        if (!renderer.verticesBuffer_.getArray()) {
          return;
        }
        expect(renderer.verticesBuffer_.getArray().length).to.eql(8);
        expect(renderer.instanceAttributesBuffer_.getArray().length).to.eql(
          2 * attributePerVertex,
        );
        expect(renderer.indicesBuffer_.getArray().length).to.eql(6);

        expect(
          renderer.instanceAttributesBuffer_.getArray().slice(0, 2),
        ).to.eql([10, 20]);
        expect(
          renderer.instanceAttributesBuffer_
            .getArray()
            .slice(attributePerVertex, 2 + attributePerVertex),
        ).to.eql([30, 40]);
        done();
      });
    });

    it('clears the buffers when the features are gone', function (done) {
      const source = layer.getSource();
      source.addFeature(
        new Feature({
          geometry: new Point([10, 20]),
        }),
      );
      source.removeFeature(source.getFeatures()[0]);
      source.addFeature(
        new Feature({
          geometry: new Point([10, 20]),
        }),
      );
      renderer.prepareFrame(frameState);

      renderer.worker_.addEventListener('message', function (event) {
        if (event.data.type !== WebGLWorkerMessageType.GENERATE_POINT_BUFFERS) {
          return;
        }
        const attributePerVertex = 1;
        expect(renderer.verticesBuffer_.getArray().length).to.eql(8);
        expect(renderer.instanceAttributesBuffer_.getArray().length).to.eql(
          2 * attributePerVertex,
        );
        expect(renderer.indicesBuffer_.getArray().length).to.eql(6);

        done();
      });
    });

    it('rebuilds the buffers only when not interacting or animating', function () {
      const spy = sinonSpy(renderer, 'rebuildBuffers_');

      frameState.viewHints[ViewHint.INTERACTING] = 1;
      frameState.viewHints[ViewHint.ANIMATING] = 0;
      renderer.prepareFrame(frameState);
      expect(spy.called).to.be(false);

      frameState.viewHints[ViewHint.INTERACTING] = 0;
      frameState.viewHints[ViewHint.ANIMATING] = 1;
      renderer.prepareFrame(frameState);
      expect(spy.called).to.be(false);

      frameState.viewHints[ViewHint.INTERACTING] = 0;
      frameState.viewHints[ViewHint.ANIMATING] = 0;
      renderer.prepareFrame(frameState);
      expect(spy.called).to.be(true);
    });

    it('rebuilds the buffers only when the frame extent changed', function () {
      const spy = sinonSpy(renderer, 'rebuildBuffers_');

      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(1);

      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(1);

      frameState.extent = [10, 20, 30, 40];
      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(2);
    });

    it('triggers source loading when the extent changes', function () {
      const spy = sinonSpy(layer.getSource(), 'loadFeatures');

      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(1);

      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(1);

      frameState.extent = [10, 20, 30, 40];
      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(2);
      expect(spy.getCall(1).args[0]).to.eql([0, 10, 40, 50]); // renderBuffer is 10
    });

    it('triggers source loading when the source revision changes', function () {
      const spy = sinonSpy(layer.getSource(), 'loadFeatures');

      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(1);

      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(1);

      layer.getSource().changed();
      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(2);
    });
  });

  describe('#forEachFeatureAtCoordinate', function () {
    let layer, renderer, feature, feature2;

    beforeEach(function () {
      feature = new Feature({geometry: new Point([0, 0]), id: 1});
      feature2 = new Feature({geometry: new Point([14, 14]), id: 2});
      layer = new VectorLayer({
        source: new VectorSource({
          features: [feature, feature2],
        }),
      });
      renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
        hitDetectionEnabled: true,
      });
    });

    afterEach(function () {
      renderer.dispose();
    });

    it('correctly hit detects a feature', function (done) {
      const transform = composeTransform(
        createTransform(),
        20,
        20,
        1,
        -1,
        0,
        0,
        0,
      );
      const frameState = Object.assign({}, baseFrameState, {
        extent: [-20, -20, 20, 20],
        size: [40, 40],
        coordinateToPixelTransform: transform,
        layerStatesArray: [layer.getLayerState()],
      });

      renderer.prepareFrame(frameState);
      renderer.worker_.addEventListener('message', function () {
        if (!renderer.renderInstructions_) {
          return;
        }
        renderer.prepareFrame(frameState);
        renderer.renderFrame(frameState);

        function checkHit(x, y, expected) {
          let called = false;
          renderer.forEachFeatureAtCoordinate(
            [x, y],
            frameState,
            0,
            function (feature) {
              expect(feature).to.be(expected);
              called = true;
            },
            null,
          );

          if (expected) {
            expect(called).to.be(true);
          } else {
            expect(called).to.be(false);
          }
        }

        checkHit(0, 0, feature);
        checkHit(1, -1, feature);
        checkHit(-2, 2, feature);
        checkHit(2, 0, null);
        checkHit(1, -3, null);

        checkHit(14, 14, feature2);
        checkHit(15, 13, feature2);
        checkHit(12, 16, feature2);
        checkHit(16, 14, null);
        checkHit(13, 11, null);

        done();
      });
    });

    it('correctly hit detects with pixelratio != 1', function (done) {
      const transform = composeTransform(
        createTransform(),
        20,
        20,
        1,
        -1,
        0,
        0,
        0,
      );
      const frameState = Object.assign({}, baseFrameState, {
        pixelRatio: 3,
        extent: [-20, -20, 20, 20],
        size: [40, 40],
        coordinateToPixelTransform: transform,
        layerStatesArray: [layer.getLayerState()],
      });

      let found;
      const cb = function (feature) {
        found = feature;
      };

      renderer.prepareFrame(frameState);
      renderer.worker_.addEventListener('message', function () {
        if (!renderer.renderInstructions_) {
          return;
        }
        renderer.prepareFrame(frameState);
        renderer.renderFrame(frameState);

        function checkHit(x, y, expected) {
          found = null;
          renderer.forEachFeatureAtCoordinate([x, y], frameState, 0, cb, null);
          expect(found).to.be(expected);
        }

        checkHit(0, 0, feature);
        checkHit(1, -1, feature);
        checkHit(-2, 2, feature);
        checkHit(2, 0, null);
        checkHit(1, -3, null);

        checkHit(14, 14, feature2);
        checkHit(15, 13, feature2);
        checkHit(12, 16, feature2);
        checkHit(16, 14, null);
        checkHit(13, 11, null);

        done();
      });
    });
  });

  describe('#disposeInternal', function () {
    it('terminates the worker and calls dispose on the helper', function () {
      const layer = new VectorLayer({
        source: new VectorSource(),
      });
      const renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
      });

      const frameState = Object.assign({}, baseFrameState, {
        size: [2, 2],
        extent: [-100, -100, 100, 100],
        layerStatesArray: [layer.getLayerState()],
      });
      renderer.prepareFrame(frameState);

      const spyHelper = sinonSpy(renderer.helper, 'disposeInternal');
      const spyWorker = sinonSpy(renderer.worker_, 'terminate');
      renderer.dispose();
      expect(spyHelper.called).to.be(true);
      expect(spyWorker.called).to.be(true);
    });
  });

  describe('featureCache_', function () {
    /** @type {VectorSource} */
    let source;
    /** @type {VectorLayer} */
    let layer;
    /** @type {Array<Feature<Point>>} */
    let features;
    /** @type {Array<Feature>} */
    let invalidGeometryFeatures;

    /**
     * @param {Feature} feature Feature
     * @param {WebGLPointsLayerRenderer} renderer Renderer
     * @return {import('../../../../../../src/ol/renderer/webgl/PointsLayer.js').FeatureCacheItem} cached values
     */
    function getCache(feature, renderer) {
      return renderer.featureCache_[getUid(feature)];
    }

    beforeEach(function () {
      source = new VectorSource();
      layer = new VectorLayer({
        source,
      });
      features = [
        new Feature({
          id: 'A',
          test: 'abcd',
          geometry: new Point([0, 1]),
        }),
        new Feature({
          id: 'D',
          test: 'efgh',
          geometry: new Point([2, 3]),
        }),
        new Feature({
          id: 'C',
          test: 'ijkl',
          geometry: new Point([4, 5]),
        }),
      ];
      invalidGeometryFeatures = [
        new Feature(),
        new Feature(
          new LineString([
            [0, 0],
            [1, 1],
          ]),
        ),
      ];
    });

    it('contains no features initially', function () {
      const renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
      });
      expect(renderer.featureCount_).to.be(0);
    });

    it('contains the features initially present in the source', function () {
      source.addFeatures(features);
      const renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
      });
      expect(renderer.featureCount_).to.be(3);
      expect(getCache(features[0], renderer).feature).to.be(features[0]);
      expect(getCache(features[0], renderer).flatCoordinates).to.be(
        features[0].getGeometry().getFlatCoordinates(),
      );
      expect(getCache(features[0], renderer).properties['test']).to.be(
        features[0].get('test'),
      );
      expect(getCache(features[1], renderer).feature).to.be(features[1]);
      expect(getCache(features[1], renderer).flatCoordinates).to.be(
        features[1].getGeometry().getFlatCoordinates(),
      );
      expect(getCache(features[1], renderer).properties['test']).to.be(
        features[1].get('test'),
      );
      expect(getCache(features[2], renderer).feature).to.be(features[2]);
      expect(getCache(features[2], renderer).flatCoordinates).to.be(
        features[2].getGeometry().getFlatCoordinates(),
      );
      expect(getCache(features[2], renderer).properties['test']).to.be(
        features[2].get('test'),
      );
    });

    it('ignores null-geometry features during construction', () => {
      source.addFeatures([...features, ...invalidGeometryFeatures]);
      const renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
      });
      expect(renderer.featureCount_).to.be(features.length);
    });

    it('removes features which no longer have a valid point geometry', () => {
      source.addFeatures(features);
      const renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
      });
      features[0].setGeometry(undefined);
      features[1].setGeometry(
        new LineString([
          [0, 0],
          [1, 1],
        ]),
      );
      expect(renderer.featureCount_).to.be(1);
    });

    it('adds features whose geometry becomes valid', () => {
      source.addFeatures(invalidGeometryFeatures);
      const renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
      });
      invalidGeometryFeatures[0].setGeometry(new Point([0, 1]));
      invalidGeometryFeatures[1].setGeometry(new Point([2, 2]));
      expect(renderer.featureCount_).to.be(2);
    });

    it('contains the features added to the source', function () {
      const renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
      });

      source.addFeature(features[0]);
      expect(renderer.featureCount_).to.be(1);

      source.addFeature(features[1]);
      expect(renderer.featureCount_).to.be(2);

      expect(getCache(features[0], renderer).feature).to.be(features[0]);
      expect(getCache(features[0], renderer).flatCoordinates).to.be(
        features[0].getGeometry().getFlatCoordinates(),
      );
      expect(getCache(features[0], renderer).properties['test']).to.be(
        features[0].get('test'),
      );
      expect(getCache(features[1], renderer).feature).to.be(features[1]);
      expect(getCache(features[1], renderer).flatCoordinates).to.be(
        features[1].getGeometry().getFlatCoordinates(),
      );
      expect(getCache(features[1], renderer).properties['test']).to.be(
        features[1].get('test'),
      );
    });

    it('does not contain the features removed to the source', function () {
      const renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
      });

      source.addFeatures(features);
      expect(renderer.featureCount_).to.be(3);

      source.removeFeature(features[1]);
      expect(renderer.featureCount_).to.be(2);

      expect(getCache(features[0], renderer).feature).to.be(features[0]);
      expect(getCache(features[0], renderer).flatCoordinates).to.be(
        features[0].getGeometry().getFlatCoordinates(),
      );
      expect(getCache(features[0], renderer).properties['test']).to.be(
        features[0].get('test'),
      );
      expect(getCache(features[2], renderer).feature).to.be(features[2]);
      expect(getCache(features[2], renderer).flatCoordinates).to.be(
        features[2].getGeometry().getFlatCoordinates(),
      );
      expect(getCache(features[2], renderer).properties['test']).to.be(
        features[2].get('test'),
      );
    });

    it('contains up to date properties and geometry', function () {
      const renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
      });

      source.addFeatures(features);
      features[0].set('test', 'updated');
      features[0].set('added', true);
      features[0].getGeometry().setCoordinates([10, 20]);
      expect(renderer.featureCount_).to.be(3);

      expect(getCache(features[0], renderer).feature).to.be(features[0]);
      expect(getCache(features[0], renderer).flatCoordinates).to.eql([10, 20]);
      expect(getCache(features[0], renderer).properties['test']).to.be(
        features[0].get('test'),
      );
      expect(getCache(features[0], renderer).properties['added']).to.be(
        features[0].get('added'),
      );
    });
  });

  describe('fires events', () => {
    let layer, source, renderer, frameState;

    beforeEach(function () {
      source = new VectorSource({
        features: new GeoJSON().readFeatures({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [13, 52],
              },
            },
          ],
        }),
      });

      layer = new WebGLPointsLayer({
        source,
        style: {
          'circle-radius': 4,
        },
      });

      renderer = new WebGLPointsLayerRenderer(layer, {
        vertexShader: simpleVertexShader,
        fragmentShader: simpleFragmentShader,
      });

      frameState = {
        viewHints: [],
        viewState: {
          projection: getProjection('EPSG:4326'),
          resolution: 0.010986328125,
          rotation: 0,
          center: [15, 52],
          zoom: 7,
        },
        extent: [
          11.1932373046875, 46.429931640625, 18.8067626953125, 57.570068359375,
        ],
        size: [693, 1014],
        layerIndex: 0,
        layerStatesArray: [
          {
            layer: layer,
            opacity: 1,
            visible: true,
            zIndex: 0,
          },
        ],
        renderTargets: {},
      };
    });

    afterEach(function () {
      renderer.dispose();
    });

    it('fires prerender and postrender events', function (done) {
      let prerenderNotified = false;
      let postrenderNotified = false;

      layer.once('prerender', (evt) => {
        prerenderNotified = true;
      });

      layer.once('postrender', (evt) => {
        postrenderNotified = true;
        expect(prerenderNotified).to.be(true);
        expect(postrenderNotified).to.be(true);
        done();
      });

      renderer.prepareFrame(frameState);
      renderer.renderFrame(frameState);
    });
  });

  describe('rendercomplete', function () {
    let map, layer;
    beforeEach(function () {
      layer = new WebGLPointsLayer({
        source: new VectorSource({
          features: [new Feature(new Point([0, 0]))],
        }),
        style: {
          'circle-radius': 14,
          'circle-fill-color': 'red',
        },
      });
      map = new Map({
        pixelRatio: 1,
        target: createMapDiv(100, 100),
        layers: [layer],
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
      });
    });

    afterEach(function () {
      disposeMap(map);
      layer.dispose();
    });

    it('is completely rendered on rendercomplete', function (done) {
      map.once('rendercomplete', function () {
        const targetContext = createCanvasContext2D(1, 1);
        const canvas = document.querySelector('.ol-layer');
        targetContext.drawImage(canvas, 50, 50, 1, 1, 0, 0, 1, 1);
        expect(Array.from(targetContext.getImageData(0, 0, 1, 1).data)).to.eql([
          255, 0, 0, 255,
        ]);
        layer
          .getSource()
          .addFeature(new Feature(new Point([1900000, 1900000])));
        layer.once('postrender', function () {
          expect(layer.getRenderer().ready).to.be(false);
        });
        map.once('rendercomplete', function () {
          const targetContext = createCanvasContext2D(1, 1);
          const canvas = document.querySelector('.ol-layer');
          targetContext.drawImage(canvas, 99, 0, 1, 1, 0, 0, 1, 1);
          expect(
            Array.from(targetContext.getImageData(0, 0, 1, 1).data),
          ).to.eql([255, 0, 0, 255]);
          done();
        });
      });
    });
  });

  describe('layer not visible initially', function () {
    let map, layer;
    beforeEach(function () {
      layer = new WebGLPointsLayer({
        source: new VectorSource(),
        style: {
          'circle-radius': 14,
          'circle-fill-color': 'red',
        },
        maxZoom: 8,
      });
      const visibleLayer = new TileLayer({
        source: new OSM(),
      });
      map = new Map({
        pixelRatio: 1,
        target: createMapDiv(100, 100),
        layers: [layer, visibleLayer],
        view: new View({
          center: [0, 0],
          zoom: 10,
        }),
      });
    });

    afterEach(function () {
      disposeMap(map);
      layer.dispose();
    });

    it('loadstart and loadend events trigger normally', function (done) {
      map.once('loadstart', () => {
        map.once('loadend', () => {
          done();
        });
      });
      map.renderSync();
    });
  });

  describe('#updateStyleVariables()', function () {
    const targetContext = createCanvasContext2D(1, 1);

    function getCenterPixelImageData() {
      targetContext.clearRect(0, 0, 1, 1);
      const canvas = document.querySelector('.testlayer');
      targetContext.drawImage(canvas, 50, 50, 1, 1, 0, 0, 1, 1);
      return Array.from(targetContext.getImageData(0, 0, 1, 1).data);
    }

    let map, layer;
    beforeEach(function (done) {
      layer = new WebGLPointsLayer({
        className: 'testlayer',
        source: new VectorSource({
          features: [new Feature(new Point([0, 0]))],
        }),
        variables: {
          r: 0,
          g: 255,
          b: 0,
        },
        style: {
          'circle-radius': 14,
          'circle-fill-color': [
            'color',
            ['var', 'r'],
            ['var', 'g'],
            ['var', 'b'],
          ],
        },
      });
      map = new Map({
        pixelRatio: 1,
        target: createMapDiv(100, 100),
        layers: [layer],
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
      });
      map.once('rendercomplete', () => done());
    });
    afterEach(function () {
      disposeMap(map);
      layer.dispose();
    });

    it('allows changing variables', function (done) {
      expect(layer.styleVariables_['r']).to.be(0);
      expect(getCenterPixelImageData()).to.eql([0, 255, 0, 255]);
      layer.updateStyleVariables({
        r: 255,
        g: 0,
        b: 255,
      });
      expect(layer.styleVariables_['r']).to.be(255);

      map.on('rendercomplete', function (event) {
        expect(getCenterPixelImageData()).to.eql([255, 0, 255, 255]);
        done();
      });
    });
  });
});
