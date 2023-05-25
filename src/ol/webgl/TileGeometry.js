/**
 * @module ol/webgl/TileGeometry
 */

import BaseTileRepresentation from './BaseTileRepresentation.js';
import MixedGeometryBatch from '../render/webgl/MixedGeometryBatch.js';
import {
  create as createTransform,
  translate as translateTransform,
} from '../transform.js';

/**
 * @typedef {import("../VectorRenderTile").default} TileType
 */

/**
 * @extends {BaseTileRepresentation<TileType>}
 */
class TileGeometry extends BaseTileRepresentation {
  /**
   * @param {import("./BaseTileRepresentation.js").TileRepresentationOptions<TileType>} options The tile texture options.
   * @param {Array<import("../render/webgl/VectorStyleRenderer.js").default>} styleRenderers Array of vector style renderers
   */
  constructor(options, styleRenderers) {
    super(options);

    /**
     * @private
     */
    this.batch_ = new MixedGeometryBatch();

    /**
     * @private
     */
    this.styleRenderers_ = styleRenderers;

    /**
     * @type {Array<import("../render/webgl/VectorStyleRenderer.js").WebGLBuffers>}
     */
    this.buffers = [];

    this.setTile(options.tile);
  }

  uploadTile() {
    this.batch_.clear();
    const sourceTiles = this.tile.getSourceTiles();
    const features = sourceTiles.reduce(
      (accumulator, sourceTile) => accumulator.concat(sourceTile.getFeatures()),
      []
    );
    this.batch_.addFeatures(features);

    const tileOriginX = sourceTiles[0].extent[0];
    const tileOriginY = sourceTiles[0].extent[1];
    const transform = translateTransform(
      createTransform(),
      -tileOriginX,
      -tileOriginY
    );

    const generatePromises = this.styleRenderers_.map((renderer, i) =>
      renderer.generateBuffers(this.batch_, transform).then((buffers) => {
        this.buffers[i] = buffers;
      })
    );
    Promise.all(generatePromises).then(() => {
      this.setReady();
    });
  }
}

export default TileGeometry;
