goog.provide('ol.control.ScaleLine');
goog.provide('ol.control.ScaleLineProperty');
goog.provide('ol.control.ScaleLineUnits');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.math');
goog.require('goog.style');
goog.require('ol.Object');
goog.require('ol.TransformFunction');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.proj');
goog.require('ol.proj.Units');
goog.require('ol.sphere.NORMAL');


/**
 * @enum {string}
 */
ol.control.ScaleLineProperty = {
  UNITS: 'units'
};


/**
 * Units for the scale line. Supported values are `'degrees'`, `'imperial'`,
 * `'nautical'`, `'metric'`, `'us'`.
 * @enum {string}
 * @api stable
 */
ol.control.ScaleLineUnits = {
  DEGREES: 'degrees',
  IMPERIAL: 'imperial',
  NAUTICAL: 'nautical',
  METRIC: 'metric',
  US: 'us'
};



/**
 * @classdesc
 * A control displaying rough x-axis distances, calculated for the center of the
 * viewport.
 * No scale line will be shown when the x-axis distance cannot be calculated in
 * the view projection (e.g. at or beyond the poles in EPSG:4326).
 * By default the scale line will show in the bottom left portion of the map,
 * but this can be changed by using the css selector `.ol-scale-line`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ScaleLineOptions=} opt_options Scale line options.
 * @api stable
 */
ol.control.ScaleLine = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var className = goog.isDef(options.className) ?
      options.className : 'ol-scale-line';

  /**
   * @private
   * @type {Element}
   */
  this.innerElement_ = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + '-inner'
  });

  /**
   * @private
   * @type {Element}
   */
  this.element_ = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + ' ' + ol.css.CLASS_UNSELECTABLE
  }, this.innerElement_);

  /**
   * @private
   * @type {?olx.ViewState}
   */
  this.viewState_ = null;

  /**
   * @private
   * @type {number}
   */
  this.minWidth_ = goog.isDef(options.minWidth) ? options.minWidth : 64;

  /**
   * @private
   * @type {boolean}
   */
  this.renderedVisible_ = false;

  /**
   * @private
   * @type {number|undefined}
   */
  this.renderedWidth_ = undefined;

  /**
   * @private
   * @type {string}
   */
  this.renderedHTML_ = '';

  /**
   * @private
   * @type {?ol.TransformFunction}
   */
  this.toEPSG4326_ = null;

  goog.base(this, {
    element: this.element_,
    target: options.target
  });

  goog.events.listen(
      this, ol.Object.getChangeEventType(ol.control.ScaleLineProperty.UNITS),
      this.handleUnitsChanged_, false, this);

  this.setUnits(/** @type {ol.control.ScaleLineUnits} */ (options.units) ||
      ol.control.ScaleLineUnits.METRIC);

};
goog.inherits(ol.control.ScaleLine, ol.control.Control);


/**
 * @const
 * @type {Array.<number>}
 */
ol.control.ScaleLine.LEADING_DIGITS = [1, 2, 5];


/**
 * @return {ol.control.ScaleLineUnits|undefined} The units to use in the scale
 *     line.
 * @observable
 * @api stable
 */
ol.control.ScaleLine.prototype.getUnits = function() {
  return /** @type {ol.control.ScaleLineUnits|undefined} */ (
      this.get(ol.control.ScaleLineProperty.UNITS));
};
goog.exportProperty(
    ol.control.ScaleLine.prototype,
    'getUnits',
    ol.control.ScaleLine.prototype.getUnits);


/**
 * @inheritDoc
 */
ol.control.ScaleLine.prototype.handleMapPostrender = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (goog.isNull(frameState)) {
    this.viewState_ = null;
  } else {
    this.viewState_ = frameState.viewState;
  }
  this.updateElement_();
};


/**
 * @private
 */
ol.control.ScaleLine.prototype.handleUnitsChanged_ = function() {
  this.updateElement_();
};


/**
 * @param {ol.control.ScaleLineUnits} units The units to use in the scale line.
 * @observable
 * @api stable
 */
ol.control.ScaleLine.prototype.setUnits = function(units) {
  this.set(ol.control.ScaleLineProperty.UNITS, units);
};
goog.exportProperty(
    ol.control.ScaleLine.prototype,
    'setUnits',
    ol.control.ScaleLine.prototype.setUnits);


/**
 * @private
 */
ol.control.ScaleLine.prototype.updateElement_ = function() {
  var viewState = this.viewState_;

  if (goog.isNull(viewState)) {
    if (this.renderedVisible_) {
      goog.style.setElementShown(this.element_, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  var center = viewState.center;
  var projection = viewState.projection;
  var pointResolution =
      projection.getPointResolution(viewState.resolution, center);
  var projectionUnits = projection.getUnits();

  var cosLatitude;
  var units = this.getUnits();
  if (projectionUnits == ol.proj.Units.DEGREES &&
      (units == ol.control.ScaleLineUnits.METRIC ||
       units == ol.control.ScaleLineUnits.IMPERIAL ||
       units == ol.control.ScaleLineUnits.US ||
       units == ol.control.ScaleLineUnits.NAUTICAL)) {

    // Convert pointResolution from degrees to meters
    this.toEPSG4326_ = null;
    cosLatitude = Math.cos(goog.math.toRadians(center[1]));
    pointResolution *= Math.PI * cosLatitude * ol.sphere.NORMAL.radius / 180;
    projectionUnits = ol.proj.Units.METERS;

  } else if ((projectionUnits == ol.proj.Units.FEET ||
      projectionUnits == ol.proj.Units.METERS) &&
      units == ol.control.ScaleLineUnits.DEGREES) {

    // Convert pointResolution from meters or feet to degrees
    if (goog.isNull(this.toEPSG4326_)) {
      this.toEPSG4326_ = ol.proj.getTransformFromProjections(
          projection, ol.proj.get('EPSG:4326'));
    }
    cosLatitude = Math.cos(goog.math.toRadians(this.toEPSG4326_(center)[1]));
    var radius = ol.sphere.NORMAL.radius;
    if (projectionUnits == ol.proj.Units.FEET) {
      radius /= 0.3048;
    }
    pointResolution *= 180 / (Math.PI * cosLatitude * radius);
    projectionUnits = ol.proj.Units.DEGREES;

  } else {
    this.toEPSG4326_ = null;
  }

  goog.asserts.assert(
      ((units == ol.control.ScaleLineUnits.METRIC ||
        units == ol.control.ScaleLineUnits.IMPERIAL ||
        units == ol.control.ScaleLineUnits.US ||
        units == ol.control.ScaleLineUnits.NAUTICAL) &&
       projectionUnits == ol.proj.Units.METERS) ||
      (units == ol.control.ScaleLineUnits.DEGREES &&
       projectionUnits == ol.proj.Units.DEGREES));

  var nominalCount = this.minWidth_ * pointResolution;
  var suffix = '';
  if (units == ol.control.ScaleLineUnits.DEGREES) {
    if (nominalCount < 1 / 60) {
      suffix = '\u2033'; // seconds
      pointResolution *= 3600;
    } else if (nominalCount < 1) {
      suffix = '\u2032'; // minutes
      pointResolution *= 60;
    } else {
      suffix = '\u00b0'; // degrees
    }
  } else if (units == ol.control.ScaleLineUnits.IMPERIAL) {
    if (nominalCount < 0.9144) {
      suffix = 'in';
      pointResolution /= 0.0254;
    } else if (nominalCount < 1609.344) {
      suffix = 'ft';
      pointResolution /= 0.3048;
    } else {
      suffix = 'mi';
      pointResolution /= 1609.344;
    }
  } else if (units == ol.control.ScaleLineUnits.NAUTICAL) {
    pointResolution /= 1852;
    suffix = 'nm';
  } else if (units == ol.control.ScaleLineUnits.METRIC) {
    if (nominalCount < 1) {
      suffix = 'mm';
      pointResolution *= 1000;
    } else if (nominalCount < 1000) {
      suffix = 'm';
    } else {
      suffix = 'km';
      pointResolution /= 1000;
    }
  } else if (units == ol.control.ScaleLineUnits.US) {
    if (nominalCount < 0.9144) {
      suffix = 'in';
      pointResolution *= 39.37;
    } else if (nominalCount < 1609.344) {
      suffix = 'ft';
      pointResolution /= 0.30480061;
    } else {
      suffix = 'mi';
      pointResolution /= 1609.3472;
    }
  } else {
    goog.asserts.fail();
  }

  var i = 3 * Math.floor(
      Math.log(this.minWidth_ * pointResolution) / Math.log(10));
  var count, width;
  while (true) {
    count = ol.control.ScaleLine.LEADING_DIGITS[i % 3] *
        Math.pow(10, Math.floor(i / 3));
    width = Math.round(count / pointResolution);
    if (isNaN(width)) {
      goog.style.setElementShown(this.element_, false);
      this.renderedVisible_ = false;
      return;
    } else if (width >= this.minWidth_) {
      break;
    }
    ++i;
  }

  var html = count + suffix;
  if (this.renderedHTML_ != html) {
    this.innerElement_.innerHTML = html;
    this.renderedHTML_ = html;
  }

  if (this.renderedWidth_ != width) {
    this.innerElement_.style.width = width + 'px';
    this.renderedWidth_ = width;
  }

  if (!this.renderedVisible_) {
    goog.style.setElementShown(this.element_, true);
    this.renderedVisible_ = true;
  }

};
