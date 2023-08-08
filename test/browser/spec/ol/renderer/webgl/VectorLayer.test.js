import Feature from '../../../../../../src/ol/Feature.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import Map from '../../../../../../src/ol/Map.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import VectorEventType from '../../../../../../src/ol/source/VectorEventType.js';
import VectorLayer from '../../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import VectorStyleRenderer, * as ol_render_webgl_vectorstylerenderer from '../../../../../../src/ol/render/webgl/VectorStyleRenderer.js';
import View from '../../../../../../src/ol/View.js';
import WebGLHelper from '../../../../../../src/ol/webgl/Helper.js';
import WebGLVectorLayerRenderer from '../../../../../../src/ol/renderer/webgl/VectorLayer.js';
import {
  Projection,
  get as getProjection,
} from '../../../../../../src/ol/proj.js';
import {create} from '../../../../../../src/ol/transform.js';
import {getUid} from '../../../../../../src/ol/util.js';

const SAMPLE_STYLE = {
  ['fill-color']: ['get', 'color'],
  ['stroke-width']: 2,
  symbol: {
    size: 3,
  },
};

const SAMPLE_STYLE2 = {
  symbol: {
    symbolType: 'square',
    color: 'red',
    size: ['array', 4, ['get', 'size']],
  },
};

const SAMPLE_VERTEX_SHADER = `
void main(void) {
  gl_Position = vec4(1.0);
}`;
const SAMPLE_FRAGMENT_SHADER = `
void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}`;

const SAMPLE_SHADERS = {
  fill: {
    fragment: SAMPLE_FRAGMENT_SHADER,
    vertex: SAMPLE_VERTEX_SHADER,
  },
  stroke: {
    fragment: SAMPLE_FRAGMENT_SHADER,
    vertex: SAMPLE_VERTEX_SHADER,
  },
  symbol: {
    fragment: SAMPLE_FRAGMENT_SHADER,
    vertex: SAMPLE_VERTEX_SHADER,
  },
  attributes: {
    attr1: {
      callback: () => 456,
    },
  },
  uniforms: {
    custom: () => 123,
  },
};

describe('ol/renderer/webgl/VectorLayer', function () {
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

  beforeEach(function () {
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
      style: [SAMPLE_STYLE, SAMPLE_SHADERS],
    });

    const proj = new Projection({
      code: 'custom',
      units: 'pixels',
      extent: [-128, -128, 128, 128],
    });
    frameState = {
      layerStatesArray: [vectorLayer.getLayerState()],
      layerIndex: 0,
      extent: [-31, 1, 31, 31],
      pixelRatio: 1,
      pixelToCoordinateTransform: create(),
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

  afterEach(function () {
    vectorLayer.dispose();
    renderer.dispose();
    map.dispose();
  });

  it('creates a new instance', function () {
    expect(renderer).to.be.a(WebGLVectorLayerRenderer);
  });

  it('do not create renderers initially', function () {
    expect(renderer.styleRenderers_).to.eql([]);
  });

  describe('#afterHelperCreated', () => {
    let spy;
    beforeEach(() => {
      spy = sinon.spy(ol_render_webgl_vectorstylerenderer, 'default');
      renderer.helper = new WebGLHelper();
      renderer.afterHelperCreated(frameState);
    });
    afterEach(() => {
      renderer.helper.dispose();
      spy.restore();
    });

    it('creates renderers', () => {
      expect(renderer.styleRenderers_.length).to.be(2);
      expect(renderer.styleRenderers_[0]).to.be.a(VectorStyleRenderer);
      expect(renderer.styleRenderers_[1]).to.be.a(VectorStyleRenderer);
    });
    it('passes the correct styles to renderers', () => {
      expect(spy.callCount).to.be(2);
      expect(spy.calledWith(SAMPLE_SHADERS)).to.be(true);
      expect(spy.calledWith(SAMPLE_STYLE)).to.be(true);
    });
  });

  describe('#reset', () => {
    beforeEach(() => {
      // first call prepareFrame to initialize the helper
      renderer.prepareFrame(frameState);
    });

    describe('use a single style', () => {
      let spy;
      beforeEach(() => {
        spy = sinon.spy(ol_render_webgl_vectorstylerenderer, 'default');
        renderer.reset({
          style: SAMPLE_STYLE2,
        });
      });
      afterEach(() => {
        spy.restore();
      });

      it('recreates renderers', () => {
        expect(renderer.styleRenderers_.length).to.be(1);
        expect(renderer.styleRenderers_[0]).to.be.a(VectorStyleRenderer);
      });
      it('passes the correct styles to renderers', () => {
        expect(spy.callCount).to.be(1);
        expect(spy.calledWith(SAMPLE_STYLE2)).to.be(true);
      });
    });
  });

  describe('source changes', () => {
    beforeEach(() => {
      sinon.spy(renderer.batch_, 'addFeature');
      sinon.spy(renderer.batch_, 'removeFeature');
      sinon.spy(renderer.batch_, 'changeFeature');
      sinon.spy(renderer.batch_, 'clear');
    });
    describe('initial state', () => {
      it('batch contains all features', () => {
        const polygonIds = Object.keys(renderer.batch_.polygonBatch.entries);
        const lineStringIds = Object.keys(
          renderer.batch_.lineStringBatch.entries
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
      sinon.spy(vectorSource, 'loadFeatures');
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
    beforeEach(async () => {
      // call once without tracking in order to initialize helper
      renderer.prepareFrame(frameState);
      renderer.renderFrame(frameState);
      // wait for buffer generation to complete
      await new Promise((resolve) => setTimeout(resolve, 150));

      sinon.spy(renderer.helper, 'setUniformFloatValue');
      sinon.spy(renderer.helper, 'setUniformFloatVec4');
      sinon.spy(renderer.helper, 'setUniformMatrixValue');
      sinon.spy(renderer.helper, 'prepareDraw');
      sinon.spy(renderer.helper, 'finalizeDraw');
      sinon.spy(renderer.styleRenderers_[0], 'render');
      sinon.spy(renderer.styleRenderers_[1], 'render');

      // this is required to keep a "snapshot" of the input matrix
      // (since the same object is reused for various calls)
      renderer.helper.setUniformMatrixValue = new Proxy(
        renderer.helper.setUniformMatrixValue,
        {
          apply(target, thisArg, [uniform, value]) {
            return target.call(thisArg, uniform, [...value]);
          },
        }
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
      expect(calls.length).to.be(6);
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
    it('calls render once for each renderer', () => {
      expect(renderer.styleRenderers_[0].render.callCount).to.be(1);
      expect(renderer.styleRenderers_[1].render.callCount).to.be(1);
    });
    it('calls helper.prepareDraw once', () => {
      expect(renderer.helper.prepareDraw.calledOnce).to.eql(true);
    });
    it('calls helper.finalizeDraw once', () => {
      expect(renderer.helper.finalizeDraw.calledOnce).to.be(true);
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
        renderer.styleRenderers_[0].render.resetHistory();
        renderer.styleRenderers_[1].render.resetHistory();
        renderer.renderFrame(frameState);
      });
      it('calls render three times for each renderer', () => {
        expect(renderer.styleRenderers_[0].render.callCount).to.be(3);
        expect(renderer.styleRenderers_[1].render.callCount).to.be(3);
      });
    });
  });

  describe('#dispose', () => {
    beforeEach(() => {
      sinon.spy(vectorSource, 'removeEventListener');
      renderer.dispose();
    });
    it('unlistens to source events', () => {
      expect(
        vectorSource.removeEventListener.calledWith(VectorEventType.ADDFEATURE)
      ).to.be(true);
      expect(
        vectorSource.removeEventListener.calledWith(
          VectorEventType.CHANGEFEATURE
        )
      ).to.be(true);
      expect(
        vectorSource.removeEventListener.calledWith(
          VectorEventType.REMOVEFEATURE
        )
      ).to.be(true);
      expect(
        vectorSource.removeEventListener.calledWith(VectorEventType.CLEAR)
      ).to.be(true);
    });
  });
});
