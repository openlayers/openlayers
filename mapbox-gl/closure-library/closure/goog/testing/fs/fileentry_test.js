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

goog.provide('goog.testing.fs.FileEntryTest');
goog.setTestOnly('goog.testing.fs.FileEntryTest');

goog.require('goog.testing.AsyncTestCase');
goog.require('goog.testing.MockClock');
goog.require('goog.testing.fs.FileEntry');
goog.require('goog.testing.fs.FileSystem');
goog.require('goog.testing.jsunit');

var asyncTestCase = goog.testing.AsyncTestCase.createAndInstall();
var fs, file, fileEntry, mockClock, currentTime;

function setUp() {
  mockClock = new goog.testing.MockClock(true);

  fs = new goog.testing.fs.FileSystem();
  fileEntry = fs.getRoot().createDirectorySync('foo').createFileSync('bar');
}

function tearDown() {
  mockClock.uninstall();
}

function testIsFile() {
  assertTrue(fileEntry.isFile());
}

function testIsDirectory() {
  assertFalse(fileEntry.isDirectory());
}

function testFile() {
  var testFile = new goog.testing.fs.FileEntry(fs, fs.getRoot(),
                                               'test', 'hello world');
  testFile.file().addCallback(function(f) {
    assertEquals('test', f.name);
    assertEquals('hello world', f.toString());

    asyncTestCase.continueTesting();
  });
  waitForAsync('testFile');
}

function testGetLastModified() {
  // Advance the clock to a known time.
  mockClock.tick(53);
  var testFile = new goog.testing.fs.FileEntry(fs, fs.getRoot(),
                                               'timeTest', 'hello world');
  mockClock.tick();
  testFile.getLastModified().addCallback(function(date) {
    assertEquals(53, date.getTime());
    asyncTestCase.continueTesting();
  });
  waitForAsync('testGetLastModified');
}

function testGetMetadata() {
  // Advance the clock to a known time.
  mockClock.tick(54);
  var testFile = new goog.testing.fs.FileEntry(fs, fs.getRoot(),
                                               'timeTest', 'hello world');
  mockClock.tick();
  testFile.getMetadata().addCallback(function(metadata) {
    assertEquals(54, metadata.modificationTime.getTime());
    asyncTestCase.continueTesting();
  });
  waitForAsync('testGetMetadata');
}


function waitForAsync(msg) {
  asyncTestCase.waitForAsync(msg);
  mockClock.tick();
}
