/**
 * @module ol/interaction/SegmentFilter
 */
import { distance } from '../coordinate';

/**
 * @classdesc
 * Recognizes the mouse hover state when the mouse pointer overlaps with a feature or overlay.
 * Allows the user to identify the state by hovering over the elements.
 * @api
 */
class SegmentFilter {
	/**
	 * Determine if the mouse coordinates fall on the endpoints of a straight line overlay
	 * @param {import("../coordinate.js").Coordinate} start Segment start coordinate.
	 * @param {import("../coordinate.js").Coordinate} end Segment end coordinate.
	 * @param {string} type The type of feature.
	 * @param {import("../coordinate.js").Coordinate} mousepoint Segment mouse coordinate.
	 * @param {number} overlayradius
	 * @return {boolean} `true` if the line segment should be selected, `false` otherwise.
	 */
	lineFilter(start, end, type, mousepoint, overlayradius) {
		if (type === 'MultiLineString' || type === 'LineString') {
			const startDistance = distance(mousepoint, start);
			const endDistance = distance(mousepoint, end);
			if (startDistance < endDistance) {
				if (startDistance <= overlayradius) {
					return false;
				} else {
					return true;
				}
			} else if (startDistance > endDistance) {
				if (endDistance <= overlayradius) {
					return false;
				} else {
					return true;
				}
			}
		}
	}
}

export default SegmentFilter;
