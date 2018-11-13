/**
 * @module ol/renderer/webgl-new/PointsLayer
 */
import LayerRenderer from '../Layer';
import WebGLBuffer from '../../webgl/Buffer';
import {DYNAMIC_DRAW, ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER} from '../../webgl';
import WebGLContext, {DefaultUniform} from '../../webgl/Context';

/**
 * @classdesc
 * Webgl vector renderer optimized for points.
 * All features will be rendered as points.
 * @api
 */
class WebGLPointsLayerRenderer extends LayerRenderer {

  /**
   * @param {import("../../layer/Vector.js").default} vectorLayer Vector layer.
   */
  constructor(vectorLayer) {
    super(vectorLayer);

    this.element_ = document.createElement('canvas');

    this.context_ = new WebGLContext(this.element_);

    this.sourceRevision_ = -1;

    this.primitiveCount_ = 0;

    this.verticesBuffer_ = new WebGLBuffer();
    this.indicesBuffer_ = new WebGLBuffer();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  composeFrame(frameState) {
    this.context_.applyFrameState(frameState);
    this.context_.setUniformFloatValue(DefaultUniform.OPACITY, this.getLayer().getOpacity());
    this.context_.drawElements(0, this.primitiveCount_ * 3);
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState) {
    const vectorLayer = this.getLayer();
    const vectorSource = vectorLayer.getSource();

    if (this.sourceRevision_ >= vectorSource.getRevision()) {
      return false;
    }
    this.sourceRevision_ = vectorSource.getRevision();

    // loop on features to fill the buffer
    // vectorSource.loadFeatures(extent, resolution, projection);
    vectorSource.forEachFeature((feature) => {
      let x = 0, y = 0, size = 0;
      let baseIndex = this.verticesBuffer_.getArray().length / 3;

      // todo: put data in buffer
      this.verticesBuffer_.getArray().push(
        x - size / 2, y - size / 2,
        x + size / 2, y - size / 2,
        x + size / 2, y + size / 2,
        x - size / 2, y + size / 2,
      );
      this.indicesBuffer_.getArray().push(
        baseIndex, baseIndex + 1, baseIndex + 3,
        baseIndex + 1, baseIndex + 2, baseIndex + 3
      );
      this.primitiveCount_++;
    });

    // write new data
    this.context_.bindBuffer(ARRAY_BUFFER, this.verticesBuffer_);
    this.context_.bindBuffer(ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

    return true;
  }
}

export default WebGLPointsLayerRenderer;
