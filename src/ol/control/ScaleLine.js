/**
 * @module ol/control/ScaleLine
 */
import Control from './Control.js';
import ProjUnits from '../proj/Units.js';
import {CLASS_UNSELECTABLE} from '../css.js';
import {METERS_PER_UNIT, getPointResolution} from '../proj.js';
import {assert} from '../asserts.js';

/**
 * @type {string}
 */
const UNITS_PROP = 'units';

/**
 * Units for the scale line. Supported values are `'degrees'`, `'imperial'`,
 * `'nautical'`, `'metric'`, `'us'`.
 * @enum {string}
 */
export const Units = {
  DEGREES: 'degrees',
  IMPERIAL: 'imperial',
  NAUTICAL: 'nautical',
  METRIC: 'metric',
  US: 'us',
};

/**
 * @const
 * @type {Array<number>}
 */
const LEADING_DIGITS = [1, 2, 5];

/**
 * @const
 * @type {number}
 */
const DEFAULT_DPI = 25.4 / 0.28;

/**
 * @typedef {Object} Options
 * @property {string} [className='ol-scale-line'] CSS Class name.
 * @property {number} [minWidth=64] Minimum width in pixels at the OGC default dpi. The width will be
 * adjusted to match the dpi used.
 * @property {function(import("../MapEvent.js").default):void} [render] Function called when the control
 * should be re-rendered. This is called in a `requestAnimationFrame` callback.
 * @property {HTMLElement|string} [target] Specify a target if you want the control
 * to be rendered outside of the map's viewport.
 * @property {import("./ScaleLine.js").Units|string} [units='metric'] Units.
 * @property {boolean} [bar=false] Render scalebars instead of a line.
 * @property {number} [steps=4] Number of steps the scalebar should use. Use even numbers
 * for best results. Only applies when `bar` is `true`.
 * @property {boolean} [text=false] Render the text scale above of the scalebar. Only applies
 * when `bar` is `true`.
 * @property {number|undefined} [dpi=undefined] dpi of output device such as printer. Only applies
 * when `bar` is `true`. If undefined the OGC default screen pixel size of 0.28mm will be assumed.
 */

/**
 * @classdesc
 * A control displaying rough y-axis distances, calculated for the center of the
 * viewport. For conformal projections (e.g. EPSG:3857, the default view
 * projection in OpenLayers), the scale is valid for all directions.
 * No scale line will be shown when the y-axis distance of a pixel at the
 * viewport center cannot be calculated in the view projection.
 * By default the scale line will show in the bottom left portion of the map,
 * but this can be changed by using the css selector `.ol-scale-line`.
 * When specifying `bar` as `true`, a scalebar will be rendered instead
 * of a scaleline.
 *
 * @api
 */
class ScaleLine extends Control {
  /**
   * @param {Options} [opt_options] Scale line options.
   */
  constructor(opt_options) {
    const options = opt_options ? opt_options : {};

    const className =
      options.className !== undefined
        ? options.className
        : options.bar
        ? 'ol-scale-bar'
        : 'ol-scale-line';

    super({
      element: document.createElement('div'),
      render: options.render,
      target: options.target,
    });

    /***
     * @type {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default> &
     *   import("../Observable").OnSignature<import("../ObjectEventType").Types|
     *     'change:units', import("../Object").ObjectEvent>}
     */
    this.on;

    /**
     * @private
     * @type {HTMLElement}
     */
    this.innerElement_ = document.createElement('div');
    this.innerElement_.className = className + '-inner';

    this.element.className = className + ' ' + CLASS_UNSELECTABLE;
    this.element.appendChild(this.innerElement_);

    /**
     * @private
     * @type {?import("../View.js").State}
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

    this.addChangeListener(UNITS_PROP, this.handleUnitsChanged_);

    this.setUnits(options.units || Units.METRIC);

    /**
     * @private
     * @type {boolean}
     */
    this.scaleBar_ = options.bar || false;

    /**
     * @private
     * @type {number}
     */
    this.scaleBarSteps_ = options.steps || 4;

    /**
     * @private
     * @type {boolean}
     */
    this.scaleBarText_ = options.text || false;

    /**
     * @private
     * @type {number|undefined}
     */
    this.dpi_ = options.dpi || undefined;
  }

  /**
   * Return the units to use in the scale line.
   * @return {import("./ScaleLine.js").Units} The units
   * to use in the scale line.
   * @observable
   * @api
   */
  getUnits() {
    return this.get(UNITS_PROP);
  }

  /**
   * @private
   */
  handleUnitsChanged_() {
    this.updateElement_();
  }

  /**
   * Set the units to use in the scale line.
   * @param {import("./ScaleLine.js").Units} units The units to use in the scale line.
   * @observable
   * @api
   */
  setUnits(units) {
    this.set(UNITS_PROP, units);
  }

  /**
   * Specify the dpi of output device such as printer.
   * @param {number|undefined} dpi The dpi of output device.
   * @api
   */
  setDpi(dpi) {
    this.dpi_ = dpi;
  }

  /**
   * @private
   */
  updateElement_() {
    const viewState = this.viewState_;

    if (!viewState) {
      if (this.renderedVisible_) {
        this.element.style.display = 'none';
        this.renderedVisible_ = false;
      }
      return;
    }

    const center = viewState.center;
    const projection = viewState.projection;
    const units = this.getUnits();
    const pointResolutionUnits =
      units == Units.DEGREES ? ProjUnits.DEGREES : ProjUnits.METERS;
    let pointResolution = getPointResolution(
      projection,
      viewState.resolution,
      center,
      pointResolutionUnits
    );

    const minWidth =
      (this.minWidth_ * (this.dpi_ || DEFAULT_DPI)) / DEFAULT_DPI;

    let nominalCount = minWidth * pointResolution;
    let suffix = '';
    if (units == Units.DEGREES) {
      const metersPerDegree = METERS_PER_UNIT[ProjUnits.DEGREES];
      nominalCount *= metersPerDegree;
      if (nominalCount < metersPerDegree / 60) {
        suffix = '\u2033'; // seconds
        pointResolution *= 3600;
      } else if (nominalCount < metersPerDegree) {
        suffix = '\u2032'; // minutes
        pointResolution *= 60;
      } else {
        suffix = '\u00b0'; // degrees
      }
    } else if (units == Units.IMPERIAL) {
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
    } else if (units == Units.NAUTICAL) {
      pointResolution /= 1852;
      suffix = 'nm';
    } else if (units == Units.METRIC) {
      if (nominalCount < 0.001) {
        suffix = 'μm';
        pointResolution *= 1000000;
      } else if (nominalCount < 1) {
        suffix = 'mm';
        pointResolution *= 1000;
      } else if (nominalCount < 1000) {
        suffix = 'm';
      } else {
        suffix = 'km';
        pointResolution /= 1000;
      }
    } else if (units == Units.US) {
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
      assert(false, 33); // Invalid units
    }

    let i = 3 * Math.floor(Math.log(minWidth * pointResolution) / Math.log(10));
    let count, width, decimalCount;
    while (true) {
      decimalCount = Math.floor(i / 3);
      const decimal = Math.pow(10, decimalCount);
      count = LEADING_DIGITS[((i % 3) + 3) % 3] * decimal;
      width = Math.round(count / pointResolution);
      if (isNaN(width)) {
        this.element.style.display = 'none';
        this.renderedVisible_ = false;
        return;
      } else if (width >= minWidth) {
        break;
      }
      ++i;
    }
    let html;
    if (this.scaleBar_) {
      html = this.createScaleBar(width, count, suffix);
    } else {
      html = count.toFixed(decimalCount < 0 ? -decimalCount : 0) + ' ' + suffix;
    }

    if (this.renderedHTML_ != html) {
      this.innerElement_.innerHTML = html;
      this.renderedHTML_ = html;
    }

    if (this.renderedWidth_ != width) {
      this.innerElement_.style.width = width + 'px';
      this.renderedWidth_ = width;
    }

    if (!this.renderedVisible_) {
      this.element.style.display = '';
      this.renderedVisible_ = true;
    }
  }

  /**
   * @private
   * @param {number} width The current width of the scalebar.
   * @param {number} scale The current scale.
   * @param {string} suffix The suffix to append to the scale text.
   * @return {string} The stringified HTML of the scalebar.
   */
  createScaleBar(width, scale, suffix) {
    const mapScale =
      '1 : ' + Math.round(this.getScaleForResolution()).toLocaleString();
    const scaleSteps = [];
    const stepWidth = width / this.scaleBarSteps_;
    let backgroundColor = '#ffffff';
    for (let i = 0; i < this.scaleBarSteps_; i++) {
      if (i === 0) {
        // create the first marker at position 0
        scaleSteps.push(this.createMarker('absolute', i));
      }
      scaleSteps.push(
        '<div>' +
          '<div ' +
          'class="ol-scale-singlebar" ' +
          'style=' +
          '"width: ' +
          stepWidth +
          'px;' +
          'background-color: ' +
          backgroundColor +
          ';"' +
          '>' +
          '</div>' +
          this.createMarker('relative', i) +
          /*render text every second step, except when only 2 steps */
          (i % 2 === 0 || this.scaleBarSteps_ === 2
            ? this.createStepText(i, width, false, scale, suffix)
            : '') +
          '</div>'
      );
      if (i === this.scaleBarSteps_ - 1) {
        {
          /*render text at the end */
        }
        scaleSteps.push(this.createStepText(i + 1, width, true, scale, suffix));
      }
      // switch colors of steps between black and white
      if (backgroundColor === '#ffffff') {
        backgroundColor = '#000000';
      } else {
        backgroundColor = '#ffffff';
      }
    }

    let scaleBarText;
    if (this.scaleBarText_) {
      scaleBarText =
        '<div ' +
        'class="ol-scale-text" ' +
        'style="width: ' +
        width +
        'px;">' +
        mapScale +
        '</div>';
    } else {
      scaleBarText = '';
    }
    const container =
      '<div ' +
      'style="display: flex;">' +
      scaleBarText +
      scaleSteps.join('') +
      '</div>';
    return container;
  }

  /**
   * Creates a marker at given position
   * @param {string} position The position, absolute or relative
   * @param {number} i The iterator
   * @return {string} The stringified div containing the marker
   */
  createMarker(position, i) {
    const top = position === 'absolute' ? 3 : -10;
    return (
      '<div ' +
      'class="ol-scale-step-marker" ' +
      'style="position: ' +
      position +
      ';' +
      'top: ' +
      top +
      'px;"' +
      '></div>'
    );
  }

  /**
   * Creates the label for a marker marker at given position
   * @param {number} i The iterator
   * @param {number} width The width the scalebar will currently use
   * @param {boolean} isLast Flag indicating if we add the last step text
   * @param {number} scale The current scale for the whole scalebar
   * @param {string} suffix The suffix for the scale
   * @return {string} The stringified div containing the step text
   */
  createStepText(i, width, isLast, scale, suffix) {
    const length =
      i === 0 ? 0 : Math.round((scale / this.scaleBarSteps_) * i * 100) / 100;
    const lengthString = length + (i === 0 ? '' : ' ' + suffix);
    const margin = i === 0 ? -3 : (width / this.scaleBarSteps_) * -1;
    const minWidth = i === 0 ? 0 : (width / this.scaleBarSteps_) * 2;
    return (
      '<div ' +
      'class="ol-scale-step-text" ' +
      'style="' +
      'margin-left: ' +
      margin +
      'px;' +
      'text-align: ' +
      (i === 0 ? 'left' : 'center') +
      '; ' +
      'min-width: ' +
      minWidth +
      'px;' +
      'left: ' +
      (isLast ? width + 'px' : 'unset') +
      ';"' +
      '>' +
      lengthString +
      '</div>'
    );
  }

  /**
   * Returns the appropriate scale for the given resolution and units.
   * @return {number} The appropriate scale.
   */
  getScaleForResolution() {
    const resolution = getPointResolution(
      this.viewState_.projection,
      this.viewState_.resolution,
      this.viewState_.center
    );
    const dpi = this.dpi_ || DEFAULT_DPI;
    const mpu = this.viewState_.projection.getMetersPerUnit();
    const inchesPerMeter = 1000 / 25.4;
    return parseFloat(resolution.toString()) * mpu * inchesPerMeter * dpi;
  }

  /**
   * Update the scale line element.
   * @param {import("../MapEvent.js").default} mapEvent Map event.
   * @override
   */
  render(mapEvent) {
    const frameState = mapEvent.frameState;
    if (!frameState) {
      this.viewState_ = null;
    } else {
      this.viewState_ = frameState.viewState;
    }
    this.updateElement_();
  }
}

export default ScaleLine;
