/**
 * @module ol/renderer/canvas/IntermediateCanvas
 */
import {inherits, nullFunction} from '../../index.js';
import _ol_coordinate_ from '../../coordinate.js';
import {createCanvasContext2D} from '../../dom.js';
import {containsExtent, intersects} from '../../extent.js';
import CanvasLayerRenderer from '../canvas/Layer.js';
import _ol_transform_ from '../../transform.js';

/**
 * @constructor
 * @abstract
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.layer.Layer} layer Layer.
 */
const IntermediateCanvasRenderer = function(layer) {

  CanvasLayerRenderer.call(this, layer);

  /**
   * @protected
   * @type {ol.Transform}
   */
  this.coordinateToCanvasPixelTransform = _ol_transform_.create();

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.hitCanvasContext_ = null;

};

inherits(IntermediateCanvasRenderer, CanvasLayerRenderer);


/**
 * @inheritDoc
 */
IntermediateCanvasRenderer.prototype.composeFrame = function(frameState, layerState, context) {

  this.preCompose(context, frameState);

  const image = this.getImage();
  if (image) {

    // clipped rendering if layer extent is set
    const extent = layerState.extent;
    const clipped = extent !== undefined &&
        !containsExtent(extent, frameState.extent) &&
        intersects(extent, frameState.extent);
    if (clipped) {
      this.clip(context, frameState, /** @type {ol.Extent} */ (extent));
    }

    const imageTransform = this.getImageTransform();
    // for performance reasons, context.save / context.restore is not used
    // to save and restore the transformation matrix and the opacity.
    // see http://jsperf.com/context-save-restore-versus-variable
    const alpha = context.globalAlpha;
    context.globalAlpha = layerState.opacity;

    // for performance reasons, context.setTransform is only used
    // when the view is rotated. see http://jsperf.com/canvas-transform
    const dx = imageTransform[4];
    const dy = imageTransform[5];
    const dw = image.width * imageTransform[0];
    const dh = image.height * imageTransform[3];
    context.drawImage(image, 0, 0, +image.width, +image.height,
      Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
    context.globalAlpha = alpha;

    if (clipped) {
      context.restore();
    }
  }

  this.postCompose(context, frameState, layerState);
};


/**
 * @abstract
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Canvas.
 */
IntermediateCanvasRenderer.prototype.getImage = function() {};


/**
 * @abstract
 * @return {!ol.Transform} Image transform.
 */
IntermediateCanvasRenderer.prototype.getImageTransform = function() {};


/**
 * @inheritDoc
 */
IntermediateCanvasRenderer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
  const layer = this.getLayer();
  const source = layer.getSource();
  const resolution = frameState.viewState.resolution;
  const rotation = frameState.viewState.rotation;
  const skippedFeatureUids = frameState.skippedFeatureUids;
  return source.forEachFeatureAtCoordinate(
    coordinate, resolution, rotation, hitTolerance, skippedFeatureUids,
    /**
       * @param {ol.Feature|ol.render.Feature} feature Feature.
       * @return {?} Callback result.
       */
    function(feature) {
      return callback.call(thisArg, feature, layer);
    });
};


/**
 * @inheritDoc
 */
IntermediateCanvasRenderer.prototype.forEachLayerAtCoordinate = function(coordinate, frameState, callback, thisArg) {
  if (!this.getImage()) {
    return undefined;
  }

  if (this.getLayer().getSource().forEachFeatureAtCoordinate !== nullFunction) {
    // for ImageCanvas sources use the original hit-detection logic,
    // so that for example also transparent polygons are detected
    return CanvasLayerRenderer.prototype.forEachLayerAtCoordinate.apply(this, arguments);
  } else {
    const pixel = _ol_transform_.apply(this.coordinateToCanvasPixelTransform, coordinate.slice());
    _ol_coordinate_.scale(pixel, frameState.viewState.resolution / this.renderedResolution);

    if (!this.hitCanvasContext_) {
      this.hitCanvasContext_ = createCanvasContext2D(1, 1);
    }

    this.hitCanvasContext_.clearRect(0, 0, 1, 1);
    this.hitCanvasContext_.drawImage(this.getImage(), pixel[0], pixel[1], 1, 1, 0, 0, 1, 1);

    const imageData = this.hitCanvasContext_.getImageData(0, 0, 1, 1).data;
    if (imageData[3] > 0) {
      return callback.call(thisArg, this.getLayer(),  imageData);
    } else {
      return undefined;
    }
  }
};
export default IntermediateCanvasRenderer;
