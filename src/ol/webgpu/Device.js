/**
 * @module ol/webgpu/Device
 */
import {WEBGPU} from '../has.js';

/**
 * @typedef {Object} DeviceHandle
 * @property {GPUDevice} device Device.
 * @property {GPUAdapter} adapter Adapter.
 * @property {GPUTextureFormat} preferredFormat Preferred canvas format.
 */

/** @type {Promise<DeviceHandle>|null} */
let devicePromise = null;

/** @type {DeviceHandle|null} */
let currentHandle = null;

/** @type {Array<function(): void>} */
const lostListeners = [];

/**
 * @return {boolean} WebGPU is available.
 */
export function isWebGPUAvailable() {
  return WEBGPU;
}

/**
 * Request a shared GPU device. Rejects if WebGPU is missing.
 *
 * Concurrent calls share one request. A request that fails is forgotten, and so
 * is a device once it is lost, so the next call starts over: a transient
 * adapter failure or a lost device does not stop rendering for good.
 * @return {Promise<DeviceHandle>} Device handle.
 */
export function requestDevice() {
  if (!WEBGPU) {
    return Promise.reject(new Error('WebGPU is not available in this browser'));
  }
  if (devicePromise) {
    return devicePromise;
  }
  const promise = acquireDevice().catch((error) => {
    if (devicePromise === promise) {
      devicePromise = null;
    }
    throw error;
  });
  devicePromise = promise;
  return promise;
}

/**
 * Obtains an adapter and a device, and makes the device current until it is
 * lost. Losing a device that has already been replaced changes nothing.
 * @return {Promise<DeviceHandle>} Device handle.
 */
async function acquireDevice() {
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('No WebGPU adapter');
  }
  const device = await adapter.requestDevice();
  const preferredFormat = navigator.gpu.getPreferredCanvasFormat();
  const handle = {device, adapter, preferredFormat};
  currentHandle = handle;
  device.lost.then(() => {
    if (currentHandle !== handle) {
      return;
    }
    currentHandle = null;
    devicePromise = null;
    for (const listener of lostListeners.slice()) {
      listener();
    }
  });
  return handle;
}

/**
 * @return {DeviceHandle|null} The current device if already requested.
 */
export function getCurrentDevice() {
  return currentHandle;
}

/**
 * @param {function(): void} listener Called when the device is lost.
 */
export function addDeviceLostListener(listener) {
  lostListeners.push(listener);
}

/**
 * @param {function(): void} listener Listener.
 */
export function removeDeviceLostListener(listener) {
  const index = lostListeners.indexOf(listener);
  if (index !== -1) {
    lostListeners.splice(index, 1);
  }
}
