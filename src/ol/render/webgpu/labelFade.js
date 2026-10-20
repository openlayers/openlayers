/**
 * @module ol/render/webgpu/labelFade
 */
/**
 * Fade-in duration for newly visible labels (ms).
 * @type {number}
 */
export const LABEL_FADE_DURATION = 200;

/**
 * Milliseconds since the page time origin.
 *
 * `frameState.time` is `Date.now()`. A float32 cannot separate two of those
 * timestamps by a fade: around 2026 the unit in the last place is more than
 * two minutes, so the shader stays on the start opacity. Subtracting the
 * time origin leaves a session clock the uniform and the vertex attribute
 * can both represent.
 *
 * @param {number} time Frame time.
 * @return {number} Clock value for a float32 uniform or vertex attribute.
 */
export function fadeClock(time) {
  return time - performance.timeOrigin;
}

/**
 * Copy a transition into a GPU buffer, converting the start time with
 * {@link fadeClock}.
 *
 * @param {Float32Array} target Destination.
 * @param {number} offset Element index.
 * @param {Array<number>} transition Start opacity, target opacity, and start time.
 */
export function writeGpuTransition(target, offset, transition) {
  target[offset] = transition[0];
  target[offset + 1] = transition[1];
  target[offset + 2] = fadeClock(transition[2]);
}

/**
 * Select the label instances that receive their identity's fade transition.
 *
 * Multiple tile batches can contain the same identity. Declutter accepts one
 * instance (or both members of an image/text pair), so hidden duplicates must
 * stay transparent even though they share the accepted instance's identity.
 * If an identity has no current winner, its previous winner keeps the
 * transition long enough to fade out.
 *
 * @param {Array<FadeLabel>} labels Labels.
 * @param {Array<boolean>} visibility Current visibility.
 * @param {Array<boolean>|null|undefined} previousVisibility Previous visibility.
 * @param {Array<number>|undefined} identities Persistent ids.
 * @return {Set<number>} Active label indices.
 */
export function activeLabelIndices(
  labels,
  visibility,
  previousVisibility,
  identities,
) {
  /** @type {Set<number>} */
  const visibleIds = new Set();
  const active = new Set();
  for (let i = 0; i < labels.length; ++i) {
    if (!visibility[i]) {
      continue;
    }
    active.add(i);
    const id = identities?.[i] ?? labels[i].id;
    if (id !== undefined) {
      visibleIds.add(id);
    }
  }
  if (!previousVisibility) {
    return active;
  }
  for (let i = 0; i < labels.length; ++i) {
    if (!previousVisibility[i] || visibility[i]) {
      continue;
    }
    const id = identities?.[i] ?? labels[i].id;
    if (id === undefined || !visibleIds.has(id)) {
      active.add(i);
    }
  }
  return active;
}

/**
 * Indices whose transition must be rewritten: every label active now, and
 * every label that was active last time and is not anymore.
 *
 * @param {Set<number>} previous Indices active on the previous update.
 * @param {Set<number>} active Indices active now.
 * @return {Array<number>} Indices to write.
 */
export function opacityIndicesToWrite(previous, active) {
  /** @type {Array<number>} */
  const dirty = [];
  for (const index of previous) {
    if (!active.has(index)) {
      dirty.push(index);
    }
  }
  for (const index of active) {
    dirty.push(index);
  }
  return dirty;
}

/**
 * Match previous-frame labels within this many CSS pixels (converted to
 * world units with view resolution) so the same text at a new tile zoom
 * does not restart the fade.
 * @type {number}
 */
export const LABEL_FADE_MATCH_PIXELS = 64;

/**
 * @typedef {Object} FadeLabel
 * @property {number} [id] Feature uid.
 * @property {string} [text] Displayed text.
 * @property {import("../../coordinate.js").Coordinate} [_anchor] World-space anchor.
 */

/**
 * @typedef {Object} FadeEntry
 * @property {string} [text] Displayed text.
 * @property {number} [x] World anchor x.
 * @property {number} [y] World anchor y.
 * @property {number} id Identity.
 * @property {number} start Opacity at `startTime`.
 * @property {number} target Target opacity.
 * @property {number} startTime Transition start.
 * @property {number} lastSeen Last update containing this identity.
 */

/**
 * @typedef {Map<string, Map<string, Array<FadeEntry>>>} FadeSpatialIndex
 */

/**
 * @param {FadeSpatialIndex} index Previous entries by text and anchor bucket.
 * @param {Set<number>} used Matched identities.
 * @param {FadeLabel} label Current label.
 * @param {number} [maxWorldDistance] Max world distance for text matching.
 * @return {FadeEntry|undefined} Nearby previous entry.
 */
function matchPrev(index, used, label, maxWorldDistance) {
  const text = label.text;
  const anchor = label._anchor;
  if (
    !text ||
    !anchor ||
    maxWorldDistance === undefined ||
    maxWorldDistance <= 0
  ) {
    return undefined;
  }
  const maxDistSq = maxWorldDistance * maxWorldDistance;
  let best;
  let bestDistSq = Infinity;
  const buckets = index.get(text);
  if (!buckets) {
    return undefined;
  }
  const xCell = Math.floor(anchor[0] / maxWorldDistance);
  const yCell = Math.floor(anchor[1] / maxWorldDistance);
  for (let dxCell = -1; dxCell <= 1; ++dxCell) {
    for (let dyCell = -1; dyCell <= 1; ++dyCell) {
      const entries = buckets.get(xCell + dxCell + '/' + (yCell + dyCell));
      if (!entries) {
        continue;
      }
      for (const entry of entries) {
        if (used.has(entry.id)) {
          continue;
        }
        const dx = /** @type {number} */ (entry.x) - anchor[0];
        const dy = /** @type {number} */ (entry.y) - anchor[1];
        const distSq = dx * dx + dy * dy;
        if (distSq <= maxDistSq && distSq < bestDistSq) {
          best = entry;
          bestDistSq = distSq;
        }
      }
    }
  }
  if (best) {
    used.add(best.id);
  }
  return best;
}

/**
 * @param {FadeEntry} entry Entry.
 * @param {number} time Time.
 * @param {number} duration Duration.
 * @return {number} Interpolated opacity.
 */
function entryOpacity(entry, time, duration) {
  if (duration <= 0) {
    return entry.target;
  }
  const progress = Math.max(
    0,
    Math.min(1, (time - entry.startTime) / duration),
  );
  return entry.start + (entry.target - entry.start) * progress;
}

/**
 * @classdesc
 * Persistent bidirectional opacity transitions keyed by symbol identity.
 */
export class LabelFade {
  /**
   * @param {number} [duration] Duration in milliseconds.
   */
  constructor(duration = LABEL_FADE_DURATION) {
    /**
     * @private
     * @type {number}
     */
    this.duration_ = duration;

    /**
     * @private
     * @type {Map<number, FadeEntry>}
     */
    this.entries_ = new Map();

    /**
     * Ids whose opacity moved to a nearby replacement.
     * @private
     * @type {Map<number, number>}
     */
    this.retired_ = new Map();
  }

  /**
   * Commit visibility targets while preserving the current opacity.
   *
   * @param {Array<FadeLabel>} labels Labels.
   * @param {Array<boolean>} visibility Visibility aligned with `labels`.
   * @param {number} time Frame time.
   * @param {number} [maxWorldDistance] Max world distance to treat same-text
   * labels as a continuation. Omitted: match by id only.
   * @param {Array<number>} [identities] Persistent ids aligned with labels.
   * @return {boolean} True if any current label is still fading.
   */
  update(labels, visibility, time, maxWorldDistance, identities) {
    const used = new Set();
    /** @type {Map<number, {label: FadeLabel, target: number}>} */
    const current = new Map();
    for (let i = 0; i < labels.length; ++i) {
      const label = labels[i];
      const id = identities?.[i] ?? label.id;
      if (id === undefined) {
        continue;
      }
      const target = visibility[i] === false ? 0 : 1;
      const existing = current.get(id);
      current.set(id, {
        label: existing?.label || label,
        target: Math.max(existing?.target || 0, target),
      });
    }

    const previous = new Map(this.entries_);
    /** @type {FadeSpatialIndex} */
    const previousByText = new Map();
    if (maxWorldDistance && maxWorldDistance > 0) {
      for (const entry of previous.values()) {
        if (!entry.text || entry.x === undefined || entry.y === undefined) {
          continue;
        }
        let buckets = previousByText.get(entry.text);
        if (!buckets) {
          buckets = new Map();
          previousByText.set(entry.text, buckets);
        }
        const bucketKey =
          Math.floor(entry.x / maxWorldDistance) +
          '/' +
          Math.floor(entry.y / maxWorldDistance);
        const bucket = buckets.get(bucketKey);
        if (bucket) {
          bucket.push(entry);
        } else {
          buckets.set(bucketKey, [entry]);
        }
      }
    }
    for (const id of current.keys()) {
      if (previous.has(id)) {
        used.add(id);
      }
    }

    let fading = false;
    for (const [id, value] of current) {
      let entry = this.entries_.get(id);
      if (!entry) {
        const matched = matchPrev(
          previousByText,
          used,
          value.label,
          maxWorldDistance,
        );
        const opacity = matched
          ? entryOpacity(matched, time, this.duration_)
          : 0;
        if (matched) {
          this.entries_.delete(matched.id);
          this.retired_.set(matched.id, time + this.duration_);
        }
        entry = {
          id,
          start: opacity,
          target: opacity,
          startTime: time,
          lastSeen: time,
        };
        this.entries_.set(id, entry);
      } else {
        used.add(id);
      }
      const opacity = entryOpacity(entry, time, this.duration_);
      if (entry.target !== value.target) {
        entry.start = opacity;
        entry.target = value.target;
        entry.startTime = time;
      }
      const anchor = value.label._anchor;
      entry.text = value.label.text;
      entry.x = anchor?.[0];
      entry.y = anchor?.[1];
      entry.lastSeen = time;
      if (entryOpacity(entry, time, this.duration_) !== entry.target) {
        fading = true;
      }
    }

    for (const [id, entry] of this.entries_) {
      if (current.has(id)) {
        continue;
      }
      const opacity = entryOpacity(entry, time, this.duration_);
      if (entry.target !== 0) {
        entry.start = opacity;
        entry.target = 0;
        entry.startTime = time;
      }
      if (entryOpacity(entry, time, this.duration_) !== entry.target) {
        fading = true;
      }
      if (
        time - entry.lastSeen > this.duration_ * 2 &&
        entryOpacity(entry, time, this.duration_) === 0
      ) {
        this.entries_.delete(id);
      }
    }
    for (const [id, expires] of this.retired_) {
      if (expires <= time) {
        this.retired_.delete(id);
      }
    }
    return fading;
  }

  /**
   * @param {number|undefined} id Label id.
   * @param {number} time Frame time.
   * @return {number} Opacity in `[0, 1]`.
   */
  opacity(id, time) {
    if (id === undefined) {
      return 1;
    }
    const entry = this.entries_.get(id);
    if (!entry) {
      return 1;
    }
    return entryOpacity(entry, time, this.duration_);
  }

  /**
   * GPU transition values for an identity.
   * @param {number|undefined} id Label id.
   * @return {Array<number>} Start opacity, target opacity, and start time.
   */
  transition(id) {
    if (id !== undefined && this.retired_.has(id)) {
      return [0, 0, 0];
    }
    const entry = id === undefined ? undefined : this.entries_.get(id);
    return entry ? [entry.start, entry.target, entry.startTime] : [1, 1, 0];
  }

  /**
   * @return {number} Transition duration.
   */
  getDuration() {
    return this.duration_;
  }
}
