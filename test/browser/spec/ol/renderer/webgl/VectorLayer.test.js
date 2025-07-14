import {spy as sinonSpy} from 'sinon';
import Feature from '../../../../../../src/ol/Feature.js';
import Map from '../../../../../../src/ol/Map.js';
import View from '../../../../../../src/ol/View.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../../../src/ol/layer/Vector.js';
import Projection from '../../../../../../src/ol/proj/Projection.js';
import {get as getProjection} from '../../../../../../src/ol/proj.js';
import {ShaderBuilder} from '../../../../../../src/ol/render/webgl/ShaderBuilder.js';
import VectorStyleRenderer, * as ol_render_webgl_vectorstylerenderer from '../../../../../../src/ol/render/webgl/VectorStyleRenderer.js';
import WebGLVectorLayerRenderer from '../../../../../../src/ol/renderer/webgl/VectorLayer.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import VectorEventType from '../../../../../../src/ol/source/VectorEventType.js';
import {
  compose as composeTransform,
  create as createTransform,
} from '../../../../../../src/ol/transform.js';
import {getUid} from '../../../../../../src/ol/util.js';
import WebGLHelper from '../../../../../../src/ol/webgl/Helper.js';

const SAMPLE_STYLE = {
  'fill-color': ['get', 'color'],
  'stroke-width': 2,
  'circle-radius': 1.5,
};

const SAMPLE_RULES = [
  {
    style: {
      'circle-radius': 4,
      'fill-color': ['get', 'color'],
      'stroke-width': 2,
    },
  },
  {
    style: {
      'circle-radius': 3,
      'fill-color': ['get', 'color'],
      'stroke-width': 2,
    },
  },
];

const SAMPLE_SHADERS = {
  builder: new ShaderBuilder()
    .setFillColorExpression('vec4(1.0)')
    .setStrokeColorExpression('vec4(1.0)')
    .setSymbolColorExpression('vec4(1.0)'),
  attributes: {
    attr1: {
      callback: () => 456,
    },
  },
  uniforms: {
    custom: () => 123,
  },
};

describe('ol/renderer/webgl/VectorLayer', () => {
  /** @type {import("../../../../../../src/ol/renderer/webgl/VectorLayer.js").default} */
  let renderer;
  /** @type {VectorLayer} */
  let vectorLayer;
  /** @type {VectorSource} */
  let vectorSource;
  /** @type {import('../../../../../../src/ol/Map.js').FrameState} */
  let frameState;
  /** @type {Map} */
  let map;

  /** @type {Feature} */
  let feature1;
  /** @type {Feature} */
  let feature2;
  /** @type {Feature} */
  let feature3;

  beforeEach(() => {
    feature1 = new Feature({id: '01', geometry: new Point([1, 2])});
    feature2 = new Feature({
      id: '02',
      geometry: new Polygon([
        [
          [1, 2],
          [3, 4],
          [5, 6],
          [1, 2],
        ],
      ]),
    });
    feature3 = new Feature({
      id: '03',
      geometry: new LineString([
        [1, 2],
        [3, 4],
        [5, 6],
        [1, 2],
      ]),
    });
    vectorSource = new VectorSource({
      features: [feature1, feature2, feature3],
    });
    vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    renderer = new WebGLVectorLayerRenderer(vectorLayer, {
      style: SAMPLE_RULES,
    });

    const proj = new Projection({
      code: 'custom',
      units: 'pixels',
      extent: [-128, -128, 128, 128],
    });
    frameState = {
      layerStatesArray: [vectorLayer.getLayerState()],
      layerIndex: 0,
      extent: [-32, 0, 32, 32],
      pixelRatio: 1,
      coordinateToPixelTransform: createTransform(),
      pixelToCoordinateTransform: createTransform(),
      postRenderFunctions: [],
      time: Date.now(),
      viewHints: [],
      viewState: {
        center: [0, 16],
        resolution: 0.25,
        rotation: 0,
        projection: proj,
      },
      size: [200, 100],
      renderTargets: {},
    };

    map = new Map({
      view: new View(),
    });
    vectorLayer.set('map', map, true);
  });

  afterEach(() => {
    vectorLayer.dispose();
    renderer.dispose();
    map.dispose();
  });

  it('creates a new instance', () => {
    expect(renderer).to.be.a(WebGLVectorLayerRenderer);
  });

  it('do not create renderer initially', () => {
    expect(renderer.styleRenderer_).to.eql(null);
  });

  describe('#afterHelperCreated', () => {
    let spy;
    beforeEach(() => {
      spy = sinonSpy(ol_render_webgl_vectorstylerenderer, 'default');
      renderer.helper = new WebGLHelper();
      renderer.afterHelperCreated(frameState);
    });
    afterEach(() => {
      renderer.helper.dispose();
      spy.restore();
    });

    it('creates renderer', () => {
      expect(renderer.styleRenderer_).to.be.a(VectorStyleRenderer);
    });
    it('passes the correct styles to renderer', () => {
      expect(spy.calledWith(SAMPLE_RULES)).to.be(true);
    });
  });

  describe('style with filters', () => {
    let spy, styleWithFilters;
    beforeEach(() => {
      styleWithFilters = [
        {
          style: {
            'circle-radius': 4,
          },
          filter: ['==', ['get', 'category'], 'A'],
        },
        {
          style: {
            'stroke-width': 2,
          },
          else: true,
        },
      ];
      renderer = new WebGLVectorLayerRenderer(vectorLayer, {
        style: styleWithFilters,
      });
      spy = sinonSpy(ol_render_webgl_vectorstylerenderer, 'default');
      renderer.helper = new WebGLHelper();
      renderer.afterHelperCreated(frameState);
    });
    afterEach(() => {
      renderer.helper.dispose();
      spy.restore();
    });

    it('passes the filters along styles to renderer', () => {
      expect(
        spy.calledWith(styleWithFilters, undefined, renderer.helper, true),
      ).to.be(true);
    });
  });

  describe('#reset', () => {
    beforeEach(() => {
      // first call prepareFrame to initialize the helper
      renderer.prepareFrame(frameState);
    });

    describe('use shaders', () => {
      let spy;
      beforeEach(() => {
        spy = sinonSpy(ol_render_webgl_vectorstylerenderer, 'default');
        renderer.reset({
          style: SAMPLE_SHADERS,
        });
      });
      afterEach(() => {
        spy.restore();
      });

      it('recreates renderer', () => {
        expect(renderer.styleRenderer_).to.be.a(VectorStyleRenderer);
      });
      it('passes the correct styles to renderer', () => {
        expect(spy.calledWith(SAMPLE_SHADERS)).to.be(true);
      });
    });

    describe('use a single style', () => {
      let spy;
      beforeEach(() => {
        spy = sinonSpy(ol_render_webgl_vectorstylerenderer, 'default');
        renderer.reset({
          style: SAMPLE_STYLE,
        });
      });
      afterEach(() => {
        spy.restore();
      });

      it('recreates renderer', () => {
        expect(renderer.styleRenderer_).to.be.a(VectorStyleRenderer);
      });
      it('passes the correct styles to renderer', () => {
        expect(spy.calledWith(SAMPLE_STYLE)).to.be(true);
      });
    });
  });

  describe('source changes', () => {
    beforeEach(() => {
      // first call prepareFrame to load initial data
      renderer.prepareFrame(frameState);

      sinonSpy(renderer.batch_, 'addFeature');
      sinonSpy(renderer.batch_, 'removeFeature');
      sinonSpy(renderer.batch_, 'changeFeature');
      sinonSpy(renderer.batch_, 'clear');
    });
    describe('initial state', () => {
      it('batch contains all features', () => {
        const polygonIds = Object.keys(renderer.batch_.polygonBatch.entries);
        const lineStringIds = Object.keys(
          renderer.batch_.lineStringBatch.entries,
        );
        const pointIds = Object.keys(renderer.batch_.pointBatch.entries);
        expect(polygonIds).to.eql([getUid(feature2)]);
        expect(lineStringIds).to.eql([getUid(feature2), getUid(feature3)]);
        expect(pointIds).to.eql([getUid(feature1)]);
      });
    });
    describe('on feature added', () => {
      it('calls batch.addFeature', () => {
        const feature4 = new Feature({id: '04', geometry: new Point([1, 2])});
        vectorSource.addFeature(feature4);
        expect(renderer.batch_.addFeature.calledWith(feature4)).to.be(true);
      });
    });
    describe('on feature changed', () => {
      it('calls batch.changeFeature', () => {
        feature1.set('message', 'hello world');
        expect(renderer.batch_.changeFeature.calledWith(feature1)).to.be(true);
      });
    });
    describe('on feature deleted', () => {
      it('calls batch.removeFeature', () => {
        vectorSource.removeFeature(feature2);
        expect(renderer.batch_.removeFeature.calledWith(feature2)).to.be(true);
      });
    });
    describe('on source clear', () => {
      it('calls batch.clear', () => {
        vectorSource.clear();
        expect(renderer.batch_.clear.calledOnce).to.be(true);
      });
    });
  });

  describe('#prepareFrame', () => {
    let toRender;
    beforeEach(() => {
      sinonSpy(vectorSource, 'loadFeatures');
      toRender = renderer.prepareFrame(frameState);
    });
    it('requires rendering', () => {
      expect(toRender).to.eql(true);
    });
    it('loads the data', () => {
      expect(vectorSource.loadFeatures.calledOnce).to.eql(true);
    });
    describe('new frame without change', () => {
      beforeEach(() => {
        toRender = renderer.prepareFrame(frameState);
      });
      it('requires rendering', () => {
        expect(toRender).to.eql(true);
      });
      it('does not load the data again', () => {
        expect(vectorSource.loadFeatures.calledTwice).to.eql(false);
      });
    });
    describe('on source change', () => {
      beforeEach(() => {
        vectorSource.changed();
        toRender = renderer.prepareFrame(frameState);
      });
      it('requires rendering', () => {
        expect(toRender).to.eql(true);
      });
      it('loads the data again', () => {
        expect(vectorSource.loadFeatures.calledTwice).to.eql(true);
      });
    });
    describe('on view change', () => {
      beforeEach(() => {
        frameState.extent = [0, 10, 0, 10];
        toRender = renderer.prepareFrame(frameState);
      });
      it('requires rendering', () => {
        expect(toRender).to.eql(true);
      });
      it('loads the data again', () => {
        expect(vectorSource.loadFeatures.calledTwice).to.eql(true);
      });
    });
  });

  describe('#renderFrame', () => {
    const withHit = 2;

    beforeEach(async () => {
      // call once without tracking in order to initialize helper
      renderer.prepareFrame(frameState);
      renderer.renderFrame(frameState);
      // wait for buffer generation to complete
      await new Promise((resolve) => setTimeout(resolve, 150));

      sinonSpy(renderer.helper, 'setUniformFloatValue');
      sinonSpy(renderer.helper, 'setUniformFloatVec2');
      sinonSpy(renderer.helper, 'setUniformFloatVec4');
      sinonSpy(renderer.helper, 'setUniformMatrixValue');
      sinonSpy(renderer.helper, 'prepareDraw');
      sinonSpy(renderer.helper, 'finalizeDraw');
      sinonSpy(renderer.helper, 'deleteBuffer');
      sinonSpy(renderer.styleRenderer_, 'render');

      // this is required to keep a "snapshot" of the input matrix
      // (since the same object is reused for various calls)
      renderer.helper.setUniformMatrixValue = new Proxy(
        renderer.helper.setUniformMatrixValue,
        {
          apply(target, thisArg, [uniform, value]) {
            return target.call(thisArg, uniform, [...value]);
          },
        },
      );

      renderer.renderFrame({
        ...frameState,
        viewState: {
          ...frameState.viewState,
          // zoom out and move center
          resolution: 0.5,
          center: [16, 0],
        },
      });
    });
    it('sets PROJECTION matrix uniform once for each geometry type', () => {
      const calls = renderer.helper.setUniformMatrixValue
        .getCalls()
        .filter((c) => c.args[0] === 'u_projectionMatrix');
      expect(calls.length).to.be(6 * withHit);
      expect(calls[0].args).to.eql([
        'u_projectionMatrix',
        // 0.5   0     0     0      combination of:
        // 0     0.5   0     0        scale( 0.25 * 200px / 2 , 0.25 * 100px / 2 )  ->  multiply by initial resolution & viewport size
        // 0     0     1     0        translate( 0 , 16 )  ->  add initial view center
        // -0.32 0.64  0     1        translate( -16 , 0 )  ->  subtract current view center
        //                            scale( 2 / ( 0.5 * 200px ) , 2 / ( 0.5 * 100px ) )  ->  divide by current resolution & viewport size
        [0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 1, 0, -0.32, 0.64, 0, 1],
      ]);
    });
    it('sets SCREEN_TO_WORLD matrix uniform once for each geometry type', () => {
      const calls = renderer.helper.setUniformMatrixValue
        .getCalls()
        .filter((c) => c.args[0] === 'u_screenToWorldMatrix');
      expect(calls.length).to.be(6 * withHit);
      expect(calls[1].args).to.eql([
        'u_screenToWorldMatrix',
        // 2     0     0     0      invert of u_projectionMatrix
        // 0     2     0     0
        // 0     0     1     0
        // 0.64  -1.28 0     1
        [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0.64, -1.28, 0, 1],
      ]);
    });
    it('sets PATTERN_ORIGIN vec2 uniform once for each geometry type', () => {
      const calls = renderer.helper.setUniformFloatVec2
        .getCalls()
        .filter((c) => c.args[0] === 'u_patternOrigin');
      expect(calls.length).to.be(6 * withHit);
      expect(calls[1].args).to.eql([
        'u_patternOrigin',
        // combination of:
        //   [ 0, 16 ]  ->  initial view center
        //   scale( 2 / (0.25 * 200px), 2 / (0.25 * 100px) )  ->  divide by initial resolution & viewport size
        [0, -1.28],
      ]);
    });
    it('calls render once for each renderer', () => {
      expect(renderer.styleRenderer_.render.callCount).to.be(1 * withHit);
    });
    it('calls helper.prepareDraw once', () => {
      expect(renderer.helper.prepareDraw.calledOnce).to.eql(true);
    });
    it('calls helper.finalizeDraw once', () => {
      expect(renderer.helper.finalizeDraw.calledOnce).to.be(true);
    });
    it("does not delete any buffer if it's the first render", () => {
      expect(renderer.helper.deleteBuffer.calledOnce).to.be(false);
    });

    describe('with horizontal wrapping', () => {
      beforeEach(() => {
        vectorSource = new VectorSource({
          features: [],
          wrapX: true,
        });
        vectorLayer.setSource(vectorSource);
        frameState.viewState.projection = getProjection('EPSG:3857');
        // spanning 3 worlds
        frameState.extent = [
          -20037508.34 * 1.5,
          -10000,
          20037508.34 * 1.5,
          10000,
        ];
        renderer.styleRenderer_.render.resetHistory();
        renderer.renderFrame(frameState);
      });
      it('calls render three times for each renderer', () => {
        expect(renderer.styleRenderer_.render.callCount).to.be(3 * withHit);
      });
    });

    describe('regenerate frame buffers', () => {
      beforeEach(async () => {
        renderer.prepareFrame({
          ...frameState,
          extent: [0, 0, 10, 10],
        });
        await new Promise((resolve) => setTimeout(resolve, 150));
      });
      it('deletes previous buffers', () => {
        expect(renderer.helper.deleteBuffer.callCount).to.be(9); // 3 buffers (index, vertex, instance) * 3 types of geometry
      });
    });
  });

  describe('#forEachFeatureAtCoordinate', () => {
    let topLeftSquare;
    let centerPoint;
    let diagonalLine;

    function checkHit(x, y, expected, done) {
      const spy = sinonSpy();
      renderer.forEachFeatureAtCoordinate([x, y], frameState, 0, spy, []);
      const called = spy.callCount;
      const found = spy.getCall(0)?.args[0];
      if (expected) {
        if (!called) {
          done(new Error('no feature found, expected one'));
        }
        if (found && found !== expected) {
          done(
            new Error(
              `feature found id=${found.get(
                'id',
              )}, does not match expected id=${expected.get('id')}`,
            ),
          );
        }
      } else if (called) {
        done(new Error('found a feature, expected none'));
      }
    }

    beforeEach(() => {
      topLeftSquare = new Feature({
        id: 'topLeftSquare',
        geometry: new Polygon([
          [
            [-25, 21],
            [5, 21],
            [5, 41],
            [-25, 41],
            [-25, 21],
          ],
        ]),
      });
      diagonalLine = new Feature({
        id: 'diagonalLine',
        geometry: new LineString([
          [-25, 0],
          [25, 25],
        ]),
      });
      centerPoint = new Feature({
        id: 'centerPoint',
        geometry: new Point([0, 16]),
      });
      vectorSource.clear();
      vectorSource.addFeatures([topLeftSquare, diagonalLine, centerPoint]);
      vectorLayer = new VectorLayer({
        source: vectorSource,
      });
      renderer = new WebGLVectorLayerRenderer(vectorLayer, {
        style: [
          {
            'fill-color': 'red',
            'stroke-color': 'orange',
            'stroke-width': 5,
            'circle-radius': 40,
            'circle-fill-color': 'blue',
          },
        ],
      });
      const transform = composeTransform(
        createTransform(),
        100, // frameState.size[0] / 2,
        50, // frameState.size[1] / 2,
        4, // 1 / viewState.resolution,
        -4, // -1 / viewState.resolution,
        0, // -viewState.rotation,
        0, // -viewState.center[0],
        -16, // -viewState.center[1]
      );
      frameState = {
        ...frameState,
        coordinateToPixelTransform: transform,
      };
    });
    it('correctly hit detects features', (done) => {
      renderer.prepareFrame(frameState);
      // this will trigger when the rendering buffers are ready
      vectorLayer.once('change', () => {
        renderer.renderFrame(frameState);
        checkHit(0, 16, centerPoint, done);
        checkHit(-15, 25, topLeftSquare, done);
        checkHit(15, 20, diagonalLine, done);
        checkHit(-15, 5, diagonalLine, done);
        checkHit(20, 5, null, done);
        done();
      });
    });

    describe('with a filter set', () => {
      beforeEach(() => {
        renderer = new WebGLVectorLayerRenderer(vectorLayer, {
          style: [
            {
              filter: ['==', ['geometry-type'], 'Point'],
              style: {
                'circle-radius': 40,
                'circle-fill-color': 'blue',
              },
            },
          ],
        });
      });
      it('correctly hit detects only the feature not filtered out', (done) => {
        renderer.prepareFrame(frameState);
        // this will trigger when the rendering buffers are ready
        vectorLayer.once('change', () => {
          renderer.renderFrame(frameState);
          checkHit(0, 16, centerPoint, done);
          checkHit(-15, 25, null, done);
          checkHit(15, 20, null, done);
          checkHit(-15, 5, null, done);
          checkHit(20, 5, null, done);
          done();
        });
      });
    });
  });

  describe('#dispose', () => {
    let deleteBufferSpy;
    beforeEach(async () => {
      // first call prepareFrame to load initial data and register listeners
      renderer.prepareFrame(frameState);
      await new Promise((resolve) => setTimeout(resolve, 150));
      sinonSpy(vectorSource, 'removeEventListener');
      deleteBufferSpy = sinonSpy(renderer.helper, 'deleteBuffer');
      renderer.dispose();
    });
    it('unlistens to source events', () => {
      expect(
        vectorSource.removeEventListener.calledWith(VectorEventType.ADDFEATURE),
      ).to.be(true);
      expect(
        vectorSource.removeEventListener.calledWith(
          VectorEventType.CHANGEFEATURE,
        ),
      ).to.be(true);
      expect(
        vectorSource.removeEventListener.calledWith(
          VectorEventType.REMOVEFEATURE,
        ),
      ).to.be(true);
      expect(
        vectorSource.removeEventListener.calledWith(VectorEventType.CLEAR),
      ).to.be(true);
    });
    it('deletes webgl buffers', () => {
      expect(deleteBufferSpy.callCount).to.be(9); // 3 buffers (index, vertex, instance) * 3 types of geometry
    });
  });
});
