goog.provide('ol.renderer.webgl.tilelayer.shader');
goog.require('ol.webgl.shader');
/**
 * @constructor
 * @extends {ol.webgl.shader.Fragment}
 */
ol.renderer.webgl.tilelayer.shader.Fragment = function() {
  goog.base(this, ol.renderer.webgl.tilelayer.shader.Fragment.SOURCE);
};
goog.inherits(ol.renderer.webgl.tilelayer.shader.Fragment, ol.webgl.shader.Fragment);
goog.addSingletonGetter(ol.renderer.webgl.tilelayer.shader.Fragment);
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.tilelayer.shader.Fragment.DEBUG_SOURCE = 'precision mediump float;\n//! NAMESPACE=ol.renderer.webgl.tilelayer\n\n\n//! COMMON\nvarying vec2 v_texCoord;\n\n\n//! FRAGMENT\nuniform sampler2D u_texture;\n\nvoid main(void) {\n  gl_FragColor = texture2D(u_texture, v_texCoord);\n}\n\n';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.tilelayer.shader.Fragment.OPTIMIZED_SOURCE = 'precision mediump float;varying vec2 a;uniform sampler2D c;void main(){gl_FragColor=texture2D(c,a);}';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.tilelayer.shader.Fragment.SOURCE = goog.DEBUG ?
    ol.renderer.webgl.tilelayer.shader.Fragment.DEBUG_SOURCE :
    ol.renderer.webgl.tilelayer.shader.Fragment.OPTIMIZED_SOURCE;
/**
 * @constructor
 * @extends {ol.webgl.shader.Vertex}
 */
ol.renderer.webgl.tilelayer.shader.Vertex = function() {
  goog.base(this, ol.renderer.webgl.tilelayer.shader.Vertex.SOURCE);
};
goog.inherits(ol.renderer.webgl.tilelayer.shader.Vertex, ol.webgl.shader.Vertex);
goog.addSingletonGetter(ol.renderer.webgl.tilelayer.shader.Vertex);
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.tilelayer.shader.Vertex.DEBUG_SOURCE = '//! NAMESPACE=ol.renderer.webgl.tilelayer\n\n\n//! COMMON\nvarying vec2 v_texCoord;\n\n\n//! VERTEX\nattribute vec2 a_position;\nattribute vec2 a_texCoord;\nuniform vec4 u_tileOffset;\n\nvoid main(void) {\n  gl_Position = vec4(a_position * u_tileOffset.xy + u_tileOffset.zw, 0., 1.);\n  v_texCoord = a_texCoord;\n}\n\n\n';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.tilelayer.shader.Vertex.OPTIMIZED_SOURCE = 'varying vec2 a;attribute vec2 c,d;uniform vec4 b;void main(){gl_Position=vec4(c*b.xy+b.zw,0,1);a=d;}';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.tilelayer.shader.Vertex.SOURCE = goog.DEBUG ?
    ol.renderer.webgl.tilelayer.shader.Vertex.DEBUG_SOURCE :
    ol.renderer.webgl.tilelayer.shader.Vertex.OPTIMIZED_SOURCE;
/**
 * @constructor
 */
ol.renderer.webgl.tilelayer.shader.uniform = function() {};
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.tilelayer.shader.uniform.u_tileOffset =
    goog.DEBUG ? 'u_tileOffset' : 'b';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.tilelayer.shader.uniform.u_texture =
    goog.DEBUG ? 'u_texture' : 'c';
/**
 * @constructor
 */
ol.renderer.webgl.tilelayer.shader.attribute = function() {};
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.tilelayer.shader.attribute.a_position =
    goog.DEBUG ? 'a_position' : 'c';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.tilelayer.shader.attribute.a_texCoord =
    goog.DEBUG ? 'a_texCoord' : 'd';
