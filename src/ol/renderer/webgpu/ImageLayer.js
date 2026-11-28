/**
 * @module ol/renderer/webgpu/ImageLayer
 */
import ImageState from '../../ImageState.js';
import ViewHint from '../../ViewHint.js';
import {
  containsCoordinate,
  getHeight,
  getIntersection,
  getWidth,
  isEmpty,
} from '../../extent.js';
import {fromUserExtent} from '../../proj.js';
import {
  apply as applyTransform,
  create as createTransform,
  multiply as multiplyTransform,
  setFromArray as setTransformFromArray,
} from '../../transform.js';
import {getUid} from '../../util.js';
import {readImagePixel} from '../../webgpu/TileTexture.js';
import {TILE_SHADER} from '../../webgpu/shaders.js';
import WebGPULayerRenderer from './Layer.js';

/**
 * @classdesc
 * WebGPU renderer for image layers.
 * @extends {WebGPULayerRenderer<import("../../layer/Image.js").default<import("../../source/Image.js").default>>}
 */
class WebGPUImageLayerRenderer extends WebGPULayerRenderer {
  /**
   * @param {import("../../layer/Image.js").default<import("../../source/Image.js").default>} layer Layer.
   */
  constructor(layer) {
    super(layer);

    /**
     * @type {import("../../Image.js").default|null}
     */
    this.image = null;

    /**
     * @private
     * @type {number}
     */
    this.renderedSourceRevision_ = 0;

    /**
     * The image and source revision the texture holds.
     * @private
     * @type {string}
     */
    this.textureKey_ = '';

    /**
     * @private
     * @type {GPUTexture|null}
     */
    this.texture_ = null;

    /**
     * @private
     * @type {GPURenderPipeline|null}
     */
    this.pipeline_ = null;

    /**
     * @private
     * @type {GPUBuffer|null}
     */
    this.uniformBuffer_ = null;

    /**
     * @private
     * @type {GPUBindGroup|null}
     */
    this.bindGroup_ = null;

    /**
     * @private
     * @type {boolean|undefined}
     */
    this.bindGroupInterpolate_ = undefined;

    /**
     * @private
     * @type {Float32Array}
     */
    this.uniformData_ = new Float32Array(32);

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.transform_ = createTransform();

    /**
     * @protected
     * @type {import("../../Map.js").FrameState|null}
     */
    this.frameState = null;

    /**
     * Whether `renderFrame` left a draw for `renderDeferred`.
     * @private
     * @type {boolean}
     */
    this.pendingPaint_ = false;
  }

  /**
   * @override
   */
  afterHelperCreated() {
    this.clearCache();
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Ready.
   * @override
   */
  prepareFrameInternal(frameState) {
    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const viewState = frameState.viewState;
    const hints = frameState.viewHints;
    const imageSource = this.getLayer().getSource();

    let renderedExtent = /** @type {import("../../extent.js").Extent} */ (
      frameState.extent
    );
    if (layerState.extent !== undefined) {
      renderedExtent = getIntersection(
        renderedExtent,
        fromUserExtent(layerState.extent, viewState.projection),
      );
    }

    if (
      hints[ViewHint.ANIMATING] ||
      hints[ViewHint.INTERACTING] ||
      isEmpty(renderedExtent)
    ) {
      return !!this.image;
    }
    if (!imageSource) {
      this.image = null;
      return false;
    }
    if (
      !(
        /** @type {{rendered: (boolean|undefined)}} */ (
          /** @type {unknown} */ (this.getLayer())
        ).rendered
      ) &&
      this.renderedSourceRevision_ !== imageSource.getRevision()
    ) {
      this.image = null;
    }
    this.renderedSourceRevision_ = imageSource.getRevision();

    const image = imageSource.getImage(
      renderedExtent,
      viewState.resolution,
      frameState.pixelRatio,
      viewState.projection,
    );
    if (!image) {
      return !!this.image;
    }
    if (this.loadImage(image)) {
      this.image = image;
    } else if (image.getState() === ImageState.EMPTY) {
      this.image = null;
    }
    return !!this.image;
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {HTMLElement|null} target Target.
   * @return {HTMLElement} Canvas.
   * @override
   */
  renderFrame(frameState, target) {
    this.frameState = frameState;
    const helper = this.helper;
    if (!helper) {
      return /** @type {HTMLElement} */ (target);
    }
    this.pendingPaint_ = true;
    if (!frameState.declutter) {
      this.paintFrame_(frameState);
    }
    return helper.getCanvas();
  }

  /**
   * Paint in ascending layer order once decluttered layers have placed their labels.
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @override
   */
  renderDeferred(frameState) {
    if (!frameState.declutter) {
      return;
    }
    this.paintFrame_(frameState);
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @private
   */
  paintFrame_(frameState) {
    if (!this.pendingPaint_) {
      return;
    }
    this.pendingPaint_ = false;
    const helper = this.helper;
    if (!helper) {
      return;
    }
    this.preRender(frameState);
    helper.prepareDraw(frameState, false, this.getClearColor(frameState));
    this.drawImage_(frameState, helper.getRenderPass());
    helper.finalizeDraw(frameState);
    this.postRender(frameState);
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame.
   * @param {GPURenderPassEncoder} pass Pass.
   * @private
   */
  drawImage_(frameState, pass) {
    const helper = /** @type {import("../../webgpu/Helper.js").default} */ (
      this.helper
    );
    const image = this.image;
    const img = image?.getImage();
    if (!image || !img || !img.width || !img.height) {
      return;
    }
    const imageExtent = image.getExtent();
    const viewState = frameState.viewState;
    let renderExtent = imageExtent;
    const layerExtent =
      frameState.layerStatesArray[frameState.layerIndex].extent;
    if (layerExtent) {
      renderExtent = getIntersection(
        imageExtent,
        fromUserExtent(layerExtent, viewState.projection),
      );
      if (isEmpty(renderExtent)) {
        return;
      }
    }

    const texture = this.uploadImage_(
      image,
      /** @type {GPUCopyExternalImageSource} */ (img),
    );
    const interpolate = this.getLayer().getSource()?.getInterpolate() ?? true;
    if (!this.bindGroup_ || this.bindGroupInterpolate_ !== interpolate) {
      this.uniformBuffer_ ??= helper.getDevice().createBuffer({
        size: this.uniformData_.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      this.bindGroup_ = helper.getDevice().createBindGroup({
        layout: this.getPipeline_().getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: {buffer: this.uniformBuffer_}},
          {
            binding: 1,
            resource: interpolate
              ? helper.getLinearSampler()
              : helper.getNearestSampler(),
          },
          {binding: 2, resource: texture.createView()},
        ],
      });
      this.bindGroupInterpolate_ = interpolate;
    }

    const width = getWidth(imageExtent);
    const height = getHeight(imageExtent);
    // Texture coordinates to view pixels.
    const transform = multiplyTransform(
      setTransformFromArray(
        this.transform_,
        frameState.coordinateToPixelTransform,
      ),
      [width, 0, 0, -height, imageExtent[0], imageExtent[3]],
    );

    const data = this.uniformData_;
    data.fill(0);
    data.set(helper.worldToClip(frameState, transform), 0);
    // The shader clips in map units from the image's top left corner.
    data[16] = renderExtent[0] - imageExtent[0];
    data[17] = renderExtent[1] - imageExtent[3];
    data[18] = renderExtent[2] - imageExtent[0];
    data[19] = renderExtent[3] - imageExtent[3];
    data[21] = 1;
    data[22] = width;
    data[23] = height;
    data[24] = 1;
    // Layer opacity is applied by the canvas element.
    data[25] = 1;
    helper.writeBuffer(/** @type {GPUBuffer} */ (this.uniformBuffer_), data);

    pass.setPipeline(this.getPipeline_());
    pass.setBindGroup(0, this.bindGroup_);
    pass.setVertexBuffer(0, helper.getQuadBuffer());
    pass.draw(4);
  }

  /**
   * Upload the image unless the texture already holds it at the current
   * source revision. Sources like Raster draw new content into the same image.
   * @param {import("../../Image.js").default} image Image.
   * @param {GPUCopyExternalImageSource} img Image element.
   * @return {GPUTexture} Texture.
   * @private
   */
  uploadImage_(image, img) {
    const helper = /** @type {import("../../webgpu/Helper.js").default} */ (
      this.helper
    );
    const key = getUid(image) + ',' + this.renderedSourceRevision_;
    const texture = this.texture_;
    if (texture && key === this.textureKey_) {
      return texture;
    }
    this.textureKey_ = key;
    const {width, height} = /** @type {HTMLCanvasElement} */ (img);
    if (texture && texture.width === width && texture.height === height) {
      helper.copyTextureRegion(texture, img, 0, 0, width, height);
      return texture;
    }
    texture?.destroy();
    this.texture_ = helper.createTextureFromImage(img);
    this.bindGroup_ = null;
    return this.texture_;
  }

  /**
   * @return {GPURenderPipeline} Pipeline.
   * @private
   */
  getPipeline_() {
    if (this.pipeline_) {
      return this.pipeline_;
    }
    const helper = /** @type {import("../../webgpu/Helper.js").default} */ (
      this.helper
    );
    const module = helper.createShaderModule(TILE_SHADER);
    const blend = {
      srcFactor: 'one',
      dstFactor: 'one-minus-src-alpha',
      operation: 'add',
    };
    this.pipeline_ = helper.getRenderPipeline('image', {
      layout: 'auto',
      vertex: {
        module,
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: 8,
            attributes: [{shaderLocation: 0, offset: 0, format: 'float32x2'}],
          },
        ],
      },
      fragment: {
        module,
        entryPoint: 'fs_main',
        targets: [
          {
            format: helper.getFormat(),
            blend: /** @type {GPUBlendState} */ ({color: blend, alpha: blend}),
          },
        ],
      },
      primitive: {topology: 'triangle-strip'},
    });
    return this.pipeline_;
  }

  /**
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Uint8ClampedArray|null} Data at the pixel location.
   * @override
   */
  getData(pixel) {
    const frameState = this.frameState;
    const image = this.image;
    const img = image?.getImage();
    if (!frameState || !image || !img) {
      return null;
    }
    const coordinate = applyTransform(
      frameState.pixelToCoordinateTransform,
      pixel.slice(),
    );
    const layerExtent = this.getLayer().getExtent();
    if (
      layerExtent &&
      !containsCoordinate(
        fromUserExtent(layerExtent, frameState.viewState.projection),
        coordinate,
      )
    ) {
      return null;
    }
    const imageExtent = image.getExtent();
    const col = Math.floor(
      (img.width * (coordinate[0] - imageExtent[0])) / getWidth(imageExtent),
    );
    if (col < 0 || col >= img.width) {
      return null;
    }
    const row = Math.floor(
      (img.height * (imageExtent[3] - coordinate[1])) / getHeight(imageExtent),
    );
    if (row < 0 || row >= img.height) {
      return null;
    }
    return readImagePixel(img, col, row);
  }

  /**
   * @override
   */
  clearCache() {
    this.texture_?.destroy();
    this.texture_ = null;
    this.textureKey_ = '';
    this.uniformBuffer_?.destroy();
    this.uniformBuffer_ = null;
    this.bindGroup_ = null;
    this.pipeline_ = null;
  }
}

export default WebGPUImageLayerRenderer;
