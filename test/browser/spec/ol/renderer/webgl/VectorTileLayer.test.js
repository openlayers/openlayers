import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import Map from '../../../../../../src/ol/Map.js';
import TileQueue from '../../../../../../src/ol/TileQueue.js';
import TileState from '../../../../../../src/ol/TileState.js';
import VectorRenderTile from '../../../../../../src/ol/VectorRenderTile.js';
import VectorTile from '../../../../../../src/ol/VectorTile.js';
import View from '../../../../../../src/ol/View.js';
import {VOID} from '../../../../../../src/ol/functions.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import VectorTileLayer from '../../../../../../src/ol/layer/VectorTile.js';
import Projection from '../../../../../../src/ol/proj/Projection.js';
import RenderFeature from '../../../../../../src/ol/render/Feature.js';
import {ShaderBuilder} from '../../../../../../src/ol/render/webgl/ShaderBuilder.js';
import VectorStyleRenderer from '../../../../../../src/ol/render/webgl/VectorStyleRenderer.js';
import WebGLVectorTileLayerRenderer, {
  Attributes,
  Uniforms,
} from '../../../../../../src/ol/renderer/webgl/VectorTileLayer.js';
import VectorTileSource from '../../../../../../src/ol/source/VectorTile.js';
import {createXYZ} from '../../../../../../src/ol/tilegrid.js';
import {create} from '../../../../../../src/ol/transform.js';
import WebGLHelper from '../../../../../../src/ol/webgl/Helper.js';
import WebGLRenderTarget from '../../../../../../src/ol/webgl/RenderTarget.js';
import TileGeometry from '../../../../../../src/ol/webgl/TileGeometry.js';
import {assertArrayLikeEqual} from '../../../../../util/equal.js';

const SAMPLE_STYLE = {
  'fill-color': ['get', 'color'],
  'stroke-width': 2,
  'circle-radius': ['get', 'size'],
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
    filter: ['>', ['zoom'], 10],
    style: {
      'circle-radius': 3,
      'fill-color': 'white',
      'stroke-width': 2,
    },
  },
];

const SAMPLE_SHADERS = () => ({
  builder: new ShaderBuilder()
    .setFillColorExpression('vec4(1.0)')
    .setStrokeColorExpression('vec4(1.0)')
    .setSymbolColorExpression('vec4(1.0)')
    .setFragmentDiscardExpression('u_zoom > 10.0'),
  attributes: {
    attr1: {
      callback: () => 456,
    },
  },
  uniforms: {
    custom: () => 123,
  },
});

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
    const proj = new Projection({
      code: 'custom',
      units: 'pixels',
      extent: [-128, -128, 128, 128],
    });
    vectorTileLayer = new VectorTileLayer({
      source: new VectorTileSource({
        projection: proj,
        tileGrid: createXYZ({
          tileSize: [256, 256],
          maxZoom: 5,
          extent: [-128, -128, 128, 128],
        }),
        tileUrlFunction: (tileCoord) => tileCoord.join('/'),
        tileLoadFunction: (tile) => {
          const polygon = new Polygon([
            [
              [0, 0],
              [0, 10],
              [10, 10],
              [10, 0],
              [0, 0],
            ],
          ]);
          tile.setFeatures([
            new RenderFeature('Point', [0, 16], [], 2, {}, 1),
            new RenderFeature(
              'LineString',
              [0, 5, 4, 12],
              [],
              2,
              {
                'color': 'red',
              },
              2,
            ),
            new RenderFeature(
              'Polygon',
              polygon.getOrientedFlatCoordinates(),
              polygon.getEnds(),
              2,
              {},
              3,
            ),
          ]);
        },
      }),
    });
    renderer = new WebGLVectorTileLayerRenderer(vectorTileLayer, {
      style: SAMPLE_RULES,
    });

    frameState = {
      layerStatesArray: [vectorTileLayer.getLayerState()],
      layerIndex: 0,
      extent: [-31, 1, 31, 31],
      pixelRatio: 2,
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
    assert.instanceOf(renderer, WebGLVectorTileLayerRenderer);
  });

  it('do not create renderer initially', function () {
    assert.deepEqual(renderer.styleRenderer_, null);
  });

  describe('#afterHelperCreated', () => {
    beforeEach(() => {
      renderer.helper = new WebGLHelper();
      renderer.afterHelperCreated(frameState);
    });
    afterEach(() => {
      renderer.helper.dispose();
    });

    it('creates renderer', () => {
      assert.instanceOf(renderer.styleRenderer_, VectorStyleRenderer);
    });
    it('passes the shaders to renderer', () => {
      const firstBuilder = renderer.styleRenderer_.styleShaders[0].builder;
      const secondBuilder = renderer.styleRenderer_.styleShaders[1].builder;
      assert.strictEqual(firstBuilder.getFillColorExpression(), 'a_prop_color');
      assert.strictEqual(
        secondBuilder.getFillColorExpression(),
        'vec4(1.0, 1.0, 1.0, 1.0)',
      );
    });
    it('adds a discard expression and uniforms to the styles', () => {
      const firstBuilder = renderer.styleRenderer_.styleShaders[0].builder;
      const secondBuilder = renderer.styleRenderer_.styleShaders[1].builder;
      assert.deepEqual(firstBuilder.uniforms_, [
        {name: 'u_depthMask', type: 'sampler2D'},
        {name: 'u_tileZoomLevel', type: 'float'},
      ]);
      assert.strictEqual(
        firstBuilder.getFragmentDiscardExpression(),
        'texture2D(u_depthMask, gl_FragCoord.xy / u_pixelRatio / u_viewportSizePx).r * 50. > u_tileZoomLevel + 0.5',
      );
      assert.deepEqual(secondBuilder.uniforms_, [
        {name: 'u_depthMask', type: 'sampler2D'},
        {name: 'u_tileZoomLevel', type: 'float'},
      ]);
      assert.strictEqual(
        secondBuilder.getFragmentDiscardExpression(),
        'texture2D(u_depthMask, gl_FragCoord.xy / u_pixelRatio / u_viewportSizePx).r * 50. > u_tileZoomLevel + 0.5',
      );
    });
    it('instantiates the tile mask target, indices, attributes and program', () => {
      assert.instanceOf(renderer.tileMaskTarget_, WebGLRenderTarget);
      assertArrayLikeEqual(
        renderer.tileMaskIndices_.getArray(),
        [0, 1, 3, 1, 2, 3],
      );
      assert.strictEqual(
        renderer.tileMaskAttributes_[0].name,
        Attributes.POSITION,
      );
      assert.instanceOf(renderer.tileMaskProgram_, WebGLProgram);
    });
  });

  describe('#reset', () => {
    beforeEach(() => {
      // first call prepareFrame to initialize the helper
      renderer.prepareFrame(frameState);
    });

    describe('use a single style', () => {
      beforeEach(() => {
        renderer.reset({
          style: SAMPLE_STYLE,
        });
      });

      it('recreates renderer', () => {
        assert.instanceOf(renderer.styleRenderer_, VectorStyleRenderer);
      });
      it('passes the correct styles to renderer', () => {
        const builder = renderer.styleRenderer_.styleShaders[0].builder;
        assert.include(builder.getSymbolColorExpression(), 'a_prop_size');
      });
    });

    describe('use shaders', () => {
      beforeEach(() => {
        renderer.reset({
          style: SAMPLE_SHADERS(),
        });
      });

      it('recreates renderer', () => {
        assert.instanceOf(renderer.styleRenderer_, VectorStyleRenderer);
      });
      it('passes the correct styles to renderer', () => {
        const builder = renderer.styleRenderer_.styleShaders[0].builder;
        assert.include(builder.getSymbolColorExpression(), 'vec4(1.0)');
      });
      it('adds the mask discard expression to the existing fragment discard', () => {
        const builder = renderer.styleRenderer_.styleShaders[0].builder;
        assert.strictEqual(
          builder.getFragmentDiscardExpression(),
          '(u_zoom > 10.0) || (texture2D(u_depthMask, gl_FragCoord.xy / u_pixelRatio / u_viewportSizePx).r * 50. > u_tileZoomLevel + 0.5)',
        );
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
          () => sourceTile,
          () => {},
        ),
        grid,
        helper: renderer.helper,
        gutter: 4,
      });
      sinonSpy(vectorTileLayer, 'changed');
    });
    it('creates a TileGeometry instance', () => {
      assert.instanceOf(tileRepresentation, TileGeometry);
    });
    it('triggers a redraw of the layer when the tile representation is ready', () => {
      tileRepresentation.setReady();
      assert.strictEqual(vectorTileLayer.changed.calledOnce, true);
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

      sinonSpy(renderer.helper, 'setUniformFloatValue');
      sinonSpy(renderer.helper, 'setUniformFloatVec4');
      sinonSpy(renderer.helper, 'setUniformMatrixValue');
      sinonSpy(renderer.helper, 'bindTexture');
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

      renderer.renderFrame(frameState);
    });
    it('sets the size of the tile mask target according to frame state', () => {
      assert.deepEqual(renderer.tileMaskTarget_.getSize(), [400, 200]);
    });
    it('sets TILE_ZOOM_LEVEL uniform three times for each tile and style renderer, plus two times for tile masks', () => {
      const calls = renderer.helper.setUniformFloatValue
        .getCalls()
        .filter((c) => c.args[0] === Uniforms.TILE_ZOOM_LEVEL);
      assert.strictEqual(calls.length, 14);
      assertArrayLikeEqual(calls[0].args, [Uniforms.TILE_ZOOM_LEVEL, 2]);
      assertArrayLikeEqual(calls[1].args, [Uniforms.TILE_ZOOM_LEVEL, 2]);
      assertArrayLikeEqual(calls[2].args, [Uniforms.TILE_ZOOM_LEVEL, 2]);
      assertArrayLikeEqual(calls[8].args, [Uniforms.TILE_ZOOM_LEVEL, 2]);
    });
    it('sets GLOBAL_ALPHA uniform three times for each tile and style renderer, plus two times for tile masks', () => {
      const calls = renderer.helper.setUniformFloatValue
        .getCalls()
        .filter((c) => c.args[0] === Uniforms.GLOBAL_ALPHA);
      assert.strictEqual(calls.length, 14);
      assertArrayLikeEqual(calls[0].args, [Uniforms.GLOBAL_ALPHA, 1]);
      assertArrayLikeEqual(calls[1].args, [Uniforms.GLOBAL_ALPHA, 1]);
      assertArrayLikeEqual(calls[2].args, [Uniforms.GLOBAL_ALPHA, 1]);
      assertArrayLikeEqual(calls[8].args, [Uniforms.GLOBAL_ALPHA, 1]);
    });
    it('sets RENDER_EXTENT uniform three times for each tile and style renderer, plus two times for tile masks', () => {
      const calls = renderer.helper.setUniformFloatVec4
        .getCalls()
        .filter((c) => c.args[0] === Uniforms.RENDER_EXTENT);
      assert.strictEqual(calls.length, 14);
      assertArrayLikeEqual(calls[0].args, [
        Uniforms.RENDER_EXTENT,
        [0, 0, 64, 64],
      ]);
      assertArrayLikeEqual(calls[1].args, [
        Uniforms.RENDER_EXTENT,
        [0, 0, 64, 64],
      ]);
      assertArrayLikeEqual(calls[2].args, [
        Uniforms.RENDER_EXTENT,
        [0, 0, 64, 64],
      ]);
      assertArrayLikeEqual(calls[8].args, [
        Uniforms.RENDER_EXTENT,
        [0, 0, 64, 64],
      ]);
    });
    it('sets PROJECTION matrix uniform three times for each tile and style renderer, plus one time per tiles for their mask', () => {
      const calls = renderer.helper.setUniformMatrixValue
        .getCalls()
        .filter((c) => c.args[0] === Uniforms.PROJECTION_MATRIX);
      assert.strictEqual(calls.length, 14);
      assertArrayLikeEqual(calls[0].args, [
        Uniforms.PROJECTION_MATRIX,
        // 0.04   0     0     0      combination of:
        // 0      0.08  0     0        translate( 0 , -16 )  ->  subtract view center
        // 0      0     1     0        translate( -64 , 0 )  ->  add tile origin
        // -2.56 -1.28  0     1        scale( 2 / ( 0.25 * 200px ) , 2 / ( 0.25 * 100px ) )  ->  divide by resolution and viewport size
        [0.04, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 1, 0, -2.56, -1.28, 0, 1],
      ]);
      assertArrayLikeEqual(calls[2].args, [
        Uniforms.PROJECTION_MATRIX,
        // 0.04   0     0     0      combination of:
        // 0      0.08  0     0        translate( 0 , -16 )  ->  subtract view center
        // 0      0     1     0        translate( -64 , 0 )  ->  add tile origin
        // -2.56 -1.28  0     1        scale( 2 / ( 0.25 * 200px ) , 2 / ( 0.25 * 100px ) )  ->  divide by resolution and viewport size
        [0.04, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 1, 0, -2.56, -1.28, 0, 1],
      ]);
      assertArrayLikeEqual(calls[8].args, [
        Uniforms.PROJECTION_MATRIX,
        // 0.04   0     0     0      combination of:
        // 0      0.08  0     0        translate( 0 , -16 )  ->  subtract view center
        // 0      0     1     0        translate( 0 , 0 )  ->  add tile origin
        // 0     -1.28  0     1        scale( 2 / ( 0.25 * 200px ) , 2 / ( 0.25 * 100px ) )  ->  divide by resolution and viewport size
        [0.04, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 1, 0, 0, -1.28, 0, 1],
      ]);
    });
    it('sets INVERT_PROJECTION_MATRIX matrix uniform three times for each tile and style renderer, plus one time per tiles for their mask', () => {
      const calls = renderer.helper.setUniformMatrixValue
        .getCalls()
        .filter((c) => c.args[0] === Uniforms.INVERT_PROJECTION_MATRIX);
      assert.strictEqual(calls.length, 14);
      assertArrayLikeEqual(calls[0].args, [
        Uniforms.INVERT_PROJECTION_MATRIX,
        // 25     0     0     0      combination of:
        // 0      12.5  0     0      * scale( 0.25 * 200px / 2 , 0.25 * 100px / 2 )  ->  view resolution and viewport size
        // 0      0     1     0      * translate( 64 , 0 )  ->  subtract add tile origin
        // 64     16    0     1      * translate( 0 , 16 )  ->  add view center
        [25, 0, 0, 0, 0, 12.5, 0, 0, 0, 0, 1, 0, 64, 16, 0, 1],
      ]);
      assertArrayLikeEqual(calls[2].args, [
        Uniforms.INVERT_PROJECTION_MATRIX,
        [25, 0, 0, 0, 0, 12.5, 0, 0, 0, 0, 1, 0, 64, 16, 0, 1],
      ]);
      assertArrayLikeEqual(calls[8].args, [
        Uniforms.INVERT_PROJECTION_MATRIX,
        [25, 0, 0, 0, 0, 12.5, 0, 0, 0, 0, 1, 0, 0, 16, 0, 1],
      ]);
    });
    it('bind TILE_MASK_TEXTURE uniform three times for each tile and style renderer, plus one time before rendering tile masks', () => {
      const calls = renderer.helper.bindTexture.getCalls();
      assert.strictEqual(calls.length, 13);
      assertArrayLikeEqual(calls[0].args, [
        renderer.tileMaskTarget_.getTexture(),
        0,
        Uniforms.TILE_MASK_TEXTURE,
      ]);
    });
    it('calls render for each tile on each renderer', () => {
      assert.strictEqual(renderer.styleRenderer_.render.callCount, 2);
    });
  });
});
