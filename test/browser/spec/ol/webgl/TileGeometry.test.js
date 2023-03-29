import Feature from '../../../../../src/ol/Feature.js';
import MixedGeometryBatch from '../../../../../src/ol/render/webgl/MixedGeometryBatch.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import TileGeometry from '../../../../../src/ol/webgl/TileGeometry.js';
import TileState from '../../../../../src/ol/TileState.js';
import VectorRenderTile from '../../../../../src/ol/VectorRenderTile.js';
import VectorTile from '../../../../../src/ol/VectorTile.js';
import WebGLHelper from '../../../../../src/ol/webgl/Helper.js';
import {VOID} from '../../../../../src/ol/functions.js';
import {createXYZ} from '../../../../../src/ol/tilegrid.js';

class MockRenderer {
  rebuild = sinon
    .stub()
    .callsFake(
      (batch, transform, type, callback) => (this.callback = callback)
    );
  endRebuild_ = () => this.callback();
}

describe('ol/webgl/TileGeometry', function () {
  /** @type {TileGeometry} */
  let tileGeometry;

  /** @type {VectorRenderTile} */
  let tile;

  let polygonBatchRenderer;
  let lineStringBatchRenderer;
  let pointBatchRenderer;
  let helper;

  beforeEach(function () {
    tile = new VectorRenderTile([3, 2, 1], TileState.IDLE, [3, 2, 1], () => []);
    polygonBatchRenderer = new MockRenderer();
    lineStringBatchRenderer = new MockRenderer();
    pointBatchRenderer = new MockRenderer();
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
      polygonBatchRenderer,
      lineStringBatchRenderer,
      pointBatchRenderer
    );
  });

  describe('tile provided initially', () => {
    it('assigns the given tile', () => {
      expect(tileGeometry.tile).to.be.a(VectorRenderTile);
    });
    it('creates a new geometry batch', () => {
      expect(tileGeometry.batch).to.be.a(MixedGeometryBatch);
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
        VOID
      );
      sourceTile.extent = [-100, -200, 300, 400];
      sourceTile.setFeatures(features);
      const newTile = new VectorRenderTile(
        [3, 2, 1],
        TileState.LOADED,
        [3, 2, 1],
        () => [sourceTile]
      );

      sinon.spy(tileGeometry.batch, 'clear');
      sinon.spy(tileGeometry.batch, 'addFeatures');
      tileGeometry.setTile(newTile);
      setTimeout(done, 10);
    });
    it('first clears the geometry batch', () => {
      expect(tileGeometry.batch.clear.calledOnce).to.be(true);
    });
    it('adds all features from the source tiles into the batch', () => {
      expect(tileGeometry.batch.addFeatures.calledOnce).to.be(true);
      expect(tileGeometry.batch.addFeatures.calledWith(features)).to.be(true);
    });
    it('translates the render instructions transform according to the tile origin', () => {
      expect(tileGeometry.renderInstructionsTransform_).to.eql([
        1, 0, 0, 1, 100, 200,
      ]);
    });
    it('becomes ready when the render buffers of each geometry type have been generated', () => {
      expect(tileGeometry.ready).to.be(false);
      polygonBatchRenderer.endRebuild_();
      expect(tileGeometry.ready).to.be(false);
      lineStringBatchRenderer.endRebuild_();
      expect(tileGeometry.ready).to.be(false);
      pointBatchRenderer.endRebuild_();
      expect(tileGeometry.ready).to.be(true);
    });
  });

  describe('setTile (async tile loading)', () => {});
});
