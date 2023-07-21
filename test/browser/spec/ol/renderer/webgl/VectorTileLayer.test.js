import Map from '../../../../../../src/ol/Map.js';
import TileGeometry from '../../../../../../src/ol/webgl/TileGeometry.js';
import TileQueue from '../../../../../../src/ol/TileQueue.js';
import TileState from '../../../../../../src/ol/TileState.js';
import VectorRenderTile from '../../../../../../src/ol/VectorRenderTile.js';
import VectorStyleRenderer, * as ol_render_webgl_vectorstylerenderer from '../../../../../../src/ol/render/webgl/VectorStyleRenderer.js';
import VectorTile from '../../../../../../src/ol/VectorTile.js';
import VectorTileLayer from '../../../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../../../src/ol/source/VectorTile.js';
import View from '../../../../../../src/ol/View.js';
import WebGLHelper from '../../../../../../src/ol/webgl/Helper.js';
import WebGLVectorTileLayerRenderer from '../../../../../../src/ol/renderer/webgl/VectorTileLayer.js';
import {Projection} from '../../../../../../src/ol/proj.js';
import {VOID} from '../../../../../../src/ol/functions.js';
import {create} from '../../../../../../src/ol/transform.js';
import {createXYZ} from '../../../../../../src/ol/tilegrid.js';

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

describe('ol/renderer/webgl/VectorTileLayer', function () {
  /** @type {import("../../../../../../src/ol/renderer/webgl/VectorTileLayer.js").default} */
  let renderer;
  /** @type {VectorTileLayer} */
  let vectorTileLayer;
  /** @type {import('../../../../../../src/ol/Map.js').FrameState} */
  let frameState;
  /** @type {Map} */
  let map;

  beforeEach(function () {
    vectorTileLayer = new VectorTileLayer({
      source: new VectorTileSource({
        tileGrid: createXYZ({
          tileSize: [256, 256],
          maxZoom: 5,
          extent: [-128, -128, 128, 128],
        }),
        tileUrlFunction: (tileCoord) => tileCoord.join('/'),
        tileLoadFunction: (tile) => tile.setFeatures([]),
      }),
    });

    renderer = new WebGLVectorTileLayerRenderer(vectorTileLayer, {
      style: [SAMPLE_STYLE, SAMPLE_SHADERS],
    });

    const proj = new Projection({
      code: 'custom',
      units: 'pixels',
      extent: [-128, -128, 128, 128],
    });
    frameState = {
      layerStatesArray: [vectorTileLayer.getLayerState()],
      layerIndex: 0,
      extent: [-31, 1, 31, 31],
      pixelRatio: 1,
      pixelToCoordinateTransform: create(),
      postRenderFunctions: [],
      time: Date.now(),
      viewHints: [],
      viewState: {
        center: [0, 16],
        resolution: 0.25, // tiles at that resolution cover a 64x64 area
        rotation: 0,
        projection: proj,
      },
      size: [200, 100],
      usedTiles: {},
      wantedTiles: {},
      tileQueue: new TileQueue(VOID, VOID),
      renderTargets: {},
    };

    map = new Map({
      view: new View(),
    });
    vectorTileLayer.set('map', map, true);
  });

  afterEach(function () {
    vectorTileLayer.dispose();
    renderer.dispose();
    map.dispose();
  });

  it('creates a new instance', function () {
    expect(renderer).to.be.a(WebGLVectorTileLayerRenderer);
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

  describe('#createTileRepresentation', () => {
    let tileRepresentation, sourceTile;
    beforeEach(() => {
      const grid = vectorTileLayer
        .getSource()
        .getTileGridForProjection(frameState.viewState.projection);
      sourceTile = new VectorTile([0, 0, 0], TileState.LOADING);
      sourceTile.features_ = [];
      tileRepresentation = renderer.createTileRepresentation({
        tile: new VectorRenderTile(
          [1, 2, 3],
          TileState.LOADING,
          [0, 0, 0],
          () => sourceTile
        ),
        grid,
        helper: renderer.helper,
        gutter: 4,
      });
      sinon.spy(vectorTileLayer, 'changed');
    });
    it('creates a TileGeometry instance', () => {
      expect(tileRepresentation).to.be.a(TileGeometry);
    });
    it('triggers a redraw of the layer when the tile representation is ready', () => {
      tileRepresentation.setReady();
      expect(vectorTileLayer.changed.calledOnce).to.be(true);
    });
  });

  describe('#renderFrame', () => {
    beforeEach(async () => {
      // prepare renderer and enqueue tiles
      // note: we've set up the frame state to show two tiles only
      renderer.prepareFrame(frameState);
      renderer.renderFrame(frameState);
      frameState.tileQueue.loadMoreTiles(Infinity, Infinity);
      await new Promise((resolve) => setTimeout(resolve, 150));

      sinon.spy(renderer.helper, 'setUniformFloatValue');
      sinon.spy(renderer.helper, 'setUniformFloatVec4');
      sinon.spy(renderer.helper, 'setUniformMatrixValue');
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

      renderer.renderFrame(frameState);
    });
    it('sets GLOBAL_ALPHA uniform three times for each tile and style renderer', () => {
      const calls = renderer.helper.setUniformFloatValue
        .getCalls()
        .filter((c) => c.args[0] === 'u_globalAlpha');
      expect(calls.length).to.be(12);
      expect(calls[0].args).to.eql(['u_globalAlpha', 1]);
      expect(calls[6].args).to.eql(['u_globalAlpha', 1]);
    });
    it('sets RENDER_EXTENT uniform (intersection of tile and view extent) three times for each tile and style renderer', () => {
      const calls = renderer.helper.setUniformFloatVec4
        .getCalls()
        .filter((c) => c.args[0] === 'u_renderExtent');
      expect(calls.length).to.be(12);
      expect(calls[0].args).to.eql(['u_renderExtent', [-31, 1, 0, 31]]);
      expect(calls[6].args).to.eql(['u_renderExtent', [0, 1, 31, 31]]);
    });
    it('sets PROJECTION matrix uniform three times for each tile and style renderer', () => {
      const calls = renderer.helper.setUniformMatrixValue
        .getCalls()
        .filter((c) => c.args[0] === 'u_projectionMatrix');
      expect(calls.length).to.be(12);
      expect(calls[0].args).to.eql([
        'u_projectionMatrix',
        // 0.04   0     0     0      combination of:
        // 0      0.08  0     0        translate( 0 , -16 )  ->  subtract view center
        // 0      0     1     0        translate( -64 , 0 )  ->  add tile origin
        // -2.56 -1.28  0     1        scale( 2 / ( 0.25 * 200px ) , 2 / ( 0.25 * 100px ) )  ->  divide by resolution and viewport size
        [0.04, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 1, 0, -2.56, -1.28, 0, 1],
      ]);
      expect(calls[6].args).to.eql([
        'u_projectionMatrix',
        // 0.04   0     0     0      combination of:
        // 0      0.08  0     0        translate( 0 , -16 )  ->  subtract view center
        // 0      0     1     0        translate( 0 , 0 )  ->  add tile origin
        // 0     -1.28  0     1        scale( 2 / ( 0.25 * 200px ) , 2 / ( 0.25 * 100px ) )  ->  divide by resolution and viewport size
        [0.04, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 1, 0, 0, -1.28, 0, 1],
      ]);
    });
    it('sets SCREEN_TO_WORLD matrix uniform three times for each tile and style renderer', () => {
      const calls = renderer.helper.setUniformMatrixValue
        .getCalls()
        .filter((c) => c.args[0] === 'u_screenToWorldMatrix');
      expect(calls.length).to.be(12);
      expect(calls[0].args).to.eql([
        'u_screenToWorldMatrix',
        // 25     0     0     0      combination of:
        // 0      12.5  0     0      * scale( 0.25 * 200px / 2 , 0.25 * 100px / 2 )  ->  view resolution and viewport size
        // 0      0     1     0      * translate( 0 , 16 )  ->  view center
        // 0      16    0     1
        [25, 0, 0, 0, 0, 12.5, 0, 0, 0, 0, 1, 0, 0, 16, 0, 1],
      ]);
      expect(calls[6].args).to.eql([
        'u_screenToWorldMatrix',
        [25, 0, 0, 0, 0, 12.5, 0, 0, 0, 0, 1, 0, 0, 16, 0, 1],
      ]);
    });
    it('calls render for each tile on each renderer', () => {
      expect(renderer.styleRenderers_[0].render.callCount).to.be(2);
      expect(renderer.styleRenderers_[1].render.callCount).to.be(2);
    });
  });
});
