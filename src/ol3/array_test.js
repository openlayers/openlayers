goog.require('goog.testing.jsunit');
goog.require('ol3.array');


function testBinaryFindNearest() {
  var arr = [1000, 500, 100];

  assertEquals(0, ol3.array.binaryFindNearest(arr, 10000));
  assertEquals(0, ol3.array.binaryFindNearest(arr, 1000));
  assertEquals(0, ol3.array.binaryFindNearest(arr, 900));

  assertEquals(1, ol3.array.binaryFindNearest(arr, 750));

  assertEquals(1, ol3.array.binaryFindNearest(arr, 550));
  assertEquals(1, ol3.array.binaryFindNearest(arr, 500));
  assertEquals(1, ol3.array.binaryFindNearest(arr, 450));

  assertEquals(2, ol3.array.binaryFindNearest(arr, 300));

  assertEquals(2, ol3.array.binaryFindNearest(arr, 200));
  assertEquals(2, ol3.array.binaryFindNearest(arr, 100));
  assertEquals(2, ol3.array.binaryFindNearest(arr, 50));

}


function testLinearFindNearest() {
  var arr = [1000, 500, 100];

  assertEquals(0, ol3.array.linearFindNearest(arr, 10000));
  assertEquals(0, ol3.array.linearFindNearest(arr, 1000));
  assertEquals(0, ol3.array.linearFindNearest(arr, 900));

  assertEquals(1, ol3.array.linearFindNearest(arr, 750));

  assertEquals(1, ol3.array.linearFindNearest(arr, 550));
  assertEquals(1, ol3.array.linearFindNearest(arr, 500));
  assertEquals(1, ol3.array.linearFindNearest(arr, 450));

  assertEquals(2, ol3.array.linearFindNearest(arr, 300));

  assertEquals(2, ol3.array.linearFindNearest(arr, 200));
  assertEquals(2, ol3.array.linearFindNearest(arr, 100));
  assertEquals(2, ol3.array.linearFindNearest(arr, 50));

}
