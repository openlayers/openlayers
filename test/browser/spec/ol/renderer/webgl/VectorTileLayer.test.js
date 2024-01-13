import Map from '../../../../../../src/ol/Map.js';
import RenderFeature from '../../../../../../src/ol/render/Feature.js';
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
import WebGLRenderTarget from '../../../../../../src/ol/webgl/RenderTarget.js';
import WebGLVectorTileLayerRenderer, {
  Attributes,
  Uniforms,
} from '../../../../../../src/ol/renderer/webgl/VectorTileLayer.js';
import {Polygon} from '../../../../../../src/ol/geom.js';
import {Projection} from '../../../../../../src/ol/proj.js';
import {ShaderBuilder} from '../../../../../../src/ol/webgl/ShaderBuilder.js';
import {VOID} from '../../../../../../src/ol/functions.js';
import {create} from '../../../../../../src/ol/transform.js';
import {createXYZ} from '../../../../../../src/ol/tilegrid.js';

const SAMPLE_STYLE = {
  'fill-color': ['get', 'color'],
  'stroke-width': 2,
  'circle-radius': 1.5,
};

const SAMPLE_STYLE2 = {
  'circle-radius': ['get', 'size'],
  'circle-fill-color': 'red',
};

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
  /** @type {import('../../../../../../src/ol/render/webgl/VectorStyleRenderer.js').StyleShaders} */
  let sampleShaders;

  beforeEach(function () {
    vectorTileLayer = new VectorTileLayer({
      source: new VectorTileSource({
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
    sampleShaders = SAMPLE_SHADERS();
    renderer = new WebGLVectorTileLayerRenderer(vectorTileLayer, {
      style: [SAMPLE_STYLE, sampleShaders],
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
    it('passes the shaders to renderers, adding a discard expression according to tile mask', () => {
      expect(spy.callCount).to.be(2);
      const firstBuilder = spy.firstCall.args[0].builder;
      const secondBuilder = spy.secondCall.args[0].builder;
      expect(firstBuilder.getFillColorExpression()).to.be('v_prop_color');
      expect(secondBuilder.getFillColorExpression()).to.be('vec4(1.0)');
    });
    it('adds a discard expression and uniforms to the styles', () => {
      const firstBuilder = spy.firstCall.args[0].builder;
      const secondBuilder = spy.secondCall.args[0].builder;
      expect(firstBuilder.uniforms_).to.contain('sampler2D u_depthMask');
      expect(firstBuilder.uniforms_).to.contain('float u_tileZoomLevel');
      expect(firstBuilder.getFragmentDiscardExpression()).to.be(
        'texture2D(u_depthMask, gl_FragCoord.xy / u_pixelRatio / u_viewportSizePx).r * 50. > u_tileZoomLevel + 0.5',
      );
      expect(secondBuilder.uniforms_).to.contain('sampler2D u_depthMask');
      expect(secondBuilder.uniforms_).to.contain('float u_tileZoomLevel');
      expect(secondBuilder.getFragmentDiscardExpression()).to.be(
        '(u_zoom > 10.0) || (texture2D(u_depthMask, gl_FragCoord.xy / u_pixelRatio / u_viewportSizePx).r * 50. > u_tileZoomLevel + 0.5)',
      );
    });
    it('instantiates the tile mask target, indices, attributes and program', () => {
      expect(renderer.tileMaskTarget_).to.be.an(WebGLRenderTarget);
      expect(renderer.tileMaskIndices_.getArray()).to.eql([0, 1, 3, 1, 2, 3]);
      expect(renderer.tileMaskAttributes_[0].name).to.be(Attributes.POSITION);
      expect(renderer.tileMaskProgram_).to.be.an(WebGLProgram);
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
        const builder = spy.firstCall.args[0].builder;
        expect(builder.getSymbolColorExpression()).to.contain('v_prop_size');
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
      sinon.spy(renderer.helper, 'bindTexture');
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
        },
      );

      renderer.renderFrame(frameState);
    });
    it('sets the size of the tile mask target according to frame state', () => {
      expect(renderer.tileMaskTarget_.getSize()).to.eql([400, 200]);
    });
    it('sets TILE_ZOOM_LEVEL uniform three times for each tile and style renderer, plus two times for tile masks', () => {
      const calls = renderer.helper.setUniformFloatValue
        .getCalls()
        .filter((c) => c.args[0] === Uniforms.TILE_ZOOM_LEVEL);
      expect(calls.length).to.be(14);
      expect(calls[0].args).to.eql([Uniforms.TILE_ZOOM_LEVEL, 2]); // tile mask
      expect(calls[1].args).to.eql([Uniforms.TILE_ZOOM_LEVEL, 2]); // tile mask
      expect(calls[2].args).to.eql([Uniforms.TILE_ZOOM_LEVEL, 2]);
      expect(calls[8].args).to.eql([Uniforms.TILE_ZOOM_LEVEL, 2]);
    });
    it('sets GLOBAL_ALPHA uniform three times for each tile and style renderer, plus two times for tile masks', () => {
      const calls = renderer.helper.setUniformFloatValue
        .getCalls()
        .filter((c) => c.args[0] === Uniforms.GLOBAL_ALPHA);
      expect(calls.length).to.be(14);
      expect(calls[0].args).to.eql([Uniforms.GLOBAL_ALPHA, 1]); // tile mask
      expect(calls[1].args).to.eql([Uniforms.GLOBAL_ALPHA, 1]); // tile mask
      expect(calls[2].args).to.eql([Uniforms.GLOBAL_ALPHA, 1]);
      expect(calls[8].args).to.eql([Uniforms.GLOBAL_ALPHA, 1]);
    });
    it('sets RENDER_EXTENT uniform (intersection of tile and view extent) three times for each tile and style renderer, plus two times for tile masks', () => {
      const calls = renderer.helper.setUniformFloatVec4
        .getCalls()
        .filter((c) => c.args[0] === Uniforms.RENDER_EXTENT);
      expect(calls.length).to.be(14);
      expect(calls[0].args).to.eql([Uniforms.RENDER_EXTENT, [-64, 0, 0, 64]]); // tile mask
      expect(calls[1].args).to.eql([Uniforms.RENDER_EXTENT, [0, 0, 64, 64]]); // tile mask
      expect(calls[2].args).to.eql([Uniforms.RENDER_EXTENT, [-31, 1, 0, 31]]);
      expect(calls[8].args).to.eql([Uniforms.RENDER_EXTENT, [0, 1, 31, 31]]);
    });
    it('sets PROJECTION matrix uniform three times for each tile and style renderer, plus one time before rendering tile masks', () => {
      const calls = renderer.helper.setUniformMatrixValue
        .getCalls()
        .filter((c) => c.args[0] === Uniforms.PROJECTION_MATRIX);
      expect(calls.length).to.be(13);
      expect(calls[0].args).to.eql([
        Uniforms.PROJECTION_MATRIX,
        // 0.04   0     0     0      combination of:
        // 0      0.08  0     0        translate( 0 , -16 )  ->  subtract view center
        // 0      0     1     0        scale( 2 / ( 0.25 * 200px ) , 2 / ( 0.25 * 100px ) )  ->  divide by resolution and viewport size
        // -2.56 -1.28  0     1
        [0.04, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 1, 0, 0, -1.28, 0, 1],
      ]);
      expect(calls[1].args).to.eql([
        Uniforms.PROJECTION_MATRIX,
        // 0.04   0     0     0      combination of:
        // 0      0.08  0     0        translate( 0 , -16 )  ->  subtract view center
        // 0      0     1     0        translate( -64 , 0 )  ->  add tile origin
        // -2.56 -1.28  0     1        scale( 2 / ( 0.25 * 200px ) , 2 / ( 0.25 * 100px ) )  ->  divide by resolution and viewport size
        [0.04, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 1, 0, -2.56, -1.28, 0, 1],
      ]);
      expect(calls[7].args).to.eql([
        Uniforms.PROJECTION_MATRIX,
        // 0.04   0     0     0      combination of:
        // 0      0.08  0     0        translate( 0 , -16 )  ->  subtract view center
        // 0      0     1     0        translate( 0 , 0 )  ->  add tile origin
        // 0     -1.28  0     1        scale( 2 / ( 0.25 * 200px ) , 2 / ( 0.25 * 100px ) )  ->  divide by resolution and viewport size
        [0.04, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 1, 0, 0, -1.28, 0, 1],
      ]);
    });
    it('sets SCREEN_TO_WORLD matrix uniform three times for each tile and style renderer, plus one time before rendering tile masks', () => {
      const calls = renderer.helper.setUniformMatrixValue
        .getCalls()
        .filter((c) => c.args[0] === Uniforms.SCREEN_TO_WORLD_MATRIX);
      expect(calls.length).to.be(13);
      expect(calls[0].args).to.eql([
        Uniforms.SCREEN_TO_WORLD_MATRIX,
        // 25     0     0     0      combination of:
        // 0      12.5  0     0      * scale( 0.25 * 200px / 2 , 0.25 * 100px / 2 )  ->  view resolution and viewport size
        // 0      0     1     0      * translate( 0 , 16 )  ->  view center
        // 0      16    0     1
        [25, 0, 0, 0, 0, 12.5, 0, 0, 0, 0, 1, 0, 0, 16, 0, 1],
      ]);
      expect(calls[1].args).to.eql([
        Uniforms.SCREEN_TO_WORLD_MATRIX,
        [25, 0, 0, 0, 0, 12.5, 0, 0, 0, 0, 1, 0, 0, 16, 0, 1],
      ]);
      expect(calls[7].args).to.eql([
        Uniforms.SCREEN_TO_WORLD_MATRIX,
        [25, 0, 0, 0, 0, 12.5, 0, 0, 0, 0, 1, 0, 0, 16, 0, 1],
      ]);
    });
    it('bind TILE_MASK_TEXTURE uniform three times for each tile and style renderer, plus one time before rendering tile masks', () => {
      const calls = renderer.helper.bindTexture.getCalls();
      expect(calls.length).to.be(13);
      expect(calls[0].args).to.eql([
        renderer.tileMaskTarget_.getTexture(),
        0,
        Uniforms.TILE_MASK_TEXTURE,
      ]);
    });
    it('calls render for each tile on each renderer', () => {
      expect(renderer.styleRenderers_[0].render.callCount).to.be(2);
      expect(renderer.styleRenderers_[1].render.callCount).to.be(2);
    });
  });
});
