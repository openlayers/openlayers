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
 */

/**
 * @typedef {Object} Options
 * @property {IGCZ} [altitudeMode='none'] Altitude mode. Possible values: 'barometric', 'gps', 'none'.
 */

// Regex constants
const B_RECORD_RE = /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/;
const H_RECORD_RE = /^H.([A-Z]{3}).*?:(.*)/;
const HFDTE_RECORD_RE = /^HFDTE(\d{2})(\d{2})(\d{2})/;
const HFDTEDATE_RECORD_RE = /^HFDTEDATE:(\d{2})(\d{2})(\d{2}),(\d{2})/;
const NEWLINE_RE = /\r\n|\r|\n/;

/**
 * @classdesc
 * Feature format for `*.igc` flight recording files.
 * @api
 */
class IGC extends TextFeature {
  /**
   * @param {Options} [options]
   */
  constructor(options = {}) {
    super();

    /** @type {import("../proj/Projection.js").default} */
    this.dataProjection = getProjection('EPSG:4326');

    /** @private @type {IGCZ} */
    this.altitudeMode_ = options.altitudeMode ?? 'none';

    /** @private */
    this.lad_ = false;
    /** @private */
    this.lod_ = false;

    this.ladStart_ = 0;
    this.ladStop_ = 0;
    this.lodStart_ = 0;
    this.lodStop_ = 0;
  }

  /**
   * @protected
   * @override
   * @param {string} text
   * @param {import("./Feature.js").ReadOptions} [options]
   * @return {import("../Feature.js").default | null}
   */
  readFeatureFromText(text, options) {
    const altitudeMode = this.altitudeMode_;
    const lines = text.split(NEWLINE_RE);
    const flatCoordinates = [];
    const properties = {};

    let [year, month, day] = [2000, 0, 1];
    let lastDateTime = -1;

    for (const line of lines) {
      if (line.startsWith('B')) {
        const m = B_RECORD_RE.exec(line);
        if (!m) continue;

        const [hour, minute, second] = [m[1], m[2], m[3]].map(Number);

        let lat = parseInt(m[4], 10) + parseInt(m[5], 10) / 60000;
        if (this.lad_) {
          lat += parseInt(line.slice(this.ladStart_, this.ladStop_), 10) / 60000 / 10 ** (this.ladStop_ - this.ladStart_);
        }
        if (m[6] === 'S') lat *= -1;

        let lon = parseInt(m[7], 10) + parseInt(m[8], 10) / 60000;
        if (this.lod_) {
          lon += parseInt(line.slice(this.lodStart_, this.lodStop_), 10) / 60000 / 10 ** (this.lodStop_ - this.lodStart_);
        }
        if (m[9] === 'W') lon *= -1;

        flatCoordinates.push(lon, lat);

        if (altitudeMode !== 'none') {
          const z = altitudeMode === 'gps' ? parseInt(m[11], 10) : parseInt(m[12], 10);
          flatCoordinates.push(z);
        }

        let dateTime = Date.UTC(year, month, day, hour, minute, second);
        if (dateTime < lastDateTime) {
          dateTime = Date.UTC(year, month, day + 1, hour, minute, second);
        }

        flatCoordinates.push(dateTime / 1000);
        lastDateTime = dateTime;

      } else if (line.startsWith('H')) {
        let m = HFDTEDATE_RECORD_RE.exec(line) ?? HFDTE_RECORD_RE.exec(line);
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
      } else if (line.startsWith('I')) {
        const numberAdds = parseInt(line.slice(1, 3), 10);
        for (let i = 0; i < numberAdds; i++) {
          const start = 3 + i * 7;
          const addStart = parseInt(line.slice(start, start + 2), 10) - 1;
          const addStop = parseInt(line.slice(start + 2, start + 4), 10);
          const addCode = line.slice(start + 4, start + 7);
          if (addCode === 'LAD') {
            this.lad_ = true;
            this.ladStart_ = addStart;
            this.ladStop_ = addStop;
          } else if (addCode === 'LOD') {
            this.lod_ = true;
            this.lodStart_ = addStart;
            this.lodStop_ = addStop;
          }
        }
      }
    }

    if (flatCoordinates.length === 0) return null;

    const layout = altitudeMode === 'none' ? 'XYM' : 'XYZM';
    const lineString = new LineString(flatCoordinates, layout);
    const feature = new Feature(transformGeometryWithOptions(lineString, false, options));
    feature.setProperties(properties, true);
    return feature;
  }

  /**
   * @protected
   * @override
   * @param {string} text
   * @param {import("./Feature.js").ReadOptions} [options]
   * @return {Array<Feature>}
   */
  readFeaturesFromText(text, options) {
    const feature = this.readFeatureFromText(text, options);
    return feature ? [feature] : [];
  }
}

export default IGC;
