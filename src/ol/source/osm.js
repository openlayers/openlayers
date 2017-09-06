import _ol_ from '../index';
import _ol_Attribution_ from '../attribution';
import _ol_source_XYZ_ from '../source/xyz';

/**
 * @classdesc
 * Layer source for the OpenStreetMap tile server.
 *
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {olx.source.OSMOptions=} opt_options Open Street Map options.
 * @api
 */
var _ol_source_OSM_ = function(opt_options) {

  var options = opt_options || {};

  var attributions;
  if (options.attributions !== undefined) {
    attributions = options.attributions;
  } else {
    attributions = [_ol_source_OSM_.ATTRIBUTION];
  }

  var crossOrigin = options.crossOrigin !== undefined ?
    options.crossOrigin : 'anonymous';

  var url = options.url !== undefined ?
    options.url : 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  _ol_source_XYZ_.call(this, {
    attributions: attributions,
    cacheSize: options.cacheSize,
    crossOrigin: crossOrigin,
    opaque: options.opaque !== undefined ? options.opaque : true,
    maxZoom: options.maxZoom !== undefined ? options.maxZoom : 19,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileLoadFunction: options.tileLoadFunction,
    url: url,
    wrapX: options.wrapX
  });

};

_ol_.inherits(_ol_source_OSM_, _ol_source_XYZ_);


/**
 * The attribution containing a link to the OpenStreetMap Copyright and License
 * page.
 * @const
 * @type {ol.Attribution}
 * @api
 */
_ol_source_OSM_.ATTRIBUTION = new _ol_Attribution_({
  html: '&copy; ' +
      '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
      'contributors.'
});
export default _ol_source_OSM_;
