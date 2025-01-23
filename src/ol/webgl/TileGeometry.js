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

    /**
     * Each geometry tile also has a mask which consisted of a quad (two triangles); this mask is intended to
     * be rendered to an offscreen buffer, and be used to correctly mask tiles according to their zoom level
     * during rendering
     */
    this.maskVertices = new WebGLArrayBuffer(ARRAY_BUFFER, STATIC_DRAW);

    this.setTile(options.tile);
  }

  /**
   * @private
   */
  generateMaskBuffer_() {
    const extent = this.tile.getSourceTiles()[0].extent;
    this.maskVertices.fromArray([
      extent[0],
      extent[1],
      extent[2],
      extent[1],
      extent[2],
      extent[3],
      extent[0],
      extent[3],
    ]);
    this.helper.flushBufferData(this.maskVertices);
  }

  /**
   * @override
   */
  uploadTile() {
    this.generateMaskBuffer_();

    this.batch_.clear();
    const sourceTiles = this.tile.getSourceTiles();
    const features = sourceTiles.reduce(
      (accumulator, sourceTile) => accumulator.concat(sourceTile.getFeatures()),
      [],
    );
    this.batch_.addFeatures(features);

    const tileOriginX = sourceTiles[0].extent[0];
    const tileOriginY = sourceTiles[0].extent[1];
    const transform = translateTransform(
      createTransform(),
      -tileOriginX,
      -tileOriginY,
    );

    const generatePromises = this.styleRenderers_.map((renderer, i) =>
      renderer.generateBuffers(this.batch_, transform).then((buffers) => {
        this.buffers[i] = buffers;
      }),
    );
    Promise.all(generatePromises).then(() => {
      this.setReady();
    });
  }

  /**
   * @override
   */
  disposeInternal() {
    this.buffers.forEach((buffers) => {
      this.disposeBuffers(buffers);
    });
    super.disposeInternal();
  }

  /**
   * Will release a set of Webgl buffers
   * @param {import('../render/webgl/VectorStyleRenderer.js').WebGLBuffers} buffers Buffers
   */
  disposeBuffers(buffers) {
    /**
     * @param {Array<WebGLArrayBuffer>} typeBuffers Buffers
     */
    const disposeBuffersOfType = (typeBuffers) => {
      for (const buffer of typeBuffers) {
        if (buffer) {
          this.helper.deleteBuffer(buffer);
        }
      }
    };
    if (buffers.pointBuffers) {
      disposeBuffersOfType(buffers.pointBuffers);
    }
    if (buffers.lineStringBuffers) {
      disposeBuffersOfType(buffers.lineStringBuffers);
    }
    if (buffers.polygonBuffers) {
      disposeBuffersOfType(buffers.polygonBuffers);
    }
  }
}

export default TileGeometry;
