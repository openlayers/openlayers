/**
 * @module ol/render/webgpu/symbolIdentity
 */
import {countMetric, endMetric, startMetric} from '../../webgpu/metrics.js';

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
    const metricStart = startMetric();
    ++this.generation_;
    const generation = this.generation_;
    const maxDistance = Math.max(0, resolution * SYMBOL_IDENTITY_MATCH_PIXELS);
    const maxDistanceSq = maxDistance * maxDistance;
    const mergeDistance = resolution * SYMBOL_IDENTITY_MERGE_PIXELS;
    const mergeDistanceSq = mergeDistance * mergeDistance;
    const used = new Set();
    const bucketSize = Math.max(maxDistance, Number.EPSILON);
    /** @type {Map<string, Map<string, Array<IdentityEntry>>>} */
    const buckets = new Map();
    if (!existingIdentities?.every((id) => id !== undefined)) {
      for (const [key, entries] of this.entries_) {
        const keyBuckets = new Map();
        buckets.set(key, keyBuckets);
        for (const entry of entries) {
          const bucketKey =
            Math.floor(entry.x / bucketSize) +
            '/' +
            Math.floor(entry.y / bucketSize);
          const bucket = keyBuckets.get(bucketKey);
          if (bucket) {
            bucket.push(entry);
          } else {
            keyBuckets.set(bucketKey, [entry]);
          }
        }
      }
    }
    /** @type {Map<string, Array<{id: number, x: number, y: number}>>} */
    const currentUnits = new Map();
    const identities = new Array(labels.length);

    /**
     * @param {PendingSymbol} symbol Symbol.
     * @return {boolean} The symbol coincides with one already identified.
     */
    const mergeCopy = (symbol) => {
      const units = currentUnits.get(symbol.key) || [];
      const copy = units.find(
        (unit) =>
          (unit.x - symbol.x) * (unit.x - symbol.x) +
            (unit.y - symbol.y) * (unit.y - symbol.y) <=
          mergeDistanceSq,
      );
      if (copy) {
        identities[symbol.index] = copy.id;
      }
      return !!copy;
    };

    /**
     * @param {PendingSymbol} symbol Symbol.
     * @param {number|undefined} wrapWidth World width to wrap across, if any.
     * @return {IdentityEntry|undefined} Nearest unused previous entry.
     */
    const nearestEntry = (symbol, wrapWidth) => {
      let best;
      let bestDistance = Infinity;
      const keyBuckets = buckets.get(symbol.key);
      if (!keyBuckets) {
        return undefined;
      }
      const queryXs = wrapWidth
        ? [symbol.x, symbol.x - wrapWidth, symbol.x + wrapWidth]
        : [symbol.x];
      const yCell = Math.floor(symbol.y / bucketSize);
      for (const queryX of queryXs) {
        const xCell = Math.floor(queryX / bucketSize);
        for (let dxCell = -1; dxCell <= 1; ++dxCell) {
          for (let dyCell = -1; dyCell <= 1; ++dyCell) {
            const bucket = keyBuckets.get(
              xCell + dxCell + '/' + (yCell + dyCell),
            );
            if (!bucket) {
              continue;
            }
            for (const entry of bucket) {
              const rawDx = entry.x - symbol.x;
              const dx = wrappedDistance(rawDx, wrapWidth);
              const dy = entry.y - symbol.y;
              const distance = dx * dx + dy * dy;
              if (
                used.has(entry.id) &&
                rawDx * rawDx + dy * dy > mergeDistanceSq
              ) {
                continue;
              }
              if (distance <= maxDistanceSq && distance < bestDistance) {
                best = entry;
                bestDistance = distance;
              }
            }
          }
        }
      }
      return best;
    };

    /**
     * @param {PendingSymbol} symbol Symbol.
     * @param {number} id Identity.
     */
    const assign = (symbol, id) => {
      used.add(id);
      const units = currentUnits.get(symbol.key) || [];
      units.push({id, x: symbol.x, y: symbol.y});
      currentUnits.set(symbol.key, units);
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
        key:
          label._identityKey ||
          `${label.text || ''}|${label.glyphCount ? 'text' : 'symbol'}`,
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
      countMetric('identityMatches');
      assign(symbol, entry.id);
    }

    for (const symbol of unmatched) {
      if (mergeCopy(symbol)) {
        continue;
      }
      const entry = nearestEntry(symbol, worldWidth);
      countMetric(entry ? 'identityMatches' : 'identityNew');
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
    endMetric('symbolIdentity', metricStart);
    return identities;
  }

  /**
   * Forget all previous symbols.
   */
  clear() {
    this.entries_.clear();
  }
}
