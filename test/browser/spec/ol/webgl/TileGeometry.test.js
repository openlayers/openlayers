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
      expect(tileGeometry.tile).to.be.a(VectorRenderTile);
    });
    it('creates a new geometry batch', () => {
      expect(tileGeometry.batch_).to.be.a(MixedGeometryBatch);
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
      expect(tileGeometry.batch_.clear.calledOnce).to.be(true);
    });
    it('adds all features from the source tiles into the batch', () => {
      expect(tileGeometry.batch_.addFeatures.calledOnce).to.be(true);
      expect(tileGeometry.batch_.addFeatures.calledWith(features)).to.be(true);
    });
    it('calls generateBuffers for each renderer with the tile origin as transform', () => {
      const originTransform = [1, 0, 0, 1, 100, 200];
      expect(styleRenderer.generateBuffers.callCount).to.be(1);
      expect(styleRenderer.generateBuffers.getCall(0).args[1]).to.eql(
        originTransform,
      );
    });
    it('becomes ready when each of the renderers have finished generating buffers', async () => {
      expect(tileGeometry.ready).to.be(false);
      styleRenderer.endGenerate_();
      expect(tileGeometry.ready).to.be(false);
      await new Promise((resolve) => setTimeout(resolve));
      expect(tileGeometry.ready).to.be(true);
    });
    it('fills the mask buffer with the tile extent', () => {
      expect(tileGeometry.maskVertices.getArray()).to.eql([
        -100, -200, 300, -200, 300, 400, -100, 400,
      ]);
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
        expect(deleteBufferSpy.callCount).to.be(4); // 2 for points, 2 for polygons
      });
    });
  });
});
