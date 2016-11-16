goog.provide('ol.format.IGC');
goog.provide('ol.format.IGCZ');

goog.require('ol');
goog.require('ol.Feature');
goog.require('ol.format.Feature');
goog.require('ol.format.TextFeature');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.LineString');
goog.require('ol.proj');


/**
 * IGC altitude/z. One of 'barometric', 'gps', 'none'.
 * @enum {string}
 */
ol.format.IGCZ = {
  BAROMETRIC: 'barometric',
  GPS: 'gps',
  NONE: 'none'
};


/**
 * @classdesc
 * Feature format for `*.igc` flight recording files.
 *
 * @constructor
 * @extends {ol.format.TextFeature}
 * @param {olx.format.IGCOptions=} opt_options Options.
 * @api
 */
ol.format.IGC = function(opt_options) {

  var options = opt_options ? opt_options : {};

  ol.format.TextFeature.call(this);

  /**
   * @inheritDoc
   */
  this.defaultDataProjection = ol.proj.get('EPSG:4326');

  /**
   * @private
   * @type {ol.format.IGCZ}
   */
  this.altitudeMode_ = options.altitudeMode ?
      options.altitudeMode : ol.format.IGCZ.NONE;

};
ol.inherits(ol.format.IGC, ol.format.TextFeature);


/**
 * @const
 * @type {Array.<string>}
 * @private
 */
ol.format.IGC.EXTENSIONS_ = ['.igc'];


/**
 * @const
 * @type {RegExp}
 * @private
 */
ol.format.IGC.B_RECORD_RE_ =
    /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/;


/**
 * @const
 * @type {RegExp}
 * @private
 */
ol.format.IGC.H_RECORD_RE_ = /^H.([A-Z]{3}).*?:(.*)/;


/**
 * @const
 * @type {RegExp}
 * @private
 */
ol.format.IGC.HFDTE_RECORD_RE_ = /^HFDTE(\d{2})(\d{2})(\d{2})/;


/**
 * A regular expression matching the newline characters `\r\n`, `\r` and `\n`.
 *
 * @const
 * @type {RegExp}
 * @private
 */
ol.format.IGC.NEWLINE_RE_ = /\r\n|\r|\n/;


/**
 * @inheritDoc
 */
ol.format.IGC.prototype.getExtensions = function() {
  return ol.format.IGC.EXTENSIONS_;
};


/**
 * Read the feature from the IGC source.
 *
 * @function
 * @param {Document|Node|Object|string} source Source.
 * @param {olx.format.ReadOptions=} opt_options Read options.
 * @return {ol.Feature} Feature.
 * @api
 */
ol.format.IGC.prototype.readFeature;


/**
 * @inheritDoc
 */
ol.format.IGC.prototype.readFeatureFromText = function(text, opt_options) {
  var altitudeMode = this.altitudeMode_;
  var lines = text.split(ol.format.IGC.NEWLINE_RE_);
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
      m = ol.format.IGC.B_RECORD_RE_.exec(line);
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
        if (altitudeMode != ol.format.IGCZ.NONE) {
          var z;
          if (altitudeMode == ol.format.IGCZ.GPS) {
            z = parseInt(m[11], 10);
          } else if (altitudeMode == ol.format.IGCZ.BAROMETRIC) {
            z = parseInt(m[12], 10);
          } else {
            goog.DEBUG && console.assert(false, 'Unknown altitude mode.');
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
      m = ol.format.IGC.HFDTE_RECORD_RE_.exec(line);
      if (m) {
        day = parseInt(m[1], 10);
        month = parseInt(m[2], 10) - 1;
        year = 2000 + parseInt(m[3], 10);
      } else {
        m = ol.format.IGC.H_RECORD_RE_.exec(line);
        if (m) {
          properties[m[1]] = m[2].trim();
        }
      }
    }
  }
  if (flatCoordinates.length === 0) {
    return null;
  }
  var lineString = new ol.geom.LineString(null);
  var layout = altitudeMode == ol.format.IGCZ.NONE ?
      ol.geom.GeometryLayout.XYM : ol.geom.GeometryLayout.XYZM;
  lineString.setFlatCoordinates(layout, flatCoordinates);
  var feature = new ol.Feature(ol.format.Feature.transformWithOptions(
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
ol.format.IGC.prototype.readFeatures;


/**
 * @inheritDoc
 */
ol.format.IGC.prototype.readFeaturesFromText = function(text, opt_options) {
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
ol.format.IGC.prototype.readProjection;
