/**
 * @module ol/interaction/DoubleClickZoom
 */
import {inherits} from '../util.js';
import MapBrowserEventType from '../MapBrowserEventType.js';
import Interaction, {zoomByDelta} from '../interaction/Interaction.js';


/**
 * @typedef {Object} Options
 * @property {number} [duration=250] Animation duration in milliseconds.
 * @property {number} [delta=1] The zoom delta applied on each double click.
 */


/**
 * @classdesc
 * Allows the user to zoom by double-clicking on the map.
 *
 * @constructor
 * @extends {module:ol/interaction/Interaction}
 * @param {module:ol/interaction/DoubleClickZoom~Options=} opt_options Options.
 * @api
 */
const DoubleClickZoom = function(opt_options) {

  const options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {number}
   */
  this.delta_ = options.delta ? options.delta : 1;

  Interaction.call(this, {
    handleEvent: handleEvent
  });

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration !== undefined ? options.duration : 250;

};

inherits(DoubleClickZoom, Interaction);


/**
 * Handles the {@link module:ol/MapBrowserEvent map browser event} (if it was a
 * doubleclick) and eventually zooms the map.
 * @param {module:ol/MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {module:ol/interaction/DoubleClickZoom}
 */
function handleEvent(mapBrowserEvent) {
  let stopEvent = false;
  const browserEvent = mapBrowserEvent.originalEvent;
  if (mapBrowserEvent.type == MapBrowserEventType.DBLCLICK) {
    const map = mapBrowserEvent.map;
    const anchor = mapBrowserEvent.coordinate;
    const delta = browserEvent.shiftKey ? -this.delta_ : this.delta_;
    const view = map.getView();
    zoomByDelta(view, delta, anchor, this.duration_);
    mapBrowserEvent.preventDefault();
    stopEvent = true;
  }
  return !stopEvent;
}

export default DoubleClickZoom;
