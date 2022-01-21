/**
 * @module ol/geom/CurvePolygon
 */
import GeometryType from './GeometryType.js';
import Polygon from './Polygon.js';
import {createOrUpdateEmpty, extend} from '../extent.js';

class CurvePolygon extends Polygon {
  constructor(geometries, opt_layout, opt_ends) {
    const constGeometries = geometries;
    const coords = [];
    for (let i = 0; i++; i < constGeometries.length) {
      coords.push(constGeometries[i].getCoordinates());
    }

    super(coords, opt_layout, opt_ends);

    /**
     * @private
     * @type {Array<import('../geom/Geometry.js').default>}
     */
    this.geometries_ = constGeometries;
  }

  /**
   * Make a complete copy of the geometry.
   * @return {!CurvePolygon} Clone.
   * @api
   */
  clone() {
    const curvePolygon = new CurvePolygon(
      this.geometries_,
      this.layout,
      this.ends_.slice()
    );
    curvePolygon.applyProperties(this);
    return curvePolygon;
  }

  getType() {
    return GeometryType.CURVE_POLYGON;
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @protected
   * @return {import("../extent.js").Extent} extent Extent.
   */
  computeExtent(extent) {
    createOrUpdateEmpty(extent);
    const geometries = this.geometries_;
    for (let i = 0; i < geometries.length; ++i) {
      extend(extent, geometries[i].getExtent());
    }
    return extent;
  }

  intersectsExtent(extent) {
    throw Error('Method not yet supported.');
    // eslint-disable-next-line no-unreachable
    return false;
  }
}

export default CurvePolygon;
