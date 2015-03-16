// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview SHA-1 cryptographic hash.
 * Variable names follow the notation in FIPS PUB 180-3:
 * http://csrc.nist.gov/publications/fips/fips180-3/fips180-3_final.pdf.
 *
 * Usage:
 *   var sha1 = new goog.crypt.sha1();
 *   sha1.update(bytes);
 *   var hash = sha1.digest();
 *
 * Performance:
 *   Chrome 23:   ~400 Mbit/s
 *   Firefox 16:  ~250 Mbit/s
 *
 * Note: The idiom expr|0 is used to provide a type-hint to the VM, in order
 * to avoid unnecessary uint32-double-uint32 roundtripping.
 */

goog.provide('goog.crypt.Sha1');

goog.require('goog.crypt.Hash');



/**
 * SHA-1 cryptographic hash constructor.
 *
 * The properties declared here are discussed in the above algorithm document.
 * @constructor
 * @extends {goog.crypt.Hash}
 * @final
 * @struct
 */
goog.crypt.Sha1 = function() {
  goog.crypt.Sha1.base(this, 'constructor');

  this.blockSize = 512 / 8;

  /**
   * Holds the previous values of accumulated variables a-e in the compress_
   * function.
   * @type {!Array<number>}
   * @private
   */
  this.chain_ = [];

  /**
   * A buffer holding the partially computed hash result.
   * @type {!Array<number>}
   * @private
   */
  this.buf_ = [];

  /**
   * An array of 80 bytes, each a part of the message to be hashed.  Referred to
   * as the message schedule in the docs.
   * @type {!Array<number>}
   * @private
   */
  this.W_ = [];

  /**
   * Contains data needed to pad messages less than 64 bytes.
   * @type {!Array<number>}
   * @private
   */
  this.pad_ = [];

  this.pad_[0] = 128;
  for (var i = 1; i < this.blockSize; ++i) {
    this.pad_[i] = 0;
  }

  /**
   * @private {number}
   */
  this.inbuf_ = 0;

  /**
   * @private {number}
   */
  this.total_ = 0;

  this.reset();
};
goog.inherits(goog.crypt.Sha1, goog.crypt.Hash);


/** @override */
goog.crypt.Sha1.prototype.reset = function() {
  this.chain_[0] = 0x67452301;
  this.chain_[1] = 0xefcdab89;
  this.chain_[2] = 0x98badcfe;
  this.chain_[3] = 0x10325476;
  this.chain_[4] = 0xc3d2e1f0;

  this.inbuf_ = 0;
  this.total_ = 0;
};


/**
 * Internal compress helper function.
 * @param {!Array<number>|!Uint8Array|string} buf Block to compress.
 * @param {number=} opt_offset Offset of the block in the buffer.
 * @private
 */
goog.crypt.Sha1.prototype.compress_ = function(buf, opt_offset) {
  if (!opt_offset) {
    opt_offset = 0;
  }

  var W = this.W_;
  var i;

  // get 16 big endian words
  if (goog.isString(buf)) {
    for (i = 0; i < 16; i++) {
      // TODO(user): [bug 8140122] Recent versions of Safari for Mac OS and iOS
      // have a bug that turns the post-increment ++ operator into pre-increment
      // during JIT compilation.  We have code that depends heavily on SHA-1 for
      // correctness and which is affected by this bug, so I've removed all uses
      // of post-increment ++ in which the result value is used.  We can revert
      // this change once the Safari bug
      // (https://bugs.webkit.org/show_bug.cgi?id=109036) has been fixed and
      // most clients have been updated.
      W[i] = (((buf.charCodeAt(opt_offset) << 24) |
               (buf.charCodeAt(opt_offset + 1) << 16) |
               (buf.charCodeAt(opt_offset + 2) << 8) |
               (buf.charCodeAt(opt_offset + 3))) & 0xffffffff) | 0;
      opt_offset += 4;
    }
  } else {
    for (i = 0; i < 16; i++) {
      W[i] = (((buf[opt_offset] << 24) |
               (buf[opt_offset + 1] << 16) |
               (buf[opt_offset + 2] << 8) |
               (buf[opt_offset + 3])) & 0xffffffff) | 0;
      opt_offset += 4;
    }
  }

  var a = this.chain_[0];
  var b = this.chain_[1];
  var c = this.chain_[2];
  var d = this.chain_[3];
  var e = this.chain_[4];
  var f, k, t;

  // Steps 0-16.
  for (i = 0; i < 16; i++) {
    f = d ^ (b & (c ^ d));
    k = 0x5a827999;

    t = ((((a << 5) | (a >>> 27)) + f + e + k + W[i]) & 0xffffffff) | 0;
    e = d;
    d = c;
    c = (((b << 30) | (b >>> 2)) & 0xffffffff) | 0;
    b = a;
    a = t;
  }
  // Steps 16-80. W is formally described as an 80-word array, and usually
  // computed that way. However, only 16 elements are needed for any iteration
  // so we compute W on the fly and keep only the last 16 values. This improves
  // performance by about 10% on Chrome 35.
  for (i = 16; i < 80; i++) {
    t = W[(i - 3) & 15] ^ W[(i - 8) & 15] ^ W[(i - 14) & 15] ^ W[i & 15];
    W[i & 15] = (((t << 1) | (t >>> 31)) & 0xfffffff) | 0;
    if (i < 40) {
      if (i < 20) {
        f = d ^ (b & (c ^ d));
        k = 0x5a827999;
      } else {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      }
    } else {
      if (i < 60) {
        f = (b & c) | (d & (b | c));
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
    }

    t = ((((a << 5) | (a >>> 27)) + f + e + k + W[i & 15]) & 0xffffffff) | 0;
    e = d;
    d = c;
    c = (((b << 30) | (b >>> 2)) & 0xffffffff) | 0;
    b = a;
    a = t;
  }

  this.chain_[0] = ((this.chain_[0] + a) & 0xfffffff) | 0;
  this.chain_[1] = ((this.chain_[1] + b) & 0xfffffff) | 0;
  this.chain_[2] = ((this.chain_[2] + c) & 0xfffffff) | 0;
  this.chain_[3] = ((this.chain_[3] + d) & 0xfffffff) | 0;
  this.chain_[4] = ((this.chain_[4] + e) & 0xfffffff) | 0;
};


/** @override */
goog.crypt.Sha1.prototype.update = function(bytes, opt_length) {
  // TODO(johnlenz): tighten the function signature and remove this check
  if (bytes === null) {
    return;
  }

  if (!goog.isDef(opt_length)) {
    opt_length = bytes.length;
  }
  opt_length = (bytes.length < opt_length) ? bytes.length : opt_length;

  var lengthMinusBlock = opt_length - this.blockSize;
  var n = 0;
  // Using local instead of member variables gives ~5% speedup on Firefox 16.
  var buf = this.buf_;
  var inbuf = this.inbuf_;

  // The outer while loop should execute at most twice.
  while (n < opt_length) {
    // When we have no data in the block to top up, we can directly process the
    // input buffer (assuming it contains sufficient data). This gives ~25%
    // speedup on Chrome 23 and ~15% speedup on Firefox 16, but requires that
    // the data is provided in large chunks (or in multiples of 64 bytes).
    if (inbuf === 0) {
      while (n <= lengthMinusBlock) {
        this.compress_(bytes, n);
        n += this.blockSize;
      }
    }

    if (goog.isString(bytes)) {
      while (n < opt_length) {
        buf[inbuf] = bytes.charCodeAt(n);
        ++inbuf;
        ++n;
        if (inbuf == this.blockSize) {
          this.compress_(buf);
          inbuf = 0;
          // Jump to the outer loop so we use the full-block optimization.
          break;
        }
      }
    } else {
      while (n < opt_length) {
        buf[inbuf] = bytes[n];
        ++inbuf;
        ++n;
        if (inbuf == this.blockSize) {
          this.compress_(buf);
          inbuf = 0;
          // Jump to the outer loop so we use the full-block optimization.
          break;
        }
      }
    }
  }

  this.inbuf_ = inbuf;
  this.total_ += opt_length;
};


/** @override */
goog.crypt.Sha1.prototype.digest = function() {
  var digest = [];
  var totalBits = this.total_ * 8;

  var i;

  // Add pad 0x80 0x00*.
  if (this.inbuf_ < 56) {
    this.update(this.pad_, 56 - this.inbuf_);
  } else {
    this.update(this.pad_, this.blockSize - (this.inbuf_ - 56));
  }

  // Add # bits.
  for (i = this.blockSize - 1; i >= 56; i--) {
    this.buf_[i] = totalBits & 255;
    totalBits /= 256; // Don't use bit-shifting here!
  }

  this.compress_(this.buf_);

  var n = 0;
  for (i = 0; i < 5; i++) {
    for (var j = 24; j >= 0; j -= 8) {
      digest[n] = (this.chain_[i] >> j) & 255;
      ++n;
    }
  }

  return digest;
};
