goog.provide('ol.control.ScaleLine');
goog.provide('ol.control.ScaleLineUnits');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.math');
goog.require('goog.style');
goog.require('ol.FrameState');
goog.require('ol.ProjectionUnits');
goog.require('ol.TransformFunction');
goog.require('ol.control.Control');
goog.require('ol.css');
goog.require('ol.projection');
goog.require('ol.sphere.NORMAL');


/**
 * @enum {string}
 */
ol.control.ScaleLineUnits = {
  DEGREES: 'degrees',
  IMPERIAL: 'imperial',
  NAUTICAL: 'nautical',
  METRIC: 'metric',
  US: 'us'
};



/**
 * @constructor
 * @extends {ol.control.Control}
 * @param {ol.control.ScaleLineOptions=} opt_options Scale line options.
 */
ol.control.ScaleLine = function(opt_options) {

  var options = opt_options || {};

  /**
   * @private
   * @type {Element}
   */
  this.innerElement_ = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': 'ol-scale-line-inner'
  });

  /**
   * @private
   * @type {Element}
   */
  this.element_ = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': 'ol-scale-line ' + ol.css.CLASS_UNSELECTABLE
  }, this.innerElement_);

  /**
   * @private
   * @type {number}
   */
  this.minWidth_ = goog.isDef(options.minWidth) ? options.minWidth : 64;

  /**
   * @private
   * @type {ol.control.ScaleLineUnits}
   */
  this.units_ = goog.isDef(options.units) ?
      options.units : ol.control.ScaleLineUnits.METRIC;

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
    map: options.map,
    target: options.target
  });

};
goog.inherits(ol.control.ScaleLine, ol.control.Control);


/**
 * @const
 * @type {Array.<number>}
 */
ol.control.ScaleLine.LEADING_DIGITS = [1, 2, 5];


/**
 * @inheritDoc
 */
ol.control.ScaleLine.prototype.handleMapPostrender = function(mapEvent) {
  this.updateElement_(mapEvent.frameState);
};


/**
 * @param {?ol.FrameState} frameState Frame state.
 * @private
 */
ol.control.ScaleLine.prototype.updateElement_ = function(frameState) {

  if (goog.isNull(frameState)) {
    if (this.renderedVisible_) {
      goog.style.showElement(this.element_, false);
      this.renderedVisible_ = false;
    }
    return;
  }

  var view2DState = frameState.view2DState;
  var center = view2DState.center;
  var projection = view2DState.projection;
  var pointResolution =
      projection.getPointResolution(view2DState.resolution, center);
  var projectionUnits = projection.getUnits();

  var cosLatitude;
  if (projectionUnits == ol.ProjectionUnits.DEGREES &&
      (this.units_ == ol.control.ScaleLineUnits.METRIC ||
       this.units_ == ol.control.ScaleLineUnits.IMPERIAL)) {

    // Convert pointResolution from degrees to meters
    this.toEPSG4326_ = null;
    cosLatitude = Math.cos(goog.math.toRadians(center[1]));
    pointResolution *= Math.PI * cosLatitude * ol.sphere.NORMAL.radius / 180;
    projectionUnits = ol.ProjectionUnits.METERS;

  } else if ((projectionUnits == ol.ProjectionUnits.FEET ||
      projectionUnits == ol.ProjectionUnits.METERS) &&
      this.units_ == ol.control.ScaleLineUnits.DEGREES) {

    // Convert pointResolution from meters or feet to degrees
    if (goog.isNull(this.toEPSG4326_)) {
      this.toEPSG4326_ = ol.projection.getTransformFromProjections(
          projection, ol.projection.get('EPSG:4326'));
    }
    cosLatitude = Math.cos(goog.math.toRadians(this.toEPSG4326_(center)[1]));
    var radius = ol.sphere.NORMAL.radius;
    if (projectionUnits == ol.ProjectionUnits.FEET) {
      radius /= 0.3048;
    }
    pointResolution *= 180 / (Math.PI * cosLatitude * radius);
    projectionUnits = ol.ProjectionUnits.DEGREES;

  } else {

    this.toEPSG4326_ = null;

  }

  goog.asserts.assert(
      ((this.units_ == ol.control.ScaleLineUnits.METRIC ||
        this.units_ == ol.control.ScaleLineUnits.IMPERIAL) &&
       projectionUnits == ol.ProjectionUnits.METERS) ||
      (this.units_ == ol.control.ScaleLineUnits.DEGREES &&
       projectionUnits == ol.ProjectionUnits.DEGREES));

  var nominalCount = this.minWidth_ * pointResolution;
  var suffix = '';
  if (this.units_ == ol.control.ScaleLineUnits.DEGREES) {
    if (nominalCount < 1 / 60) {
      suffix = '\u2033'; // seconds
      pointResolution *= 3600;
    } else if (nominalCount < 1) {
      suffix = '\u2032'; // minutes
      pointResolution *= 60;
    } else {
      suffix = '\u00b0'; // degrees
    }
  } else if (this.units_ == ol.control.ScaleLineUnits.IMPERIAL) {
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
  } else if (this.units_ == ol.control.ScaleLineUnits.NAUTICAL) {
    pointResolution /= 1852;
    suffix = 'nm';
  } else if (this.units_ == ol.control.ScaleLineUnits.METRIC) {
    if (nominalCount < 1) {
      suffix = 'mm';
      pointResolution *= 1000;
    } else if (nominalCount < 1000) {
      suffix = 'm';
    } else {
      suffix = 'km';
      pointResolution /= 1000;
    }
  } else if (this.units_ == ol.control.ScaleLineUnits.US) {
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
    if (width >= this.minWidth_) {
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
    goog.style.showElement(this.element_, true);
    this.renderedVisible_ = true;
  }

};
