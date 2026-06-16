import {assert} from 'chai';
import {spy as sinonSpy, stub as sinonStub} from 'sinon';
import Feature from '../../../../../../src/ol/Feature.js';
import Map from '../../../../../../src/ol/Map.js';
import View from '../../../../../../src/ol/View.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../../../src/ol/layer/Vector.js';
import {get as getProjection} from '../../../../../../src/ol/proj.js';
import Projection from '../../../../../../src/ol/proj/Projection.js';
import {ShaderBuilder} from '../../../../../../src/ol/render/webgl/ShaderBuilder.js';
import VectorStyleRenderer, * as ol_render_webgl_vectorstylerenderer from '../../../../../../src/ol/render/webgl/VectorStyleRenderer.js';
import {createPostProcessDefinition} from '../../../../../../src/ol/render/webgl/textUtil.js';
import WebGLVectorLayerRenderer from '../../../../../../src/ol/renderer/webgl/VectorLayer.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import VectorEventType from '../../../../../../src/ol/source/VectorEventType.js';
import {
  compose as composeTransform,
  create as createTransform,
} from '../../../../../../src/ol/transform.js';
import {getUid} from '../../../../../../src/ol/util.js';
import WebGLHelper from '../../../../../../src/ol/webgl/Helper.js';
import {assertArrayLikeEqual} from '../../../../../util/equal.js';

// sinon can't spy on ES module exports, so the renderer module is mocked here
// to capture how the style renderer gets constructed.
vi.mock('../../../../../../src/ol/render/webgl/VectorStyleRenderer.js', {
  spy: true,
});

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
      'text-value': 'hello world',
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
    renderer.dispose();
    vectorLayer.dispose();
    map.dispose();
  });

  it('creates a new instance', () => {
    assert.instanceOf(renderer, WebGLVectorLayerRenderer);
  });

  it('do not create renderer initially', () => {
    assert.deepEqual(renderer.styleRenderer_, null);
  });

  it('does include the post processing step for text rendering', () => {
    const mockPostProcess = createPostProcessDefinition(
      () => null,
      () => null,
    );
    expect(renderer.postProcesses_.length).to.be(1);
    expect(renderer.postProcesses_[0].fragmentShader).to.eql(
      mockPostProcess.fragmentShader,
    );
    expect(renderer.postProcesses_[0].vertexShader).to.eql(
      mockPostProcess.vertexShader,
    );
  });

  describe('#afterHelperCreated', () => {
    let spy;
    beforeEach(() => {
      spy = ol_render_webgl_vectorstylerenderer.default;
      spy.mockClear();
      renderer.helper = new WebGLHelper();
      renderer.afterHelperCreated(frameState);
    });
    afterEach(() => {
      renderer.helper.dispose();
      spy.mockClear();
    });

    it('creates renderer', () => {
      assert.instanceOf(renderer.styleRenderer_, VectorStyleRenderer);
    });
    it('passes the correct styles to renderer', () => {
      assert.isTrue(spy.mock.calls.some((call) => call[0] === SAMPLE_RULES));
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
      spy = ol_render_webgl_vectorstylerenderer.default;
      spy.mockClear();
      renderer.helper = new WebGLHelper();
      renderer.afterHelperCreated(frameState);
    });
    afterEach(() => {
      renderer.helper.dispose();
      spy.mockClear();
    });

    it('passes the filters along styles to renderer', () => {
      assert.isTrue(
        spy.mock.calls.some(
          (call) =>
            call[0] === styleWithFilters &&
            call[1] === undefined &&
            call[2] === renderer.helper &&
            call[3] === true,
        ),
      );
    });
  });

  describe('#reset', () => {
    describe('use shaders', () => {
      let spy;
      beforeEach(() => {
        spy = ol_render_webgl_vectorstylerenderer.default;
        spy.mockClear();
        renderer.reset({
          style: SAMPLE_SHADERS,
        });
        renderer.prepareFrame(frameState);
      });
      afterEach(() => {
        spy.mockClear();
      });

      it('recreates renderer', () => {
        assert.instanceOf(renderer.styleRenderer_, VectorStyleRenderer);
      });
      it('passes the correct styles to renderer', () => {
        assert.isTrue(
          spy.mock.calls.some((call) => call[0] === SAMPLE_SHADERS),
        );
      });
      it('does not include the post processing step for text rendering', () => {
        expect(renderer.postProcesses_).to.eql([]);
      });
    });

    describe('use a single style', () => {
      let spy;
      beforeEach(() => {
        spy = ol_render_webgl_vectorstylerenderer.default;
        spy.mockClear();
        renderer.reset({
          style: SAMPLE_STYLE,
        });
        renderer.prepareFrame(frameState);
      });
      afterEach(() => {
        spy.mockClear();
      });

      it('recreates renderer', () => {
        assert.instanceOf(renderer.styleRenderer_, VectorStyleRenderer);
      });
      it('passes the correct styles to renderer', () => {
        assert.isTrue(spy.mock.calls.some((call) => call[0] === SAMPLE_STYLE));
      });
      it('does not include the post processing step for text rendering', () => {
        expect(renderer.postProcesses_).to.eql([]);
      });
    });
  });

  describe('style without text & with post processes', () => {
    const POST_PROCESS = {
      hello: 'world',
    };
    beforeEach(() => {
      renderer = new WebGLVectorLayerRenderer(vectorLayer, {
        style: [
          {
            style: {
              'circle-radius': 4,
            },
          },
        ],
        postProcesses: [POST_PROCESS],
      });

      // this will initialize the style renderer
      renderer.prepareFrame(frameState);
      renderer.renderFrame(frameState);

      sinonSpy(renderer.styleRenderer_, 'finalizeTextRender');
    });

    it('does not include the text post processing step', () => {
      expect(renderer.postProcesses_).to.eql([POST_PROCESS]);
    });

    describe('when a style with text is set later on', () => {
      beforeEach(() => {
        renderer.reset({
          style: SAMPLE_RULES,
        });
      });

      it('does include the post processing step for text rendering', () => {
        const mockPostProcess = createPostProcessDefinition(
          () => null,
          () => null,
        );
        expect(renderer.postProcesses_.length).to.be(2);
        expect(renderer.postProcesses_[0].fragmentShader).to.eql(
          mockPostProcess.fragmentShader,
        );
        expect(renderer.postProcesses_[0].vertexShader).to.eql(
          mockPostProcess.vertexShader,
        );
        expect(renderer.postProcesses_[1]).to.eql(POST_PROCESS);
      });
    });

    it('does not call styleRenderer.finalizeTextRender after renderFrame', () => {
      renderer.prepareFrame(frameState);
      renderer.renderFrame(frameState);
      expect(renderer.styleRenderer_.finalizeTextRender.called).to.be(false);
    });
  });

  describe('source changes', () => {
    beforeEach(() => {
      // first call prepareFrame to load initial data
      renderer.prepareFrame(frameState);

      vi.spyOn(renderer.batch_, 'addFeature');
      vi.spyOn(renderer.batch_, 'removeFeature');
      vi.spyOn(renderer.batch_, 'changeFeature');
      vi.spyOn(renderer.batch_, 'clear');
    });
    describe('initial state', () => {
      it('batch contains all features', () => {
        const polygonIds = Object.keys(renderer.batch_.polygonBatch.entries);
        const lineStringIds = Object.keys(
          renderer.batch_.lineStringBatch.entries,
        );
        const pointIds = Object.keys(renderer.batch_.pointBatch.entries);
        assert.deepEqual(polygonIds, [getUid(feature2)]);
        assert.deepEqual(lineStringIds, [getUid(feature2), getUid(feature3)]);
        assert.deepEqual(pointIds, [getUid(feature1)]);
      });
    });
    describe('on feature added', () => {
      it('calls batch.addFeature', () => {
        const feature4 = new Feature({id: '04', geometry: new Point([1, 2])});
        vectorSource.addFeature(feature4);
        assert.isTrue(
          renderer.batch_.addFeature.mock.calls.some(
            (call) => call[0] === feature4,
          ),
        );
      });
    });
    describe('on feature changed', () => {
      it('calls batch.changeFeature', () => {
        feature1.set('message', 'hello world');
        assert.isTrue(
          renderer.batch_.changeFeature.mock.calls.some(
            (call) => call[0] === feature1,
          ),
        );
      });
    });
    describe('on feature deleted', () => {
      it('calls batch.removeFeature', () => {
        vectorSource.removeFeature(feature2);
        assert.isTrue(
          renderer.batch_.removeFeature.mock.calls.some(
            (call) => call[0] === feature2,
          ),
        );
      });
    });
    describe('on source clear', () => {
      it('calls batch.clear', () => {
        vectorSource.clear();
        assert.strictEqual(renderer.batch_.clear.mock.calls.length, 1);
      });
    });
  });

  describe('#prepareFrame', () => {
    let toRender;
    beforeEach(() => {
      vi.spyOn(vectorSource, 'loadFeatures');
      toRender = renderer.prepareFrame(frameState);
    });
    it('requires rendering', () => {
      assert.deepEqual(toRender, true);
    });
    it('loads the data', () => {
      assert.strictEqual(vectorSource.loadFeatures.mock.calls.length, 1);
    });
    describe('new frame without change', () => {
      beforeEach(() => {
        sinonSpy(renderer.styleRenderer_, 'generateBuffers');
        toRender = renderer.prepareFrame(frameState);
      });
      it('requires rendering', () => {
        assert.deepEqual(toRender, true);
      });
      it('does not load the data again', () => {
        assert.strictEqual(vectorSource.loadFeatures.mock.calls.length, 1);
      });
      it('does not regenerate the buffers', () => {
        expect(renderer.styleRenderer_.generateBuffers.called).to.be(false);
      });
    });
    describe('on source change', () => {
      beforeEach(() => {
        vectorSource.changed();
        sinonSpy(renderer.styleRenderer_, 'generateBuffers');
        toRender = renderer.prepareFrame(frameState);
      });
      it('requires rendering', () => {
        assert.deepEqual(toRender, true);
      });
      it('loads the data again', () => {
        assert.strictEqual(vectorSource.loadFeatures.mock.calls.length, 2);
      });
      it('regenerates the buffers', () => {
        expect(renderer.styleRenderer_.generateBuffers.callCount).to.be(1);
        expect(
          renderer.styleRenderer_.generateBuffers.getCall(0).args[1],
        ).to.eql([0.04, 0, 0, 0.08, 0, -1.28]); // transform made from the current frame state
        expect(
          renderer.styleRenderer_.generateBuffers.getCall(0).args[2],
        ).to.eql(frameState.viewState.resolution);
      });
    });
    describe('on view change', () => {
      beforeEach(() => {
        frameState.extent = [0, 10, 0, 10];
        sinonSpy(renderer.styleRenderer_, 'generateBuffers');
        toRender = renderer.prepareFrame(frameState);
      });
      it('requires rendering', () => {
        assert.deepEqual(toRender, true);
      });
      it('loads the data again', () => {
        assert.strictEqual(vectorSource.loadFeatures.mock.calls.length, 2);
      });
      it('regenerates the buffers', () => {
        expect(renderer.styleRenderer_.generateBuffers.callCount).to.be(1);
      });
    });
  });

  describe('#renderFrame', () => {
    const withHit = 2;
    let newFrameState;
    let finalizeTextRenderStub;

    beforeEach(async () => {
      // call once without tracking in order to initialize helper
      renderer.prepareFrame(frameState);
      renderer.renderFrame(frameState);
      // wait for buffer generation to complete
      await new Promise((resolve) => setTimeout(resolve, 150));

      vi.spyOn(renderer.helper, 'setUniformFloatValue');
      vi.spyOn(renderer.helper, 'setUniformFloatVec2');
      vi.spyOn(renderer.helper, 'setUniformFloatVec4');
      vi.spyOn(renderer.helper, 'setUniformMatrixValue');
      vi.spyOn(renderer.helper, 'prepareDraw');
      vi.spyOn(renderer.helper, 'finalizeDraw');
      vi.spyOn(renderer.helper, 'deleteBuffer');
      vi.spyOn(renderer.styleRenderer_, 'render');
      finalizeTextRenderStub = sinonStub(
        renderer.styleRenderer_,
        'finalizeTextRender',
      ).returns(Promise.resolve());

      // this is required to keep a "snapshot" of the input vec2
      // (since the same object is reused for various calls)
      renderer.helper.setUniformFloatVec2 = new Proxy(
        renderer.helper.setUniformFloatVec2,
        {
          apply(target, thisArg, [uniform, value]) {
            return target.call(thisArg, uniform, [...value]);
          },
        },
      );

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
      newFrameState = {
        ...frameState,
        viewState: {
          ...frameState.viewState,
          // zoom out and move center
          resolution: 0.5,
          center: [16, 0],
        },
      };
      renderer.renderFrame(newFrameState);
    });
    it('sets PROJECTION matrix uniform once for each geometry type', () => {
      const calls = renderer.helper.setUniformMatrixValue.mock.calls.filter(
        (c) => c[0] === 'u_projectionMatrix',
      );
      assert.strictEqual(calls.length, 6 * withHit);
      assertArrayLikeEqual(calls[0], [
        'u_projectionMatrix',
        // 0.5   0     0     0      combination of:
        // 0     0.5   0     0        scale( 0.25 * 200px / 2 , 0.25 * 100px / 2 )  ->  multiply by initial resolution & viewport size
        // 0     0     1     0        translate( 0 , 16 )  ->  add initial view center
        // -0.32 0.64  0     1        translate( -16 , 0 )  ->  subtract current view center
        //                            scale( 2 / ( 0.5 * 200px ) , 2 / ( 0.5 * 100px ) )  ->  divide by current resolution & viewport size
        [0.5, 0, 0, 0, 0, 0.5, 0, 0, 0, 0, 1, 0, -0.32, 0.64, 0, 1],
      ]);
    });
    it('sets INVERT_PROJECTION_MATRIX matrix uniform once for each geometry type', () => {
      const calls = renderer.helper.setUniformMatrixValue.mock.calls.filter(
        (c) => c[0] === 'u_invertProjectionMatrix',
      );
      assert.strictEqual(calls.length, 6 * withHit);
      assertArrayLikeEqual(calls[1], [
        'u_invertProjectionMatrix',
        // 2     0     0     0      invert of u_projectionMatrix
        // 0     2     0     0
        // 0     0     1     0
        // 0.64  -1.28 0     1
        [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0.64, -1.28, 0, 1],
      ]);
    });
    it('sets PATTERN_ORIGIN_X_DOUBLE vec2 uniform once for each geometry type', () => {
      const calls = renderer.helper.setUniformFloatVec2.mock.calls.filter(
        (c) => c[0] === 'u_df_patternOriginX',
      );
      assert.strictEqual(calls.length, 6 * withHit);
      assertArrayLikeEqual(calls[1], [
        'u_df_patternOriginX',
        // combination of:
        //   0          -> pattern origin X in world coordinates
        //   - 16       -> center X coordinate
        //   / 0.5      -> divide by resolution
        //   + 100px    -> add half viewport size
        //              -> split in high part/low part for double-float precision
        [68, 0],
      ]);
    });
    it('sets PATTERN_ORIGIN_Y_DOUBLE vec2 uniform once for each geometry type', () => {
      const calls = renderer.helper.setUniformFloatVec2.mock.calls.filter(
        (c) => c[0] === 'u_df_patternOriginY',
      );
      assert.strictEqual(calls.length, 6 * withHit);
      assertArrayLikeEqual(calls[1], [
        'u_df_patternOriginY',
        // combination of:
        //   0          -> pattern origin Y in world coordinates
        //   - 0        -> center Y coordinate
        //   / 0.5      -> divide by resolution
        //   + 50px    -> add half viewport size
        //              -> split in high part/low part for double-float precision
        [50, 0],
      ]);
    });
    it('calls render once for each renderer', () => {
      assert.strictEqual(
        renderer.styleRenderer_.render.mock.calls.length,
        1 * withHit,
      );
    });
    it('calls helper.prepareDraw once', () => {
      assert.strictEqual(renderer.helper.prepareDraw.mock.calls.length, 1);
    });
    it('calls helper.finalizeDraw once', () => {
      assert.strictEqual(renderer.helper.finalizeDraw.mock.calls.length, 1);
    });
    it('calls styleRenderer.finalizeTextRender once', () => {
      expect(renderer.styleRenderer_.finalizeTextRender.calledOnce).to.be(true);
    });
    it("does not delete any buffer if it's the first render", () => {
      assert.strictEqual(renderer.helper.deleteBuffer.mock.calls.length, 0);
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
        renderer.styleRenderer_.render.mockClear();
        renderer.renderFrame(frameState);
      });
      it('calls render three times for each renderer', () => {
        assert.strictEqual(
          renderer.styleRenderer_.render.mock.calls.length,
          3 * withHit,
        );
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
        assert.strictEqual(renderer.helper.deleteBuffer.mock.calls.length, 9);
      });
    });

    describe('text overlay rerender', () => {
      let finalizeTextRenderResolver;

      beforeEach(() => {
        finalizeTextRenderStub.returns(
          new Promise((resolve) => {
            finalizeTextRenderResolver = resolve;
          }),
        );
        sinonSpy(vectorLayer, 'changed');
      });

      it('calls layer.changed() after the text overlay is ready to be rendered', async () => {
        renderer.renderFrame(newFrameState);
        finalizeTextRenderResolver();
        await new Promise((resolve) => setTimeout(resolve)); // awaiting next tick
        expect(vectorLayer.changed.callCount).to.be(1);

        // asking for an identical render: layer.changed() should not be called again
        renderer.renderFrame(newFrameState);
        finalizeTextRenderResolver();
        await new Promise((resolve) => setTimeout(resolve));
        expect(vectorLayer.changed.callCount).to.be(1);

        // different extent: layer.changed should be called once more
        renderer.renderFrame(frameState);
        finalizeTextRenderResolver();
        await new Promise((resolve) => setTimeout(resolve));
        expect(vectorLayer.changed.callCount).to.be(2);

        // source updated extent: layer.changed should be called once more
        vectorSource.changed();
        renderer.renderFrame(frameState);
        finalizeTextRenderResolver();
        await new Promise((resolve) => setTimeout(resolve));
        expect(vectorLayer.changed.callCount).to.be(3);
      });

      it('does not call layer.changed() if the renderer was disposed in the meantime', () => {
        renderer.renderFrame(frameState);
        renderer.dispose();
        finalizeTextRenderResolver();
        assert.strictEqual(vectorLayer.changed.callCount, 0);
      });
    });
  });

  describe('#forEachFeatureAtCoordinate', () => {
    let topLeftSquare;
    let centerPoint;
    let diagonalLine;

    function checkHit(x, y, expected, reject) {
      const spy = vi.fn();
      renderer.forEachFeatureAtCoordinate([x, y], frameState, 0, spy, []);
      const called = spy.mock.calls.length;
      const found = spy.mock.calls[0]?.[0];
      if (expected) {
        if (!called) {
          reject(new Error('no feature found, expected one'));
        }
        if (found && found !== expected) {
          reject(
            new Error(
              `feature found id=${found.get(
                'id',
              )}, does not match expected id=${expected.get('id')}`,
            ),
          );
        }
      } else if (called) {
        reject(new Error('found a feature, expected none'));
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
    it('correctly hit detects features', () =>
      new Promise((resolve, reject) => {
        renderer.prepareFrame(frameState);
        // this will trigger when the rendering buffers are ready
        vectorLayer.once('change', () => {
          renderer.renderFrame(frameState);
          checkHit(0, 16, centerPoint, reject);
          checkHit(-15, 25, topLeftSquare, reject);
          checkHit(15, 20, diagonalLine, reject);
          checkHit(-15, 5, diagonalLine, reject);
          checkHit(20, 5, null, reject);
          resolve();
        });
      }));

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
      it('correctly hit detects only the feature not filtered out', () =>
        new Promise((resolve, reject) => {
          renderer.prepareFrame(frameState);
          // this will trigger when the rendering buffers are ready
          vectorLayer.once('change', () => {
            renderer.renderFrame(frameState);
            checkHit(0, 16, centerPoint, reject);
            checkHit(-15, 25, null, reject);
            checkHit(15, 20, null, reject);
            checkHit(-15, 5, null, reject);
            checkHit(20, 5, null, reject);
            resolve();
          });
        }));
    });
  });

  describe('#dispose', () => {
    let deleteBufferSpy;
    beforeEach(async () => {
      // first call prepareFrame to load initial data and register listeners
      renderer.prepareFrame(frameState);
      await new Promise((resolve) => setTimeout(resolve, 150));
      vi.spyOn(vectorSource, 'removeEventListener');
      deleteBufferSpy = vi.spyOn(renderer.helper, 'deleteBuffer');
      sinonSpy(renderer.styleRenderer_, 'dispose');
      sinonSpy(renderer.styleRenderer_, 'disposeTextInstructions');
      renderer.dispose();
    });
    it('unlistens to source events', () => {
      const eventTypes = vectorSource.removeEventListener.mock.calls.map(
        (c) => c[0],
      );
      assert.strictEqual(eventTypes.includes(VectorEventType.ADDFEATURE), true);
      assert.strictEqual(
        eventTypes.includes(VectorEventType.CHANGEFEATURE),
        true,
      );
      assert.strictEqual(
        eventTypes.includes(VectorEventType.REMOVEFEATURE),
        true,
      );
      assert.strictEqual(eventTypes.includes(VectorEventType.CLEAR), true);
    });
    it('deletes webgl buffers', () => {
      assert.strictEqual(deleteBufferSpy.mock.calls.length, 9);
    });
    it('disposes of the style renderer', () => {
      expect(renderer.styleRenderer_.dispose.calledOnce).to.be(true);
    });
    it('disposes of the text rendering instructions', () => {
      expect(renderer.styleRenderer_.disposeTextInstructions.calledOnce).to.be(
        true,
      );
    });
  });
});
