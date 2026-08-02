/**
 * @module ol/render/Box
 */

import Disposable from '../Disposable.js';
import Polygon from '../geom/Polygon.js';

class RenderBox extends Disposable {
  /**
   * @param {string} className CSS class name.
   */
  constructor(className) {
    super();

    /**
     * @type {import("../geom/Polygon.js").default|null}
     * @private
     */
    this.geometry_ = null;

    /**
     * @type {HTMLDivElement}
     * @private
     */
    this.element_ = document.createElement('div');
    this.element_.style.position = 'absolute';
    this.element_.style.pointerEvents = 'auto';
    this.element_.className = 'ol-box ' + className;

    /**
     * @private
     * @type {import("../Map.js").default|null}
     */
    this.map_ = null;

    /**
     * @private
     * @type {import("../pixel.js").Pixel|null}
     */
    this.startPixel_ = null;

    /**
     * @private
     * @type {import("../pixel.js").Pixel|null}
     */
    this.endPixel_ = null;
  }

  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    this.setMap(null);
  }

  /**
   * @private
   */
  render_() {
    const startPixel = this.startPixel_;
    const endPixel = this.endPixel_;
    if (!startPixel || !endPixel) {
      return;
    }
    const px = 'px';
    const style = this.element_.style;
    style.left = Math.min(startPixel[0], endPixel[0]) + px;
    style.top = Math.min(startPixel[1], endPixel[1]) + px;
    style.width = Math.abs(endPixel[0] - startPixel[0]) + px;
    style.height = Math.abs(endPixel[1] - startPixel[1]) + px;
  }

  /**
   * @param {import("../Map.js").default|null} map Map.
   */
  setMap(map) {
    if (this.map_) {
      const container = this.map_.getOverlayContainer();
      if (container) {
        container.removeChild(this.element_);
      }
      const style = this.element_.style;
      style.left = 'inherit';
      style.top = 'inherit';
      style.width = 'inherit';
      style.height = 'inherit';
    }
    this.map_ = map;
    if (this.map_) {
      const container = this.map_.getOverlayContainer();
      if (container) {
        container.appendChild(this.element_);
      }
    }
  }

  /**
   * @param {import("../pixel.js").Pixel} startPixel Start pixel.
   * @param {import("../pixel.js").Pixel} endPixel End pixel.
   */
  setPixels(startPixel, endPixel) {
    this.startPixel_ = startPixel;
    this.endPixel_ = endPixel;
    this.createOrUpdateGeometry();
    this.render_();
  }

  /**
   * Creates or updates the cached geometry.
   */
  createOrUpdateGeometry() {
    if (!this.map_) {
      return;
    }

    const startPixel = this.startPixel_;
    const endPixel = this.endPixel_;
    if (!startPixel || !endPixel) {
      return;
    }

    const pixels = [
      startPixel,
      [startPixel[0], endPixel[1]],
      endPixel,
      [endPixel[0], startPixel[1]],
    ];
    const map = this.map_;
    const coordinates = pixels.map((pixel) =>
      map.getCoordinateFromPixelInternal(pixel),
    );
    const first = coordinates[0];
    if (!first) {
      return;
    }
    // close the polygon
    coordinates[4] = first.slice();
    const ring = /** @type {Array<import("../coordinate.js").Coordinate>} */ (
      coordinates
    );
    if (!this.geometry_) {
      this.geometry_ = new Polygon([ring]);
    } else {
      this.geometry_.setCoordinates([ring]);
    }
  }

  /**
   * @return {import("../geom/Polygon.js").default} Geometry.
   */
  getGeometry() {
    return /** @type {import("../geom/Polygon.js").default} */ (this.geometry_);
  }
}

export default RenderBox;
