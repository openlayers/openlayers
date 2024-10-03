/**
 * @module ol/renderer/webgl/FlowLayer
 */
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import WebGLTileLayerRenderer from './TileLayer.js';
import {ARRAY_BUFFER, STATIC_DRAW} from '../../webgl.js';
import {DefaultUniform} from '../../webgl/Helper.js';

/**
 * @typedef {import("../../layer/Flow.js").default} LayerType
 */

/**
 * @typedef {Object} Options
 * @property {number} maxSpeed The maximum particle speed in the input data.
 * @property {number} [speedFactor=0.001] A larger factor increases the rate at which particles cross the screen.
 * @property {number} [particles=65536] The number of particles to render.
 * @property {number} [cacheSize=512] The texture cache size.
 * @property {string} tileVertexShader The flow tile vertex shader.
 * @property {string} tileFragmentShader The flow tile fragment shader.
 * @property {string} textureVertexShader Generic texture fragment shader.
 * @property {string} textureFragmentShader Generic texture fragment shader.
 * @property {string} particlePositionVertexShader The particle position vertex shader.
 * @property {string} particlePositionFragmentShader The particle position fragment shader.
 * @property {string} particleColorVertexShader The particle color vertex shader.
 * @property {string} particleColorFragmentShader The particle color fragment shader.
 */

/**
 * Shader uniforms.
 * @enum {string}
 */
export const U = {
  TEXTURE: 'u_texture',
  VELOCITY_TEXTURE: 'u_velocityTexture',
  POSITION_TEXTURE: 'u_positionTexture',
  PARTICLE_COUNT_SQRT: 'u_particleCountSqrt',
  MAX_SPEED: 'u_maxSpeed',
  GAIN: 'u_gain',
  OFFSET: 'u_offset',
  IS_FLOAT: 'u_isFloat',
  RANDOM_SEED: 'u_randomSeed',
  SPEED_FACTOR: 'u_speedFactor',
  DROP_RATE: 'u_dropRate',
  DROP_RATE_BUMP: 'u_dropRateBump',
  OPACITY: 'u_opacity',
  ROTATION: DefaultUniform.ROTATION,
  VIEWPORT_SIZE_PX: DefaultUniform.VIEWPORT_SIZE_PX,
};

/**
 * Shader attributes.
 * @enum {string}
 */
export const A = {
  POSITION: 'a_position',
  INDEX: 'a_index',
};

/**
 * Shader varyings.
 * @enum {string}
 */
export const V = {
  POSITION: 'v_position',
};

/**
 * @classdesc
 * Experimental WebGL renderer for vector fields.
 * @extends {WebGLTileLayerRenderer<LayerType>}
 */
class FlowLayerRenderer extends WebGLTileLayerRenderer {
  /**
   * @param {LayerType} layer The tiled field layer.
   * @param {Options} options The renderer options.
   */
  constructor(layer, options) {
    super(layer, {
      vertexShader: options.tileVertexShader,
      fragmentShader: options.tileFragmentShader,
      cacheSize: options.cacheSize,
      // TODO: rework the post-processing logic
      // see https://github.com/openlayers/openlayers/issues/16120
      postProcesses: [{}],
      uniforms: {
        [U.MAX_SPEED]: options.maxSpeed,
      },
    });

    /**
     * @type {string}
     * @private
     */
    this.particleColorFragmentShader_ = options.particleColorFragmentShader;

    /**
     * @type {WebGLTexture|null}
     * @private
     */
    this.velocityTexture_ = null;

    /**
     * @type {number}
     * @private
     */
    this.particleCountSqrt_ = options.particles
      ? Math.ceil(Math.sqrt(options.particles))
      : 256;

    /**
     * @type {WebGLArrayBuffer}
     * @private
     */
    this.particleIndexBuffer_;

    /**
     * @type {WebGLArrayBuffer}
     * @private
     */
    this.quadBuffer_;

    /**
     * @type {WebGLProgram}
     * @private
     */
    this.particlePositionProgram_;

    /**
     * @type {string}
     * @private
     */
    this.particlePositionVertexShader_ = options.particlePositionVertexShader;

    /**
     * @type {string}
     * @private
     */
    this.particlePositionFragmentShader_ =
      options.particlePositionFragmentShader;

    /**
     * @type {WebGLTexture}
     * @private
     */
    this.previousPositionTexture_;

    /**
     * @type {WebGLTexture}
     * @private
     */
    this.nextPositionTexture_;

    /**
     * @type {WebGLProgram}
     * @private
     */
    this.particleColorProgram_;

    /**
     * @type {string}
     * @private
     */
    this.particleColorVertexShader_ = options.particleColorVertexShader;

    /**
     * @type {string}
     * @private
     */
    this.particleColorFragmentShader_ = options.particleColorFragmentShader;

    /**
     * @type {WebGLProgram}
     * @private
     */
    this.textureProgram_;

    /**
     * @type {string}
     * @private
     */
    this.textureVertexShader_ = options.textureVertexShader;

    /**
     * @type {string}
     * @private
     */
    this.textureFragmentShader_ = options.textureFragmentShader;

    /**
     * @type {WebGLTexture}
     * @private
     */
    this.previousTrailsTexture_;

    /**
     * @type {WebGLTexture}
     * @private
     */
    this.nextTrailsTexture_;

    /**
     * @type {number}
     * @private
     */
    this.fadeOpacity_ = 0.996; // how fast the particle trails fade on each frame

    /**
     * @type {number}
     * @private
     */
    this.maxSpeed_ = options.maxSpeed;

    /**
     * @type {number}
     * @private
     */
    this.speedFactor_ = options.speedFactor || 0.001;

    /**
     * @type {number}
     * @private
     */
    this.dropRate_ = 0.003; // how often the particles move to a random place

    /**
     * @type {number}
     * @private
     */
    this.dropRateBump_ = 0.01; // drop rate increase relative to individual particle speed

    /**
     * @type {Array<number>}
     * @private
     */
    this.tempVec2_ = [0, 0];

    /**
     * @type {number}
     * @private
     */
    this.renderedWidth_ = 0;

    /**
     * @type {number}
     * @private
     */
    this.renderedHeight_ = 0;
  }

  /**
   * @override
   */
  afterHelperCreated() {
    super.afterHelperCreated();
    const helper = this.helper;

    const gl = helper.getGL();
    this.framebuffer_ = gl.createFramebuffer();

    const particleCount = this.particleCountSqrt_ * this.particleCountSqrt_;
    const particleIndices = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; ++i) {
      particleIndices[i] = i;
    }
    const particleIndexBuffer = new WebGLArrayBuffer(ARRAY_BUFFER, STATIC_DRAW);
    particleIndexBuffer.setArray(particleIndices);
    helper.flushBufferData(particleIndexBuffer);
    this.particleIndexBuffer_ = particleIndexBuffer;

    const quadIndices = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
    const quadBuffer = new WebGLArrayBuffer(ARRAY_BUFFER, STATIC_DRAW);
    quadBuffer.setArray(quadIndices);
    helper.flushBufferData(quadBuffer);
    this.quadBuffer_ = quadBuffer;

    const particlePositions = new Uint8Array(particleCount * 4);
    for (let i = 0; i < particlePositions.length; ++i) {
      particlePositions[i] = Math.floor(Math.random() * 256);
    }

    this.previousPositionTexture_ = helper.createTexture(
      [this.particleCountSqrt_, this.particleCountSqrt_],
      particlePositions,
      null,
      true,
    );

    this.nextPositionTexture_ = helper.createTexture(
      [this.particleCountSqrt_, this.particleCountSqrt_],
      particlePositions,
      null,
      true,
    );

    this.particlePositionProgram_ = helper.getProgram(
      this.particlePositionFragmentShader_,
      this.particlePositionVertexShader_,
    );

    this.particleColorProgram_ = helper.getProgram(
      this.particleColorFragmentShader_,
      this.particleColorVertexShader_,
    );

    this.textureProgram_ = helper.getProgram(
      this.textureFragmentShader_,
      this.textureVertexShader_,
    );
  }

  createSizeDependentTextures_() {
    const helper = this.helper;
    const gl = helper.getGL();
    const canvas = helper.getCanvas();
    const screenWidth = canvas.width;
    const screenHeight = canvas.height;

    const blank = new Uint8Array(screenWidth * screenHeight * 4);

    if (this.nextTrailsTexture_) {
      gl.deleteTexture(this.nextTrailsTexture_);
    }
    this.nextTrailsTexture_ = helper.createTexture(
      [screenWidth, screenHeight],
      blank,
      null,
      true,
    );

    if (this.previousTrailsTexture_) {
      gl.deleteTexture(this.previousTrailsTexture_);
    }
    this.previousTrailsTexture_ = helper.createTexture(
      [screenWidth, screenHeight],
      blank,
      null,
      true,
    );
  }

  /**
   * @override
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   */
  beforeFinalize(frameState) {
    const helper = this.helper;
    const gl = helper.getGL();
    const canvas = helper.getCanvas();
    const screenWidth = canvas.width;
    const screenHeight = canvas.height;

    if (
      this.renderedWidth_ != screenWidth ||
      this.renderedHeight_ != screenHeight
    ) {
      this.createSizeDependentTextures_();
    }

    const size = [screenWidth, screenHeight];

    // copy current frame buffer to the velocity texture
    this.velocityTexture_ = helper.createTexture(
      size,
      null,
      this.velocityTexture_,
    );
    gl.copyTexImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      0,
      0,
      screenWidth,
      screenHeight,
      0,
    );

    this.drawParticleTrails_(frameState);
    this.updateParticlePositions_(frameState);

    frameState.animate = true;
    this.renderedWidth_ = screenWidth;
    this.renderedHeight_ = screenHeight;
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   */
  drawParticleTrails_(frameState) {
    const helper = this.helper;
    const gl = helper.getGL();

    helper.bindFrameBuffer(this.framebuffer_, this.nextTrailsTexture_);

    this.drawTexture_(this.previousTrailsTexture_, this.fadeOpacity_);
    this.drawParticleColor_(frameState);

    helper.bindInitialFrameBuffer();
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.drawTexture_(this.nextTrailsTexture_, 1);
    gl.disable(gl.BLEND);

    const current = this.nextTrailsTexture_;
    this.nextTrailsTexture_ = this.previousTrailsTexture_;
    this.previousTrailsTexture_ = current;
  }

  /**
   * @param {WebGLTexture} texture The texture to draw.
   * @param {number} opacity The opacity.
   */
  drawTexture_(texture, opacity) {
    const helper = this.helper;
    const gl = helper.getGL();

    helper.useProgram(this.textureProgram_);
    helper.bindTexture(texture, 0, U.TEXTURE);
    helper.bindAttribute(this.quadBuffer_, A.POSITION, 2);
    this.helper.setUniformFloatValue(U.OPACITY, opacity);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   */
  drawParticleColor_(frameState) {
    const helper = this.helper;
    const gl = helper.getGL();

    helper.useProgram(this.particleColorProgram_);

    const particleCount = this.particleCountSqrt_ * this.particleCountSqrt_;

    helper.bindAttribute(this.particleIndexBuffer_, A.INDEX, 1);

    helper.bindTexture(this.previousPositionTexture_, 0, U.POSITION_TEXTURE);
    helper.bindTexture(this.velocityTexture_, 1, U.VELOCITY_TEXTURE);

    this.helper.setUniformFloatValue(
      U.PARTICLE_COUNT_SQRT,
      this.particleCountSqrt_,
    );

    const rotation = this.tempVec2_;
    rotation[0] = Math.cos(-frameState.viewState.rotation);
    rotation[1] = Math.sin(-frameState.viewState.rotation);
    this.helper.setUniformFloatVec2(U.ROTATION, rotation);

    this.helper.setUniformFloatValue(U.MAX_SPEED, this.maxSpeed_);

    gl.drawArrays(gl.POINTS, 0, particleCount);
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   */
  updateParticlePositions_(frameState) {
    const helper = this.helper;
    const gl = helper.getGL();

    helper.useProgram(this.particlePositionProgram_);
    gl.viewport(0, 0, this.particleCountSqrt_, this.particleCountSqrt_);
    helper.bindFrameBuffer(this.framebuffer_, this.nextPositionTexture_);

    helper.bindTexture(this.previousPositionTexture_, 0, U.POSITION_TEXTURE);
    helper.bindTexture(this.velocityTexture_, 1, U.VELOCITY_TEXTURE);
    helper.bindAttribute(this.quadBuffer_, A.POSITION, 2);

    helper.setUniformFloatValue(U.RANDOM_SEED, Math.random());
    helper.setUniformFloatValue(U.SPEED_FACTOR, this.speedFactor_);
    helper.setUniformFloatValue(U.DROP_RATE, this.dropRate_);
    helper.setUniformFloatValue(U.DROP_RATE_BUMP, this.dropRateBump_);

    const rotation = this.tempVec2_;
    rotation[0] = Math.cos(-frameState.viewState.rotation);
    rotation[1] = Math.sin(-frameState.viewState.rotation);
    this.helper.setUniformFloatVec2(U.ROTATION, rotation);

    const size = frameState.size;
    this.helper.setUniformFloatVec2(U.VIEWPORT_SIZE_PX, [size[0], size[1]]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    const current = this.nextPositionTexture_;
    this.nextPositionTexture_ = this.previousPositionTexture_;
    this.previousPositionTexture_ = current;
  }
}

export default FlowLayerRenderer;
