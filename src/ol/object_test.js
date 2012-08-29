goog.require('goog.testing.jsunit');
goog.require('ol');
goog.require('ol3.Object');


function testObject1() {
  var obj = {k: 1};
  obj = ol.object(obj);
  assertTrue(obj instanceof ol3.Object);
  assertEquals(1, obj.get('k'));
}


function testObject2() {
  var obj1 = new ol3.Object();
  var obj2 = ol.object(obj1);
  assertTrue(obj2 === obj1);
}

