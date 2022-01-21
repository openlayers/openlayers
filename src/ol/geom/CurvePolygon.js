/**
 * @module ol/geom/CurvePolygon
 */
import GeometryType from './GeometryType.js';
import Polygon from './Polygon.js';
import {createOrUpdateEmpty, extend} from '../extent.js';

function getCoords(rings) {
  const coords = [];

  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i];

    const ringType = ring.getType();
    if (
      ringType === GeometryType.CIRCULAR_STRING ||
      ringType === GeometryType.LINE_STRING
    ) {
      coords.push(ring.getCoordinates());
    } else {
      const geometries = ring.getGeometries();
      for (let ii = 0; ii < geometries.length; ii++) {
        coords.push(geometries[ii].getCoordinates());
      }
    }
  }
  return coords;
}

class CurvePolygon extends Polygon {
  constructor(rings, opt_layout, opt_ends) {
    super(getCoords(rings), opt_layout, opt_ends);

    /**
     * @private
     * @type {Array<import('../geom/Geometry.js').default>}
     */
    this.rings_ = rings;
  }

  /**
   * Make a complete copy of the geometry.
   * @return {!CurvePolygon} Clone.
   * @api
   */
  clone() {
    const curvePolygon = new CurvePolygon(
      this.rings_,
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
   * @param {number} squaredTolerance Squared tolerance.
   * @return {Polygon} Simplified Polygon.
   * @protected
   */
  getSimplifiedGeometryInternal(squaredTolerance) {
    // todo: moeten we hier iets mee?
    // als ik deze niet hier implementeer wordt de method van de Polygon class
    // aangeroepen en wordt er een Polygon gereturned. En dat is niet de bedoeling,
    // want dan zal niet de juiste renderer worden aangeroepen (namelijk die van de
    // Polygon in plaats van de CurvePolygon).
    return this.clone();
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @protected
   * @return {import("../extent.js").Extent} extent Extent.
   */
  computeExtent(extent) {
    createOrUpdateEmpty(extent);
    const geometries = this.rings_;
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
