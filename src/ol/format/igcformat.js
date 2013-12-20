goog.provide('ol.format.IGC');
goog.provide('ol.format.IGCZ');

goog.require('goog.asserts');
goog.require('goog.string');
goog.require('goog.string.newlines');
goog.require('ol.Feature');
goog.require('ol.format.Text');
goog.require('ol.geom.LineString');
goog.require('ol.proj');


/**
 * @enum {string}
 */
ol.format.IGCZ = {
  BAROMETRIC: 'barometric',
  GPS: 'gps',
  NONE: 'none'
};



/**
 * @constructor
 * @extends {ol.format.Text}
 * @param {olx.format.IGCOptions=} opt_options Options.
 */
ol.format.IGC = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * @private
   * @type {ol.format.IGCZ}
   */
  this.altitudeMode_ = goog.isDef(options.altitudeMode) ?
      options.altitudeMode : ol.format.IGCZ.NONE;

};
goog.inherits(ol.format.IGC, ol.format.Text);


/**
 * @const {Array.<string>}
 * @private
 */
ol.format.IGC.EXTENSIONS_ = ['.igc'];


/**
 * @const {RegExp}
 * @private
 */
ol.format.IGC.B_RECORD_RE_ =
    /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/;


/**
 * @const {RegExp}
 * @private
 */
ol.format.IGC.H_RECORD_RE_ = /^H.([A-Z]{3}).*?:(.*)/;


/**
 * @const {RegExp}
 * @private
 */
ol.format.IGC.HFDTE_RECORD_RE_ = /^HFDTE(\d{2})(\d{2})(\d{2})/;


/**
 * @inheritDoc
 */
ol.format.IGC.prototype.getExtensions = function() {
  return ol.format.IGC.EXTENSIONS_;
};


/**
 * @inheritDoc
 */
ol.format.IGC.prototype.readFeatureFromText = function(text) {
  var altitudeMode = this.altitudeMode_;
  var lines = goog.string.newlines.splitLines(text);
  /** @type {Object.<string, string>} */
  var properties = {};
  var flatCoordinates = [];
  var year = 2000;
  var month = 1;
  var day = 1;
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
            goog.asserts.fail();
            z = 0;
          }
          flatCoordinates.push(z);
        }
        var date = new Date(year, month, day, hour, minute, second, 0);
        flatCoordinates.push(date.getTime() / 1000);
      }
    } else if (line.charAt(0) == 'H') {
      m = ol.format.IGC.H_RECORD_RE_.exec(line);
      if (m) {
        properties[m[1]] = goog.string.trim(m[2]);
        m = ol.format.IGC.HFDTE_RECORD_RE_.exec(line);
        if (m) {
          year = 2000 + parseInt(m[1], 10);
          month = parseInt(m[2], 10);
          day = parseInt(m[3], 10);
        }
      }
    }
  }
  var lineString = new ol.geom.LineString(null);
  var layout = altitudeMode == ol.format.IGCZ.NONE ?
      ol.geom.GeometryLayout.XYM : ol.geom.GeometryLayout.XYZM;
  lineString.setFlatCoordinates(layout, flatCoordinates);
  var feature = new ol.Feature(lineString);
  feature.setValues(properties);
  return feature;
};


/**
 * @inheritDoc
 */
ol.format.IGC.prototype.readFeaturesFromText = function(text) {
  var feature = this.readFeatureFromText(text);
  if (!goog.isNull(feature)) {
    return [feature];
  } else {
    return [];
  }
};


/**
 * @inheritDoc
 */
ol.format.IGC.prototype.readProjectionFromText = function(text) {
  return ol.proj.get('EPSG:4326');
};
