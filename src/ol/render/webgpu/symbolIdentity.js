/**
 * @module ol/render/webgpu/symbolIdentity
 */
import {countMetric} from '../../webgpu/metrics.js';

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
 * @classdesc
 * Assigns symbol-instance ids that survive vector-tile and zoom replacement.
 *
 * Content/style keys narrow the candidates, then world anchors provide a
 * one-to-one nearest match. Entries live for two generations so a parent tile
 * can disappear one frame before its child arrives without breaking opacity
 * continuity.
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
   * @return {Array<number>} Identity aligned with labels.
   */
  update(labels, worldOffsets, resolution, worldWidth) {
    ++this.generation_;
    const generation = this.generation_;
    const maxDistance = Math.max(0, resolution * SYMBOL_IDENTITY_MATCH_PIXELS);
    const maxDistanceSq = maxDistance * maxDistance;
    const used = new Set();
    const currentUnits = new Map();
    const identities = new Array(labels.length);

    for (let i = 0; i < labels.length; ++i) {
      const label = labels[i];
      const anchor = label._anchor;
      const x = (anchor?.[0] || 0) + (worldOffsets[i] || 0);
      const y = anchor?.[1] || 0;
      const key =
        label._identityKey ||
        `${label.text || ''}|${label.glyphCount ? 'text' : 'symbol'}`;
      const exact = `${key}|${x.toPrecision(12)}|${y.toPrecision(12)}`;
      const current = currentUnits.get(exact);
      if (current !== undefined) {
        identities[i] = current;
        continue;
      }

      const candidates = this.entries_.get(key) || [];
      let best;
      let bestDistance = Infinity;
      for (const entry of candidates) {
        if (used.has(entry.id)) {
          continue;
        }
        const dx = wrappedDistance(entry.x - x, worldWidth);
        const dy = entry.y - y;
        const distance = dx * dx + dy * dy;
        if (distance <= maxDistanceSq && distance < bestDistance) {
          best = entry;
          bestDistance = distance;
        }
      }

      const id = best ? best.id : this.nextId_++;
      if (best) {
        countMetric('identityMatches');
      } else {
        countMetric('identityNew');
      }
      used.add(id);
      currentUnits.set(exact, id);
      identities[i] = id;
      candidates.push({id, x, y, generation});
      this.entries_.set(key, candidates);
    }

    for (const [key, entries] of this.entries_) {
      const newest = new Map();
      for (const entry of entries) {
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
