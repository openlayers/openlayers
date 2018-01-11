/**
 * @module ol/control
 */
import Collection from './Collection.js';
import Attribution from './control/Attribution.js';
import Rotate from './control/Rotate.js';
import Zoom from './control/Zoom.js';


/**
 * Set of controls included in maps by default. Unless configured otherwise,
 * this returns a collection containing an instance of each of the following
 * controls:
 * * {@link ol.control.Zoom}
 * * {@link ol.control.Rotate}
 * * {@link ol.control.Attribution}
 *
 * @param {olx.control.DefaultsOptions=} opt_options Defaults options.
 * @return {ol.Collection.<ol.control.Control>} Controls.
 * @api
 */
export function defaults(opt_options) {

  var options = opt_options ? opt_options : {};

  var controls = new Collection();

  var zoomControl = options.zoom !== undefined ? options.zoom : true;
  if (zoomControl) {
    controls.push(new Zoom(options.zoomOptions));
  }

  var rotateControl = options.rotate !== undefined ? options.rotate : true;
  if (rotateControl) {
    controls.push(new Rotate(options.rotateOptions));
  }

  var attributionControl = options.attribution !== undefined ?
    options.attribution : true;
  if (attributionControl) {
    controls.push(new Attribution(options.attributionOptions));
  }

  return controls;

}
