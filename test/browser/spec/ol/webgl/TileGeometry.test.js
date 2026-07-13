import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import TileState from '../../../../../src/ol/TileState.js';
import VectorRenderTile from '../../../../../src/ol/VectorRenderTile.js';
import VectorTile from '../../../../../src/ol/VectorTile.js';
import {VOID} from '../../../../../src/ol/functions.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import MixedGeometryBatch from '../../../../../src/ol/render/webgl/MixedGeometryBatch.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';
import WebGLHelper from '../../../../../src/ol/webgl/Helper.js';
import TileGeometry from '../../../../../src/ol/webgl/TileGeometry.js';
import {assertArrayLikeEqual} from '../../../../util/equal.js';

class MockRenderer {
  generateBuffers = vi.fn(
    () => new Promise((resolve) => (this.endGenerate_ = resolve)),
  );
  endGenerate_ = null;
  disposeTextInstructions = vi.fn();
}

describe('ol/webgl/TileGeometry', function () {
  /** @type {TileGeometry} */
  let tileGeometry;

  /** @type {VectorRenderTile} */
  let tile;

  let styleRenderer;
  let helper;
  let grid;

  beforeEach(function () {
    tile = new VectorRenderTile(
      [3, 2, 1],
      TileState.IDLE,
      [3, 2, 1],
      () => [],
      () => {},
    );
    styleRenderer = new MockRenderer();
    helper = new WebGLHelper();
    grid = createXYZ({
      tileSize: [256, 256],
      maxZoom: 5,
      extent: [-128, -128, 128, 128],
    });

    tileGeometry = new TileGeometry(
      {
        tile,
        grid,
        helper,
      },
      styleRenderer,
    );
  });
  afterEach(() => {
    helper.dispose();
  });

  describe('tile provided initially', () => {
    it('assigns the given tile', () => {
      assert.instanceOf(tileGeometry.tile, VectorRenderTile);
    });
    it('creates a new geometry batch', () => {
      assert.instanceOf(tileGeometry.batch_, MixedGeometryBatch);
    });
    it('computes the resolution of the tile content according its z coordinate', () => {
      assert.strictEqual(tileGeometry.wantedResolution, grid.getResolution(3));
    });
  });

  describe('tile provided asynchronously', () => {
    /** @type {Array<Feature>} */
    let features;

    beforeEach(
      () =>
        new Promise((resolve) => {
          features = [
            new Feature({
              geometry: new Point([10, 20]),
            }),
            new Feature({
              geometry: new Polygon([
                [100, 101],
                [102, 103],
                [104, 105],
                [100, 101],
              ]),
            }),
          ];
          const sourceTile = new VectorTile(
            [3, 2, 1],
            TileState.LOADED,
            'http://source',
            null,
            VOID,
          );
          sourceTile.extent = [-100, -200, 300, 400];
          sourceTile.setFeatures(features);
          const newTile = new VectorRenderTile(
            [3, 2, 1],
            TileState.LOADED,
            [3, 2, 1],
            () => [sourceTile],
            () => {},
          );

          vi.spyOn(tileGeometry.batch_, 'clear');
          vi.spyOn(tileGeometry.batch_, 'addFeatures');
          tileGeometry.setTile(newTile);
          setTimeout(resolve, 10);
        }),
    );
    it('first clears the geometry batch', () => {
      assert.strictEqual(tileGeometry.batch_.clear.mock.calls.length, 1);
    });
    it('adds all features from the source tiles into the batch', () => {
      assert.strictEqual(tileGeometry.batch_.addFeatures.mock.calls.length, 1);
      assert.deepEqual(
        tileGeometry.batch_.addFeatures.mock.calls[0][0],
        features,
      );
    });
    it('calls generateBuffers for each renderer with the tile origin as transform', () => {
      const originTransform = [1, 0, 0, 1, 100, 200];
      assert.strictEqual(styleRenderer.generateBuffers.mock.calls.length, 1);
      assert.deepEqual(
        styleRenderer.generateBuffers.mock.calls[0][1],
        originTransform,
      );
      assert.deepEqual(
        styleRenderer.generateBuffers.mock.calls[0][2],
        tileGeometry.wantedResolution,
      );
    });
    it('becomes ready when each of the renderers have finished generating buffers', async () => {
      assert.strictEqual(tileGeometry.ready, false);
      styleRenderer.endGenerate_();
      assert.strictEqual(tileGeometry.ready, false);
      await new Promise((resolve) => setTimeout(resolve));
      assert.strictEqual(tileGeometry.ready, true);
    });
    it('fills the mask buffer with the tile extent (expressed relative to the tile origin)', () => {
      assertArrayLikeEqual(
        tileGeometry.maskVertices.getArray(),
        [0, 0, 400, 0, 400, 600, 0, 600],
      );
    });

    describe('#dispose', () => {
      let deleteBufferSpy;
      beforeEach(async () => {
        deleteBufferSpy = vi.spyOn(helper, 'deleteBuffer');
        // generate buffers and dispose the tile
        styleRenderer.endGenerate_({
          pointBuffers: [{}, {}],
          polygonBuffers: [{}, {}],
        });
        await new Promise((resolve) => setTimeout(resolve));
        tileGeometry.dispose();
      });
      it('deletes webgl buffers', () => {
        assert.strictEqual(deleteBufferSpy.mock.calls.length, 4);
      });
      it('disposes text instructions', () => {
        assert.strictEqual(
          styleRenderer.disposeTextInstructions.mock.calls.length,
          1,
        );
      });
    });
  });
});
