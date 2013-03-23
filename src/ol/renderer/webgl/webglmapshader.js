goog.provide('ol.renderer.webgl.map.shader');
goog.require('ol.webgl.FragmentShader');
goog.require('ol.webgl.VertexShader');
/**
 * @constructor
 * @extends {ol.webgl.FragmentShader}
 */
ol.renderer.webgl.map.shader.Fragment = function() {
  goog.base(this, ol.renderer.webgl.map.shader.Fragment.SOURCE);
};
goog.inherits(ol.renderer.webgl.map.shader.Fragment, ol.webgl.FragmentShader);
goog.addSingletonGetter(ol.renderer.webgl.map.shader.Fragment);
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.Fragment.DEBUG_SOURCE = 'precision mediump float;\n//! NAMESPACE=ol.renderer.webgl.map\n\n\n//! COMMON\nvarying vec2 v_texCoord;\n\n\n//! FRAGMENT\n// @see https://svn.webkit.org/repository/webkit/trunk/Source/WebCore/platform/graphics/filters/skia/SkiaImageFilterBuilder.cpp\nuniform mat4 u_colorMatrix;\nuniform float u_opacity;\nuniform sampler2D u_texture;\n\nvoid main(void) {\n  vec4 texColor = texture2D(u_texture, v_texCoord);\n  gl_FragColor.rgb = (u_colorMatrix * vec4(texColor.rgb, 1.)).rgb;\n  gl_FragColor.a = texColor.a * u_opacity;\n}\n\n';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.Fragment.OPTIMIZED_SOURCE = 'precision mediump float;varying vec2 a;uniform mat4 d;uniform float e;uniform sampler2D f;void main(){vec4 g=texture2D(f,a);gl_FragColor.rgb=(d*vec4(g.rgb,1)).rgb;gl_FragColor.a=g.a*e;}';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.Fragment.SOURCE = goog.DEBUG ?
    ol.renderer.webgl.map.shader.Fragment.DEBUG_SOURCE :
    ol.renderer.webgl.map.shader.Fragment.OPTIMIZED_SOURCE;
/**
 * @constructor
 * @extends {ol.webgl.VertexShader}
 */
ol.renderer.webgl.map.shader.Vertex = function() {
  goog.base(this, ol.renderer.webgl.map.shader.Vertex.SOURCE);
};
goog.inherits(ol.renderer.webgl.map.shader.Vertex, ol.webgl.VertexShader);
goog.addSingletonGetter(ol.renderer.webgl.map.shader.Vertex);
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.Vertex.DEBUG_SOURCE = '//! NAMESPACE=ol.renderer.webgl.map\n\n\n//! COMMON\nvarying vec2 v_texCoord;\n\n\n//! VERTEX\nattribute vec2 a_position;\nattribute vec2 a_texCoord;\n\nuniform mat4 u_texCoordMatrix;\nuniform mat4 u_projectionMatrix;\n\nvoid main(void) {\n  gl_Position = u_projectionMatrix * vec4(a_position, 0., 1.);\n  v_texCoord = (u_texCoordMatrix * vec4(a_texCoord, 0., 1.)).st;\n}\n\n\n';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.Vertex.OPTIMIZED_SOURCE = 'varying vec2 a;attribute vec2 d,e;uniform mat4 b,c;void main(){gl_Position=c*vec4(d,0,1);a=(b*vec4(e,0,1)).st;}';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.Vertex.SOURCE = goog.DEBUG ?
    ol.renderer.webgl.map.shader.Vertex.DEBUG_SOURCE :
    ol.renderer.webgl.map.shader.Vertex.OPTIMIZED_SOURCE;
/**
 * @constructor
 */
ol.renderer.webgl.map.shader.uniform = function() {};
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.uniform.u_texCoordMatrix =
    goog.DEBUG ? 'u_texCoordMatrix' : 'b';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.uniform.u_projectionMatrix =
    goog.DEBUG ? 'u_projectionMatrix' : 'c';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.uniform.u_colorMatrix =
    goog.DEBUG ? 'u_colorMatrix' : 'd';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.uniform.u_opacity =
    goog.DEBUG ? 'u_opacity' : 'e';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.uniform.u_texture =
    goog.DEBUG ? 'u_texture' : 'f';
/**
 * @constructor
 */
ol.renderer.webgl.map.shader.attribute = function() {};
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.attribute.a_position =
    goog.DEBUG ? 'a_position' : 'd';
/**
 * @const
 * @type {string}
 */
ol.renderer.webgl.map.shader.attribute.a_texCoord =
    goog.DEBUG ? 'a_texCoord' : 'e';
