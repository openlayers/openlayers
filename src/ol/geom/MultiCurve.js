/**
 * @module ol/geom/MultiCurve
 */
import GeometryType from './GeometryType.js';
import {GeometryCollection} from '../geom.js';

class MultiCurve extends GeometryCollection {
  constructor(geometries, opt_layout) {
    super(geometries);
  }

  getType() {
    return GeometryType.MULTI_CURVE;
  }
}

export default MultiCurve;
