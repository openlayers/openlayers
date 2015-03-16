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

goog.provide('goog.ui.DrilldownRowTest');
goog.setTestOnly('goog.ui.DrilldownRowTest');

goog.require('goog.dom');
goog.require('goog.testing.jsunit');
goog.require('goog.ui.DrilldownRow');

function testMakeRows() {
  var ff = goog.dom.getElement('firstRow');
  var d = new goog.ui.DrilldownRow({});
  var d1 = new goog.ui.DrilldownRow(
      {html: '<tr><td>Second row</td><td>Second column</td></tr>'}
      );
  var d2 = new goog.ui.DrilldownRow(
      {html: '<tr><td>Third row</td><td>Second column</td></tr>'}
      );
  var d21 = new goog.ui.DrilldownRow(
      {html: '<tr><td>Fourth row</td><td>Second column</td></tr>'}
      );
  var d22 = new goog.ui.DrilldownRow(goog.ui.DrilldownRow.sampleProperties);
  d.decorate(ff);
  d.addChild(d1, true);
  d.addChild(d2, true);
  d2.addChild(d21, true);
  d2.addChild(d22, true);

  assertThrows(function() {
    d.findIndex();
  });

  assertEquals(0, d1.findIndex());
  assertEquals(1, d2.findIndex());
}
