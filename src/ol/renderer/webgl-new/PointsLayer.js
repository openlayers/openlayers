/**
 * @module ol/renderer/webgl-new/PointsLayer
 */
import LayerRenderer from '../Layer';
import WebGLBuffer from '../../webgl/Buffer';
import {DYNAMIC_DRAW, ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, FLOAT} from '../../webgl';
import WebGLHelper, {DefaultAttrib, DefaultUniform} from '../../webgl/Helper';
import WebGLVertex from "../../webgl/Vertex";
import WebGLFragment from "../../webgl/Fragment";
import GeometryType from "../../geom/GeometryType";

const VERTEX_SHADER = `
  precision mediump float;
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  attribute float a_rotateWithView;
  attribute vec2 a_offsets;
  
  uniform mat4 u_projectionMatrix;
  uniform mat4 u_offsetScaleMatrix;
  uniform mat4 u_offsetRotateMatrix;
  
  varying vec2 v_texCoord;
  
  void main(void) {
    mat4 offsetMatrix = u_offsetScaleMatrix;
    if (a_rotateWithView == 1.0) {
      offsetMatrix = u_offsetScaleMatrix * u_offsetRotateMatrix;
    }
    vec4 offsets = offsetMatrix * vec4(a_offsets, 0.0, 0.0);
    gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0) + offsets;
    v_texCoord = a_texCoord;
  }`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform float u_opacity;
  
  varying vec2 v_texCoord;
  
  void main(void) {
    gl_FragColor.rgb = vec3(1.0, 1.0, 1.0);
    float alpha = u_opacity;
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
  constructor(vectorLayer, opt_options) {
    super(vectorLayer);

    const options = opt_options || {};

    this.context_ = new WebGLHelper({
      postProcessingShader: options.postProcessingShader
    });

    this.sourceRevision_ = -1;

    this.verticesBuffer_ = new WebGLBuffer([], DYNAMIC_DRAW);
    this.indicesBuffer_ = new WebGLBuffer([], DYNAMIC_DRAW);

    const vertexShader = new WebGLVertex(options.vertexShader || VERTEX_SHADER);
    const fragmentShader = new WebGLFragment(options.fragmentShader || FRAGMENT_SHADER);
    this.program_ = this.context_.getProgram(fragmentShader, vertexShader);
    this.context_.useProgram(this.program_);

    this.sizeCallback_ = options.sizeCallback || function(feature) {
      return 1;
    };
    this.coordCallback_ = options.coordCallback || function(feature, index) {
      const geom = /** @type {import("../../geom/Point").default} */ (feature.getGeometry());
      return geom.getCoordinates()[index];
    }
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
  renderFrame(frameState, layerState) {
    this.context_.applyFrameState(frameState);
    this.context_.setUniformFloatValue(DefaultUniform.OPACITY, layerState.opacity);
    this.context_.drawElements(0, this.indicesBuffer_.getArray().length);
    this.context_.finalizeDraw();
    return this.context_.getCanvas();
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState) {
    const vectorLayer = /** @type {import("../../layer/Vector.js").default} */ (this.getLayer());
    const vectorSource = /** @type {import("../../source/Vector.js").default} */ (vectorLayer.getSource());

    this.context_.prepareDraw(frameState.size, frameState.pixelRatio);

    if (this.sourceRevision_ < vectorSource.getRevision()) {
      this.sourceRevision_ = vectorSource.getRevision();

      const viewState = frameState.viewState;
      const projection = viewState.projection;
      const resolution = viewState.resolution;

      // loop on features to fill the buffer
      vectorSource.loadFeatures([-Infinity, -Infinity, Infinity, Infinity], resolution, projection);
      vectorSource.forEachFeature((feature) => {
        if (!feature.getGeometry() || feature.getGeometry().getType() !== GeometryType.POINT) {
          return;
        }
        const geom = /** @type {import("../../geom/Point").default} */ (feature.getGeometry());
        const x = this.coordCallback_(feature, 0);
        const y = this.coordCallback_(feature, 1);
        const size = this.sizeCallback_(feature);
        let stride = 6;
        let baseIndex = this.verticesBuffer_.getArray().length / stride;

        this.verticesBuffer_.getArray().push(
          x, y, -size / 2, -size / 2, 0, 0,
          x, y, +size / 2, -size / 2, 1, 0,
          x, y, +size / 2, +size / 2, 1, 1,
          x, y, -size / 2, +size / 2, 0, 1,
        );
        this.indicesBuffer_.getArray().push(
          baseIndex, baseIndex + 1, baseIndex + 3,
          baseIndex + 1, baseIndex + 2, baseIndex + 3
        );
      });
    }

    // write new data
    this.context_.bindBuffer(ARRAY_BUFFER, this.verticesBuffer_);
    this.context_.bindBuffer(ELEMENT_ARRAY_BUFFER, this.indicesBuffer_);

    let bytesPerFloat = Float32Array.BYTES_PER_ELEMENT;
    this.context_.enableAttributeArray(DefaultAttrib.POSITION, 2, FLOAT, bytesPerFloat * 6, 0);
    this.context_.enableAttributeArray(DefaultAttrib.OFFSETS, 2, FLOAT, bytesPerFloat * 6, bytesPerFloat * 2);
    this.context_.enableAttributeArray(DefaultAttrib.TEX_COORD, 2, FLOAT, bytesPerFloat * 6, bytesPerFloat * 4);

    return true;
  }
}

export default WebGLPointsLayerRenderer;
