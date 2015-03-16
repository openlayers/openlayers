/* Warning: These tests take about 8 minutes to run. */

goog.provide('goog.crypt.ShaMcTest');
goog.setTestOnly('goog.crypt.ShaMcTest');

goog.require('goog.crypt');
goog.require('goog.crypt.Sha1');
goog.require('goog.crypt.Sha224');
goog.require('goog.crypt.Sha256');
goog.require('goog.crypt.Sha384');
goog.require('goog.crypt.Sha512');

goog.require('goog.testing.jsunit');
goog.require('goog.userAgent');

function testSha1() {
  var sha = new goog.crypt.Sha1();
  var initial_state = 'Sha1';
  var count = 1638;
  var state = goog.crypt.stringToByteArray(initial_state);
  var digest;
  for (var i = 0; i < count; i++) {
    sha.reset();
    sha.update(state);
    digest = sha.digest();
    state = goog.array.concat(digest, state);
  }
  assertEquals(32764, state.length);
  assertEquals('9da05831d6441141b62545eb4bf3bcc92b8c8276',
      goog.crypt.byteArrayToHex(digest));
  sha.reset();
  for (var i = 0; i < (32764 + 10); i++) {
    sha.update(state, i);
  }
  assertEquals('70a4f1a7b523d9989a1cfd0f512a906abbfefe5f',
      goog.crypt.byteArrayToHex(sha.digest()));
}

function testSha224() {
  var sha = new goog.crypt.Sha224();
  var initial_state = 'Sha224';
  var count = 1170;
  var state = goog.crypt.stringToByteArray(initial_state);
  var digest;
  for (var i = 0; i < count; i++) {
    sha.reset();
    sha.update(state);
    digest = sha.digest();
    state = goog.array.concat(digest, state);
  }
  assertEquals(32766, state.length);
  assertEquals('c7636f5369a057fde53f3a70cb2880795a35af53db38ed8a04cbcbfe',
      goog.crypt.byteArrayToHex(digest));
  sha.reset();
  for (var i = 0; i < (32766 + 10); i++) {
    sha.update(state, i);
  }
  assertEquals('69f7e71bbf9a7bd15832fa77e09cbe458dcea284ddb00a69eb3ed78a',
      goog.crypt.byteArrayToHex(sha.digest()));
}

function testSha256() {
  var sha = new goog.crypt.Sha256();
  var initial_state = 'Sha256';
  var count = 1024;
  var state = goog.crypt.stringToByteArray(initial_state);
  var digest;
  for (var i = 0; i < count; i++) {
    sha.reset();
    sha.update(state);
    digest = sha.digest();
    state = goog.array.concat(digest, state);
  }
  assertEquals(32774, state.length);
  assertEquals('bdc98db7476b58c33161211099b02c27da6bed3959a8b1d4e600f4d628ba0200',
      goog.crypt.byteArrayToHex(digest));
  sha.reset();
  for (var i = 0; i < (32774 + 10); i++) {
    sha.update(state, i);
  }
  assertEquals('26cc26f6429ce20c1b537d67cc288231a18de2a258d8bf529751439cd7c71d37',
      goog.crypt.byteArrayToHex(sha.digest()));
}

function testSha384() {
  var sha = new goog.crypt.Sha384();
  var initial_state = 'Sha384';
  var count = 682;
  var state = goog.crypt.stringToByteArray(initial_state);
  var digest;
  for (var i = 0; i < count; i++) {
    sha.reset();
    sha.update(state);
    digest = sha.digest();
    state = goog.array.concat(digest, state);
  }
  assertEquals(32742, state.length);
  assertEquals('1e7017a365fd31f6c439efb3eabef783a1e09ebcbb357bc4c9aac5fa9d731a167ee8105cd1c76159a1c27c56c5d1bc8c',
      goog.crypt.byteArrayToHex(digest));
  sha.reset();
  for (var i = 0; i < (32742 + 10); i++) {
    sha.update(state, i);
  }
  assertEquals('0cd4695e15f9089e767b2866e1728588d5cece4ad13e4943aa5bd5f9debbe133e2fac302851a2e90e13c318ace25fbb8',
      goog.crypt.byteArrayToHex(sha.digest()));
}

function testSha512() {
  var sha = new goog.crypt.Sha512();
  var initial_state = 'Sha512';
  var count = 512;
  var state = goog.crypt.stringToByteArray(initial_state);
  var digest;
  for (var i = 0; i < count; i++) {
    sha.reset();
    sha.update(state);
    digest = sha.digest();
    state = goog.array.concat(digest, state);
  }
  assertEquals(32774, state.length);
  assertEquals('5c9c25961a9171e2a79b9be65e05ce238752e7bfbaf3696c6ed63b8ee2735315d2cb58bf70a5f08dd70ecab029bd0725dcdd84dacd063ea9148cb3e5d7fa948a',
      goog.crypt.byteArrayToHex(digest));
  sha.reset();
  for (var i = 0; i < (32774 + 10); i++) {
    sha.update(state, i);
  }
  assertEquals('10a310e050cf9b2e9d4fc3c0a8f8e183c158ff28c23a42fd5b7777f449cfbe92655eee2bb42fb47c6900e001153b74a5db777b9b2d1543dc30fe98face94f106',
      goog.crypt.byteArrayToHex(sha.digest()));
}

