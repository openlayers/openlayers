import _ol_ from '../index';
import _ol_webgl_ from '../webgl';
import _ol_webgl_Shader_ from '../webgl/shader';

/**
 * @constructor
 * @extends {ol.webgl.Shader}
 * @param {string} source Source.
 * @struct
 */
var _ol_webgl_Fragment_ = function(source) {
  _ol_webgl_Shader_.call(this, source);
};

_ol_.inherits(_ol_webgl_Fragment_, _ol_webgl_Shader_);


/**
 * @inheritDoc
 */
_ol_webgl_Fragment_.prototype.getType = function() {
  return _ol_webgl_.FRAGMENT_SHADER;
};
export default _ol_webgl_Fragment_;
