/**
 * @module ol/render/webgpu/numberSink
 */

/**
 * Append-only numbers stored in a typed array.
 *
 * Geometry used to accumulate in ordinary arrays, one boxed number per
 * element, and copy into a typed array at the end. This grows a typed array
 * directly. `finish()` still copies into a tightly sized buffer so a worker
 * can transfer it.
 */
export class NumberSink {
  /**
   * @param {Int16ArrayConstructor|Uint32ArrayConstructor|Float32ArrayConstructor|Float64ArrayConstructor} Ctor Element type.
   */
  constructor(Ctor) {
    /**
     * @private
     * @type {Int16ArrayConstructor|Uint32ArrayConstructor|Float32ArrayConstructor|Float64ArrayConstructor}
     */
    this.ctor_ = Ctor;

    /**
     * Storage. Valid numbers are `values[0 .. length)`.
     * @type {Int16Array|Uint32Array|Float32Array|Float64Array}
     */
    this.values = new Ctor(256);

    /**
     * @type {number}
     */
    this.length = 0;
  }

  /**
   * @param {number} a First value.
   * @param {number} [b] Second value.
   * @param {number} [c] Third value.
   * @param {number} [d] Fourth value.
   * @param {number} [e] Fifth value.
   * @param {number} [f] Sixth value.
   * @return {number} Length after the append.
   */
  push(a, b, c, d, e, f) {
    const count =
      f !== undefined
        ? 6
        : e !== undefined
          ? 5
          : d !== undefined
            ? 4
            : c !== undefined
              ? 3
              : b !== undefined
                ? 2
                : 1;
    const length = this.length;
    const needed = length + count;
    let data = this.values;
    if (needed > data.length) {
      let capacity = data.length * 2;
      while (capacity < needed) {
        capacity *= 2;
      }
      const next = new this.ctor_(capacity);
      next.set(data);
      data = next;
      this.values = data;
    }
    data[length] = a;
    if (count > 1) {
      data[length + 1] = /** @type {number} */ (b);
    }
    if (count > 2) {
      data[length + 2] = /** @type {number} */ (c);
    }
    if (count > 3) {
      data[length + 3] = /** @type {number} */ (d);
    }
    if (count > 4) {
      data[length + 4] = /** @type {number} */ (e);
    }
    if (count > 5) {
      data[length + 5] = /** @type {number} */ (f);
    }
    this.length = needed;
    return needed;
  }

  /**
   * @return {Int16Array|Uint32Array|Float32Array|Float64Array} Tight copy.
   */
  finish() {
    const out = new this.ctor_(this.length);
    if (this.length) {
      out.set(this.values.subarray(0, this.length));
    }
    return out;
  }
}
