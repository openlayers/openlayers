goog.provide('ol.CenterConstraint');

goog.require('ol.extent');
goog.require('ol.math');


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.View|undefined} view Restrict to viewport of this view, if given.
 * @return {ol.CenterConstraintType} The constraint.
 */
ol.CenterConstraint.createExtent = function(extent, view) {
  // Extent doesn't change, so we can store the size and center.
  var extentSize = [
    extent[2] - extent[0],
    extent[3] - extent[1],
  ];
  var extentCenter = ol.extent.getCenter(extent);
  return (
    /**
     * @param {ol.Coordinate|undefined} center Center.
     * @return {ol.Coordinate|undefined} Center.
     */
    function(center) {
      if (center) {
        var extent_ = extent;
        // TODO: Handle rotated views?
        // Restrict the extent further if a view was given.
        if (view) {
          // TODO: Improve performance and readability by tracking viewport (and resolution) changes.
          var viewportSize = view.getSizeFromViewport();
          var viewResolution = view.getResolution();
          // Deltas can not be negative or we will create an invalid extent.
          // Clamp to the center when the restrictExtent has smaller display than the Viewport.
          var deltaX = Math.max((extentSize[0] - (viewportSize[0] * viewResolution)) / 2, 0);
          var deltaY = Math.max((extentSize[1] - (viewportSize[1] * viewResolution)) / 2, 0);
          var c = ol.extent.getCenter(extent);
          extent_ = [
            extentCenter[0] - deltaX,
            extentCenter[1] - deltaY,
            extentCenter[0] + deltaX,
            extentCenter[1] + deltaY,
          ];
        }
        return [
          ol.math.clamp(center[0], extent_[0], extent_[2]),
          ol.math.clamp(center[1], extent_[1], extent_[3])
        ];
      } else {
        return undefined;
      }
    });
};


/**
 * @param {ol.Coordinate|undefined} center Center.
 * @return {ol.Coordinate|undefined} Center.
 */
ol.CenterConstraint.none = function(center) {
  return center;
};
