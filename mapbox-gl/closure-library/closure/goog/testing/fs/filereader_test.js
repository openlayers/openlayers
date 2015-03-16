// Copyright 2011 The Closure Library Authors. All Rights Reserved.
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

goog.provide('goog.testing.fs.FileReaderTest');
goog.setTestOnly('goog.testing.fs.FileReaderTest');

goog.require('goog.Timer');
goog.require('goog.async.Deferred');
goog.require('goog.events');
goog.require('goog.fs.Error');
goog.require('goog.fs.FileReader');
goog.require('goog.fs.FileSaver');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.fs.FileReader');
goog.require('goog.testing.fs.FileSystem');
goog.require('goog.testing.jsunit');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
var file, deferredReader;
var hasArrayBuffer = goog.isDef(goog.global.ArrayBuffer);

function setUp() {
  var fs = new goog.testing.fs.FileSystem();
  var fileEntry = fs.getRoot().createDirectorySync('foo').createFileSync('bar');
  file = fileEntry.fileSync();
  file.setDataInternal('test content');

  deferredReader = new goog.async.Deferred();
  goog.Timer.callOnce(
      goog.bind(deferredReader.callback, deferredReader,
          new goog.testing.fs.FileReader()));
}

function testRead() {
  deferredReader.
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.INIT)).
      addCallback(goog.partial(checkResult, undefined)).
      addCallback(goog.partial(readAsText)).
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.LOADING)).
      addCallback(goog.partial(checkResult, undefined)).
      addCallback(goog.partial(waitForEvent,
                               goog.fs.FileReader.EventType.LOAD_START)).
      addCallback(goog.partial(checkResult, undefined)).
      addCallback(goog.partial(waitForEvent,
                               goog.fs.FileReader.EventType.LOAD)).
      addCallback(goog.partial(checkResult, undefined)).
      addCallback(goog.partial(waitForEvent,
                               goog.fs.FileReader.EventType.LOAD_END)).
      addCallback(goog.partial(checkResult, file.toString())).
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.DONE)).
      addBoth(continueTesting);
  waitForAsync('testRead');
}

function testReadAsArrayBuffer() {
  if (!hasArrayBuffer) {
    // Skip if array buffer is not supported
    return;
  }
  deferredReader.
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.INIT)).
      addCallback(goog.partial(checkResult, undefined)).
      addCallback(goog.partial(readAsArrayBuffer)).
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.LOADING)).
      addCallback(goog.partial(checkResult, undefined)).
      addCallback(goog.partial(waitForEvent,
                               goog.fs.FileReader.EventType.LOAD_START)).
      addCallback(goog.partial(checkResult, undefined)).
      addCallback(goog.partial(waitForEvent,
                               goog.fs.FileReader.EventType.LOAD)).
      addCallback(goog.partial(checkResult, undefined)).
      addCallback(goog.partial(waitForEvent,
                               goog.fs.FileReader.EventType.LOAD_END)).
      addCallback(goog.partial(checkResult, file.toArrayBuffer())).
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.DONE)).
      addBoth(continueTesting);
  waitForAsync('testReadAsArrayBuffer');
}

function testReadAsDataUrl() {
  deferredReader.
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.INIT)).
      addCallback(goog.partial(checkResult, undefined)).
      addCallback(goog.partial(readAsDataUrl)).
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.LOADING)).
      addCallback(goog.partial(checkResult, undefined)).
      addCallback(goog.partial(waitForEvent,
                               goog.fs.FileReader.EventType.LOAD_START)).
      addCallback(goog.partial(checkResult, undefined)).
      addCallback(goog.partial(waitForEvent,
                               goog.fs.FileReader.EventType.LOAD)).
      addCallback(goog.partial(checkResult, undefined)).
      addCallback(goog.partial(waitForEvent,
                               goog.fs.FileReader.EventType.LOAD_END)).
      addCallback(goog.partial(checkResult, file.toDataUrl())).
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.DONE)).
      addBoth(continueTesting);
  waitForAsync('testReadAsDataUrl');
}

function testAbort() {
  deferredReader.
      addCallback(goog.partial(readAsText)).
      addCallback(function(reader) { reader.abort(); }).
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.LOADING)).
      addCallback(goog.partial(waitForError, goog.fs.Error.ErrorCode.ABORT)).
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.LOADING)).
      addCallback(goog.partial(waitForEvent,
                               goog.fs.FileReader.EventType.ABORT)).
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.LOADING)).
      addCallback(goog.partial(waitForEvent,
                               goog.fs.FileReader.EventType.LOAD_END)).
      addCallback(goog.partial(checkReadyState,
                               goog.fs.FileReader.ReadyState.DONE)).
      addCallback(goog.partial(checkResult, undefined)).
      addBoth(continueTesting);
  waitForAsync('testAbort');
}

function testAbortBeforeRead() {
  deferredReader.
      addCallback(function(reader) { reader.abort(); }).
      addErrback(function(err) {
        assertEquals(goog.fs.Error.ErrorCode.INVALID_STATE, err.code);
        return true;
      }).
      addCallback(function(calledErrback) {
        assertTrue(calledErrback);
      }).
      addBoth(continueTesting);
  waitForAsync('testAbortBeforeRead');
}

function testReadDuringRead() {
  deferredReader.
      addCallback(goog.partial(readAsText)).
      addCallback(goog.partial(readAsText)).
      addErrback(function(err) {
        assertEquals(goog.fs.Error.ErrorCode.INVALID_STATE, err.code);
        return true;
      }).
      addCallback(assertTrue).
      addBoth(continueTesting);
  waitForAsync('testReadDuringRead');
}

function continueTesting(result) {
  asyncTestCase.continueTesting();
  if (result instanceof Error) {
    throw result;
  }
}

function waitForAsync(msg) {
  asyncTestCase.waitForAsync(msg);
}

function waitForEvent(type, target) {
  var d = new goog.async.Deferred();
  goog.events.listenOnce(target, type, goog.bind(d.callback, d, target));
  return d;
}

function waitForError(type, target) {
  var d = new goog.async.Deferred();
  goog.events.listenOnce(
      target, goog.fs.FileReader.EventType.ERROR, function(e) {
        assertEquals(type, target.getError().code);
        d.callback(target);
      });
  return d;
}

function readAsText(reader) {
  reader.readAsText(file);
}

function readAsArrayBuffer(reader) {
  reader.readAsArrayBuffer(file);
}

function readAsDataUrl(reader) {
  reader.readAsDataUrl(file);
}

function readAndWait(reader) {
  readAsText(reader);
  return waitForEvent(goog.fs.FileSaver.EventType.LOAD_END, reader);
}

function checkResult(expectedResult, reader) {
  checkEquals(expectedResult, reader.getResult());
}

function checkEquals(a, b) {
  if (hasArrayBuffer &&
      a instanceof ArrayBuffer && b instanceof ArrayBuffer) {
    assertEquals(a.byteLength, b.byteLength);
    var viewA = new Uint8Array(a);
    var viewB = new Uint8Array(b);
    for (var i = 0; i < a.byteLength; i++) {
      assertEquals(viewA[i], viewB[i]);
    }
  } else {
    assertEquals(a, b);
  }
}

function checkReadyState(expectedState, reader) {
  assertEquals(expectedState, reader.getReadyState());
}
