/**
 * @module ol/render/webgl/LineStringBatchRenderer
 */
import AbstractBatchRenderer from './BatchRenderer.js';
import {AttributeType} from '../../webgl/Helper.js';
import {transform2D} from '../../geom/flat/transform.js';

/**
 * Names of attributes made available to the vertex shader.
 * Please note: changing these *will* break custom shaders!
 * @enum {string}
 */
export const Attributes = {
  SEGMENT_START: 'a_segmentStart',
  SEGMENT_END: 'a_segmentEnd',
  PARAMETERS: 'a_parameters',
};

class LineStringBatchRenderer extends AbstractBatchRenderer {
  /**
   * @param {import("../../webgl/Helper.js").default} helper WebGL helper instance
   * @param {Worker} worker WebGL worker instance
   * @param {string} vertexShader Vertex shader
   * @param {string} fragmentShader Fragment shader
   * @param {Array<import('./BatchRenderer.js').CustomAttribute>} customAttributes List of custom attributes
   */
  constructor(helper, worker, vertexShader, fragmentShader, customAttributes) {
    super(helper, worker, vertexShader, fragmentShader, customAttributes);

    // vertices for lines must hold both a position (x,y) and an offset (dx,dy)
    this.attributes = [
      {
        name: Attributes.SEGMENT_START,
        size: 2,
        type: AttributeType.FLOAT,
      },
      {
        name: Attributes.SEGMENT_END,
        size: 2,
        type: AttributeType.FLOAT,
      },
      {
        name: Attributes.PARAMETERS,
        size: 1,
        type: AttributeType.FLOAT,
      },
    ].concat(
      customAttributes.map(function (attribute) {
        return {
          name: 'a_' + attribute.name,
          size: 1,
          type: AttributeType.FLOAT,
        };
      })
    );
  }

  /**
   * Render instructions for lines are structured like so:
   * [ customAttr0, ... , customAttrN, numberOfVertices0, x0, y0, ... , xN, yN, numberOfVertices1, ... ]
   * @param {import("./MixedGeometryBatch.js").LineStringGeometryBatch} batch Linestring geometry batch
   * @override
   */
  generateRenderInstructions(batch) {
    // here we anticipate the amount of render instructions for lines:
    // 2 instructions per vertex for position (x and y)
    // + 1 instruction per line per custom attributes
    // + 1 instruction per line (for vertices count)
    const totalInstructionsCount =
      2 * batch.verticesCount +
      (1 + this.customAttributes.length) * batch.geometriesCount;
    if (
      !batch.renderInstructions ||
      batch.renderInstructions.length !== totalInstructionsCount
    ) {
      batch.renderInstructions = new Float32Array(totalInstructionsCount);
    }

    // loop on features to fill the render instructions
    const flatCoords = [];
    let renderIndex = 0;
    for (const featureUid in batch.entries) {
      const batchEntry = batch.entries[featureUid];
      for (let i = 0, ii = batchEntry.flatCoordss.length; i < ii; i++) {
        flatCoords.length = batchEntry.flatCoordss[i].length;
        transform2D(
          batchEntry.flatCoordss[i],
          0,
          flatCoords.length,
          2,
          batch.renderInstructionsTransform,
          flatCoords
        );

        // custom attributes
        for (let k = 0, kk = this.customAttributes.length; k < kk; k++) {
          const value = this.customAttributes[k].callback(batchEntry.feature);
          batch.renderInstructions[renderIndex++] = value;
        }

        // vertices count
        batch.renderInstructions[renderIndex++] = flatCoords.length / 2;

        // looping on points for positions
        for (let j = 0, jj = flatCoords.length; j < jj; j += 2) {
          batch.renderInstructions[renderIndex++] = flatCoords[j];
          batch.renderInstructions[renderIndex++] = flatCoords[j + 1];
        }
      }
    }
  }
}

export default LineStringBatchRenderer;
