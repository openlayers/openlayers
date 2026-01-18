/**
 * @module ol/render/webgl/GlyphAtlas
 */
import TinySDF from '@mapbox/tiny-sdf';
import {createCanvasContext2D} from '../../dom.js';

/**
 * @typedef {Object} GlyphInfo
 * @property {number} id Character code
 * @property {number} x Position in the atlas
 * @property {number} y Position in the atlas
 * @property {number} width Width of the glyph
 * @property {number} height Height of the glyph
 * @property {number} advance Width of the glyph
 * @property {number} top Distance from top of glyph to baseline
 * @property {number} left Distance from left of glyph to origin
 */

/**
 * @classdesc
 * Manages the glyph atlas for WebGL text rendering.
 * It uses tiny-sdf to generate SDF glyphs and packs them into a single texture.
 * This is a "super simple" implementation:
 * - Dynamic packing (simply appending left-to-right, then new line)
 * - Single font family/style support per atlas
 */
class GlyphAtlas {
  /**
   * @param {string} fontFamily Font family
   * @param {string} [fontWeight] Font weight
   */
  constructor(fontFamily, fontWeight = 'normal') {
    this.fontFamily_ = fontFamily;
    this.fontWeight_ = fontWeight;

    this.fontSize_ = 128;
    this.buffer_ = 8;
    this.radius_ = 12;
    this.cutoff_ = 0.25;

    this.sdf_ = new TinySDF({
      fontSize: this.fontSize_,
      fontFamily: this.fontFamily_,
      fontWeight: this.fontWeight_,
      buffer: this.buffer_,
      radius: this.radius_,
      cutoff: this.cutoff_,
    });

    /**
     * @type {Map<string, number>}
     * @private
     */
    this.kerningCache_ = new Map();

    /**
     * @type {Map<string, GlyphInfo>}
     * @private
     */
    this.glyphs_ = new Map();

    this.width_ = 2048;
    this.height_ = 2048;
    const context = createCanvasContext2D(this.width_, this.height_);
    this.context_ = context;
    this.canvas_ = context.canvas;

    this.cursorX_ = 0;
    this.cursorY_ = 0;
    this.rowHeight_ = 0;
  }

  /**
   * @return {HTMLCanvasElement | OffscreenCanvas} The atlas canvas
   */
  getCanvas() {
    return this.canvas_;
  }

  /**
   * @param {string} char1 First char
   * @param {string} char2 Second char
   * @return {number} Kerning offset (usually negative)
   */
  getKerning(char1, char2) {
    if (!char1 || !char2) {
      return 0;
    }

    const key = char1 + char2;
    if (this.kerningCache_.has(key)) {
      return this.kerningCache_.get(key);
    }

    this.context_.font = `${this.fontWeight_} ${this.fontSize_}px ${this.fontFamily_}`;

    const w1 = this.context_.measureText(char1).width;
    const w2 = this.context_.measureText(char2).width;
    const wTotal = this.context_.measureText(char1 + char2).width;

    const k = wTotal - (w1 + w2);

    this.kerningCache_.set(key, k);
    return k;
  }

  /**
   * @return {number} The atlas width
   */
  getWidth() {
    return this.width_;
  }

  /**
   * @return {number} The atlas height
   */
  getHeight() {
    return this.height_;
  }

  /**
   * Adds a char to the atlas if not already present.
   * @param {string} char Character to add
   * @return {GlyphInfo} Glyph info
   */
  addChar(char) {
    if (this.glyphs_.has(char)) {
      return this.glyphs_.get(char);
    }

    const sdfData = this.sdf_.draw(char);
    const width = sdfData.width;
    const height = sdfData.height;

    if (this.cursorX_ + width > this.width_) {
      this.cursorX_ = 0;
      this.cursorY_ += this.rowHeight_;
      this.rowHeight_ = 0;
    }

    if (this.cursorY_ + height > this.height_) {
      return null;
    }
    const imgData = this.context_.createImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const val = sdfData.data[i];
      imgData.data[i * 4] = val; // R
      imgData.data[i * 4 + 1] = val; // G
      imgData.data[i * 4 + 2] = val; // B
      imgData.data[i * 4 + 3] = val; // A
    }
    this.context_.putImageData(imgData, this.cursorX_, this.cursorY_);

    const glyphInfo = {
      id: char.charCodeAt(0),
      x: this.cursorX_,
      y: this.cursorY_,
      width: width,
      height: height,
      advance: sdfData.glyphAdvance,
      top: sdfData.glyphTop,
      left: sdfData.glyphLeft,
    };

    this.glyphs_.set(char, glyphInfo);

    this.cursorX_ += width;
    this.rowHeight_ = Math.max(this.rowHeight_, height);

    return glyphInfo;
  }

  /**
   * Adds a solid white block to the atlas for background rendering
   * @return {GlyphInfo} Glyph info
   */
  getWhitePixel() {
    const char = '__WHITE_BLOCK__';
    if (this.glyphs_.has(char)) {
      return this.glyphs_.get(char);
    }

    const width = 8;
    const height = 8;

    if (this.cursorX_ + width > this.width_) {
      this.cursorX_ = 0;
      this.cursorY_ += this.rowHeight_;
      this.rowHeight_ = 0;
    }

    const imgData = this.context_.createImageData(width, height);
    for (let i = 0; i < width * height * 4; i++) {
      imgData.data[i] = 255;
    }

    this.context_.putImageData(imgData, this.cursorX_, this.cursorY_);

    const glyphInfo = {
      id: -1,
      x: this.cursorX_,
      y: this.cursorY_,
      width: width,
      height: height,
      advance: 0,
      top: 0,
      left: 0,
    };

    this.glyphs_.set(char, glyphInfo);

    this.cursorX_ += width;
    this.rowHeight_ = Math.max(this.rowHeight_, height);

    return glyphInfo;
  }
}

export default GlyphAtlas;
