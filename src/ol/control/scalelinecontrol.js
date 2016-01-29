goog.provide('ol.control.ScaleLine');
goog.provide('ol.control.ScaleLineProperty');
goog.provide('ol.control.ScaleLineUnits');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('ol.events');
goog.require('goog.style');
goog.require('ol');
goog.require('ol.Object');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.proj.METERS_PER_UNIT');
goog.require('ol.proj.Units');


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

  var options = opt_options ? opt_options : {};

  var className = options.className ? options.className : 'ol-scale-line';

  /**
   * @private
   * @type {Element}
   */
  this.innerElement_ = goog.dom.createDom('DIV',
      className + '-inner');

  /**
   * @private
   * @type {Element}
   */
  this.element_ = goog.dom.createDom('DIV',
      className + ' ' + ol.css.CLASS_UNSELECTABLE, this.innerElement_);

  /**
   * @private
   * @type {?olx.ViewState}
   */
  this.viewState_ = null;

  /**
   * @private
   * @type {number}
   */
  this.minWidth_ = options.minWidth !== undefined ? options.minWidth : 64;

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

  var render = options.render ? options.render : ol.control.ScaleLine.render;

  goog.base(this, {
    element: this.element_,
    render: render,
    target: options.target
  });

  ol.events.listen(
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
 * Return the units to use in the scale line.
 * @return {ol.control.ScaleLineUnits|undefined} The units to use in the scale
 *     line.
 * @observable
 * @api stable
 */
ol.control.ScaleLine.prototype.getUnits = function() {
  return /** @type {ol.control.ScaleLineUnits|undefined} */ (
      this.get(ol.control.ScaleLineProperty.UNITS));
};


/**
 * Update the scale line element.
 * @param {ol.MapEvent} mapEvent Map event.
 * @this {ol.control.ScaleLine}
 * @api
 */
ol.control.ScaleLine.render = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (!frameState) {
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
 * Set the units to use in the scale line.
 * @param {ol.control.ScaleLineUnits} units The units to use in the scale line.
 * @observable
 * @api stable
 */
ol.control.ScaleLine.prototype.setUnits = function(units) {
  this.set(ol.control.ScaleLineProperty.UNITS, units);
};


/**
 * @private
 */
ol.control.ScaleLine.prototype.updateElement_ = function() {
  var viewState = this.viewState_;

  if (!viewState) {
    if (this.renderedVisible_) {
      goog.style.setElementShown(this.element_, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  var center = viewState.center;
  var projection = viewState.projection;
  var metersPerUnit = projection.getMetersPerUnit();
  var pointResolution =
      projection.getPointResolution(viewState.resolution, center) *
      metersPerUnit;

  var nominalCount = this.minWidth_ * pointResolution;
  var suffix = '';
  var units = this.getUnits();
  if (units == ol.control.ScaleLineUnits.DEGREES) {
    var metersPerDegree = ol.proj.METERS_PER_UNIT[ol.proj.Units.DEGREES];
    pointResolution /= metersPerDegree;
    if (nominalCount < metersPerDegree / 60) {
      suffix = '\u2033'; // seconds
      pointResolution *= 3600;
    } else if (nominalCount < metersPerDegree) {
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
    goog.asserts.fail('Scale line element cannot be updated');
  }

  var i = 3 * Math.floor(
      Math.log(this.minWidth_ * pointResolution) / Math.log(10));
  var count, width;
  while (true) {
    count = ol.control.ScaleLine.LEADING_DIGITS[((i % 3) + 3) % 3] *
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

  var html = count + ' ' + suffix;
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
