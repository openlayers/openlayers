import _ol_ from '../index';
import _ol_Feature_ from '../feature';
import _ol_format_Feature_ from '../format/feature';
import _ol_format_IGCZ_ from '../format/igcz';
import _ol_format_TextFeature_ from '../format/textfeature';
import _ol_geom_GeometryLayout_ from '../geom/geometrylayout';
import _ol_geom_LineString_ from '../geom/linestring';
import _ol_proj_ from '../proj';

/**
 * @classdesc
 * Feature format for `*.igc` flight recording files.
 *
 * @constructor
 * @extends {ol.format.TextFeature}
 * @param {olx.format.IGCOptions=} opt_options Options.
 * @api
 */
var _ol_format_IGC_ = function(opt_options) {

  var options = opt_options ? opt_options : {};

  _ol_format_TextFeature_.call(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = _ol_proj_.get('EPSG:4326');

  /**
   * @private
   * @type {ol.format.IGCZ}
   */
  this.altitudeMode_ = options.altitudeMode ?
    options.altitudeMode : _ol_format_IGCZ_.NONE;

};

_ol_.inherits(_ol_format_IGC_, _ol_format_TextFeature_);


/**
 * @const
 * @type {RegExp}
 * @private
 */
_ol_format_IGC_.B_RECORD_RE_ =
    /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/;


/**
 * @const
 * @type {RegExp}
 * @private
 */
_ol_format_IGC_.H_RECORD_RE_ = /^H.([A-Z]{3}).*?:(.*)/;


/**
 * @const
 * @type {RegExp}
 * @private
 */
_ol_format_IGC_.HFDTE_RECORD_RE_ = /^HFDTE(\d{2})(\d{2})(\d{2})/;


/**
 * A regular expression matching the newline characters `\r\n`, `\r` and `\n`.
 *
 * @const
 * @type {RegExp}
 * @private
 */
_ol_format_IGC_.NEWLINE_RE_ = /\r\n|\r|\n/;


/**
 * Read the feature from the IGC source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 * @api
 */
_ol_format_IGC_.prototype.readFeature;


/**
 * @inheritDoc
 */
_ol_format_IGC_.prototype.readFeatureFromText = function(text, opt_options) {
  var altitudeMode = this.altitudeMode_;
  var lines = text.split(_ol_format_IGC_.NEWLINE_RE_);
  /** @type {Object.<string, string>} */
  var properties = {};
  var flatCoordinates = [];
  var year = 2000;
  var month = 0;
  var day = 1;
  var lastDateTime = -1;
  var i, ii;
  for (i = 0, ii = lines.length; i < ii; ++i) {
    var line = lines[i];
    var m;
    if (line.charAt(0) == 'B') {
      m = _ol_format_IGC_.B_RECORD_RE_.exec(line);
      if (m) {
        var hour = parseInt(m[1], 10);
        var minute = parseInt(m[2], 10);
        var second = parseInt(m[3], 10);
        var y = parseInt(m[4], 10) + parseInt(m[5], 10) / 60000;
        if (m[6] == 'S') {
          y = -y;
        }
        var x = parseInt(m[7], 10) + parseInt(m[8], 10) / 60000;
        if (m[9] == 'W') {
          x = -x;
        }
        flatCoordinates.push(x, y);
        if (altitudeMode != _ol_format_IGCZ_.NONE) {
          var z;
          if (altitudeMode == _ol_format_IGCZ_.GPS) {
            z = parseInt(m[11], 10);
          } else if (altitudeMode == _ol_format_IGCZ_.BAROMETRIC) {
            z = parseInt(m[12], 10);
          } else {
            z = 0;
          }
          flatCoordinates.push(z);
        }
        var dateTime = Date.UTC(year, month, day, hour, minute, second);
        // Detect UTC midnight wrap around.
        if (dateTime < lastDateTime) {
          dateTime = Date.UTC(year, month, day + 1, hour, minute, second);
        }
        flatCoordinates.push(dateTime / 1000);
        lastDateTime = dateTime;
      }
    } else if (line.charAt(0) == 'H') {
      m = _ol_format_IGC_.HFDTE_RECORD_RE_.exec(line);
      if (m) {
        day = parseInt(m[1], 10);
        month = parseInt(m[2], 10) - 1;
        year = 2000 + parseInt(m[3], 10);
      } else {
        m = _ol_format_IGC_.H_RECORD_RE_.exec(line);
        if (m) {
          properties[m[1]] = m[2].trim();
        }
      }
    }
  }
  if (flatCoordinates.length === 0) {
    return null;
  }
  var lineString = new _ol_geom_LineString_(null);
  var layout = altitudeMode == _ol_format_IGCZ_.NONE ?
    _ol_geom_GeometryLayout_.XYM : _ol_geom_GeometryLayout_.XYZM;
  lineString.setFlatCoordinates(layout, flatCoordinates);
  var feature = new _ol_Feature_(_ol_format_Feature_.transformWithOptions(
      lineString, false, opt_options));
  feature.setProperties(properties);
  return feature;
};


/**
 * Read the feature from the source. As IGC sources contain a single
 * feature, this will return the feature in an array.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {Array.<ol.Feature>} Features.
 * @api
 */
_ol_format_IGC_.prototype.readFeatures;


/**
 * @inheritDoc
 */
_ol_format_IGC_.prototype.readFeaturesFromText = function(text, opt_options) {
  var feature = this.readFeatureFromText(text, opt_options);
  if (feature) {
    return [feature];
  } else {
    return [];
  }
};


/**
 * Read the projection from the IGC source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @return {ol.proj.Projection} Projection.
 * @api
 */
_ol_format_IGC_.prototype.readProjection;


/**
 * Not implemented.
 * @inheritDoc
 */
_ol_format_IGC_.prototype.writeFeatureText = function(feature, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
_ol_format_IGC_.prototype.writeFeaturesText = function(features, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
_ol_format_IGC_.prototype.writeGeometryText = function(geometry, opt_options) {};


/**
 * Not implemented.
 * @inheritDoc
 */
_ol_format_IGC_.prototype.readGeometryFromText = function(text, opt_options) {};
export default _ol_format_IGC_;
