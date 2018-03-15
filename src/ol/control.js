/**
 * @module ol/control
 */
import Collection from './Collection.js';
import Attribution from './control/Attribution.js';
import Rotate from './control/Rotate.js';
import Zoom from './control/Zoom.js';


/**
 * @typedef {Object} DefaultsOptions
 * @property {boolean} [attribution=true] Include
 * {@link module:ol/control/Attribution~Attribution}.
 * @property {module:ol/control/Attribution~AttributionOptions} [attributionOptions]
 * Options for {@link module:ol/control/Attribution~Attribution}.
 * @property {boolean} [rotate=true] Include
 * {@link module:ol/control/Rotate~Rotate}.
 * @property {module:ol/control/Rotate~RotateOptions} [rotateOptions] Options
 * for {@link module:ol/control/Rotate~Rotate}.
 * @property {boolean} [zoom] Include {@link module:ol/control/Zoom~Zoom}.
 * @property {module:ol/control/Zoom~ZoomOptions} [zoomOptions] Options for
 * {@link module:ol/control/Zoom~Zoom}.
 * @api
 */


/**
 * Set of controls included in maps by default. Unless configured otherwise,
 * this returns a collection containing an instance of each of the following
 * controls:
 * * {@link module:ol/control/Zoom~Zoom}
 * * {@link module:ol/control/Rotate~Rotate}
 * * {@link module:ol/control/Attribution~Attribution}
 *
 * @param {module:ol/control~DefaultsOptions~DefaultsOptions=} opt_options
 * Defaults options.
 * @return {module:ol/Collection~Collection.<module:ol/control/Control~Control>}
 * Controls.
 * @api
 */
export function defaults(opt_options) {

  const options = opt_options ? opt_options : {};

  const controls = new Collection();

  const zoomControl = options.zoom !== undefined ? options.zoom : true;
  if (zoomControl) {
    controls.push(new Zoom(options.zoomOptions));
  }

  const rotateControl = options.rotate !== undefined ? options.rotate : true;
  if (rotateControl) {
    controls.push(new Rotate(options.rotateOptions));
  }

  const attributionControl = options.attribution !== undefined ?
    options.attribution : true;
  if (attributionControl) {
    controls.push(new Attribution(options.attributionOptions));
  }

  return controls;

}
