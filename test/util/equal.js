import {assert} from 'chai';

/**
 * Normalize typed arrays for deep comparison.
 * @param {*} value Value.
 * @return {*} Normalized value.
 */
function normalizeForDeepEqual(value) {
  if (ArrayBuffer.isView(value)) {
    return Array.from(value).map(normalizeForDeepEqual);
  }
  if (Array.isArray(value)) {
    return value.map(normalizeForDeepEqual);
  }
  if (value !== null && typeof value === 'object') {
    const normalized = {};
    for (const key of Object.keys(value)) {
      normalized[key] = normalizeForDeepEqual(value[key]);
    }
    return normalized;
  }
  if (typeof value === 'number') {
    return value === 0 ? 0 : value;
  }
  return value;
}

/**
 * Assert deep equality, comparing typed arrays to plain arrays by value.
 * @param {*} actual Actual value.
 * @param {*} expected Expected value.
 * @param {string} [message] Message.
 */
export function assertArrayLikeEqual(actual, expected, message) {
  assert.deepEqual(
    normalizeForDeepEqual(actual),
    normalizeForDeepEqual(expected),
    message,
  );
}

/**
 * @typedef {Object} AttributeDescriptorExpected
 * @property {number} size Attribute size.
 */

/**
 * Assert attribute descriptor objects match expected size and have callbacks.
 * @param {Object<string, AttributeDescriptorExpected>} actual Actual descriptors.
 * @param {Object<string, AttributeDescriptorExpected>} expected Expected descriptors.
 */
export function assertAttributeDescriptors(actual, expected) {
  assert.hasAllKeys(actual, Object.keys(expected));
  for (const name in expected) {
    assert.property(actual, name);
    if ('size' in expected[name]) {
      assert.strictEqual(actual[name].size, expected[name].size);
    }
    assert.isFunction(actual[name].callback);
  }
}

/**
 * Assert custom attribute maps match expected descriptor sizes and callbacks.
 * @param {Object<string, {size: number, callback: Function}>} actual Actual map.
 * @param {Object<string, AttributeDescriptorExpected>} expected Expected map.
 */
export function assertCustomAttributes(actual, expected) {
  assertAttributeDescriptors(actual, expected);
}

/**
 * Assert uniform maps contain the expected keys with function values.
 * @param {Object<string, Function>} actual Actual uniforms.
 * @param {Object<string, any>} expected Expected uniform keys.
 */
export function assertUniformCallbacks(actual, expected) {
  assert.hasAllKeys(actual, Object.keys(expected));
  for (const name in expected) {
    assert.property(actual, name);
    assert.isFunction(actual[name]);
  }
}
