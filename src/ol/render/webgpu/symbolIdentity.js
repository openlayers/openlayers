/**
 * @module ol/render/webgpu/symbolIdentity
 */
/**
 * @typedef {Object} IdentityEntry
 * @property {number} id Persistent identity.
 * @property {number} x World x.
 * @property {number} y World y.
 * @property {number} generation Last generation in which this entry appeared.
 */

/**
 * Distance in CSS pixels within which a replacement symbol can inherit an id.
 * @type {number}
 */
export const SYMBOL_IDENTITY_MATCH_PIXELS = 32;

/**
 * Distance in CSS pixels within which simultaneous copies of a symbol, e.g.
 * from a parent and a child tile, are the same symbol. Copies this close
 * would collide anyway, so only one of them could be shown.
 * @type {number}
 */
export const SYMBOL_IDENTITY_MERGE_PIXELS = 4;

/**
 * @param {number} dx X distance.
 * @param {number|undefined} worldWidth Projection world width.
 * @return {number} Shortest wrapped distance.
 */
function wrappedDistance(dx, worldWidth) {
  if (!worldWidth || !isFinite(worldWidth) || worldWidth <= 0) {
    return Math.abs(dx);
  }
  const distance = Math.abs(dx);
  return Math.min(
    distance,
    Math.abs(distance - worldWidth),
    Math.abs(distance + worldWidth),
  );
}

/**
 * @typedef {Object} PendingSymbol
 * @property {number} index Label index.
 * @property {string} key Content/style key.
 * @property {number} x World x, including the world offset.
 * @property {number} y World y.
 */

/**
 * @classdesc
 * Points bucketed by content key and grid cell. A search within the cell size
 * only visits the 3x3 cells around a point, instead of every point with the
 * same key — thousands of identical icons, e.g. one-way arrows, share a key.
 * @template T
 */
class SpatialHash {
  /**
   * @param {number} cellSize Cell size, at least the search distance.
   */
  constructor(cellSize) {
    /**
     * A zero search distance only matches points in the same cell.
     * @private
     * @type {number}
     */
    this.cellSize_ = cellSize > 0 ? cellSize : 1;

    /**
     * Cells by content key, then by cell coordinates.
     * @private
     * @type {Map<string, Map<string, Array<number>>>}
     */
    this.cells_ = new Map();

    /**
     * @private
     * @type {Array<T>}
     */
    this.items_ = [];

    /**
     * @private
     * @type {Array<number>}
     */
    this.coordinates_ = [];
  }

  /**
   * @param {string} key Content key.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {T} item Item.
   */
  add(key, x, y, item) {
    const cellKey =
      Math.floor(x / this.cellSize_) + ' ' + Math.floor(y / this.cellSize_);
    const order = this.items_.length;
    this.items_.push(item);
    this.coordinates_.push(x, y);
    let cells = this.cells_.get(key);
    if (!cells) {
      cells = new Map();
      this.cells_.set(key, cells);
    }
    const cell = cells.get(cellKey);
    if (cell) {
      cell.push(order);
    } else {
      cells.set(cellKey, [order]);
    }
  }

  /**
   * Visit the items with this key that may be within the cell size of a point.
   * @param {string} key Content key.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {function(T, number, number, number): void} callback Called with
   * the item, its x and y, and its insertion order.
   */
  forEachNear(key, x, y, callback) {
    const cells = this.cells_.get(key);
    if (!cells) {
      return;
    }
    const cx = Math.floor(x / this.cellSize_);
    const cy = Math.floor(y / this.cellSize_);
    const coordinates = this.coordinates_;
    for (let i = cx - 1; i <= cx + 1; ++i) {
      for (let j = cy - 1; j <= cy + 1; ++j) {
        const cell = cells.get(i + ' ' + j);
        if (!cell) {
          continue;
        }
        for (const order of cell) {
          callback(
            this.items_[order],
            coordinates[order * 2],
            coordinates[order * 2 + 1],
            order,
          );
        }
      }
    }
  }
}

/**
 * @classdesc
 * Assigns symbol-instance ids that survive vector-tile and zoom replacement.
 *
 * Content/style keys narrow the candidates, then world anchors provide a
 * one-to-one nearest match. Copies in the same world are matched before any
 * copy may match across the antimeridian, so the off-screen copy from a
 * wrapped world cannot take the id of the copy on screen. Entries live for two
 * generations so a parent tile can disappear one frame before its child
 * arrives without breaking opacity continuity.
 */
export class SymbolIdentityIndex {
  constructor() {
    /**
     * @private
     * @type {Map<string, Array<IdentityEntry>>}
     */
    this.entries_ = new Map();

    /**
     * @private
     * @type {number}
     */
    this.nextId_ = 1;

    /**
     * @private
     * @type {number}
     */
    this.generation_ = 0;
  }

  /**
   * @param {Array<import("./declutter.js").Label>} labels Labels.
   * @param {Array<number>} worldOffsets World x offsets aligned with labels.
   * @param {number} resolution View resolution.
   * @param {number} [worldWidth] Projection world width.
   * @param {Array<number|undefined>} [existingIdentities] Identities retained by unchanged label batches.
   * @return {Array<number>} Identity aligned with labels.
   */
  update(labels, worldOffsets, resolution, worldWidth, existingIdentities) {
    ++this.generation_;
    const generation = this.generation_;
    const maxDistance = Math.max(0, resolution * SYMBOL_IDENTITY_MATCH_PIXELS);
    const maxDistanceSq = maxDistance * maxDistance;
    const mergeDistance = resolution * SYMBOL_IDENTITY_MERGE_PIXELS;
    const mergeDistanceSq = mergeDistance * mergeDistance;
    const used = new Set();
    /** @type {SpatialHash<number>} */
    const currentUnits = new SpatialHash(mergeDistance);
    const identities = new Array(labels.length);
    const pendingKeys = new Array(labels.length);
    const requestedKeys = new Set();
    for (let i = 0; i < labels.length; ++i) {
      if (existingIdentities?.[i] !== undefined) {
        continue;
      }
      const label = labels[i];
      const key =
        label._identityKey ||
        `${label.text || ''}|${label.glyphCount ? 'text' : 'symbol'}`;
      pendingKeys[i] = key;
      requestedKeys.add(key);
    }

    // Entries added during this update get ids that are already used, so the
    // previous entries are all that nearestEntry() can ever match. When every
    // label keeps its identity, nearestEntry() is not called at all. Only keys
    // used by new labels need a spatial index.
    /** @type {SpatialHash<IdentityEntry>} */
    const previous = new SpatialHash(maxDistance);
    if (requestedKeys.size) {
      for (const [key, entries] of this.entries_) {
        if (!requestedKeys.has(key)) {
          continue;
        }
        for (const entry of entries) {
          previous.add(key, entry.x, entry.y, entry);
        }
      }
    }

    /**
     * @param {PendingSymbol} symbol Symbol.
     * @return {boolean} The symbol coincides with one already identified.
     */
    const mergeCopy = (symbol) => {
      // The first copy added wins, as with a linear search.
      let copyId;
      let copyOrder = Infinity;
      currentUnits.forEachNear(
        symbol.key,
        symbol.x,
        symbol.y,
        (id, x, y, order) => {
          if (
            order < copyOrder &&
            (x - symbol.x) * (x - symbol.x) + (y - symbol.y) * (y - symbol.y) <=
              mergeDistanceSq
          ) {
            copyId = id;
            copyOrder = order;
          }
        },
      );
      if (copyId !== undefined) {
        identities[symbol.index] = copyId;
      }
      return copyId !== undefined;
    };

    /**
     * @param {PendingSymbol} symbol Symbol.
     * @param {number|undefined} wrapWidth World width to wrap across, if any.
     * @return {IdentityEntry|undefined} Nearest unused previous entry.
     */
    const nearestEntry = (symbol, wrapWidth) => {
      let best;
      let bestDistance = Infinity;
      let bestOrder = Infinity;
      /**
       * @param {IdentityEntry} entry Entry.
       * @param {number} x Entry x.
       * @param {number} y Entry y.
       * @param {number} order Insertion order, the tie breaker.
       */
      const visit = (entry, x, y, order) => {
        const rawDx = x - symbol.x;
        const dy = y - symbol.y;
        // A used id can still be shared by a copy of its symbol, e.g. one
        // retained by an unchanged batch.
        if (used.has(entry.id) && rawDx * rawDx + dy * dy > mergeDistanceSq) {
          return;
        }
        const dx = wrappedDistance(rawDx, wrapWidth);
        const distance = dx * dx + dy * dy;
        if (
          distance <= maxDistanceSq &&
          (distance < bestDistance ||
            (distance === bestDistance && order < bestOrder))
        ) {
          best = entry;
          bestDistance = distance;
          bestOrder = order;
        }
      };
      previous.forEachNear(symbol.key, symbol.x, symbol.y, visit);
      if (wrapWidth && isFinite(wrapWidth) && wrapWidth > 0) {
        // Within the match distance across the antimeridian means near the
        // symbol shifted by one world.
        previous.forEachNear(symbol.key, symbol.x + wrapWidth, symbol.y, visit);
        previous.forEachNear(symbol.key, symbol.x - wrapWidth, symbol.y, visit);
      }
      return best;
    };

    /**
     * @param {PendingSymbol} symbol Symbol.
     * @param {number} id Identity.
     */
    const assign = (symbol, id) => {
      used.add(id);
      currentUnits.add(symbol.key, symbol.x, symbol.y, id);
      identities[symbol.index] = id;
      const candidates = this.entries_.get(symbol.key) || [];
      candidates.push({id, x: symbol.x, y: symbol.y, generation});
      this.entries_.set(symbol.key, candidates);
    };

    /** @type {Array<PendingSymbol>} */
    const unmatched = [];
    for (let i = 0; i < labels.length; ++i) {
      const existingId = existingIdentities?.[i];
      if (existingId !== undefined) {
        identities[i] = existingId;
        used.add(existingId);
        continue;
      }
      const label = labels[i];
      const anchor = label._anchor;
      const symbol = {
        index: i,
        key: pendingKeys[i],
        x: (anchor?.[0] || 0) + (worldOffsets[i] || 0),
        y: anchor?.[1] || 0,
      };
      if (mergeCopy(symbol)) {
        continue;
      }
      const entry = nearestEntry(symbol, undefined);
      if (!entry) {
        unmatched.push(symbol);
        continue;
      }
      assign(symbol, entry.id);
    }

    for (const symbol of unmatched) {
      if (mergeCopy(symbol)) {
        continue;
      }
      const entry = nearestEntry(symbol, worldWidth);
      assign(symbol, entry ? entry.id : this.nextId_++);
    }

    for (const [key, entries] of this.entries_) {
      const newest = new Map();
      for (const entry of entries) {
        if (used.has(entry.id)) {
          entry.generation = generation;
        }
        if (entry.generation < generation - 2) {
          continue;
        }
        const replacement = newest.get(entry.id);
        if (!replacement || replacement.generation < entry.generation) {
          newest.set(entry.id, entry);
        }
      }
      if (newest.size) {
        this.entries_.set(key, Array.from(newest.values()));
      } else {
        this.entries_.delete(key);
      }
    }
    return identities;
  }

  /**
   * Forget all previous symbols.
   */
  clear() {
    this.entries_.clear();
  }
}
