/**
 * @module ol/interaction/DragZoom
 */
import {inherits} from '../index.js';
import {easeOut} from '../easing.js';
import {shiftKeyOnly} from '../events/condition.js';
import {createOrUpdateFromCoordinates, getBottomLeft, getCenter, getTopRight, scaleFromCenter} from '../extent.js';
import DragBox from '../interaction/DragBox.js';

/**
 * @classdesc
 * Allows the user to zoom the map by clicking and dragging on the map,
 * normally combined with an {@link ol.events.condition} that limits
 * it to when a key, shift by default, is held down.
 *
 * To change the style of the box, use CSS and the `.ol-dragzoom` selector, or
 * your custom one configured with `className`.
 *
 * @constructor
 * @extends {ol.interaction.DragBox}
 * @param {olx.interaction.DragZoomOptions=} opt_options Options.
 * @api
 */
const DragZoom = function(opt_options) {
  const options = opt_options ? opt_options : {};

  const condition = options.condition ? options.condition : shiftKeyOnly;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration !== undefined ? options.duration : 200;

  /**
   * @private
   * @type {boolean}
   */
  this.out_ = options.out !== undefined ? options.out : false;

  DragBox.call(this, {
    condition: condition,
    className: options.className || 'ol-dragzoom'
  });

};

inherits(DragZoom, DragBox);


/**
 * @inheritDoc
 */
DragZoom.prototype.onBoxEnd = function() {
  const map = this.getMap();

  const view = /** @type {!ol.View} */ (map.getView());

  const size = /** @type {!ol.Size} */ (map.getSize());

  let extent = this.getGeometry().getExtent();

  if (this.out_) {
    const mapExtent = view.calculateExtent(size);
    const boxPixelExtent = createOrUpdateFromCoordinates([
      map.getPixelFromCoordinate(getBottomLeft(extent)),
      map.getPixelFromCoordinate(getTopRight(extent))]);
    const factor = view.getResolutionForExtent(boxPixelExtent, size);

    scaleFromCenter(mapExtent, 1 / factor);
    extent = mapExtent;
  }

  const resolution = view.constrainResolution(
    view.getResolutionForExtent(extent, size));

  let center = getCenter(extent);
  center = view.constrainCenter(center);

  view.animate({
    resolution: resolution,
    center: center,
    duration: this.duration_,
    easing: easeOut
  });

};
export default DragZoom;
