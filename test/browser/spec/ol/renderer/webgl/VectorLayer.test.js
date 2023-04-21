import Feature from '../../../../../../src/ol/Feature.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import LineStringBatchRenderer from '../../../../../../src/ol/render/webgl/LineStringBatchRenderer.js';
import Map from '../../../../../../src/ol/Map.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import PointBatchRenderer from '../../../../../../src/ol/render/webgl/PointBatchRenderer.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import PolygonBatchRenderer from '../../../../../../src/ol/render/webgl/PolygonBatchRenderer.js';
import VectorEventType from '../../../../../../src/ol/source/VectorEventType.js';
import VectorLayer from '../../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import View from '../../../../../../src/ol/View.js';
import WebGLHelper from '../../../../../../src/ol/webgl/Helper.js';
import WebGLVectorLayerRenderer from '../../../../../../src/ol/renderer/webgl/VectorLayer.js';
import {
  Projection,
  get as getProjection,
} from '../../../../../../src/ol/proj.js';
import {create} from '../../../../../../src/ol/transform.js';
import {getUid} from '../../../../../../src/ol/util.js';
import {packColor} from '../../../../../../src/ol/webgl/styleparser.js';

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
      uniforms: {
        u_returnOne: () => 1,
      },
      attributes: [
        {
          name: 'myAttr',
          size: 1,
          callback: () => 10,
        },
      ],
      point: {
        color: () => packColor('green'),
      },
      fill: {
        color: () => packColor('blue'),
      },
      stroke: {
        color: () => packColor('red'),
        width: () => 2.5,
      },
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
    expect(renderer.polygonRenderer_).to.be(null);
    expect(renderer.pointRenderer_).to.be(null);
    expect(renderer.lineStringRenderer_).to.be(null);
  });

  describe('#afterHelperCreated', () => {
    beforeEach(() => {
      renderer.helper = new WebGLHelper();
      renderer.afterHelperCreated(frameState);
    });

    it('creates renderers', () => {
      expect(renderer.polygonRenderer_).to.be.a(PolygonBatchRenderer);
      expect(renderer.pointRenderer_).to.be.a(PointBatchRenderer);
      expect(renderer.lineStringRenderer_).to.be.a(LineStringBatchRenderer);
    });
    it('passes custom attributes to renderers', () => {
      expect(renderer.polygonRenderer_.attributes[2]).to.eql({
        name: 'a_myAttr',
        size: 1,
        type: 5126,
      });
      expect(renderer.pointRenderer_.attributes[3]).to.eql({
        name: 'a_myAttr',
        size: 1,
        type: 5126,
      });
      expect(renderer.lineStringRenderer_.attributes[5]).to.eql({
        name: 'a_myAttr',
        size: 1,
        type: 5126,
      });
    });
  });

  describe('#reset', () => {
    beforeEach(() => {
      // first call prepareFrame to initialize the helper
      renderer.prepareFrame(frameState);
    });

    describe('changing uniforms and attributes', () => {
      const changedUniforms = {u_returnTwo: () => 2};
      beforeEach(() => {
        sinon.spy(renderer.helper, 'setUniforms');

        renderer.reset({
          uniforms: changedUniforms,
          attributes: [
            {
              name: 'otherAttr',
              size: 2,
              callback: () => [100, 200],
            },
          ],
          point: {},
          fill: {},
          stroke: {
            color: () => packColor('red'),
          },
        });
      });
      it('recreates renderers with the default attributes as well as the custom ones', () => {
        const polygonAttrs = renderer.polygonRenderer_.attributes.map(
          (a) => a.name
        );
        const pointAttrs = renderer.pointRenderer_.attributes.map(
          (a) => a.name
        );
        const lineStringAttrs = renderer.lineStringRenderer_.attributes.map(
          (a) => a.name
        );
        expect(polygonAttrs).to.eql(['a_position', 'a_color', 'a_otherAttr']);
        expect(pointAttrs).to.eql([
          'a_position',
          'a_index',
          'a_color',
          'a_otherAttr',
        ]);
        expect(lineStringAttrs).to.eql([
          'a_segmentStart',
          'a_segmentEnd',
          'a_parameters',
          'a_color',
          'a_width',
          'a_otherAttr',
        ]);
        expect(renderer.polygonRenderer_.attributes[2]).to.eql({
          name: 'a_otherAttr',
          size: 2,
          type: 5126,
        });
      });
      it('calls setUniforms on the helper with the new uniforms', () => {
        expect(renderer.helper.setUniforms.calledWith(changedUniforms)).to.be(
          true
        );
      });
    });

    describe('provide custom shaders instead of default ones', () => {
      beforeEach(() => {
        sinon.spy(renderer.helper, 'setUniforms');

        renderer.reset({
          attributes: [
            {
              name: 'otherAttr',
              size: 2,
              callback: () => [100, 200],
            },
            {
              name: 'otherAttr2',
              size: 4,
              callback: () => [1, 2, 3, 4],
            },
          ],
          point: {
            vertexShader: 'void main(void) {}',
            fragmentShader: 'void main(void) {}',
          },
          fill: {
            vertexShader: 'void main(void) {}',
            fragmentShader: 'void main(void) {}',
          },
          stroke: {
            vertexShader: 'void main(void) {}',
            fragmentShader: 'void main(void) {}',
          },
        });
      });
      it('recreates renderers with the only provided attributes', () => {
        const polygonAttrs = renderer.polygonRenderer_.attributes.map(
          (a) => a.name
        );
        const pointAttrs = renderer.pointRenderer_.attributes.map(
          (a) => a.name
        );
        const lineStringAttrs = renderer.lineStringRenderer_.attributes.map(
          (a) => a.name
        );
        expect(polygonAttrs).to.eql([
          'a_position',
          'a_otherAttr',
          'a_otherAttr2',
        ]);
        expect(pointAttrs).to.eql([
          'a_position',
          'a_index',
          'a_otherAttr',
          'a_otherAttr2',
        ]);
        expect(lineStringAttrs).to.eql([
          'a_segmentStart',
          'a_segmentEnd',
          'a_parameters',
          'a_otherAttr',
          'a_otherAttr2',
        ]);
        expect(renderer.polygonRenderer_.attributes[1]).to.eql({
          name: 'a_otherAttr',
          size: 2,
          type: 5126,
        });
        expect(renderer.polygonRenderer_.attributes[2]).to.eql({
          name: 'a_otherAttr2',
          size: 4,
          type: 5126,
        });
      });
    });
  });

  describe('#renderFrame', () => {
    beforeEach(async () => {});
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
    beforeEach(() => {
      // call once without tracking in order to initialize helper
      renderer.prepareFrame(frameState);
      renderer.renderFrame(frameState);

      sinon.spy(renderer.helper, 'setUniformFloatValue');
      sinon.spy(renderer.helper, 'setUniformFloatVec4');
      sinon.spy(renderer.helper, 'setUniformMatrixValue');
      sinon.spy(renderer.helper, 'prepareDraw');
      sinon.spy(renderer.helper, 'finalizeDraw');
      sinon.spy(renderer.pointRenderer_, 'preRender');
      sinon.spy(renderer.pointRenderer_, 'render');
      sinon.spy(renderer.lineStringRenderer_, 'preRender');
      sinon.spy(renderer.lineStringRenderer_, 'render');
      sinon.spy(renderer.polygonRenderer_, 'preRender');
      sinon.spy(renderer.polygonRenderer_, 'render');

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

      renderer.renderFrame(frameState);
    });
    it('sets PROJECTION matrix uniform once for each geometry type', () => {
      const calls = renderer.helper.setUniformMatrixValue
        .getCalls()
        .filter((c) => c.args[0] === 'u_projectionMatrix');
      expect(calls.length).to.be(3);
      expect(calls[0].args).to.eql([
        'u_projectionMatrix',
        // 0.04   0     0     0      combination of:
        // 0      0.08  0     0        translate( 0 , -16 )  ->  subtract view center
        // 0      0     1     0        scale( 2 / ( 0.25 * 200px ) , 2 / ( 0.25 * 100px ) )  ->  divide by resolution and viewport size
        // 0     -1.28  0     1
        [0.04, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 1, 0, 0, -1.28, 0, 1],
      ]);
    });
    it('calls preRender and render once for each renderer', () => {
      expect(renderer.pointRenderer_.preRender.callCount).to.be(1);
      expect(renderer.pointRenderer_.render.callCount).to.be(1);
      expect(renderer.lineStringRenderer_.preRender.callCount).to.be(1);
      expect(renderer.lineStringRenderer_.render.callCount).to.be(1);
      expect(renderer.polygonRenderer_.preRender.callCount).to.be(1);
      expect(renderer.polygonRenderer_.render.callCount).to.be(1);
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
        renderer.pointRenderer_.preRender.resetHistory();
        renderer.pointRenderer_.render.resetHistory();
        renderer.lineStringRenderer_.preRender.resetHistory();
        renderer.lineStringRenderer_.render.resetHistory();
        renderer.polygonRenderer_.preRender.resetHistory();
        renderer.polygonRenderer_.render.resetHistory();
        renderer.renderFrame(frameState);
      });
      it('calls preRender and render three times for each renderer', () => {
        expect(renderer.pointRenderer_.preRender.callCount).to.be(3);
        expect(renderer.pointRenderer_.render.callCount).to.be(3);
        expect(renderer.lineStringRenderer_.preRender.callCount).to.be(3);
        expect(renderer.lineStringRenderer_.render.callCount).to.be(3);
        expect(renderer.polygonRenderer_.preRender.callCount).to.be(3);
        expect(renderer.polygonRenderer_.render.callCount).to.be(3);
      });
    });
  });

  describe('#dispose', () => {
    beforeEach(() => {
      sinon.spy(renderer.worker_, 'terminate');
      sinon.spy(vectorSource, 'removeEventListener');
      renderer.dispose();
    });
    it('disposes of the webgl worker', () => {
      expect(renderer.worker_.terminate.callCount).to.be(1);
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
