import Feature from '../../../../../../src/ol/Feature.js';
import GeoJSON from '../../../../../../src/ol/format/GeoJSON.js';
import Map from '../../../../../../src/ol/Map.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import View from '../../../../../../src/ol/View.js';
import ViewHint from '../../../../../../src/ol/ViewHint.js';
import WebGLPointsLayer from '../../../../../../src/ol/layer/WebGLPoints.js';
import WebGLPointsLayerRenderer from '../../../../../../src/ol/renderer/webgl/PointsLayer.js';
import {WebGLWorkerMessageType} from '../../../../../../src/ol/render/webgl/constants.js';
import {
  compose as composeTransform,
  create as createTransform,
} from '../../../../../../src/ol/transform.js';
import {createCanvasContext2D} from '../../../../../../src/ol/dom.js';
import {get as getProjection} from '../../../../../../src/ol/proj.js';
import {getUid} from '../../../../../../src/ol/util.js';
import {unByKey} from '../../../../../../src/ol/Observable.js';

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

const simpleVertexShader = `
  precision mediump float;
  uniform mat4 u_projectionMatrix;
  uniform mat4 u_offsetScaleMatrix;
  attribute vec2 a_position;
  attribute float a_index;

  void main(void) {
    mat4 offsetMatrix = u_offsetScaleMatrix;
    float offsetX = a_index == 0.0 || a_index == 3.0 ? -2.0 : 2.0;
    float offsetY = a_index == 0.0 || a_index == 1.0 ? -2.0 : 2.0;
    vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
    gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
  }`;
const simpleFragmentShader = `
  precision mediump float;

  void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }`;

// these shaders support hit detection
// they have a built-in size value of 4
const hitVertexShader = `
  precision mediump float;
  uniform mat4 u_projectionMatrix;
  uniform mat4 u_offsetScaleMatrix;
  attribute vec2 a_position;
  attribute float a_index;
  attribute vec4 a_hitColor;
  varying vec4 v_hitColor;

  void main(void) {
    mat4 offsetMatrix = u_offsetScaleMatrix;
    float offsetX = a_index == 0.0 || a_index == 3.0 ? -2.0 : 2.0;
    float offsetY = a_index == 0.0 || a_index == 1.0 ? -2.0 : 2.0;
    vec4 offsets = offsetMatrix * vec4(offsetX, offsetY, 0.0, 0.0);
    gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
    v_hitColor = a_hitColor;
  }`;
const hitFragmentShader = `
  precision mediump float;
  varying vec4 v_hitColor;

  void main(void) {
    gl_FragColor = v_hitColor;
  }`;

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
      document.body.removeChild(target);
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
        hitVertexShader: hitVertexShader,
        hitFragmentShader: hitFragmentShader,
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

      const spy = sinon.spy(renderer.helper, 'prepareDraw');
      renderer.prepareFrame(frameState);
      expect(spy.called).to.be(true);
    });

    it('fills up a buffer with 2 triangles per point', function (done) {
      layer.getSource().addFeature(
        new Feature({
          geometry: new Point([10, 20]),
        })
      );
      layer.getSource().addFeature(
        new Feature({
          geometry: new Point([30, 40]),
        })
      );
      renderer.prepareFrame(frameState);

      const attributePerVertex = 3;

      renderer.worker_.addEventListener('message', function (event) {
        if (event.data.type !== WebGLWorkerMessageType.GENERATE_POINT_BUFFERS) {
          return;
        }
        expect(renderer.verticesBuffer_.getArray().length).to.eql(
          2 * 4 * attributePerVertex
        );
        expect(renderer.indicesBuffer_.getArray().length).to.eql(2 * 6);

        expect(renderer.verticesBuffer_.getArray()[0]).to.eql(10);
        expect(renderer.verticesBuffer_.getArray()[1]).to.eql(20);
        expect(
          renderer.verticesBuffer_.getArray()[4 * attributePerVertex + 0]
        ).to.eql(30);
        expect(
          renderer.verticesBuffer_.getArray()[4 * attributePerVertex + 1]
        ).to.eql(40);
        done();
      });
    });

    it('fills up the hit render buffer with 2 triangles per point', function (done) {
      layer.getSource().addFeature(
        new Feature({
          geometry: new Point([10, 20]),
        })
      );
      layer.getSource().addFeature(
        new Feature({
          geometry: new Point([30, 40]),
        })
      );
      renderer.prepareFrame(frameState);

      const attributePerVertex = 8;

      renderer.worker_.addEventListener('message', function (event) {
        if (event.data.type !== WebGLWorkerMessageType.GENERATE_POINT_BUFFERS) {
          return;
        }
        if (!renderer.hitVerticesBuffer_.getArray()) {
          return;
        }
        expect(renderer.hitVerticesBuffer_.getArray().length).to.eql(
          2 * 4 * attributePerVertex
        );
        expect(renderer.indicesBuffer_.getArray().length).to.eql(2 * 6);

        expect(renderer.hitVerticesBuffer_.getArray()[0]).to.eql(10);
        expect(renderer.hitVerticesBuffer_.getArray()[1]).to.eql(20);
        expect(
          renderer.hitVerticesBuffer_.getArray()[4 * attributePerVertex + 0]
        ).to.eql(30);
        expect(
          renderer.hitVerticesBuffer_.getArray()[4 * attributePerVertex + 1]
        ).to.eql(40);
        done();
      });
    });

    it('clears the buffers when the features are gone', function (done) {
      const source = layer.getSource();
      source.addFeature(
        new Feature({
          geometry: new Point([10, 20]),
        })
      );
      source.removeFeature(source.getFeatures()[0]);
      source.addFeature(
        new Feature({
          geometry: new Point([10, 20]),
        })
      );
      renderer.prepareFrame(frameState);

      renderer.worker_.addEventListener('message', function (event) {
        if (event.data.type !== WebGLWorkerMessageType.GENERATE_POINT_BUFFERS) {
          return;
        }
        const attributePerVertex = 3;
        expect(renderer.verticesBuffer_.getArray().length).to.eql(
          4 * attributePerVertex
        );
        expect(renderer.indicesBuffer_.getArray().length).to.eql(6);
        done();
      });
    });

    it('rebuilds the buffers only when not interacting or animating', function () {
      const spy = sinon.spy(renderer, 'rebuildBuffers_');

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
      const spy = sinon.spy(renderer, 'rebuildBuffers_');

      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(1);

      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(1);

      frameState.extent = [10, 20, 30, 40];
      renderer.prepareFrame(frameState);
      expect(spy.callCount).to.be(2);
    });

    it('triggers source loading when the extent changes', function () {
      const spy = sinon.spy(layer.getSource(), 'loadFeatures');

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
      const spy = sinon.spy(layer.getSource(), 'loadFeatures');

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
        hitVertexShader: hitVertexShader,
        hitFragmentShader: hitFragmentShader,
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
        0
      );
      const frameState = Object.assign({}, baseFrameState, {
        extent: [-20, -20, 20, 20],
        size: [40, 40],
        coordinateToPixelTransform: transform,
        layerStatesArray: [layer.getLayerState()],
      });

      renderer.prepareFrame(frameState);
      renderer.worker_.addEventListener('message', function () {
        if (!renderer.hitRenderInstructions_) {
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
            null
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
        0
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
        if (!renderer.hitRenderInstructions_) {
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

      const spyHelper = sinon.spy(renderer.helper, 'disposeInternal');
      const spyWorker = sinon.spy(renderer.worker_, 'terminate');
      renderer.dispose();
      expect(spyHelper.called).to.be(true);
      expect(spyWorker.called).to.be(true);
    });
  });

  describe('featureCache_', function () {
    let source, layer, features;

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
      expect(getCache(features[0], renderer).geometry).to.be(
        features[0].getGeometry()
      );
      expect(getCache(features[0], renderer).properties['test']).to.be(
        features[0].get('test')
      );
      expect(getCache(features[1], renderer).feature).to.be(features[1]);
      expect(getCache(features[1], renderer).geometry).to.be(
        features[1].getGeometry()
      );
      expect(getCache(features[1], renderer).properties['test']).to.be(
        features[1].get('test')
      );
      expect(getCache(features[2], renderer).feature).to.be(features[2]);
      expect(getCache(features[2], renderer).geometry).to.be(
        features[2].getGeometry()
      );
      expect(getCache(features[2], renderer).properties['test']).to.be(
        features[2].get('test')
      );
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
      expect(getCache(features[0], renderer).geometry).to.be(
        features[0].getGeometry()
      );
      expect(getCache(features[0], renderer).properties['test']).to.be(
        features[0].get('test')
      );
      expect(getCache(features[1], renderer).feature).to.be(features[1]);
      expect(getCache(features[1], renderer).geometry).to.be(
        features[1].getGeometry()
      );
      expect(getCache(features[1], renderer).properties['test']).to.be(
        features[1].get('test')
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
      expect(getCache(features[0], renderer).geometry).to.be(
        features[0].getGeometry()
      );
      expect(getCache(features[0], renderer).properties['test']).to.be(
        features[0].get('test')
      );
      expect(getCache(features[2], renderer).feature).to.be(features[2]);
      expect(getCache(features[2], renderer).geometry).to.be(
        features[2].getGeometry()
      );
      expect(getCache(features[2], renderer).properties['test']).to.be(
        features[2].get('test')
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
      expect(getCache(features[0], renderer).geometry.getCoordinates()).to.eql([
        10, 20,
      ]);
      expect(getCache(features[0], renderer).properties['test']).to.be(
        features[0].get('test')
      );
      expect(getCache(features[0], renderer).properties['added']).to.be(
        features[0].get('added')
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
          symbol: {
            symbolType: 'square',
          },
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
          symbol: {
            symbolType: 'circle',
            size: 14,
            color: 'red',
          },
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
            Array.from(targetContext.getImageData(0, 0, 1, 1).data)
          ).to.eql([255, 0, 0, 255]);
          done();
        });
      });
    });
    it('is not ready until after second rebuildBuffers_ worker calls completed', function (done) {
      map.renderSync();
      map.getView().setCenter([10, 10]);
      map.renderSync();
      let changed = 0;
      const key = layer.on('change', function () {
        try {
          expect(layer.getRenderer().ready).to.be(++changed > 2);
          if (changed === 4) {
            unByKey(key);
            done();
          }
        } catch (e) {
          done(e);
        }
      });
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
        style: {
          variables: {
            r: 0,
            g: 255,
            b: 0,
          },
          symbol: {
            symbolType: 'circle',
            size: 14,
            color: ['color', ['var', 'r'], ['var', 'g'], ['var', 'b']],
          },
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
