/**
 * @module ol/proj/transforms
 */
import {isEmpty} from '../obj.js';


/**
 * @private
 * @type {Object.<string, Object.<string, ol.TransformFunction>>}
 */
let transforms = {};


/**
 * Clear the transform cache.
 */
export function clear() {
  transforms = {};
}


/**
 * Registers a conversion function to convert coordinates from the source
 * projection to the destination projection.
 *
 * @param {ol.proj.Projection} source Source.
 * @param {ol.proj.Projection} destination Destination.
 * @param {ol.TransformFunction} transformFn Transform.
 */
export function add(source, destination, transformFn) {
  const sourceCode = source.getCode();
  const destinationCode = destination.getCode();
  if (!(sourceCode in transforms)) {
    transforms[sourceCode] = {};
  }
  transforms[sourceCode][destinationCode] = transformFn;
}


/**
 * Unregisters the conversion function to convert coordinates from the source
 * projection to the destination projection.  This method is used to clean up
 * cached transforms during testing.
 *
 * @param {ol.proj.Projection} source Source projection.
 * @param {ol.proj.Projection} destination Destination projection.
 * @return {ol.TransformFunction} transformFn The unregistered transform.
 */
export function remove(source, destination) {
  const sourceCode = source.getCode();
  const destinationCode = destination.getCode();
  const transform = transforms[sourceCode][destinationCode];
  delete transforms[sourceCode][destinationCode];
  if (isEmpty(transforms[sourceCode])) {
    delete transforms[sourceCode];
  }
  return transform;
}


/**
 * Get a transform given a source code and a destination code.
 * @param {string} sourceCode The code for the source projection.
 * @param {string} destinationCode The code for the destination projection.
 * @return {ol.TransformFunction|undefined} The transform function (if found).
 */
export function get(sourceCode, destinationCode) {
  let transform;
  if (sourceCode in transforms && destinationCode in transforms[sourceCode]) {
    transform = transforms[sourceCode][destinationCode];
  }
  return transform;
}
