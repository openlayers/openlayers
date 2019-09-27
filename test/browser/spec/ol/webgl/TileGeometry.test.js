import {assert} from 'chai';
import {spy as sinonSpy, stub as sinonStub} from 'sinon';
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
  generateBuffers = sinonStub().callsFake(
    () => new Promise((resolve) => (this.endGenerate_ = resolve)),
  );
  endGenerate_ = null;
}

describe('ol/webgl/TileGeometry', function () {
  /** @type {TileGeometry} */
  let tileGeometry;

  /** @type {VectorRenderTile} */
  let tile;

  let styleRenderer;
  let helper;

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

    tileGeometry = new TileGeometry(
      {
        tile,
        grid: createXYZ({
          tileSize: [256, 256],
          maxZoom: 5,
          extent: [-128, -128, 128, 128],
        }),
        helper,
      },
      styleRenderer,
    );
  });
  this.afterEach(() => {
    helper.dispose();
  });

  describe('tile provided initially', () => {
    it('assigns the given tile', () => {
      assert.instanceOf(tileGeometry.tile, VectorRenderTile);
    });
    it('creates a new geometry batch', () => {
      assert.instanceOf(tileGeometry.batch_, MixedGeometryBatch);
    });
  });

  describe('tile provided asynchronously', () => {
    /** @type {Array<Feature>} */
    let features;

    beforeEach((done) => {
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

      sinonSpy(tileGeometry.batch_, 'clear');
      sinonSpy(tileGeometry.batch_, 'addFeatures');
      tileGeometry.setTile(newTile);
      setTimeout(done, 10);
    });
    it('first clears the geometry batch', () => {
      assert.strictEqual(tileGeometry.batch_.clear.calledOnce, true);
    });
    it('adds all features from the source tiles into the batch', () => {
      assert.strictEqual(tileGeometry.batch_.addFeatures.calledOnce, true);
      assert.strictEqual(
        tileGeometry.batch_.addFeatures.calledWith(features),
        true,
      );
    });
    it('calls generateBuffers for each renderer with the tile origin as transform', () => {
      const originTransform = [1, 0, 0, 1, 100, 200];
      assert.strictEqual(styleRenderer.generateBuffers.callCount, 1);
      assert.deepEqual(
        styleRenderer.generateBuffers.getCall(0).args[1],
        originTransform,
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
        deleteBufferSpy = sinonSpy(helper, 'deleteBuffer');
        // generate buffers and dispose the tile
        styleRenderer.endGenerate_({
          pointBuffers: [{}, {}],
          polygonBuffers: [{}, {}],
        });
        await new Promise((resolve) => setTimeout(resolve));
        tileGeometry.dispose();
      });
      it('deletes webgl buffers', () => {
        assert.strictEqual(deleteBufferSpy.callCount, 4);
      });
    });
  });
});
