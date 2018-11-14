/**
 * @module ol/renderer/webgl-new/PointsLayer
 */
import LayerRenderer from '../Layer';
import WebGLBuffer from '../../webgl/Buffer';
import {DYNAMIC_DRAW, ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER} from '../../webgl';
import WebGLContext, {DefaultUniform} from '../../webgl/Context';
import WebGLVertex from "../../webgl/Vertex";
import WebGLFragment from "../../webgl/Fragment";

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  attribute float a_opacity;
  attribute float a_rotateWithView;
  
  uniform mat4 u_projectionMatrix;
  uniform mat4 u_offsetScaleMatrix;
  uniform mat4 u_offsetRotateMatrix;
  
  varying vec2 v_texCoord;
  varying float v_opacity;
  
  void main(void) {
    mat4 offsetMatrix = u_offsetScaleMatrix;
    if (a_rotateWithView == 1.0) {
      offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;
    }
    vec4 offsets = offsetMatrix * vec4(a_offsets, 0.0, 0.0);
    gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
    v_texCoord = a_texCoord;
    v_opacity = a_opacity;
  }`;

const FRAGMENT_SHADER = `
  uniform float u_opacity;
  uniform sampler2D u_image;
  
  varying vec2 v_texCoord;
  varying float v_opacity;
  
  void main(void) {
    vec4 texColor = texture2D(u_image, v_texCoord);
    gl_FragColor.rgb = texColor.rgb;
    float alpha = texColor.a * v_opacity * u_opacity;
    if (alpha == 0.0) {
      discard;
    }
    gl_FragColor.a = alpha;
  }`;

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

    this.verticesBuffer_ = new WebGLBuffer([], DYNAMIC_DRAW);
    this.indicesBuffer_ = new WebGLBuffer([], DYNAMIC_DRAW);

    const vertexShader = new WebGLVertex(VERTEX_SHADER);
    const fragmentShader = new WebGLFragment(FRAGMENT_SHADER);
    const program = this.context_.getProgram(fragmentShader, vertexShader);
    this.context_.useProgram(program);
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
    const vectorLayer = /** @type {import("../../layer/Vector.js").default} */ (this.getLayer());
    const vectorSource = /** @type {import("../../source/Vector.js").default} */ (vectorLayer.getSource());

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
