import _ol_math_ from './math';
var _ol_CenterConstraint_ = {};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.CenterConstraintType} The constraint.
 */
_ol_CenterConstraint_.createExtent = function(extent) {
  return (
    /**
     * @param {ol.Coordinate|undefined} center Center.
     * @return {ol.Coordinate|undefined} Center.
     */
    function(center) {
      if (center) {
        return [
          _ol_math_.clamp(center[0], extent[0], extent[2]),
          _ol_math_.clamp(center[1], extent[1], extent[3])
        ];
      } else {
        return undefined;
      }
    }
  );
};


/**
 * @param {ol.Coordinate|undefined} center Center.
 * @return {ol.Coordinate|undefined} Center.
 */
_ol_CenterConstraint_.none = function(center) {
  return center;
};
export default _ol_CenterConstraint_;
