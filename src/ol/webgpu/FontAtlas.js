/**
 * @module ol/webgpu/FontAtlas
 */
import {createCanvasContext2D} from '../dom.js';
import {measureAndCacheTextWidth} from '../render/canvas.js';

/**
 * @typedef {Object} GlyphMetrics
 * @property {number} texX0 Left atlas texel, local to `page`.
 * @property {number} texY0 Top atlas texel, local to `page`.
 * @property {number} texX1 Right atlas texel, local to `page`.
 * @property {number} texY1 Bottom atlas texel, local to `page`.
 * @property {number} page Atlas page holding this cell.
 * @property {number} width Width in pixels.
 * @property {number} height Height in pixels.
 * @property {number} ascent Distance from the top of the packed cell to the alphabetic baseline.
 * @property {number} pad Inset from the cell edge to the advance origin, in CSS pixels.
 * @property {number} advance Advance width.
 */

/**
 * One shelf-packed canvas and the GPU texture it uploads into.
 * @typedef {Object} AtlasPage
 * @property {number} size Canvas width and height.
 * @property {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} context Canvas context.
 * @property {number} shelfX Next cell x.
 * @property {number} shelfY Next cell y.
 * @property {number} shelfHeight Tallest cell on the current shelf.
 * @property {GPUTexture|null} texture Uploaded texture, or null before the first upload.
 * @property {boolean} resized The canvas grew, so the texture must be recreated.
 * @property {boolean} dirty New cells need copying into the existing texture.
 * @property {number} dirtyX0 Dirty rectangle left.
 * @property {number} dirtyY0 Dirty rectangle top.
 * @property {number} dirtyX1 Dirty rectangle right.
 * @property {number} dirtyY1 Dirty rectangle bottom.
 */

/**
 * First page starts small and doubles as glyphs arrive.
 * @type {number}
 */
const INITIAL_PAGE_SIZE = 512;

/**
 * Further glyphs open another page instead of doubling past this.
 * 4096 stays under the WebGPU minimum maxTextureDimension2D of 8192.
 * @type {number}
 */
const MAX_PAGE_SIZE = 4096;

/**
 * @param {string} font CSS font.
 * @param {number} pixelRatio Device pixel ratio.
 * @return {string} Font with px/pt sizes scaled for rasterization.
 */
function scaleFont(font, pixelRatio) {
  if (pixelRatio === 1) {
    return font;
  }
  return font.replace(
    /([\d.]+)(px|pt)/g,
    (_, value, unit) => `${Number(value) * pixelRatio}${unit}`,
  );
}

/**
 * @param {number} size Page size in texels.
 * @return {AtlasPage} Empty page.
 */
function createPage(size) {
  const context = createCanvasContext2D(size, size, undefined, {
    alpha: true,
  });
  context.clearRect(0, 0, size, size);
  context.fillStyle = '#0f0';
  context.strokeStyle = '#f00';
  return {
    size,
    context,
    shelfX: 1,
    shelfY: 1,
    shelfHeight: 0,
    texture: null,
    resized: true,
    dirty: false,
    dirtyX0: 0,
    dirtyY0: 0,
    dirtyX1: 0,
    dirtyY1: 0,
  };
}

/**
 * @classdesc
 * Shelf-packed font atlas rasterized with Canvas 2D. The red channel stores
 * halo coverage and the green channel stores fill coverage. Keeping the masks
 * independent lets the renderer draw every halo before any fill in a label.
 *
 * Pages grow from 512 to 4096 and then another page is opened. A page's GPU
 * texture is recreated only when that page grows; new cells are copied into
 * the existing texture.
 */
class FontAtlas {
  constructor() {
    /**
     * @private
     * @type {Array<AtlasPage>}
     */
    this.pages_ = [createPage(INITIAL_PAGE_SIZE)];

    /**
     * @private
     * @type {Object<string, GlyphMetrics>}
     */
    this.glyphs_ = {};

    /**
     * Glyph advances by font, then by glyph.
     * @private
     * @type {Object<string, Object<string, number>>}
     */
    this.widthCaches_ = {};

    /**
     * Bumps when a page texture object is replaced. In-place texel copies
     * leave it unchanged so a render bundle can keep its bind group.
     * @private
     * @type {number}
     */
    this.revision_ = 0;
  }

  /**
   * @param {string} font Font (CSS pixels).
   * @param {string} glyph Grapheme.
   * @param {number} [strokeWidth] Stroke width in CSS pixels.
   * @param {number} [pixelRatio] Device pixel ratio for rasterization.
   * @return {GlyphMetrics} Metrics in CSS pixels and stable atlas texels.
   */
  getGlyph(font, glyph, strokeWidth = 0, pixelRatio = 1) {
    const dpr = pixelRatio > 0 ? pixelRatio : 1;
    const key = font + '\n' + glyph + '\n' + strokeWidth + '\n' + dpr;
    if (key in this.glyphs_) {
      return this.glyphs_[key];
    }
    const scaledFont = scaleFont(font, dpr);
    let page = this.pages_[this.pages_.length - 1];
    page.context.font = scaledFont;
    const metrics = page.context.measureText(glyph);
    const width = Math.ceil(metrics.width || 0);
    const ascent = Math.ceil(metrics.actualBoundingBoxAscent || 12 * dpr);
    const descent = Math.ceil(metrics.actualBoundingBoxDescent || 4 * dpr);
    const height = ascent + descent;
    const pad = Math.ceil(strokeWidth * dpr) + 1;
    const w = width + pad * 2;
    const h = height + pad * 2;

    page = this.fit_(page, w, h);

    const x = page.shelfX;
    const y = page.shelfY;
    page.context.save();
    page.context.font = scaledFont;
    // Additive compositing preserves the independently antialiased coverage
    // masks where the stroke and fill overlap. Canvas image data is
    // unpremultiplied, so the shader multiplies each channel by alpha to
    // recover its coverage.
    page.context.globalCompositeOperation = 'lighter';
    page.context.fillStyle = '#0f0';
    page.context.strokeStyle = '#f00';
    page.context.textBaseline = 'alphabetic';
    page.context.lineJoin = 'round';
    if (strokeWidth > 0) {
      page.context.lineWidth = strokeWidth * dpr;
      page.context.strokeText(glyph, x + pad, y + pad + ascent);
    }
    page.context.fillText(glyph, x + pad, y + pad + ascent);
    page.context.restore();

    page.shelfX += w + 1;
    page.shelfHeight = Math.max(page.shelfHeight, h);
    this.markDirty_(page, x, y, w, h);

    const record = {
      texX0: x,
      texY0: y,
      texX1: x + w,
      texY1: y + h,
      page: this.pages_.indexOf(page),
      width: w / dpr,
      height: h / dpr,
      ascent: (pad + ascent) / dpr,
      pad: pad / dpr,
      advance: measureAndCacheTextWidth(
        font,
        glyph,
        (this.widthCaches_[font] ??= {}),
      ),
    };
    this.glyphs_[key] = record;
    return record;
  }

  /**
   * Upload dirty texels. A page keeps its GPUTexture until that page's canvas
   * grows; only the new cells are copied.
   * @param {import("./Helper.js").default} helper Helper.
   * @return {number} Revision. Changes only when a texture object is replaced.
   */
  upload(helper) {
    for (const page of this.pages_) {
      if (!page.texture || page.resized) {
        page.texture?.destroy();
        page.texture = helper.createTextureFromImage(page.context.canvas);
        page.resized = false;
        page.dirty = false;
        ++this.revision_;
      } else if (page.dirty) {
        const canvas = page.context.canvas;
        const x = Math.max(0, page.dirtyX0);
        const y = Math.max(0, page.dirtyY0);
        const x1 = Math.min(canvas.width, page.dirtyX1);
        const y1 = Math.min(canvas.height, page.dirtyY1);
        helper.copyTextureRegion(page.texture, canvas, x, y, x1 - x, y1 - y);
        page.dirty = false;
      }
    }
    return this.revision_;
  }

  /**
   * Forget all glyphs and release the page textures, e.g. after a font has
   * loaded and glyphs rasterized with a fallback font are stale. The revision
   * still increases, so bind groups for the old textures are not reused.
   */
  clear() {
    for (const page of this.pages_) {
      page.texture?.destroy();
    }
    this.pages_ = [createPage(INITIAL_PAGE_SIZE)];
    this.glyphs_ = {};
    this.widthCaches_ = {};
    ++this.revision_;
  }

  /**
   * @param {number} page Page index.
   * @return {GPUTexture|null} Texture, or null before that page is uploaded.
   */
  getTexture(page) {
    return this.pages_[page]?.texture ?? null;
  }

  /**
   * @return {number} Page count.
   */
  getPageCount() {
    return this.pages_.length;
  }

  /**
   * @param {number} [page] Page index. The page currently being packed when omitted.
   * @return {HTMLCanvasElement|OffscreenCanvas} Canvas.
   */
  getCanvas(page) {
    const index = page === undefined ? this.pages_.length - 1 : page;
    return this.pages_[index].context.canvas;
  }

  /**
   * Pack `w` by `h` on `page`, growing it up to 4096 or opening another page
   * of that size.
   * @param {AtlasPage} page Current page.
   * @param {number} w Cell width.
   * @param {number} h Cell height.
   * @return {AtlasPage} Page that has room, or the current page when the cell
   *     itself is larger than the maximum.
   * @private
   */
  fit_(page, w, h) {
    if (
      (w + 2 > page.size || h + 2 > page.size) &&
      page.size * 2 <= MAX_PAGE_SIZE
    ) {
      this.grow_(page);
      return this.fit_(page, w, h);
    }
    if (page.shelfX + w + 1 > page.size) {
      page.shelfY += page.shelfHeight + 1;
      page.shelfX = 1;
      page.shelfHeight = 0;
    }
    if (page.shelfY + h + 1 <= page.size) {
      return page;
    }
    if (page.size * 2 <= MAX_PAGE_SIZE) {
      this.grow_(page);
      return this.fit_(page, w, h);
    }
    if (w + 2 > MAX_PAGE_SIZE || h + 2 > MAX_PAGE_SIZE) {
      return page;
    }
    const next = createPage(MAX_PAGE_SIZE);
    this.pages_.push(next);
    return this.fit_(next, w, h);
  }

  /**
   * @param {AtlasPage} page Page.
   * @private
   */
  grow_(page) {
    const next = page.size * 2;
    const context = createCanvasContext2D(next, next, undefined, {
      alpha: true,
    });
    context.clearRect(0, 0, next, next);
    context.drawImage(page.context.canvas, 0, 0);
    context.fillStyle = '#0f0';
    context.strokeStyle = '#f00';
    page.context = context;
    page.size = next;
    page.resized = true;
  }

  /**
   * @param {AtlasPage} page Page.
   * @param {number} x Left.
   * @param {number} y Top.
   * @param {number} w Width.
   * @param {number} h Height.
   * @private
   */
  markDirty_(page, x, y, w, h) {
    const x1 = x + w;
    const y1 = y + h;
    if (!page.dirty) {
      page.dirtyX0 = x;
      page.dirtyY0 = y;
      page.dirtyX1 = x1;
      page.dirtyY1 = y1;
      page.dirty = true;
      return;
    }
    page.dirtyX0 = Math.min(page.dirtyX0, x);
    page.dirtyY0 = Math.min(page.dirtyY0, y);
    page.dirtyX1 = Math.max(page.dirtyX1, x1);
    page.dirtyY1 = Math.max(page.dirtyY1, y1);
  }
}

export default FontAtlas;
