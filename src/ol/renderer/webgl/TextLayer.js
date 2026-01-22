/**
 * @module ol/renderer/webgl/TextLayer
 */
import bidiFactory from 'bidi-js';
import {buildExpression, newEvaluationContext} from '../../expr/cpu.js';
import {
  BooleanType,
  ColorType,
  NumberType,
  StringType,
  newParsingContext,
} from '../../expr/expression.js';
import GlyphAtlas from '../../render/webgl/GlyphAtlas.js';
import {
  create as createTransform,
  translate as translateTransform,
} from '../../transform.js';
import {
  create as createMat4,
  fromTransform as mat4FromTransform,
} from '../../vec/mat4.js';
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import {AttributeType, DefaultUniform} from '../../webgl/Helper.js';
import {ARRAY_BUFFER, DYNAMIC_DRAW, ELEMENT_ARRAY_BUFFER} from '../../webgl.js';
import WebGLLayerRenderer from './Layer.js';
import {getWorldParameters} from './worldUtil.js';

/**
 * @typedef {Object} Options
 * @property {string} [fontFamily='sans-serif'] Font family
 * @property {string} [fontWeight='normal'] Font weight
 * @property {import("../../style/flat.js").FlatStyleLike} [style] Style
 */

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  attribute vec2 a_offset;
  attribute float a_opacity;
  attribute float a_rotateWithView;
  attribute float a_rotation;
  attribute float a_scale;
  attribute vec4 a_color;
  attribute vec4 a_outlineColor;
  attribute float a_outlineWidth;

  uniform mat4 u_projectionMatrix;
  uniform vec2 u_screen;

  varying vec2 v_texCoord;
  varying float v_opacity;
  varying vec4 v_color;
  varying vec4 v_outlineColor;
  varying float v_outlineWidth;

  vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
  }

  void main() {
    v_texCoord = a_texCoord;
    v_opacity = a_opacity;
    v_color = a_color;
    v_outlineColor = a_outlineColor;
    v_outlineWidth = a_outlineWidth;
    
    vec4 anchor = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
    
    vec2 anchorScreen = ((anchor.xy / anchor.w) * 0.5 + 0.5) * u_screen;
    anchorScreen = floor(anchorScreen + 0.5);
    anchor.xy = (anchorScreen / u_screen * 2.0 - 1.0) * anchor.w;
    
    vec2 offset = a_offset * a_scale;
    
    offset = rotate(offset, a_rotation);
    
    vec2 offsetNDC = offset / u_screen * 2.0;
    
    gl_Position = anchor + vec4(offsetNDC.x, -offsetNDC.y, 0.0, 0.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  uniform sampler2D u_texture;
  uniform float u_opacity;

  varying vec2 v_texCoord;
  varying float v_opacity;
  varying vec4 v_color;
  varying vec4 v_outlineColor;
  varying float v_outlineWidth;

  const float smoothing = 0.1;

  void main() {
    float dist = texture2D(u_texture, v_texCoord).a;
    
    float threshold = 0.6;
    
    float alpha = smoothstep(threshold - smoothing, threshold + smoothing, dist);
    
    float borderThreshold = threshold - v_outlineWidth;
    float borderAlpha = smoothstep(borderThreshold - smoothing, borderThreshold + smoothing, dist);
    
    vec4 finalColor = mix(v_outlineColor, v_color, alpha);
    
    float finalAlpha = borderAlpha * v_opacity;
    
    float outAlpha = finalColor.a * finalAlpha;
    gl_FragColor = vec4(finalColor.rgb * outAlpha, outAlpha);
  }
`;

class WebGLTextLayerRenderer extends WebGLLayerRenderer {
  /**
   * @param {import("../../layer/Layer.js").default} layer Layer.
   * @param {Options} options Options.
   */
  constructor(layer, options) {
    super(layer, {
      uniforms: {
        [DefaultUniform.PROJECTION_MATRIX]: createMat4(),
        u_screen: [1, 1],
      },
    });

    this.sourceRevision_ = -1;
    this.verticesBuffer_ = new WebGLArrayBuffer(ARRAY_BUFFER, DYNAMIC_DRAW);
    this.indicesBuffer_ = new WebGLArrayBuffer(
      ELEMENT_ARRAY_BUFFER,
      DYNAMIC_DRAW,
    );

    this.program_;

    this.attributes = [
      {name: 'a_position', size: 2, type: AttributeType.FLOAT},
      {name: 'a_texCoord', size: 2, type: AttributeType.FLOAT},
      {name: 'a_offset', size: 2, type: AttributeType.FLOAT},
      {name: 'a_opacity', size: 1, type: AttributeType.FLOAT},
      {name: 'a_rotateWithView', size: 1, type: AttributeType.FLOAT},
      {name: 'a_rotation', size: 1, type: AttributeType.FLOAT},
      {name: 'a_scale', size: 1, type: AttributeType.FLOAT},
      {name: 'a_color', size: 4, type: AttributeType.FLOAT},
      {name: 'a_outlineColor', size: 4, type: AttributeType.FLOAT},
      {name: 'a_outlineWidth', size: 1, type: AttributeType.FLOAT},
    ];

    this.style_ = options.style || {};
    this.atlas_ = new GlyphAtlas(
      options.fontFamily || 'sans-serif',
      options.fontWeight || 'normal',
    );
    this.atlasTexture_ = null;

    this.currentTransform_ = createTransform();
    this.tmpMat4_ = createMat4(); // Temp mat4 for conversion
    this.invertRenderTransform_ = createTransform();
    this.renderTransform_ = createTransform();

    const source = layer.getSource();
    this.sourceChangeListener_ = source.addEventListener(
      'change',
      this.handleSourceChange_.bind(this),
    );

    const bidi = bidiFactory();
    this.bidiInstance_ = null;
    this.bidiInstance_ = bidi;
  }

  handleSourceChange_() {
    this.getLayer().changed();
  }

  /**
   * @override
   */
  afterHelperCreated() {
    this.program_ = this.helper.getProgram(FRAGMENT_SHADER, VERTEX_SHADER);
  }

  /**
   * @override
   */
  prepareFrameInternal(frameState) {
    const layer = this.getLayer();
    const source = layer.getSource();

    if (!this.atlasTexture_) {
      this.atlasTexture_ = this.helper.getGL().createTexture();
    }

    if (source.getRevision() !== this.sourceRevision_) {
      this.sourceRevision_ = source.getRevision();
      this.rebuildBuffers_(frameState);
    }

    this.helper.useProgram(this.program_, frameState);
    this.helper.prepareDraw(frameState);

    return true;
  }

  rebuildBuffers_(frameState) {
    const source = this.getLayer().getSource();
    const features = source.getFeatures();

    const stride = 19;
    let vCursor = 0;
    let iCursor = 0;
    let vertexIndex = 0;
    let vertices = new Float32Array(features.length * stride * 4);
    let indices = new Uint32Array(features.length * 6);

    const resizeArrays = (minV, minI) => {
      if (vCursor + minV > vertices.length) {
        const newV = new Float32Array(
          Math.max(vertices.length * 2, vCursor + minV),
        );
        newV.set(vertices);
        vertices = newV;
      }
      if (iCursor + minI > indices.length) {
        const newI = new Uint32Array(
          Math.max(indices.length * 2, iCursor + minI),
        );
        newI.set(indices);
        indices = newI;
      }
    };

    const atlasWidth = this.atlas_.getWidth();
    const atlasHeight = this.atlas_.getHeight();

    const style = /** @type {any} */ (this.style_);
    const textExpression = style.text;
    const fontSizeExpression = style['font-size'];
    const fillColorExpression = style['fill-color'];
    const strokeColorExpression = style['stroke-color'];
    const strokeWidthExpression = style['stroke-width'];
    const visibleExpression = style['visible'];

    let textEvaluator,
      fontSizeEvaluator,
      fillColorEvaluator,
      strokeColorEvaluator,
      strokeWidthEvaluator,
      visibleEvaluator;
    const evalContext = newEvaluationContext();

    if (textExpression) {
      textEvaluator = buildExpression(
        textExpression,
        StringType,
        newParsingContext(),
      );
    }
    if (fontSizeExpression) {
      fontSizeEvaluator = buildExpression(
        fontSizeExpression,
        NumberType,
        newParsingContext(),
      );
    }
    if (fillColorExpression) {
      fillColorEvaluator = buildExpression(
        fillColorExpression,
        ColorType,
        newParsingContext(),
      );
    }
    if (strokeColorExpression) {
      strokeColorEvaluator = buildExpression(
        strokeColorExpression,
        ColorType,
        newParsingContext(),
      );
    }
    if (strokeWidthExpression) {
      strokeWidthEvaluator = buildExpression(
        strokeWidthExpression,
        NumberType,
        newParsingContext(),
      );
    }
    if (visibleExpression) {
      visibleEvaluator = buildExpression(
        visibleExpression,
        BooleanType,
        newParsingContext(),
      );
    }

    features.forEach((feature) => {
      const geometry = feature.getGeometry();
      if (!geometry || geometry.getType() !== 'Point') {
        return;
      }

      const flatCoords = geometry.getFlatCoordinates();
      const x = flatCoords[0];
      const y = flatCoords[1];

      evalContext.properties = feature.getProperties();

      let visible = true;
      if (visibleEvaluator) {
        try {
          visible = visibleEvaluator(evalContext);
        } catch {
          visible = true;
        }
      }
      if (!visible) {
        return;
      }

      let text;
      if (textEvaluator) {
        try {
          text = textEvaluator(evalContext);
        } catch {
          text = '';
        }
      } else {
        text =
          feature.get('text') ||
          feature.get('name') ||
          feature.get('label') ||
          '';
      }
      if (!text) {
        return;
      }
      text = String(text);
      const originalText = text;
      if (this.bidiInstance_) {
        try {
          const bidi = this.bidiInstance_;
          const levels = bidi.getEmbeddingLevels(text);
          const flips = bidi.getReorderSegments(text, levels);

          if (flips.length > 0) {
            const chars = text.split('');
            flips.forEach((range) => {
              const [start, end] = range;
              const segment = chars.slice(start, end + 1).reverse();
              for (let i = 0; i < segment.length; i++) {
                chars[start + i] = segment[i];
              }
            });
            text = chars.join('');
          }
        } catch {
          text = originalText;
        }
      }

      const rotation =
        feature.get('rotation') !== undefined ? feature.get('rotation') : 0;
      const rotateWithView = feature.get('rotateWithView') ? 1.0 : 0.0;

      let textSize = 16;
      if (fontSizeEvaluator) {
        try {
          textSize = fontSizeEvaluator(evalContext);
        } catch {
          textSize = 16;
        }
      } else if (feature.get('textSize') !== undefined) {
        textSize = feature.get('textSize');
      }
      const scale = textSize / 128.0;

      let color = [0.2, 0.2, 0.2, 1.0];
      if (fillColorEvaluator) {
        try {
          color = fillColorEvaluator(evalContext);
        } catch {
          color = [0.2, 0.2, 0.2, 1.0];
        }
      } else if (feature.get('color')) {
        color = feature.get('color');
      }

      let outlineColor = [1.0, 1.0, 1.0, 1.0];
      if (strokeColorEvaluator) {
        try {
          outlineColor = strokeColorEvaluator(evalContext);
        } catch {
          outlineColor = [1.0, 1.0, 1.0, 1.0];
        }
      } else if (feature.get('outlineColor')) {
        outlineColor = feature.get('outlineColor');
      }

      let outlineWidth = 0.0;
      if (strokeWidthEvaluator) {
        try {
          const widthPixels = strokeWidthEvaluator(evalContext);
          outlineWidth = widthPixels / 24.0;
        } catch {
          outlineWidth = 0.0;
        }
      } else if (feature.get('outlineWidth') !== undefined) {
        outlineWidth = feature.get('outlineWidth');
      }

      const backgroundColor = feature.get('backgroundColor') || [0, 0, 0, 0];
      const backgroundOutlineColor =
        feature.get('backgroundOutlineColor') || backgroundColor;
      const backgroundOutlineWidth =
        feature.get('backgroundOutlineWidth') !== undefined
          ? feature.get('backgroundOutlineWidth')
          : 0.0;
      const hasBackground =
        backgroundColor[3] > 0 ||
        (backgroundOutlineWidth > 0 && backgroundOutlineColor[3] > 0);

      const whiteGlyph = this.atlas_.getWhitePixel();

      let currentOffsetX = 0;

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      let cursorX = 0;

      const outlineMargin = outlineWidth * 20; // Heuristic
      const autoSpacing = Math.max(0, outlineMargin - 2);
      const userSpacing =
        feature.get('spacing') !== undefined ? feature.get('spacing') : 0;
      const totalSpacing = autoSpacing + userSpacing;

      let prevChar = null;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const glyph = this.atlas_.addChar(char);
        if (glyph) {
          let kerning = 0;
          if (prevChar) {
            kerning = this.atlas_.getKerning(prevChar, char);
          }
          cursorX += kerning;

          const gLeft = cursorX + glyph.left - outlineMargin;
          const gRight = cursorX + glyph.left + glyph.width + outlineMargin;
          const gTop = -glyph.top - outlineMargin;
          const gBottom = -glyph.top + glyph.height + outlineMargin;

          if (gLeft < minX) {
            minX = gLeft;
          }
          if (gRight > maxX) {
            maxX = gRight;
          }
          if (gTop < minY) {
            minY = gTop;
          }
          if (gBottom > maxY) {
            maxY = gBottom;
          }

          cursorX += glyph.advance + totalSpacing;
          prevChar = char;
        }
      }

      if (minX === Infinity) {
        minX = 0;
        maxX = 0;
        minY = 0;
        maxY = 0;
      }

      const textWidth = maxX - minX;
      const textHeight = maxY - minY;
      const visualCenterX = (minX + maxX) / 2;
      currentOffsetX = -visualCenterX;

      if (hasBackground && whiteGlyph) {
        resizeArrays(4 * stride * 2, 6 * 2);
      }

      if (hasBackground && whiteGlyph) {
        const paddingX = 8;
        const paddingY = 4;
        const bgWidth = Math.round(textWidth + paddingX * 2);
        const bgHeight = Math.round(textHeight + paddingY * 2);
        const bgX = Math.round(-bgWidth / 2);
        const visualCenterY = (minY + maxY) / 2;
        const bgY = Math.round(visualCenterY - bgHeight / 2);
        const w = bgWidth;
        const h = bgHeight;

        const uvPad = 2;
        const u0 = (whiteGlyph.x + uvPad) / atlasWidth;
        const v0 = (whiteGlyph.y + uvPad) / atlasHeight;
        const u1 = (whiteGlyph.x + whiteGlyph.width - uvPad) / atlasWidth;
        const v1 = (whiteGlyph.y + whiteGlyph.height - uvPad) / atlasHeight;

        const bgR = backgroundColor[0],
          bgG = backgroundColor[1],
          bgB = backgroundColor[2],
          bgA = backgroundColor[3];
        const bgOR = backgroundOutlineColor[0],
          bgOG = backgroundOutlineColor[1],
          bgOB = backgroundOutlineColor[2],
          bgOA = backgroundOutlineColor[3];
        const bgOWidth = backgroundOutlineWidth;

        if (bgOWidth > 0 && bgOA > 0) {
          const bw = w + bgOWidth * 2;
          const bh = h + bgOWidth * 2;
          const bx = bgX - bgOWidth;
          const by = bgY - bgOWidth;
          const boX1 = bx + bw;
          const boY1 = by + bh;

          vertices.set(
            [
              x,
              y,
              u0,
              v0,
              bx,
              by,
              1,
              rotateWithView,
              rotation,
              scale,
              bgOR,
              bgOG,
              bgOB,
              bgOA,
              0,
              0,
              0,
              0,
              0,
              x,
              y,
              u1,
              v0,
              boX1,
              by,
              1,
              rotateWithView,
              rotation,
              scale,
              bgOR,
              bgOG,
              bgOB,
              bgOA,
              0,
              0,
              0,
              0,
              0,
              x,
              y,
              u1,
              v1,
              boX1,
              boY1,
              1,
              rotateWithView,
              rotation,
              scale,
              bgOR,
              bgOG,
              bgOB,
              bgOA,
              0,
              0,
              0,
              0,
              0,
              x,
              y,
              u0,
              v1,
              bx,
              boY1,
              1,
              rotateWithView,
              rotation,
              scale,
              bgOR,
              bgOG,
              bgOB,
              bgOA,
              0,
              0,
              0,
              0,
              0,
            ],
            vCursor,
          );
          vCursor += 4 * stride;

          indices.set(
            [
              vertexIndex + 0,
              vertexIndex + 1,
              vertexIndex + 2,
              vertexIndex + 0,
              vertexIndex + 2,
              vertexIndex + 3,
            ],
            iCursor,
          );
          iCursor += 6;
          vertexIndex += 4;
        }

        if (bgA > 0) {
          const offX0 = bgX;
          const offX1 = bgX + w;
          const offY0 = bgY;
          const offY1 = bgY + h;

          vertices.set(
            [
              x,
              y,
              u0,
              v0,
              offX0,
              offY0,
              1,
              rotateWithView,
              rotation,
              scale,
              bgR,
              bgG,
              bgB,
              bgA,
              0,
              0,
              0,
              0,
              0,
              x,
              y,
              u1,
              v0,
              offX1,
              offY0,
              1,
              rotateWithView,
              rotation,
              scale,
              bgR,
              bgG,
              bgB,
              bgA,
              0,
              0,
              0,
              0,
              0,
              x,
              y,
              u1,
              v1,
              offX1,
              offY1,
              1,
              rotateWithView,
              rotation,
              scale,
              bgR,
              bgG,
              bgB,
              bgA,
              0,
              0,
              0,
              0,
              0,
              x,
              y,
              u0,
              v1,
              offX0,
              offY1,
              1,
              rotateWithView,
              rotation,
              scale,
              bgR,
              bgG,
              bgB,
              bgA,
              0,
              0,
              0,
              0,
              0,
            ],
            vCursor,
          );
          vCursor += 4 * stride;

          indices.set(
            [
              vertexIndex + 0,
              vertexIndex + 1,
              vertexIndex + 2,
              vertexIndex + 0,
              vertexIndex + 2,
              vertexIndex + 3,
            ],
            iCursor,
          );
          iCursor += 6;
          vertexIndex += 4;
        }
      }

      const cR = color[0],
        cG = color[1],
        cB = color[2],
        cA = color[3];
      const oR = outlineColor[0],
        oG = outlineColor[1],
        oB = outlineColor[2],
        oA = outlineColor[3];

      prevChar = null;

      resizeArrays(text.length * 4 * stride, text.length * 6);

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const glyph = this.atlas_.addChar(char);

        if (!glyph) {
          continue;
        }

        let kerning = 0;
        if (prevChar) {
          kerning = this.atlas_.getKerning(prevChar, char);
        }
        currentOffsetX += kerning;

        const w = glyph.width;
        const h = glyph.height;

        const u0 = glyph.x / atlasWidth;
        const v0 = glyph.y / atlasHeight;
        const u1 = (glyph.x + glyph.width) / atlasWidth;
        const v1 = (glyph.y + glyph.height) / atlasHeight;

        const offX0 = currentOffsetX + glyph.left;
        const offX1 = offX0 + w;
        const offY0 = -glyph.top;
        const offY1 = offY0 + h;

        vertices.set(
          [
            x,
            y,
            u0,
            v0,
            offX0,
            offY0,
            1,
            rotateWithView,
            rotation,
            scale,
            cR,
            cG,
            cB,
            cA,
            oR,
            oG,
            oB,
            oA,
            outlineWidth,
            x,
            y,
            u1,
            v0,
            offX1,
            offY0,
            1,
            rotateWithView,
            rotation,
            scale,
            cR,
            cG,
            cB,
            cA,
            oR,
            oG,
            oB,
            oA,
            outlineWidth,
            x,
            y,
            u1,
            v1,
            offX1,
            offY1,
            1,
            rotateWithView,
            rotation,
            scale,
            cR,
            cG,
            cB,
            cA,
            oR,
            oG,
            oB,
            oA,
            outlineWidth,
            x,
            y,
            u0,
            v1,
            offX0,
            offY1,
            1,
            rotateWithView,
            rotation,
            scale,
            cR,
            cG,
            cB,
            cA,
            oR,
            oG,
            oB,
            oA,
            outlineWidth,
          ],
          vCursor,
        );
        vCursor += 4 * stride;

        indices.set(
          [
            vertexIndex + 0,
            vertexIndex + 1,
            vertexIndex + 2,
            vertexIndex + 0,
            vertexIndex + 2,
            vertexIndex + 3,
          ],
          iCursor,
        );
        iCursor += 6;

        vertexIndex += 4;
        currentOffsetX += glyph.advance + totalSpacing;
        prevChar = char;
      }
    });

    this.verticesBuffer_.setArray(vertices.subarray(0, vCursor));
    this.indicesBuffer_.setArray(indices.subarray(0, iCursor));

    this.helper.flushBufferData(this.verticesBuffer_);
    this.helper.flushBufferData(this.indicesBuffer_);

    const gl = this.helper.getGL();
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture_);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.atlas_.getCanvas(),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  /**
   * @override
   */
  renderFrame(frameState) {
    const gl = this.helper.getGL();
    this.preRender(gl, frameState);

    const [startWorld, endWorld, worldWidth] = getWorldParameters(
      frameState,
      this.getLayer(),
    );

    this.helper.useProgram(this.program_, frameState);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture_);
    const textureLoc = gl.getUniformLocation(this.program_, 'u_texture');
    gl.uniform1i(textureLoc, 0);

    const opacityLoc = gl.getUniformLocation(this.program_, 'u_opacity');
    gl.uniform1f(opacityLoc, 1.0);

    const size = frameState.size;
    gl.uniform2f(
      gl.getUniformLocation(this.program_, 'u_screen'),
      size[0],
      size[1],
    );

    this.helper.makeProjectionTransform(frameState, this.currentTransform_);

    let world = startWorld;

    do {
      this.helper.bindBuffer(this.indicesBuffer_);
      this.helper.bindBuffer(this.verticesBuffer_);
      this.helper.enableAttributes(this.attributes);

      const transform = this.currentTransform_.slice();

      translateTransform(transform, world * worldWidth, 0);

      mat4FromTransform(this.tmpMat4_, transform);

      gl.uniformMatrix4fv(
        gl.getUniformLocation(this.program_, DefaultUniform.PROJECTION_MATRIX),
        false,
        this.tmpMat4_,
      );

      const renderCount = this.indicesBuffer_.getSize();
      this.helper.drawElements(0, renderCount);
    } while (++world < endWorld);

    this.helper.finalizeDraw(frameState);

    this.postRender(gl, frameState);

    return this.helper.getCanvas();
  }
}

export default WebGLTextLayerRenderer;
