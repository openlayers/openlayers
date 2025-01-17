/**
 * @module ol/webgl/LabelsArray
 */

const textEncoder = new TextEncoder();

const chunkSize = 100_000;

/**
 * @classdesc
 * This class stores text values using typed arrays internally.
 */
class LabelsArray {
  constructor() {
    /**
     * @private
     */
    this.array_ = new Uint8Array(chunkSize);

    this.actualSize_ = 0;

    /**
     * @type {Map<string, number>}
     * @private
     */
    this.labelPositionMap_ = new Map();
  }

  /**
   * @param {string} label Label to append to the end of the array
   * @return {number} The position of the label in the typed array
   */
  push(label) {
    if (this.labelPositionMap_.has(label)) {
      return this.labelPositionMap_.get(label);
    }
    const encoded = textEncoder.encode(label);
    if (this.actualSize_ + encoded.length > this.array_.length) {
      const newArray = new Uint8Array(this.array_.length + chunkSize);
      newArray.set(this.array_);
      this.array_ = newArray;
    }
    const position = this.actualSize_;
    this.array_.set(encoded, position);
    this.actualSize_ += encoded.length;
    this.labelPositionMap_.set(label, position);
    return position;
  }

  /**
   * @return {Uint8Array}
   */
  getArray() {
    return this.array_;
  }
}

export default LabelsArray;
