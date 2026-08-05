/**
 * @module ol/webgl/TileGeometry
 */

import MixedGeometryBatch from '../render/webgl/MixedGeometryBatch.js';
import {
  create as createTransform,
  translate as translateTransform,
} from '../transform.js';
import {ARRAY_BUFFER, STATIC_DRAW} from '../webgl.js';
import BaseTileRepresentation from './BaseTileRepresentation.js';
import WebGLArrayBuffer from './Buffer.js';

/**
 * @typedef {import("../VectorRenderTile.js").default} TileType
 */

/**
 * @extends {BaseTileRepresentation<TileType>}
 */
class TileGeometry extends BaseTileRepresentation {
  /**
   * @param {import("./BaseTileRepresentation.js").TileRepresentationOptions<TileType>} options The tile texture options.
   * @param {import("../render/webgl/VectorStyleRenderer.js").default} styleRenderer Vector style renderer
   */
  constructor(options, styleRenderer) {
    super(options);

    /**
     * @private
     */
    this.batch_ = new MixedGeometryBatch();

    /**
     * @private
     */
    this.styleRenderer_ = styleRenderer;

    /**
     * @type {import("../render/webgl/VectorStyleRenderer.js").WebGLBuffers|null}
     */
    this.buffers = null;

    /**
     * Each geometry tile also has a mask which consisted of a quad (two triangles); this mask is intended to
     * be rendered to an offscreen buffer, and be used to correctly mask tiles according to their zoom level
     * during rendering; these coordinates are expressed in the same coordinate system as the tile geometries
     */
    this.maskVertices = new WebGLArrayBuffer(ARRAY_BUFFER, STATIC_DRAW);

    /**
     * @type {number}
     */
    this.wantedResolution = options.grid.getResolution(
      options.tile.getTileCoord()[0],
    );

    this.setTile(options.tile);
  }

  /**
   * @private
   */
  generateMaskBuffer_() {
    const sourceTile = this.tile.getSourceTiles()[0];
    const extent = sourceTile.extent;
    if (!extent) {
      return;
    }
    const originX = extent[0];
    const originY = extent[1];
    const width = extent[2] - originX;
    const height = extent[3] - originY;
    this.maskVertices.fromArray([0, 0, width, 0, width, height, 0, height]);
    /** @type {import("./Helper.js").default} */ (this.helper).flushBufferData(
      this.maskVertices,
    );
  }

  /**
   * @override
   */
  uploadTile() {
    if (!this.helper) {
      return;
    }
    this.generateMaskBuffer_();

    this.batch_.clear();
    const sourceTiles = this.tile.getSourceTiles();
    /** @type {Array<import("../Feature.js").default|import("../render/Feature.js").default>} */
    const features = [];
    for (const sourceTile of sourceTiles) {
      const tileFeatures = sourceTile.getFeatures();
      if (!tileFeatures) {
        continue;
      }
      for (let i = 0; i < tileFeatures.length; ++i) {
        features.push(
          /** @type {import("../Feature.js").default|import("../render/Feature.js").default} */ (
            tileFeatures[i]
          ),
        );
      }
    }

    const firstExtent = sourceTiles[0].extent;
    if (!firstExtent) {
      return;
    }
    const tileOriginX = firstExtent[0];
    const tileOriginY = firstExtent[1];
    const transform = translateTransform(
      createTransform(),
      -tileOriginX,
      -tileOriginY,
    );

    this.batch_.addFeatures(features);

    this.styleRenderer_
      .generateBuffers(this.batch_, transform, this.wantedResolution)
      .then((buffers) => {
        this.buffers = buffers;
        this.setReady();
      });
  }

  /**
   * @override
   */
  disposeInternal() {
    const helper = this.helper;
    if (this.buffers && helper) {
      /**
       * @param {Array<WebGLArrayBuffer>} typeBuffers Buffers
       */
      const disposeBuffersOfType = (typeBuffers) => {
        for (const buffer of typeBuffers) {
          if (buffer) {
            helper.deleteBuffer(buffer);
          }
        }
      };
      this.buffers.pointBuffers &&
        disposeBuffersOfType(this.buffers.pointBuffers);
      this.buffers.lineStringBuffers &&
        disposeBuffersOfType(this.buffers.lineStringBuffers);
      this.buffers.polygonBuffers &&
        disposeBuffersOfType(this.buffers.polygonBuffers);
      this.styleRenderer_.disposeTextInstructions(
        this.buffers.textInstructionsKey ?? '',
      );
    }
    super.disposeInternal();
  }
}

export default TileGeometry;
