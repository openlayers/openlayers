/**
 * @module ol/render/webgl/ImageReplay
 */
import {getUid} from '../../util.js';
import WebGLTextureReplay from './TextureReplay.js';
import WebGLBuffer from '../../webgl/Buffer.js';

class WebGLImageReplay extends WebGLTextureReplay {
  /**
   * @param {number} tolerance Tolerance.
   * @param {import("../../extent.js").Extent} maxExtent Max extent.
   */
  constructor(tolerance, maxExtent) {
    super(tolerance, maxExtent);

    /**
     * @type {Array<HTMLCanvasElement|HTMLImageElement|HTMLVideoElement>}
     * @protected
     */
    this.images_ = [];

    /**
     * @type {Array<HTMLCanvasElement|HTMLImageElement|HTMLVideoElement>}
     * @protected
     */
    this.hitDetectionImages_ = [];

    /**
     * @type {Array<WebGLTexture>}
     * @private
     */
    this.textures_ = [];

    /**
     * @type {Array<WebGLTexture>}
     * @private
     */
    this.hitDetectionTextures_ = [];

  }

  /**
   * @inheritDoc
   */
  drawMultiPoint(multiPointGeometry, feature) {
    this.startIndices.push(this.indices.length);
    this.startIndicesFeature.push(feature);
    const flatCoordinates = multiPointGeometry.getFlatCoordinates();
    const stride = multiPointGeometry.getStride();
    this.drawCoordinates(
      flatCoordinates, 0, flatCoordinates.length, stride);
  }

  /**
   * @inheritDoc
   */
  drawPoint(pointGeometry, feature) {
    this.startIndices.push(this.indices.length);
    this.startIndicesFeature.push(feature);
    const flatCoordinates = pointGeometry.getFlatCoordinates();
    const stride = pointGeometry.getStride();
    this.drawCoordinates(
      flatCoordinates, 0, flatCoordinates.length, stride);
  }

  /**
   * @inheritDoc
   */
  finish(context) {
    const gl = context.getGL();

    this.groupIndices.push(this.indices.length);
    this.hitDetectionGroupIndices.push(this.indices.length);

    // create, bind, and populate the vertices buffer
    this.verticesBuffer = new WebGLBuffer(this.vertices);

    const indices = this.indices;

    // create, bind, and populate the indices buffer
    this.indicesBuffer = new WebGLBuffer(indices);

    // create textures
    /** @type {Object<string, WebGLTexture>} */
    const texturePerImage = {};

    this.createTextures(this.textures_, this.images_, texturePerImage, gl);

    this.createTextures(this.hitDetectionTextures_, this.hitDetectionImages_,
      texturePerImage, gl);

    this.images_ = null;
    this.hitDetectionImages_ = null;
    super.finish(context);
  }

  /**
   * @inheritDoc
   */
  setImageStyle(imageStyle) {
    const anchor = imageStyle.getAnchor();
    const image = imageStyle.getImage(1);
    const imageSize = imageStyle.getImageSize();
    const hitDetectionImage = imageStyle.getHitDetectionImage(1);
    const opacity = imageStyle.getOpacity();
    const origin = imageStyle.getOrigin();
    const rotateWithView = imageStyle.getRotateWithView();
    const rotation = imageStyle.getRotation();
    const size = imageStyle.getSize();
    const scale = imageStyle.getScale();

    let currentImage;
    if (this.images_.length === 0) {
      this.images_.push(image);
    } else {
      currentImage = this.images_[this.images_.length - 1];
      if (getUid(currentImage) != getUid(image)) {
        this.groupIndices.push(this.indices.length);
        this.images_.push(image);
      }
    }

    if (this.hitDetectionImages_.length === 0) {
      this.hitDetectionImages_.push(hitDetectionImage);
    } else {
      currentImage =
          this.hitDetectionImages_[this.hitDetectionImages_.length - 1];
      if (getUid(currentImage) != getUid(hitDetectionImage)) {
        this.hitDetectionGroupIndices.push(this.indices.length);
        this.hitDetectionImages_.push(hitDetectionImage);
      }
    }

    this.anchorX = anchor[0];
    this.anchorY = anchor[1];
    this.height = size[1];
    this.imageHeight = imageSize[1];
    this.imageWidth = imageSize[0];
    this.opacity = opacity;
    this.originX = origin[0];
    this.originY = origin[1];
    this.rotation = rotation;
    this.rotateWithView = rotateWithView;
    this.scale = scale;
    this.width = size[0];
  }

  /**
   * @inheritDoc
   */
  getTextures(opt_all) {
    return opt_all ? this.textures_.concat(this.hitDetectionTextures_) : this.textures_;
  }

  /**
   * @inheritDoc
   */
  getHitDetectionTextures() {
    return this.hitDetectionTextures_;
  }
}


export default WebGLImageReplay;
