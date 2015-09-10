goog.provide('ol.ext.pixelworks');
/** @typedef {function(*)} */
ol.ext.pixelworks;
(function() {
var exports = {};
var module = {exports: exports};
var define;
/**
 * @fileoverview
 * @suppress {accessControls, ambiguousFunctionDecl, checkDebuggerStatement, checkRegExp, checkTypes, checkVars, const, constantProperty, deprecated, duplicate, es5Strict, fileoverviewTags, missingProperties, nonStandardJsDocs, strictModuleDepCheck, suspiciousCode, undefinedNames, undefinedVars, unknownDefines, uselessCode, visibility}
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.pixelworks = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Processor = require('./processor');

exports.Processor = Processor;

},{"./processor":2}],2:[function(require,module,exports){
/* eslint-disable dot-notation */

/**
 * Create a function for running operations.
 * @param {function(Array, Object):*} operation The operation.
 * @return {function(Object):ArrayBuffer} A function that takes an object with
 * buffers, meta, imageOps, width, and height properties and returns an array
 * buffer.
 */
function createMinion(operation) {
  return function(data) {
    // bracket notation for minification support
    var buffers = data['buffers'];
    var meta = data['meta'];
    var imageOps = data['imageOps'];
    var width = data['width'];
    var height = data['height'];

    var numBuffers = buffers.length;
    var numBytes = buffers[0].byteLength;
    var output, b;

    if (imageOps) {
      var images = new Array(numBuffers);
      for (b = 0; b < numBuffers; ++b) {
        images[b] = new ImageData(
            new Uint8ClampedArray(buffers[b]), width, height);
      }
      output = operation(images, meta).data;
    } else {
      output = new Uint8ClampedArray(numBytes);
      var arrays = new Array(numBuffers);
      var pixels = new Array(numBuffers);
      for (b = 0; b < numBuffers; ++b) {
        arrays[b] = new Uint8ClampedArray(buffers[b]);
        pixels[b] = [0, 0, 0, 0];
      }
      for (var i = 0; i < numBytes; i += 4) {
        for (var j = 0; j < numBuffers; ++j) {
          var array = arrays[j];
          pixels[j][0] = array[i];
          pixels[j][1] = array[i + 1];
          pixels[j][2] = array[i + 2];
          pixels[j][3] = array[i + 3];
        }
        var pixel = operation(pixels, meta);
        output[i] = pixel[0];
        output[i + 1] = pixel[1];
        output[i + 2] = pixel[2];
        output[i + 3] = pixel[3];
      }
    }
    return output.buffer;
  };
}

/**
 * Create a worker for running operations.
 * @param {Object} config Configuration.
 * @param {function(Object)} onMessage Called with a message event.
 * @return {Worker} The worker.
 */
function createWorker(config, onMessage) {
  var lib = Object.keys(config.lib || {}).map(function(name) {
    return 'var ' + name + ' = ' + config.lib[name].toString() + ';';
  });

  var lines = lib.concat([
    'var __minion__ = (' + createMinion.toString() + ')(',
        config.operation.toString(),
    ');',
    'self.addEventListener("message", function(__event__) {',
      'var buffer = __minion__(__event__.data);',
      'self.postMessage({buffer: buffer, meta: __event__.data.meta}, [buffer]);',
    '});'
  ]);

  var blob = new Blob(lines, {type: 'text/javascript'});
  var source = URL.createObjectURL(blob);
  var worker = new Worker(source);
  worker.addEventListener('message', onMessage);
  return worker;
}

/**
 * Create a faux worker for running operations.
 * @param {Object} config Configuration.
 * @param {function(Object)} onMessage Called with a message event.
 * @return {Object} The faux worker.
 */
function createFauxWorker(config, onMessage) {
  var minion = createMinion(config.operation);
  return {
    postMessage: function(data) {
      setTimeout(function() {
        onMessage({data: {buffer: minion(data), meta: data.meta}});
      }, 0);
    }
  };
}

/**
 * A processor runs pixel or image operations in workers.
 * @param {Object} config Configuration.
 */
function Processor(config) {
  this._imageOps = !!config.imageOps;
  var threads;
  if (config.threads === 0) {
    threads = 0;
  } else if (this._imageOps) {
    threads = 1;
  } else {
    threads = config.threads || 1;
  }
  var workers = [];
  if (threads) {
    for (var i = 0; i < threads; ++i) {
      workers[i] = createWorker(config, this._onWorkerMessage.bind(this, i));
    }
  } else {
    workers[0] = createFauxWorker(config, this._onWorkerMessage.bind(this, 0));
  }
  this._workers = workers;
  this._queue = [];
  this._maxQueueLength = config.queue || Infinity;
  this._running = 0;
  this._dataLookup = {};
  this._job = null;
}

/**
 * Run operation on input data.
 * @param {Array.<Array|ImageData>} inputs Array of pixels or image data
 *     (depending on the operation type).
 * @param {Object} meta A user data object.  This is passed to all operations
 *     and must be serializable.
 * @param {function(Error, ImageData, Object)} callback Called when work
 *     completes.  The first argument is any error.  The second is the ImageData
 *     generated by operations.  The third is the user data object.
 */
Processor.prototype.process = function(inputs, meta, callback) {
  this._enqueue({
    inputs: inputs,
    meta: meta,
    callback: callback
  });
  this._dispatch();
};

/**
 * Stop responding to any completed work and destroy the processor.
 */
Processor.prototype.destroy = function() {
  for (var key in this) {
    this[key] = null;
  }
  this._destroyed = true;
};

/**
 * Add a job to the queue.
 * @param {Object} job The job.
 */
Processor.prototype._enqueue = function(job) {
  this._queue.push(job);
  while (this._queue.length > this._maxQueueLength) {
    this._queue.shift().callback(null, null);
  }
};

/**
 * Dispatch a job.
 */
Processor.prototype._dispatch = function() {
  if (this._running === 0 && this._queue.length > 0) {
    var job = this._job = this._queue.shift();
    var width = job.inputs[0].width;
    var height = job.inputs[0].height;
    var buffers = job.inputs.map(function(input) {
      return input.data.buffer;
    });
    var threads = this._workers.length;
    this._running = threads;
    if (threads === 1) {
      this._workers[0].postMessage({
        'buffers': buffers,
        'meta': job.meta,
        'imageOps': this._imageOps,
        'width': width,
        'height': height
      }, buffers);
    } else {
      var length = job.inputs[0].data.length;
      var segmentLength = 4 * Math.ceil(length / 4 / threads);
      for (var i = 0; i < threads; ++i) {
        var offset = i * segmentLength;
        var slices = [];
        for (var j = 0, jj = buffers.length; j < jj; ++j) {
          slices.push(buffers[i].slice(offset, offset + segmentLength));
        }
        this._workers[i].postMessage({
          'buffers': slices,
          'meta': job.meta,
          'imageOps': this._imageOps,
          'width': width,
          'height': height
        }, slices);
      }
    }
  }
};

/**
 * Handle messages from the worker.
 * @param {number} index The worker index.
 * @param {Object} event The message event.
 */
Processor.prototype._onWorkerMessage = function(index, event) {
  if (this._destroyed) {
    return;
  }
  this._dataLookup[index] = event.data;
  --this._running;
  if (this._running === 0) {
    this._resolveJob();
  }
};

/**
 * Resolve a job.  If there are no more worker threads, the processor callback
 * will be called.
 */
Processor.prototype._resolveJob = function() {
  var job = this._job;
  var threads = this._workers.length;
  var data, meta;
  if (threads === 1) {
    data = new Uint8ClampedArray(this._dataLookup[0]['buffer']);
    meta = this._dataLookup[0]['meta'];
  } else {
    var length = job.inputs[0].data.length;
    data = new Uint8ClampedArray(length);
    meta = new Array(length);
    var segmentLength = 4 * Math.ceil(length / 4 / threads);
    for (var i = 0; i < threads; ++i) {
      var buffer = this._dataLookup[i]['buffer'];
      var offset = i * segmentLength;
      data.set(new Uint8ClampedArray(buffer), offset);
      meta[i] = this._dataLookup[i]['meta'];
    }
  }
  this._job = null;
  this._dataLookup = {};
  job.callback(null,
      new ImageData(data, job.inputs[0].width, job.inputs[0].height), meta);
  this._dispatch();
};

module.exports = Processor;

},{}]},{},[1])(1)
});
ol.ext.pixelworks = module.exports;
})();
