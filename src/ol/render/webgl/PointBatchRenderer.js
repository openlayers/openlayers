/**
 * @module ol/render/webgl/PointBatchRenderer
 */

import {apply as applyTransform} from '../../transform.js';
import {AttributeType} from '../../webgl/Helper.js';
import AbstractBatchRenderer from './BatchRenderer.js';

class PointBatchRenderer extends AbstractBatchRenderer {
  /**
   * @param {import("../../webgl/Helper.js").default} helper
   * @param {Worker} worker
   * @param {string} vertexShader
   * @param {string} fragmentShader
   * @param {Array<import('./BatchRenderer.js').CustomAttribute>} customAttributes
   */
  constructor(helper, worker, vertexShader, fragmentShader, customAttributes) {
    super(helper, worker, vertexShader, fragmentShader, customAttributes);

    // vertices for point must hold both a position (x,y) and an index (their position in the quad)
    this.attributes_ = [
      {
        name: 'a_position',
        size: 2,
        type: AttributeType.FLOAT,
      },
      {
        name: 'a_index',
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
   * @param {import("./MixedGeometryBatch.js").PointGeometryBatch} batch
   * @override
   */
  generateRenderInstructions_(batch) {
    // here we anticipate the amount of render instructions for points:
    // 2 instructions per vertex for position (x and y)
    // + 1 instruction per vertex per custom attributes
    const totalInstructionsCount =
      (2 + this.customAttributes_.length) * batch.geometriesCount;
    if (
      !batch.renderInstructions ||
      batch.renderInstructions.length !== totalInstructionsCount
    ) {
      batch.renderInstructions = new Float32Array(totalInstructionsCount);
    }

    // loop on features to fill the render instructions
    let batchEntry;
    const tmpCoords = [];
    let renderIndex = 0;
    let value;
    for (const featureUid in batch.entries) {
      batchEntry = batch.entries[featureUid];
      for (let i = 0, ii = batchEntry.flatCoordss.length; i < ii; i++) {
        tmpCoords[0] = batchEntry.flatCoordss[i][0];
        tmpCoords[1] = batchEntry.flatCoordss[i][1];
        applyTransform(batch.renderInstructionsTransform, tmpCoords);

        batch.renderInstructions[renderIndex++] = tmpCoords[0];
        batch.renderInstructions[renderIndex++] = tmpCoords[1];

        // pushing custom attributes
        for (let j = 0, jj = this.customAttributes_.length; j < jj; j++) {
          value = this.customAttributes_[j].callback(
            batchEntry.feature,
            batchEntry.properties
          );
          batch.renderInstructions[renderIndex++] = value;
        }
      }
    }
  }
}

export default PointBatchRenderer;
