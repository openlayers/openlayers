/**
 * @module ol/render/webgl/PointBatchRenderer
 */

import AbstractBatchRenderer from './BatchRenderer.js';
import {AttributeType} from '../../webgl/Helper.js';
import {apply as applyTransform} from '../../transform.js';

/**
 * Names of attributes made available to the vertex shader.
 * Please note: changing these *will* break custom shaders!
 * @enum {string}
 */
export const Attributes = {
  POSITION: 'a_position',
  INDEX: 'a_index',
};

class PointBatchRenderer extends AbstractBatchRenderer {
  /**
   * @param {import("../../webgl/Helper.js").default} helper WebGL helper instance
   * @param {Worker} worker WebGL worker instance
   * @param {string} vertexShader Vertex shader
   * @param {string} fragmentShader Fragment shader
   * @param {Array<import('./BatchRenderer.js').CustomAttribute>} customAttributes List of custom attributes
   */
  constructor(helper, worker, vertexShader, fragmentShader, customAttributes) {
    super(helper, worker, vertexShader, fragmentShader, customAttributes);

    // vertices for point must hold both a position (x,y) and an index (their position in the quad)
    this.attributes = [
      {
        name: Attributes.POSITION,
        size: 2,
        type: AttributeType.FLOAT,
      },
      {
        name: Attributes.INDEX,
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
   * [ x0, y0, customAttr0, ... , xN, yN, customAttrN ]
   * @param {import("./MixedGeometryBatch.js").PointGeometryBatch} batch Point geometry batch
   * @override
   */
  generateRenderInstructions(batch) {
    // here we anticipate the amount of render instructions for points:
    // 2 instructions per vertex for position (x and y)
    // + 1 instruction per vertex per custom attributes
    const totalInstructionsCount =
      (2 + this.customAttributes.length) * batch.geometriesCount;
    if (
      !batch.renderInstructions ||
      batch.renderInstructions.length !== totalInstructionsCount
    ) {
      batch.renderInstructions = new Float32Array(totalInstructionsCount);
    }

    // loop on features to fill the render instructions
    const tmpCoords = [];
    let renderIndex = 0;
    for (const featureUid in batch.entries) {
      const batchEntry = batch.entries[featureUid];
      for (let i = 0, ii = batchEntry.flatCoordss.length; i < ii; i++) {
        tmpCoords[0] = batchEntry.flatCoordss[i][0];
        tmpCoords[1] = batchEntry.flatCoordss[i][1];
        applyTransform(batch.renderInstructionsTransform, tmpCoords);

        batch.renderInstructions[renderIndex++] = tmpCoords[0];
        batch.renderInstructions[renderIndex++] = tmpCoords[1];

        // pushing custom attributes
        for (let j = 0, jj = this.customAttributes.length; j < jj; j++) {
          const value = this.customAttributes[j].callback(batchEntry.feature);
          batch.renderInstructions[renderIndex++] = value;
        }
      }
    }
  }
}

export default PointBatchRenderer;
