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
 * @return {Promise<DeviceHandle>} Device handle.
 */
export function requestDevice() {
  if (!WEBGPU) {
    return Promise.reject(new Error('WebGPU is not available in this browser'));
  }
  if (devicePromise) {
    return devicePromise;
  }
  devicePromise = (async () => {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('No WebGPU adapter');
    }
    const device = await adapter.requestDevice();
    const preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    const handle = {device, adapter, preferredFormat};
    currentHandle = handle;
    device.lost.then(() => {
      currentHandle = null;
      devicePromise = null;
      for (const listener of lostListeners) {
        listener();
      }
    });
    return handle;
  })();
  return devicePromise;
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
