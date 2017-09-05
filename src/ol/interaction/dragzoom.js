import _ol_ from '../index';
import _ol_easing_ from '../easing';
import _ol_events_condition_ from '../events/condition';
import _ol_extent_ from '../extent';
import _ol_interaction_DragBox_ from '../interaction/dragbox';

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
var _ol_interaction_DragZoom_ = function(opt_options) {
  var options = opt_options ? opt_options : {};

  var condition = options.condition ?
    options.condition : _ol_events_condition_.shiftKeyOnly;

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

  _ol_interaction_DragBox_.call(this, {
    condition: condition,
    className: options.className || 'ol-dragzoom'
  });

};

_ol_.inherits(_ol_interaction_DragZoom_, _ol_interaction_DragBox_);


/**
 * @inheritDoc
 */
_ol_interaction_DragZoom_.prototype.onBoxEnd = function() {
  var map = this.getMap();

  var view = /** @type {!ol.View} */ (map.getView());

  var size = /** @type {!ol.Size} */ (map.getSize());

  var extent = this.getGeometry().getExtent();

  if (this.out_) {
    var mapExtent = view.calculateExtent(size);
    var boxPixelExtent = _ol_extent_.createOrUpdateFromCoordinates([
      map.getPixelFromCoordinate(_ol_extent_.getBottomLeft(extent)),
      map.getPixelFromCoordinate(_ol_extent_.getTopRight(extent))]);
    var factor = view.getResolutionForExtent(boxPixelExtent, size);

    _ol_extent_.scaleFromCenter(mapExtent, 1 / factor);
    extent = mapExtent;
  }

  var resolution = view.constrainResolution(
      view.getResolutionForExtent(extent, size));

  var center = _ol_extent_.getCenter(extent);
  center = view.constrainCenter(center);

  view.animate({
    resolution: resolution,
    center: center,
    duration: this.duration_,
    easing: _ol_easing_.easeOut
  });

};
export default _ol_interaction_DragZoom_;
