/**
 * GPU allocation and upload counters. Importing this module wraps the WebGPU
 * prototype methods, so every device created afterwards is counted.
 *
 * Memory is the size of the buffers and textures that were created and not yet
 * destroyed. The canvas context's own textures are not included.
 */
import {getUid} from '../../../src/ol/util.js';

/**
 * Bytes per texel. Formats not listed count as 4 bytes.
 * @type {Object<string, number>}
 */
const FORMAT_BYTES = {
  r8unorm: 1,
  r8snorm: 1,
  r8uint: 1,
  r8sint: 1,
  rg8unorm: 2,
  rg8snorm: 2,
  rg8uint: 2,
  rg8sint: 2,
  r16uint: 2,
  r16sint: 2,
  r16float: 2,
  depth16unorm: 2,
  rg16uint: 4,
  rg16sint: 4,
  rg16float: 4,
  rgba16uint: 8,
  rgba16sint: 8,
  rgba16float: 8,
  rg32uint: 8,
  rg32sint: 8,
  rg32float: 8,
  rgba32uint: 16,
  rgba32sint: 16,
  rgba32float: 16,
};

/**
 * @typedef {Object} GpuCounters
 * @property {number} liveBytes Bytes of buffers and textures not yet destroyed.
 * @property {number} peakBytes Highest `liveBytes` since the last {@link resetGpuPeak}.
 * @property {number} allocations Buffers and textures created.
 * @property {number} writeBufferCalls `GPUQueue#writeBuffer` calls.
 * @property {number} writeBufferBytes Bytes written by those calls.
 * @property {number} textureUploadBytes Bytes written by `writeTexture` and
 * `copyExternalImageToTexture`.
 * @property {number} submits `GPUQueue#submit` calls.
 */

/** @type {GpuCounters} */
const counters = {
  liveBytes: 0,
  peakBytes: 0,
  allocations: 0,
  writeBufferCalls: 0,
  writeBufferBytes: 0,
  textureUploadBytes: 0,
  submits: 0,
};

/**
 * Bytes of the buffers and textures not yet destroyed, by uid.
 * @type {Object<string, number>}
 */
const liveByUid = {};

/**
 * @param {string} format Texture format.
 * @return {number} Bytes per texel.
 */
function formatBytes(format) {
  return FORMAT_BYTES[format] ?? 4;
}

/**
 * @param {GPUTexture} texture Texture.
 * @return {number} Bytes for every mip level and sample.
 */
function textureBytes(texture) {
  const volume = texture.dimension === '3d';
  let texels = 0;
  for (let level = 0; level < texture.mipLevelCount; ++level) {
    texels +=
      Math.max(1, texture.width >> level) *
      Math.max(1, texture.height >> level) *
      (volume
        ? Math.max(1, texture.depthOrArrayLayers >> level)
        : texture.depthOrArrayLayers);
  }
  return texels * texture.sampleCount * formatBytes(texture.format);
}

/**
 * @param {GPUExtent3D} size Copy size.
 * @return {number} Texels.
 */
function extentTexels(size) {
  if (Symbol.iterator in Object(size)) {
    const [width, height = 1, depth = 1] = /** @type {Iterable<number>} */ (
      size
    );
    return width * height * depth;
  }
  const extent = /** @type {GPUExtent3DDict} */ (size);
  return extent.width * (extent.height ?? 1) * (extent.depthOrArrayLayers ?? 1);
}

/**
 * `dataOffset` and `size` count elements for typed arrays and bytes otherwise.
 * @param {BufferSource} data Data.
 * @param {number} [dataOffset] Offset into `data`.
 * @param {number} [size] Amount to write.
 * @return {number} Bytes written.
 */
export function writeBufferByteLength(data, dataOffset = 0, size) {
  const elementBytes =
    ArrayBuffer.isView(data) && !(data instanceof DataView)
      ? /** @type {Uint8Array} */ (data).BYTES_PER_ELEMENT
      : 1;
  return (size ?? data.byteLength / elementBytes - dataOffset) * elementBytes;
}

/**
 * @param {GPUBuffer|GPUTexture} object Created object.
 * @param {number} bytes Its size.
 */
function track(object, bytes) {
  liveByUid[getUid(object)] = bytes;
  ++counters.allocations;
  counters.liveBytes += bytes;
  counters.peakBytes = Math.max(counters.peakBytes, counters.liveBytes);
}

/**
 * @param {GPUBuffer|GPUTexture} object Destroyed object.
 */
function untrack(object) {
  const uid = getUid(object);
  if (!(uid in liveByUid)) {
    return;
  }
  counters.liveBytes -= liveByUid[uid];
  delete liveByUid[uid];
}

function install() {
  const device = GPUDevice.prototype;
  const createBuffer = device.createBuffer;
  device.createBuffer = function (descriptor) {
    const buffer = createBuffer.call(this, descriptor);
    track(buffer, buffer.size);
    return buffer;
  };
  const createTexture = device.createTexture;
  device.createTexture = function (descriptor) {
    const texture = createTexture.call(this, descriptor);
    track(texture, textureBytes(texture));
    return texture;
  };
  for (const proto of [GPUBuffer.prototype, GPUTexture.prototype]) {
    const destroy = proto.destroy;
    proto.destroy = function () {
      untrack(this);
      return destroy.call(this);
    };
  }
  const queue = GPUQueue.prototype;
  const writeBuffer = queue.writeBuffer;
  queue.writeBuffer = function (buffer, offset, data, dataOffset, size) {
    ++counters.writeBufferCalls;
    counters.writeBufferBytes += writeBufferByteLength(data, dataOffset, size);
    return writeBuffer.apply(this, arguments);
  };
  const writeTexture = queue.writeTexture;
  queue.writeTexture = function (destination, data, layout, size) {
    counters.textureUploadBytes +=
      extentTexels(size) * formatBytes(destination.texture.format);
    return writeTexture.apply(this, arguments);
  };
  const copyExternalImageToTexture = queue.copyExternalImageToTexture;
  queue.copyExternalImageToTexture = function (source, destination, size) {
    counters.textureUploadBytes +=
      extentTexels(size) * formatBytes(destination.texture.format);
    return copyExternalImageToTexture.apply(this, arguments);
  };
  const submit = queue.submit;
  queue.submit = function () {
    ++counters.submits;
    return submit.apply(this, arguments);
  };
}

if (typeof GPUDevice !== 'undefined') {
  install();
}

/**
 * @return {GpuCounters} Current counters.
 */
export function readGpuCounters() {
  return {...counters};
}

/**
 * Start a new peak at the current live size.
 */
export function resetGpuPeak() {
  counters.peakBytes = counters.liveBytes;
}

/**
 * @typedef {Object} GpuUsage
 * @property {number} peakMB Highest GPU memory.
 * @property {number} retainedMB GPU memory at the end.
 * @property {number} allocations Buffers and textures created.
 * @property {number} writeBufferCalls `writeBuffer` calls.
 * @property {number} writeBufferMB Bytes written by those calls, in MB.
 * @property {number} textureUploadMB Bytes uploaded to textures, in MB.
 * @property {number} submits Queue submissions.
 */

const MB = 1024 * 1024;

/**
 * The peak is the one since the last {@link resetGpuPeak}, which is called
 * when `start` is read.
 * @param {GpuCounters} start Counters before.
 * @param {GpuCounters} end Counters after.
 * @return {GpuUsage} Usage in between.
 */
export function gpuUsage(start, end) {
  return {
    peakMB: end.peakBytes / MB,
    retainedMB: end.liveBytes / MB,
    allocations: end.allocations - start.allocations,
    writeBufferCalls: end.writeBufferCalls - start.writeBufferCalls,
    writeBufferMB: (end.writeBufferBytes - start.writeBufferBytes) / MB,
    textureUploadMB: (end.textureUploadBytes - start.textureUploadBytes) / MB,
    submits: end.submits - start.submits,
  };
}
