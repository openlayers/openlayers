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
 * Size and rasterization settings of a cell, in texels.
 * @typedef {Object} GlyphCell
 * @property {string} font Font scaled to texels.
 * @property {number} lineWidth Halo stroke width.
 * @property {number} width Width.
 * @property {number} height Height.
 * @property {number} ascent Distance from the top to the alphabetic baseline.
 * @property {number} pad Inset from the cell edge to the advance origin.
 */

/**
 * Rows of texels that are shelf packed.
 * @typedef {Object} Shelves
 * @property {number} size Width and height.
 * @property {number} shelfX Next cell x.
 * @property {number} shelfY Next cell y.
 * @property {number} shelfHeight Tallest cell on the current shelf.
 */

/**
 * One shelf-packed GPU texture.
 * @typedef {Shelves & {texture: GPUTexture|null}} AtlasPage
 */

/**
 * A cell on a staging canvas, waiting to be copied to its page.
 * @typedef {Object} StagedCell
 * @property {number} sourceX Left texel on the staging canvas.
 * @property {number} sourceY Top texel on the staging canvas.
 * @property {number} page Page index.
 * @property {number} x Left texel on the page.
 * @property {number} y Top texel on the page.
 * @property {number} width Width.
 * @property {number} height Height.
 */

/**
 * Canvas that new cells are rasterized on until they are uploaded.
 * @typedef {Shelves & {context: CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D, cells: Array<StagedCell>}} StagingCanvas
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
 * Glyphs that need another page beyond this many are not drawn, until the
 * atlas starts over. Four `rg8unorm` pages of 4096 are 128 MiB per layer.
 * @type {number}
 */
const MAX_PAGE_COUNT = 4;

/**
 * Cells that do not fit on a staging canvas of this size before the next
 * upload go to another one.
 * @type {number}
 */
const STAGING_SIZE = 1024;

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
 * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} context Context.
 * @param {string} font Font (CSS pixels).
 * @param {string} text Grapheme or text.
 * @param {number} strokeWidth Halo stroke width in CSS pixels.
 * @param {number} pixelRatio Device pixel ratio.
 * @return {GlyphCell} Cell.
 */
export function measureCell(context, font, text, strokeWidth, pixelRatio) {
  const scaledFont = scaleFont(font, pixelRatio);
  context.font = scaledFont;
  const metrics = context.measureText(text);
  const width = Math.ceil(metrics.width || 0);
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent || 12 * pixelRatio);
  const descent = Math.ceil(metrics.actualBoundingBoxDescent || 4 * pixelRatio);
  const pad = Math.ceil(strokeWidth * pixelRatio) + 1;
  return {
    font: scaledFont,
    lineWidth: strokeWidth * pixelRatio,
    width: width + pad * 2,
    height: ascent + descent + pad * 2,
    ascent: pad + ascent,
    pad,
  };
}

/**
 * Draw the halo in red and the fill in green. Additive compositing preserves
 * the independently antialiased coverage masks where they overlap, so the
 * premultiplied red and green channels are the halo and fill coverage.
 * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} context Context.
 * @param {string} text Grapheme or text.
 * @param {GlyphCell} cell Cell.
 * @param {number} x Left.
 * @param {number} y Top.
 */
export function drawCell(context, text, cell, x, y) {
  context.save();
  context.font = cell.font;
  context.globalCompositeOperation = 'lighter';
  context.fillStyle = '#0f0';
  context.strokeStyle = '#f00';
  context.textBaseline = 'alphabetic';
  context.lineJoin = 'round';
  if (cell.lineWidth > 0) {
    context.lineWidth = cell.lineWidth;
    context.strokeText(text, x + cell.pad, y + cell.ascent);
  }
  context.fillText(text, x + cell.pad, y + cell.ascent);
  context.restore();
}

/**
 * @param {number} size Width and height.
 * @return {Shelves} Empty shelves.
 */
function createShelves(size) {
  return {size, shelfX: 1, shelfY: 1, shelfHeight: 0};
}

/**
 * Move to the next shelf when the current one has no room for `w`.
 * @param {Shelves} shelves Shelves.
 * @param {number} w Cell width.
 * @param {number} h Cell height.
 * @return {boolean} The cell fits.
 */
function fitShelf(shelves, w, h) {
  if (shelves.shelfX + w + 1 > shelves.size) {
    shelves.shelfY += shelves.shelfHeight + 1;
    shelves.shelfX = 1;
    shelves.shelfHeight = 0;
  }
  return shelves.shelfY + h + 1 <= shelves.size;
}

/**
 * @param {Shelves} shelves Shelves.
 * @param {number} w Cell width.
 * @param {number} h Cell height.
 * @return {Array<number>} Left and top of the cell.
 */
function placeOnShelf(shelves, w, h) {
  const position = [shelves.shelfX, shelves.shelfY];
  shelves.shelfX += w + 1;
  shelves.shelfHeight = Math.max(shelves.shelfHeight, h);
  return position;
}

/**
 * @param {number} size Page size in texels.
 * @return {AtlasPage} Empty page.
 */
function createPage(size) {
  return {...createShelves(size), texture: null};
}

/**
 * @param {number} size Width and height.
 * @return {StagingCanvas} Empty staging canvas.
 */
function createStagingCanvas(size) {
  return {
    ...createShelves(size),
    context: createCanvasContext2D(size, size, undefined, {alpha: true}),
    cells: [],
  };
}

/**
 * @classdesc
 * Shelf-packed font atlas rasterized with Canvas 2D. The red channel stores
 * halo coverage and the green channel stores fill coverage. Keeping the masks
 * independent lets the renderer draw every halo before any fill in a label.
 *
 * Pages exist only on the GPU. New cells are rasterized on a small staging
 * canvas, which is uploaded once and copied cell by cell to the pages. Pages
 * grow from 512 to 4096 and then another page is opened, up to four; then the
 * atlas is full, so its user has to start it over. A page's GPU texture is
 * replaced only when that page grows, by a copy on the GPU.
 */
class FontAtlas {
  constructor() {
    /**
     * @private
     * @type {Array<AtlasPage>}
     */
    this.pages_ = [createPage(INITIAL_PAGE_SIZE)];

    /**
     * Cells rasterized since the last upload. The first canvas is kept for
     * later uploads.
     * @private
     * @type {Array<StagingCanvas>}
     */
    this.staging_ = [createStagingCanvas(STAGING_SIZE)];

    /**
     * Texture the first staging canvas is uploaded to.
     * @private
     * @type {GPUTexture|null}
     */
    this.stagingTexture_ = null;

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

    /**
     * Incremented by `clear()`, after which no earlier glyph is valid.
     * @private
     * @type {number}
     */
    this.generation_ = 0;

    /**
     * A glyph did not fit on the pages the atlas may have.
     * @private
     * @type {boolean}
     */
    this.full_ = false;
  }

  /**
   * @param {string} font Font (CSS pixels).
   * @param {string} glyph Grapheme.
   * @param {number} [strokeWidth] Stroke width in CSS pixels.
   * @param {number} [pixelRatio] Device pixel ratio for rasterization.
   * @return {GlyphMetrics} Metrics in CSS pixels and stable atlas texels. A
   * glyph that does not fit in a full atlas has its advance but no size.
   */
  getGlyph(font, glyph, strokeWidth = 0, pixelRatio = 1) {
    const dpr = pixelRatio > 0 ? pixelRatio : 1;
    const key = font + '\n' + glyph + '\n' + strokeWidth + '\n' + dpr;
    if (key in this.glyphs_) {
      return this.glyphs_[key];
    }
    const advance = measureAndCacheTextWidth(
      font,
      glyph,
      (this.widthCaches_[font] ??= {}),
    );
    let staging = this.staging_[this.staging_.length - 1];
    const cell = measureCell(staging.context, font, glyph, strokeWidth, dpr);
    const w = cell.width;
    const h = cell.height;
    const page = this.fit_(this.pages_[this.pages_.length - 1], w, h);
    if (!page) {
      this.full_ = true;
      const empty = {
        texX0: 0,
        texY0: 0,
        texX1: 0,
        texY1: 0,
        page: 0,
        width: 0,
        height: 0,
        ascent: 0,
        pad: 0,
        advance,
      };
      this.glyphs_[key] = empty;
      return empty;
    }
    const [x, y] = placeOnShelf(page, w, h);
    const pageIndex = this.pages_.indexOf(page);

    if (!fitShelf(staging, w, h)) {
      staging = createStagingCanvas(
        Math.min(Math.max(STAGING_SIZE, w + 2, h + 2), MAX_PAGE_SIZE),
      );
      this.staging_.push(staging);
      fitShelf(staging, w, h);
    }
    const [sourceX, sourceY] = placeOnShelf(staging, w, h);
    drawCell(staging.context, glyph, cell, sourceX, sourceY);
    staging.cells.push({
      sourceX,
      sourceY,
      page: pageIndex,
      x,
      y,
      width: w,
      height: h,
    });

    const record = {
      texX0: x,
      texY0: y,
      texX1: x + w,
      texY1: y + h,
      page: pageIndex,
      width: w / dpr,
      height: h / dpr,
      ascent: cell.ascent / dpr,
      pad: cell.pad / dpr,
      advance,
    };
    this.glyphs_[key] = record;
    return record;
  }

  /**
   * Copy new cells to the page textures. A page keeps its GPUTexture until
   * that page grows.
   * @param {import("./Helper.js").default} helper Helper.
   * @return {number} Revision. Changes only when a texture object is replaced.
   */
  upload(helper) {
    const device = helper.getDevice();
    for (const page of this.pages_) {
      if (page.texture?.width !== page.size) {
        this.replaceTexture_(device, page);
      }
    }
    for (const staging of this.staging_) {
      if (!staging.cells.length) {
        continue;
      }
      this.copyStagedCells_(device, staging);
    }
    const first = this.staging_[0];
    first.context.clearRect(0, 0, first.size, first.shelfY + first.shelfHeight);
    Object.assign(first, createShelves(first.size));
    first.cells = [];
    this.staging_ = [first];
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
    this.stagingTexture_?.destroy();
    this.stagingTexture_ = null;
    this.pages_ = [createPage(INITIAL_PAGE_SIZE)];
    this.staging_ = [createStagingCanvas(STAGING_SIZE)];
    this.glyphs_ = {};
    this.widthCaches_ = {};
    this.full_ = false;
    ++this.revision_;
    ++this.generation_;
  }

  /**
   * @return {boolean} A glyph did not fit, and is not drawn until the atlas
   * starts over.
   */
  isFull() {
    return this.full_;
  }

  /**
   * @return {number} Changes whenever the atlas starts over, so a user can
   * tell whether glyphs it holds still refer to these pages.
   */
  getGeneration() {
    return this.generation_;
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
   * @param {number} page Page index.
   * @return {number} Page width and height in texels.
   */
  getPageSize(page) {
    return this.pages_[page].size;
  }

  /**
   * Pack `w` by `h` on `page`, growing it up to 4096 or opening another page
   * of that size, up to `MAX_PAGE_COUNT` pages.
   * @param {AtlasPage} page Current page.
   * @param {number} w Cell width.
   * @param {number} h Cell height.
   * @return {AtlasPage|null} Page that has room, the current page when the
   *     cell itself is larger than the maximum, or null when the atlas has no
   *     more pages to open.
   * @private
   */
  fit_(page, w, h) {
    if (
      (w + 2 > page.size || h + 2 > page.size) &&
      page.size * 2 <= MAX_PAGE_SIZE
    ) {
      page.size *= 2;
      return this.fit_(page, w, h);
    }
    if (fitShelf(page, w, h)) {
      return page;
    }
    if (page.size * 2 <= MAX_PAGE_SIZE) {
      page.size *= 2;
      return this.fit_(page, w, h);
    }
    if (w + 2 > MAX_PAGE_SIZE || h + 2 > MAX_PAGE_SIZE) {
      return page;
    }
    if (this.pages_.length >= MAX_PAGE_COUNT) {
      return null;
    }
    const next = createPage(MAX_PAGE_SIZE);
    this.pages_.push(next);
    return this.fit_(next, w, h);
  }

  /**
   * Create a texture of the page size, with the texels of the previous one.
   * @param {GPUDevice} device Device.
   * @param {AtlasPage} page Page.
   * @private
   */
  replaceTexture_(device, page) {
    const texture = device.createTexture({
      size: [page.size, page.size],
      format: 'rg8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.COPY_SRC,
    });
    const previous = page.texture;
    if (previous) {
      const encoder = device.createCommandEncoder();
      encoder.copyTextureToTexture({texture: previous}, {texture}, [
        previous.width,
        previous.height,
      ]);
      device.queue.submit([encoder.finish()]);
      previous.destroy();
    }
    page.texture = texture;
    ++this.revision_;
  }

  /**
   * Upload the used rows of a staging canvas and copy its cells to their pages.
   * @param {GPUDevice} device Device.
   * @param {StagingCanvas} staging Staging canvas.
   * @private
   */
  copyStagedCells_(device, staging) {
    const shared = staging.size === STAGING_SIZE;
    const texture =
      (shared && this.stagingTexture_) ||
      device.createTexture({
        size: [staging.size, staging.size],
        format: 'rg8unorm',
        usage:
          GPUTextureUsage.COPY_SRC |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });
    if (shared) {
      this.stagingTexture_ = texture;
    }
    const rows = Math.min(staging.shelfY + staging.shelfHeight, staging.size);
    // The canvas holds premultiplied coverage, which is what the shader reads.
    device.queue.copyExternalImageToTexture(
      {source: staging.context.canvas},
      {texture, premultipliedAlpha: true},
      [staging.size, rows],
    );
    const encoder = device.createCommandEncoder();
    for (const cell of staging.cells) {
      const page = this.pages_[cell.page];
      // A cell larger than the page is cut off.
      const width = Math.min(
        cell.width,
        page.size - cell.x,
        staging.size - cell.sourceX,
      );
      const height = Math.min(
        cell.height,
        page.size - cell.y,
        rows - cell.sourceY,
      );
      if (width <= 0 || height <= 0) {
        continue;
      }
      encoder.copyTextureToTexture(
        {texture, origin: {x: cell.sourceX, y: cell.sourceY}},
        {
          texture: /** @type {GPUTexture} */ (page.texture),
          origin: {x: cell.x, y: cell.y},
        },
        [width, height],
      );
    }
    device.queue.submit([encoder.finish()]);
    if (!shared) {
      texture.destroy();
    }
  }
}

export default FontAtlas;
