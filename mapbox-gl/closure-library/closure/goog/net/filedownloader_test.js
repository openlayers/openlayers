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

goog.provide('goog.net.FileDownloaderTest');
goog.setTestOnly('goog.net.FileDownloaderTest');

goog.require('goog.fs.Error');
goog.require('goog.net.ErrorCode');
goog.require('goog.net.FileDownloader');
goog.require('goog.net.XhrIo');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.fs');
goog.require('goog.testing.fs.FileSystem');
goog.require('goog.testing.jsunit');
goog.require('goog.testing.net.XhrIoPool');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
var xhrIoPool, xhr, fs, dir, downloader;

function setUpPage() {
  goog.testing.fs.install(new goog.testing.PropertyReplacer());
}

function setUp() {
  xhrIoPool = new goog.testing.net.XhrIoPool();
  xhr = xhrIoPool.getXhr();
  fs = new goog.testing.fs.FileSystem();
  dir = fs.getRoot();
  downloader = new goog.net.FileDownloader(dir, xhrIoPool);
}

function tearDown() {
  goog.dispose(downloader);
}

function testDownload() {
  downloader.download('/foo/bar').addCallback(function(blob) {
    var fileEntry = dir.getFileSync('`3fa/``2Ffoo`2Fbar/`bar');
    assertEquals('data', blob.toString());
    assertEquals('data', fileEntry.fileSync().toString());
    asyncTestCase.continueTesting();
  }).addErrback(function(err) { throw err; });

  assertEquals('/foo/bar', xhr.getLastUri());
  assertEquals(goog.net.XhrIo.ResponseType.ARRAY_BUFFER, xhr.getResponseType());

  xhr.simulateResponse(200, 'data');
  asyncTestCase.waitForAsync('testDownload');
}

function testGetDownloadedBlob() {
  downloader.download('/foo/bar').
      addCallback(function() {
        return downloader.getDownloadedBlob('/foo/bar');
      }).
      addCallback(function(blob) { assertEquals('data', blob.toString()); }).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase)).
      addErrback(function(err) { throw err; });

  xhr.simulateResponse(200, 'data');
  asyncTestCase.waitForAsync('testGetDownloadedBlob');
}

function testGetLocalUrl() {
  downloader.download('/foo/bar').
      addCallback(function() { return downloader.getLocalUrl('/foo/bar'); }).
      addCallback(function(url) { assertMatches(/\/`bar$/, url); }).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase)).
      addErrback(function(err) { throw err; });

  xhr.simulateResponse(200, 'data');
  asyncTestCase.waitForAsync('testGetLocalUrl');
}

function testLocalUrlWithContentDisposition() {
  downloader.download('/foo/bar').
      addCallback(function() { return downloader.getLocalUrl('/foo/bar'); }).
      addCallback(function(url) { assertMatches(/\/`qux`22bap$/, url); }).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase)).
      addErrback(function(err) { throw err; });

  xhr.simulateResponse(
      200, 'data', {'Content-Disposition': 'attachment; filename="qux\\"bap"'});
  asyncTestCase.waitForAsync('testGetLocalUrl');
}

function testIsDownloaded() {
  downloader.download('/foo/bar').
      addCallback(function() { return downloader.isDownloaded('/foo/bar'); }).
      addCallback(assertTrue).
      addCallback(function() { return downloader.isDownloaded('/foo/baz'); }).
      addCallback(assertFalse).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase)).
      addErrback(function(err) { throw err; });

  xhr.simulateResponse(200, 'data');
  asyncTestCase.waitForAsync('testIsDownloaded');
}

function testRemove() {
  downloader.download('/foo/bar').
      addCallback(function() { return downloader.remove('/foo/bar'); }).
      addCallback(function() { return downloader.isDownloaded('/foo/bar'); }).
      addCallback(assertFalse).
      addCallback(function() {
        return downloader.getDownloadedBlob('/foo/bar');
      }).
      addErrback(function(err) {
        assertEquals(goog.fs.Error.ErrorCode.NOT_FOUND, err.code);
        var download = downloader.download('/foo/bar');
        xhr.simulateResponse(200, 'more data');
        return download;
      }).
      addCallback(function() { return downloader.isDownloaded('/foo/bar'); }).
      addCallback(assertTrue).
      addCallback(function() {
        return downloader.getDownloadedBlob('/foo/bar');
      }).
      addCallback(function(blob) {
        assertEquals('more data', blob.toString());
      }).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase));

  xhr.simulateResponse(200, 'data');
  asyncTestCase.waitForAsync('testRemove');
}

function testSetBlob() {
  downloader.setBlob('/foo/bar', goog.testing.fs.getBlob('data')).
      addCallback(function() { return downloader.isDownloaded('/foo/bar'); }).
      addCallback(assertTrue).
      addCallback(function() {
        return downloader.getDownloadedBlob('/foo/bar');
      }).
      addCallback(function(blob) {
        assertEquals('data', blob.toString());
      }).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase)).
      addErrback(function(err) { throw err; });

  asyncTestCase.waitForAsync('testSetBlob');
}

function testSetBlobWithName() {
  downloader.setBlob('/foo/bar', goog.testing.fs.getBlob('data'), 'qux').
      addCallback(function() { return downloader.getLocalUrl('/foo/bar'); }).
      addCallback(function(url) { assertMatches(/\/`qux$/, url); }).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase)).
      addErrback(function(err) { throw err; });

  asyncTestCase.waitForAsync('testSetBlob');
}

function testDownloadDuringDownload() {
  var download1 = downloader.download('/foo/bar');
  var download2 = downloader.download('/foo/bar');

  download1.
      addCallback(function() { return download2; }).
      addCallback(function() {
        return downloader.getDownloadedBlob('/foo/bar');
      }).
      addCallback(function(blob) { assertEquals('data', blob.toString()); }).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase));

  // There should only need to be one response for both downloads, since the
  // second should return the same deferred as the first.
  xhr.simulateResponse(200, 'data');
  asyncTestCase.waitForAsync('testDownloadeduringDownload');
}

function testGetDownloadedBlobDuringDownload() {
  var download = downloader.download('/foo/bar');
  downloader.waitForDownload('/foo/bar').addCallback(function() {
    return downloader.getDownloadedBlob('/foo/bar');
  }).addCallback(function(blob) {
    assertTrue(download.hasFired());
    assertEquals('data', blob.toString());
    asyncTestCase.continueTesting();
  });

  xhr.simulateResponse(200, 'data');
  asyncTestCase.waitForAsync('testGetDownloadedBlobDuringDownload');
}

function testIsDownloadedDuringDownload() {
  var download = downloader.download('/foo/bar');
  downloader.waitForDownload('/foo/bar').addCallback(function() {
    return downloader.isDownloaded('/foo/bar');
  }).addCallback(function(isDownloaded) {
    assertTrue(download.hasFired());
    assertTrue(isDownloaded);
    asyncTestCase.continueTesting();
  });

  xhr.simulateResponse(200, 'data');
  asyncTestCase.waitForAsync('testIsDownloadedDuringDownload');
}

function testRemoveDuringDownload() {
  var download = downloader.download('/foo/bar');
  downloader.
      waitForDownload('/foo/bar').
      addCallback(function() { return downloader.remove('/foo/bar'); }).
      addCallback(function() { assertTrue(download.hasFired()); }).
      addCallback(function() { return downloader.isDownloaded('/foo/bar'); }).
      addCallback(assertFalse).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase));

  xhr.simulateResponse(200, 'data');
  asyncTestCase.waitForAsync('testRemoveDuringDownload');
}

function testSetBlobDuringDownload() {
  var download = downloader.download('/foo/bar');
  downloader.
      waitForDownload('/foo/bar').
      addCallback(function() {
        return downloader.setBlob(
            '/foo/bar', goog.testing.fs.getBlob('blob data'));
      }).
      addErrback(function(err) {
        assertEquals(
            goog.fs.Error.ErrorCode.INVALID_MODIFICATION, err.fileError.code);
        return download;
      }).
      addCallback(function() {
        return downloader.getDownloadedBlob('/foo/bar');
      }).
      addCallback(function(b) { assertEquals('xhr data', b.toString()); }).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase));

  xhr.simulateResponse(200, 'xhr data');
  asyncTestCase.waitForAsync('testSetBlobDuringDownload');
}

function testDownloadCancelledBeforeXhr() {
  var download = downloader.download('/foo/bar');
  download.cancel();

  download.
      addErrback(function() {
    assertEquals('/foo/bar', xhr.getLastUri());
    assertEquals(goog.net.ErrorCode.ABORT, xhr.getLastErrorCode());
    assertFalse(xhr.isActive());

    return downloader.isDownloaded('/foo/bar');
  }).
      addCallback(assertFalse).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase));

  asyncTestCase.waitForAsync('testDownloadCancelledBeforeXhr');
}

function testDownloadCancelledAfterXhr() {
  var download = downloader.download('/foo/bar');
  xhr.simulateResponse(200, 'data');
  download.cancel();

  download.
      addErrback(function() {
    assertEquals('/foo/bar', xhr.getLastUri());
    assertEquals(goog.net.ErrorCode.NO_ERROR, xhr.getLastErrorCode());
    assertFalse(xhr.isActive());

    return downloader.isDownloaded('/foo/bar');
  }).
      addCallback(assertFalse).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase));

  asyncTestCase.waitForAsync('testDownloadCancelledAfterXhr');
}

function testFailedXhr() {
  downloader.download('/foo/bar').
      addErrback(function(err) {
        assertEquals('/foo/bar', err.url);
        assertEquals(404, err.xhrStatus);
        assertEquals(goog.net.ErrorCode.HTTP_ERROR, err.xhrErrorCode);
        assertUndefined(err.fileError);

        return downloader.isDownloaded('/foo/bar');
      }).
      addCallback(assertFalse).
      addCallback(goog.bind(asyncTestCase.continueTesting, asyncTestCase));

  xhr.simulateResponse(404);
  asyncTestCase.waitForAsync('testFailedXhr');
}

function testFailedDownloadSave() {
  downloader.download('/foo/bar').
      addCallback(function() {
        var download = downloader.download('/foo/bar');
        xhr.simulateResponse(200, 'data');
        return download;
      }).
      addErrback(function(err) {
        assertEquals('/foo/bar', err.url);
        assertUndefined(err.xhrStatus);
        assertUndefined(err.xhrErrorCode);
        assertEquals(
            goog.fs.Error.ErrorCode.INVALID_MODIFICATION, err.fileError.code);

        asyncTestCase.continueTesting();
      });

  xhr.simulateResponse(200, 'data');
  asyncTestCase.waitForAsync('testFailedDownloadSave');
}

function testFailedGetDownloadedBlob() {
  downloader.getDownloadedBlob('/foo/bar').
      addErrback(function(err) {
        assertEquals(goog.fs.Error.ErrorCode.NOT_FOUND, err.code);
        asyncTestCase.continueTesting();
      });

  asyncTestCase.waitForAsync('testFailedGetDownloadedBlob');
}

function testFailedRemove() {
  downloader.remove('/foo/bar').
      addErrback(function(err) {
        assertEquals(goog.fs.Error.ErrorCode.NOT_FOUND, err.code);
        asyncTestCase.continueTesting();
      });

  asyncTestCase.waitForAsync('testFailedRemove');
}

function testIsDownloading() {
  assertFalse(downloader.isDownloading('/foo/bar'));
  downloader.download('/foo/bar').addCallback(function() {
    assertFalse(downloader.isDownloading('/foo/bar'));
    asyncTestCase.continueTesting();
  });

  assertTrue(downloader.isDownloading('/foo/bar'));

  xhr.simulateResponse(200, 'data');
  asyncTestCase.waitForAsync('testIsDownloading');
}

function testIsDownloadingWhenCancelled() {
  assertFalse(downloader.isDownloading('/foo/bar'));
  var deferred = downloader.download('/foo/bar').addErrback(function() {
    assertFalse(downloader.isDownloading('/foo/bar'));
  });

  assertTrue(downloader.isDownloading('/foo/bar'));
  deferred.cancel();
}

function assertMatches(expected, actual) {
  assert(
      'Expected "' + actual + '" to match ' + expected,
      expected.test(actual));
}
