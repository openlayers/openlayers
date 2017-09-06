import _ol_Collection_ from './collection';
import _ol_control_Attribution_ from './control/attribution';
import _ol_control_Rotate_ from './control/rotate';
import _ol_control_Zoom_ from './control/zoom';
var _ol_control_ = {};


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
_ol_control_.defaults = function(opt_options) {

  var options = opt_options ? opt_options : {};

  var controls = new _ol_Collection_();

  var zoomControl = options.zoom !== undefined ? options.zoom : true;
  if (zoomControl) {
    controls.push(new _ol_control_Zoom_(options.zoomOptions));
  }

  var rotateControl = options.rotate !== undefined ? options.rotate : true;
  if (rotateControl) {
    controls.push(new _ol_control_Rotate_(options.rotateOptions));
  }

  var attributionControl = options.attribution !== undefined ?
    options.attribution : true;
  if (attributionControl) {
    controls.push(new _ol_control_Attribution_(options.attributionOptions));
  }

  return controls;

};
export default _ol_control_;
