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

goog.provide('goog.testing.fs.integrationTest');
goog.setTestOnly('goog.testing.fs.integrationTest');

goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.events');
goog.require('goog.fs');
goog.require('goog.fs.DirectoryEntry');
goog.require('goog.fs.Error');
goog.require('goog.fs.FileSaver');
goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.fs');
goog.require('goog.testing.jsunit');

var TEST_DIR = 'goog-fs-test-dir';

var deferredFs = goog.testing.fs.getTemporary();
var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();

function setUpPage() {
  goog.testing.fs.install(new goog.testing.PropertyReplacer());
}

function tearDown() {
  loadTestDir().
      addCallback(function(dir) { return dir.removeRecursively(); }).
      addBoth(continueTesting);
  asyncTestCase.waitForAsync('removing filesystem');
}

function testWriteFile() {
  loadFile('test', goog.fs.DirectoryEntry.Behavior.CREATE).
      addCallback(goog.partial(writeToFile, 'test content')).
      addCallback(goog.partial(checkFileContent, 'test content')).
      addBoth(continueTesting);
  asyncTestCase.waitForAsync('testWriteFile');
}

function testRemoveFile() {
  loadFile('test', goog.fs.DirectoryEntry.Behavior.CREATE).
      addCallback(goog.partial(writeToFile, 'test content')).
      addCallback(function(fileEntry) { return fileEntry.remove(); }).
      addCallback(goog.partial(checkFileRemoved, 'test')).
      addBoth(continueTesting);
  asyncTestCase.waitForAsync('testRemoveFile');
}

function testMoveFile() {
  var deferredSubdir = loadDirectory(
      'subdir', goog.fs.DirectoryEntry.Behavior.CREATE);
  var deferredWrittenFile =
      loadFile('test', goog.fs.DirectoryEntry.Behavior.CREATE).
      addCallback(goog.partial(writeToFile, 'test content'));
  goog.async.DeferredList.gatherResults([deferredSubdir, deferredWrittenFile]).
      addCallback(splitArgs(function(dir, fileEntry) {
        return fileEntry.moveTo(dir);
      })).
      addCallback(goog.partial(checkFileContent, 'test content')).
      addCallback(goog.partial(checkFileRemoved, 'test')).
      addBoth(continueTesting);
  asyncTestCase.waitForAsync('testMoveFile');
}

function testCopyFile() {
  var deferredFile = loadFile('test', goog.fs.DirectoryEntry.Behavior.CREATE);
  var deferredSubdir = loadDirectory(
      'subdir', goog.fs.DirectoryEntry.Behavior.CREATE);
  var deferredWrittenFile = deferredFile.branch().
      addCallback(goog.partial(writeToFile, 'test content'));
  goog.async.DeferredList.gatherResults([deferredSubdir, deferredWrittenFile]).
      addCallback(splitArgs(function(dir, fileEntry) {
        return fileEntry.copyTo(dir);
      })).
      addCallback(goog.partial(checkFileContent, 'test content')).
      awaitDeferred(deferredFile).
      addCallback(goog.partial(checkFileContent, 'test content')).
      addBoth(continueTesting);
  asyncTestCase.waitForAsync('testCopyFile');
}

function testAbortWrite() {
  var deferredFile = loadFile('test', goog.fs.DirectoryEntry.Behavior.CREATE);
  deferredFile.branch().
      addCallback(goog.partial(startWrite, 'test content')).
      addCallback(function(writer) { writer.abort(); }).
      addCallback(
          goog.partial(waitForEvent, goog.fs.FileSaver.EventType.ABORT)).
      awaitDeferred(deferredFile).
      addCallback(goog.partial(checkFileContent, '')).
      addBoth(continueTesting);
  asyncTestCase.waitForAsync('testAbortWrite');
}

function testSeek() {
  var deferredFile = loadFile('test', goog.fs.DirectoryEntry.Behavior.CREATE);
  deferredFile.branch().
      addCallback(goog.partial(writeToFile, 'test content')).
      addCallback(function(fileEntry) { return fileEntry.createWriter(); }).
      addCallback(
          goog.partial(checkReadyState, goog.fs.FileSaver.ReadyState.INIT)).
      addCallback(function(writer) {
        writer.seek(5);
        writer.write(goog.fs.getBlob('stuff and things'));
      }).
      addCallback(
          goog.partial(checkReadyState, goog.fs.FileSaver.ReadyState.WRITING)).
      addCallback(
          goog.partial(waitForEvent, goog.fs.FileSaver.EventType.WRITE)).
      awaitDeferred(deferredFile).
      addCallback(goog.partial(checkFileContent, 'test stuff and things')).
      addBoth(continueTesting);
  asyncTestCase.waitForAsync('testSeek');
}

function testTruncate() {
  var deferredFile = loadFile('test', goog.fs.DirectoryEntry.Behavior.CREATE);
  deferredFile.branch().
      addCallback(goog.partial(writeToFile, 'test content')).
      addCallback(function(fileEntry) { return fileEntry.createWriter(); }).
      addCallback(
          goog.partial(checkReadyState, goog.fs.FileSaver.ReadyState.INIT)).
      addCallback(function(writer) { writer.truncate(4); }).
      addCallback(
          goog.partial(checkReadyState, goog.fs.FileSaver.ReadyState.WRITING)).
      addCallback(
          goog.partial(waitForEvent, goog.fs.FileSaver.EventType.WRITE)).
      awaitDeferred(deferredFile).
      addCallback(goog.partial(checkFileContent, 'test')).
      addBoth(continueTesting);
  asyncTestCase.waitForAsync('testTruncate');
}


function continueTesting(result) {
  asyncTestCase.continueTesting();
  if (result instanceof Error) {
    throw result;
  }
}

function loadTestDir() {
  return deferredFs.branch().addCallback(function(fs) {
    return fs.getRoot().getDirectory(
        TEST_DIR, goog.fs.DirectoryEntry.Behavior.CREATE);
  });
}

function loadFile(filename, behavior) {
  return loadTestDir().addCallback(function(dir) {
    return dir.getFile(filename, behavior);
  });
}

function loadDirectory(filename, behavior) {
  return loadTestDir().addCallback(function(dir) {
    return dir.getDirectory(filename, behavior);
  });
}

function startWrite(content, fileEntry) {
  return fileEntry.createWriter().
      addCallback(
          goog.partial(checkReadyState, goog.fs.FileSaver.ReadyState.INIT)).
      addCallback(function(writer) {
        writer.write(goog.fs.getBlob(content));
        return writer;
      }).
      addCallback(
          goog.partial(checkReadyState, goog.fs.FileSaver.ReadyState.WRITING));
}

function waitForEvent(type, target) {
  var d = new goog.async.Deferred();
  goog.events.listenOnce(target, type, d.callback, false, d);
  return d;
}

function writeToFile(content, fileEntry) {
  return startWrite(content, fileEntry).
      addCallback(
          goog.partial(waitForEvent, goog.fs.FileSaver.EventType.WRITE)).
      addCallback(function() { return fileEntry; });
}

function checkFileContent(content, fileEntry) {
  return fileEntry.file().
      addCallback(function(blob) { return goog.fs.blobToString(blob); }).
      addCallback(goog.partial(assertEquals, content));
}

function checkFileRemoved(filename) {
  return loadFile(filename).
      addCallback(goog.partial(fail, 'expected file to be removed')).
      addErrback(function(err) {
        assertEquals(err.code, goog.fs.Error.ErrorCode.NOT_FOUND);
        return true; // Go back to callback path
      });
}

function checkReadyState(expectedState, writer) {
  assertEquals(expectedState, writer.getReadyState());
}

function splitArgs(fn) {
  return function(args) { return fn(args[0], args[1]); };
}
