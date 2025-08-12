/**
 * @module ol/format/IGC
 */
import Feature from '../Feature.js';
import LineString from '../geom/LineString.js';
import { get as getProjection } from '../proj.js';
import { transformGeometryWithOptions } from './Feature.js';
import TextFeature from './TextFeature.js';

/**
 * @typedef {'barometric' | 'gps' | 'none'} IGCZ
 * IGC altitude/z. One of 'barometric', 'gps', 'none'.
 */

/**
 * @const
 * @type {RegExp}
 */
const B_RECORD_RE =
  /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/;

/**
 * @const
 * @type {RegExp}
 */
const H_RECORD_RE = /^H.([A-Z]{3}).*?:(.*)/;

/**
 * @const
 * @type {RegExp}
 */
const HFDTE_RECORD_RE = /^HFDTE(\d{2})(\d{2})(\d{2})/;

/**
 * @const
 * @type {RegExp}
 */
const HFDTEDATE_RECORD_RE = /^HFDTEDATE:(\d{2})(\d{2})(\d{2}),(\d{2})/;

/**
 * A regular expression matching the newline characters `\r\n`, `\r` and `\n`.
 *
 * @const
 * @type {RegExp}
 */
const NEWLINE_RE = /\r\n|\r|\n/;

/**
 * @typedef {Object} Options
 * @property {IGCZ} [altitudeMode='none'] Altitude mode. Possible
 * values are `'barometric'`, `'gps'`, and `'none'`.
 */

/**
 * @classdesc
 * Feature format for `*.igc` flight recording files.
 *
 * As IGC sources contain a single feature,
 * {@link module:ol/format/IGC~IGC#readFeatures} will return the feature in an
 * array.
 *
 * @api
 */
class IGC extends TextFeature {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    super();

    options = options || {};

    /**
     * @type {import("../proj/Projection.js").default}
     */
    this.dataProjection = getProjection('EPSG:4326');

    /**
     * @private
     * @type {IGCZ}
     */
    this.altitudeMode_ = options.altitudeMode || 'none';

    this.lad_ = false;
    this.lod_ = false;
    this.ladStart_ = 0;
    this.ladStop_ = 0;
    this.lodStart_ = 0;
    this.lodStop_ = 0;
  }

  /**
   * @protected
   * @param {string} text The IGC text data.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @return {import("../Feature.js").default|null} Feature.
   * @override
   */
  readFeatureFromText(text, options) {
    const altitudeMode = this.altitudeMode_;
    const lines = text.split(NEWLINE_RE);
    /** @type {Object<string, string>} */
    const properties = {};
    const flatCoordinates = [];
    let year = 2000;
    let month = 0;
    let day = 1;
    let lastDateTime = -1;
    let i, ii;
    for (i = 0, ii = lines.length; i < ii; ++i) {
      const line = lines[i];
      let m;
      if (line.charAt(0) === 'B') {
        m = B_RECORD_RE.exec(line);
        if (m) {
          const hour = parseInt(m[1], 10);
          const minute = parseInt(m[2], 10);
          const second = parseInt(m[3], 10);
          let y = parseInt(m[4], 10) + parseInt(m[5], 10) / 60000;
          if (this.lad_) {
            y +=
              parseInt(line.slice(this.ladStart_, this.ladStop_), 10) /
              60000 /
              10 ** (this.ladStop_ - this.ladStart_);
          }
          if (m[6] === 'S') {
            y = -y;
          }
          let x = parseInt(m[7], 10) + parseInt(m[8], 10) / 60000;
          if (this.lod_) {
            x +=
              parseInt(line.slice(this.lodStart_, this.lodStop_), 10) /
              60000 /
              10 ** (this.lodStop_ - this.lodStart_);
          }
          if (m[9] === 'W') {
            x = -x;
          }
          flatCoordinates.push(x, y);
          if (altitudeMode !== 'none') {
            let z;
            if (altitudeMode === 'gps') {
              z = parseInt(m[11], 10);
            } else if (altitudeMode === 'barometric') {
              z = parseInt(m[12], 10);
            } else {
              z = 0;
            }
            flatCoordinates.push(z);
          }
          let dateTime = Date.UTC(year, month, day, hour, minute, second);
          if (dateTime < lastDateTime) {
            dateTime = Date.UTC(year, month, day + 1, hour, minute, second);
          }
          flatCoordinates.push(dateTime / 1000);
          lastDateTime = dateTime;
        }
      } else if (line.charAt(0) === 'H') {
        m = HFDTEDATE_RECORD_RE.exec(line);
        if (m) {
          day = parseInt(m[1], 10);
          month = parseInt(m[2], 10) - 1;
          year = 2000 + parseInt(m[3], 10);
        } else {
          m = HFDTE_RECORD_RE.exec(line);
          if (m) {
            day = parseInt(m[1], 10);
            month = parseInt(m[2], 10) - 1;
            year = 2000 + parseInt(m[3], 10);
          } else {
            m = H_RECORD_RE.exec(line);
            if (m) {
              properties[m[1]] = m[2].trim();
            }
          }
        }
      } else if (line.charAt(0) === 'I') {
        const numberAdds = parseInt(line.slice(1, 3), 10);
        for (let j = 0; j < numberAdds; j++) {
          const start = 3 + j * 7;
          const addCode = line.slice(start + 4, start + 7);
          if (addCode === 'LAD') {
            this.lad_ = true;
            this.ladStart_ = start;
            this.ladStop_ = start + 2;
          } else if (addCode === 'LOD') {
            this.lod_ = true;
            this.lodStart_ = start;
            this.lodStop_ = start + 2;
          }
        }
      }
    }
    if (!flatCoordinates.length) {
      return null;
    }
    const layout = altitudeMode === 'none' ? 'XYM' : 'XYZM';
    const lineString = new LineString(flatCoordinates, layout);
    const feature = new Feature(
      transformGeometryWithOptions(lineString, false, options)
    );
    feature.setProperties(properties, true);
    return feature;
  }

  /**
   * @param {string} text The IGC text data.
   * @param {import("./Feature.js").ReadOptions} [options] Read options.
   * @protected
   * @return {Array<import("../Feature.js").default>} Features.
   * @override
   */
  readFeaturesFromText(text, options) {
    const feature = this.readFeatureFromText(text, options);
    return feature ? [feature] : [];
  }
}

export default IGC;
