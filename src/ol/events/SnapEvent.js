/**
 * @module ol/events/SnapEvent
 */
import Event from './Event.js';

/**
 * @enum {string}
 */
export const SnapEventType = {
  /**
   * Triggered upon snapping to vertex or edge
   * @event SnapEvent#snap
   * @api
   */
  SNAP: 'snap',
  UNSNAP: 'unsnap',
};

/**
 * @classdesc
 * Events emitted by {@link module:ol/interaction/Snap~Snap} instances are instances of this
 */
export class SnapEvent extends Event {
  /**
   * @param {SnapEventType} type Type.
   * @param {Object} options Options.
   * @param {import("../coordinate.js").Coordinate} options.vertex The snapped vertex.
   * @param {import("../coordinate.js").Coordinate} options.vertexPixel The pixel of the snapped vertex.
   * @param {import("../Feature.js").default} options.feature The feature being snapped.
   * @param {Array<import("../coordinate.js").Coordinate>|null} options.segment Segment, or `null` if snapped to a vertex.
   */
  constructor(type, options) {
    super(type);
    /**
     * The Map coordinate of the snapped point.
     * @type {import("../coordinate.js").Coordinate}
     * @api
     */
    this.vertex = options.vertex;
    /**
     * The Map pixel of the snapped point.
     * @type {Array<number>&Array<number>}
     * @api
     */
    this.vertexPixel = options.vertexPixel;
    /**
     * The feature closest to the snapped point.
     * @type {import("../Feature.js").default<import("../geom/Geometry.js").default>}
     * @api
     */
    this.feature = options.feature;
    /**
     * The segment closest to the snapped point, if snapped to a segment.
     * @type {Array<import("../coordinate.js").Coordinate>|null}
     * @api
     */
    this.segment = options.segment;
  }
}
