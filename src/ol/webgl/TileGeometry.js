/**
 * @module ol/webgl/TileGeometry
 */

import BaseTileRepresentation from './BaseTileRepresentation.js';
import MixedGeometryBatch from '../render/webgl/MixedGeometryBatch.js';
import {
  create as createTransform,
  reset as resetTransform,
  translate as translateTransform,
} from '../transform.js';

/**
 * @typedef {import("../VectorRenderTile").default} TileType
 */

/**
 * @extends {BaseTileRepresentation<TileType>}
 */
class TileGeometry extends BaseTileRepresentation {
  batch = new MixedGeometryBatch();

  /**
   * @param {import("./BaseTileRepresentation.js").TileRepresentationOptions<TileType>} options The tile texture options.
   * @param {import("../render/webgl/PolygonBatchRenderer.js").default} polygonRenderer Polygon renderer
   * @param {import("../render/webgl/LineStringBatchRenderer.js").default} lineStringRenderer Linestring renderer
   * @param {import("../render/webgl/PointBatchRenderer.js").default} pointRenderer Point renderer
   */
  constructor(options, polygonRenderer, lineStringRenderer, pointRenderer) {
    super(options);
    /**
     * @private
     */
    this.polygonRenderer_ = polygonRenderer;
    /**
     * @private
     */
    this.lineStringRenderer_ = lineStringRenderer;
    /**
     * @private
     */
    this.pointRenderer_ = pointRenderer;

    /**
     * @private
     */
    this.renderInstructionsTransform_ = createTransform();

    this.setTile(options.tile);
  }

  uploadTile_() {
    this.batch.clear();
    const sourceTiles = this.tile.getSourceTiles();
    const features = sourceTiles.reduce(
      (accumulator, sourceTile) => accumulator.concat(sourceTile.getFeatures()),
      []
    );
    this.batch.addFeatures(features);

    const tileOriginX = sourceTiles[0].extent[0];
    const tileOriginY = sourceTiles[0].extent[1];
    resetTransform(this.renderInstructionsTransform_);
    translateTransform(
      this.renderInstructionsTransform_,
      -tileOriginX,
      -tileOriginY
    );

    let remaining = 3;
    const rebuildCb = () => {
      remaining--;
      if (remaining === 0) {
        this.setReady();
      }
    };

    // split geometry processing into separate tasks to avoid blocking the UI thread
    setTimeout(() => {
      this.polygonRenderer_.rebuild(
        this.batch.polygonBatch,
        this.renderInstructionsTransform_,
        'Polygon',
        rebuildCb
      );
    });
    setTimeout(() => {
      this.lineStringRenderer_.rebuild(
        this.batch.lineStringBatch,
        this.renderInstructionsTransform_,
        'LineString',
        rebuildCb
      );
    });
    setTimeout(() => {
      this.pointRenderer_.rebuild(
        this.batch.pointBatch,
        this.renderInstructionsTransform_,
        'Point',
        rebuildCb
      );
    });
  }
}

export default TileGeometry;
