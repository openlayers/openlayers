/**
 * @module ol/webgl/TileGeometry
 */

import MixedGeometryBatch from '../render/webgl/MixedGeometryBatch.js';
import VectorSource from '../source/Vector.js';
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
     * @type {import("../render/webgl/VectorStyleRenderer.js").WebGLBuffers}
     */
    this.buffers = null;

    /**
     * Each geometry tile also has a mask which consisted of a quad (two triangles); this mask is intended to
     * be rendered to an offscreen buffer, and be used to correctly mask tiles according to their zoom level
     * during rendering
     */
    this.maskVertices = new WebGLArrayBuffer(ARRAY_BUFFER, STATIC_DRAW);

    /**
     * @type {Array<import("../Feature.js").default|import("../render/Feature.js").default>}
     */
    this.features = null;

    this.vectorSource_ = new VectorSource({
      features: [],
      useSpatialIndex: true,
    });

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
    this.features = sourceTiles.reduce(
      (accumulator, sourceTile) => accumulator.concat(sourceTile.getFeatures()),
      [],
    );
    this.batch_.addFeatures(this.features);
    this.vectorSource_.addFeatures(this.features);

    const tileOriginX = sourceTiles[0].extent[0];
    const tileOriginY = sourceTiles[0].extent[1];
    const transform = translateTransform(
      createTransform(),
      -tileOriginX,
      -tileOriginY,
    );

    this.styleRenderer_
      .generateBuffers(this.batch_, transform)
      .then((buffers) => {
        this.buffers = buffers;
        this.setReady();
      });
  }

  getFeatures() {
    return this.batch_;
  }

  getSource() {
    return this.vectorSource_;
  }

  /**
   * @override
   */
  disposeInternal() {
    if (this.buffers) {
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
      this.buffers.pointBuffers &&
        disposeBuffersOfType(this.buffers.pointBuffers);
      this.buffers.lineStringBuffers &&
        disposeBuffersOfType(this.buffers.lineStringBuffers);
      this.buffers.polygonBuffers &&
        disposeBuffersOfType(this.buffers.polygonBuffers);
      this.styleRenderer_.disposeTextInstructions(
        this.buffers.textInstructionsKey,
      );
    }
    super.disposeInternal();
  }
}

export default TileGeometry;
