import _ol_proj_ from '../proj';
var _ol_proj_common_ = {};


/**
 * Deprecated.  Transforms between EPSG:4326 and EPSG:3857 are now included by
 * default.  There is no need to call this function in application code and it
 * will be removed in a future major release.
 * @deprecated This function is no longer necessary.
 * @api
 */
_ol_proj_common_.add = _ol_proj_.addCommon;
export default _ol_proj_common_;
