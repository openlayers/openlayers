// FIXME remove afterLoadXml as it uses the wrong XML parser on IE9

// helper functions for async testing
(function(global) {

  function afterLoad(type, path, next) {
    var client = new XMLHttpRequest();
    client.open('GET', path, true);
    client.onload = function() {
      var data;
      if (type === 'xml') {
        data = client.responseXML;
      } else {
        data = client.responseText;
      }
      if (!data) {
        throw new Error(path + ' loading failed: ' + client.status);
      }
      next(data);
    };
    client.send();
  }

  /**
   * @param {string} path Relative path to file (e.g. 'spec/ol/foo.json').
   * @param {function(Object)} next Function to call with response object on
   *     success.  On failure, an error is thrown with the reason.
   */
  global.afterLoadJson = function(path, next) {
    afterLoad('json', path, next);
  };


  /**
   * @param {string} path Relative path to file (e.g. 'spec/ol/foo.txt').
   * @param {function(string)} next Function to call with response text on
   *     success.  On failure, an error is thrown with the reason.
   */
  global.afterLoadText = function(path, next) {
    afterLoad('text', path, next);
  };


  /**
   * @param {string} path Relative path to file (e.g. 'spec/ol/foo.xml').
   * @param {function(Document)} next Function to call with response xml on
   *     success.  On failure, an error is thrown with the reason.
   */
  global.afterLoadXml = function(path, next) {
    afterLoad('xml', path, next);
  };


  // extensions to expect.js
  var expect = global.expect;


  /**
   * Assert value is within some tolerance of a number.
   * @param {Number} n Number.
   * @param {Number} tol Tolerance.
   */
  expect.Assertion.prototype.roughlyEqual = function(n, tol) {
    this.assert(
        Math.abs(this.obj - n) <= tol,
        function() {
          return 'expected ' + expect.stringify(this.obj) + ' to be within ' +
              tol + ' of ' + n;
        },
        function() {
          return 'expected ' + expect.stringify(this.obj) +
              ' not to be within ' + tol + ' of ' + n;
        });
    return this;
  };


  /**
   * Assert that a sinon spy was called.
   */
  expect.Assertion.prototype.called = function() {
    this.assert(
        this.obj.called,
        function() {
          return 'expected ' + expect.stringify(this.obj) + ' to be called';
        },
        function() {
          return 'expected ' + expect.stringify(this.obj) + ' not to be called';
        });
    return this;
  };


  function getChildNodes(node, options) {
    // check whitespace
    if (options && options.includeWhiteSpace) {
        return node.childNodes;
    } else {
      var nodes = [];
      for (var i = 0, ii=node.childNodes.length; i < ii; i++ ) {
        var child = node.childNodes[i];
        if (child.nodeType == 1) {
          // element node, add it
          nodes.push(child);
        } else if (child.nodeType == 3) {
          // text node, add if non empty
          if (child.nodeValue &&
              child.nodeValue.replace(/^\s*(.*?)\s*$/, '$1') !== '') {
            nodes.push(child);
          }
        }
      }
      return nodes;
    }
  }

  function assertElementNodesEqual(node1, node2, options, errors) {
    var testPrefix = (options && options.prefix === true);
    try {
      expect(node1.nodeType).to.equal(node2.nodeType);
    } catch(e) {
      errors.push('nodeType test failed for: ' + node1.nodeName + ' | ' +
          node2.nodeName + ' | ' + e.message);
    }
    if (testPrefix) {
      try {
        expect(node1.nodeName).to.equal(node2.nodeName);
      } catch(e) {
        errors.push('nodeName test failed for: ' + node1.nodeName + ' | ' +
            node2.nodeName + ' | ' + e.message);
      }
    } else {
      try {
        expect(node1.nodeName.split(':').pop()).to.equal(
            node2.nodeName.split(':').pop());
      } catch(e) {
        errors.push('nodeName test failed for: ' + node1.nodeName + ' | ' +
            node2.nodeName + ' | ' + e.message);
      }
    }
    // for text nodes compare value
    if (node1.nodeType === 3) {
      try {
        // TODO should we make this optional?
        expect(node1.nodeValue.replace(/\s/g, '')).to.equal(
            node2.nodeValue.replace(/\s/g, ''));
      } catch(e) {
        errors.push('nodeValue test failed | ' + e.message);
      }
    }
    // for element type nodes compare namespace, attributes, and children
    else if (node1.nodeType === 1) {
      // test namespace alias and uri
      if (node1.prefix || node2.prefix) {
        if (testPrefix) {
          try {
            expect(node1.prefix).to.equal(node2.prefix);
          } catch(e) {
            errors.push('Prefix test failed for: ' + node1.nodeName + ' | ' +
                e.message);
          }
        }
      }
      if (node1.namespaceURI || node2.namespaceURI) {
        try {
          expect(node1.namespaceURI).to.equal(node2.namespaceURI);
        } catch(e) {
          errors.push('namespaceURI test failed for: ' + node1.nodeName +
              ' | ' + e.message);
        }
      }
      // compare attributes - disregard xmlns given namespace handling above
      var node1AttrLen = 0;
      var node1Attr = {};
      var node2AttrLen = 0;
      var node2Attr = {};
      var ga, ea, gn, en;
      var i, ii;
      if (node1.attributes) {
        for (i=0, ii=node1.attributes.length; i<ii; ++i) {
          ga = node1.attributes[i];
          if (ga.specified === undefined || ga.specified === true) {
            if (ga.name.split(':').shift() != 'xmlns') {
              gn = testPrefix ? ga.name : ga.name.split(':').pop();
              node1Attr[gn] = ga;
              ++node1AttrLen;
            }
          }
        }
      }
      if (node2.attributes) {
        for (i=0, ii=node2.attributes.length; i<ii; ++i) {
          ea = node2.attributes[i];
          if (ea.specified === undefined || ea.specified === true) {
            if (ea.name.split(':').shift() != 'xmlns') {
              en = testPrefix ? ea.name : ea.name.split(':').pop();
              node2Attr[en] = ea;
              ++node2AttrLen;
            }
          }
        }
      }
      try {
        expect(node1AttrLen).to.equal(node2AttrLen);
      } catch(e) {
        errors.push('Number of attributes test failed for: ' + node1.nodeName +
            ' | ' + e.message);
      }
      var gv, ev;
      for (var name in node1Attr) {
        if (node2Attr[name] === undefined) {
          errors.push('Attribute name ' + node1Attr[name].name +
              ' expected for element ' + node1.nodeName);
        }
        // test attribute namespace
        try {
          // we do not care about the difference between an empty string and
          // null for namespaceURI some tests will fail in IE9 otherwise
          // see also 
          // http://msdn.microsoft.com/en-us/library/ff460650(v=vs.85).aspx
          expect(node1Attr[name].namespaceURI || null).to.be(
              node2Attr[name].namespaceURI || null);
        } catch(e) {
          errors.push('namespaceURI attribute test failed for: ' +
              node1.nodeName + ' | ' + e.message);
        }
        try {
          expect(node1Attr[name].value).to.equal(node2Attr[name].value);
        } catch(e) {
          errors.push('Attribute value test failed for: ' + node1.nodeName +
              ' | ' + e.message);
        }
      }
      // compare children
      var node1ChildNodes = getChildNodes(node1, options);
      var node2ChildNodes = getChildNodes(node2, options);
      try {
        expect(node1ChildNodes.length).to.equal(node2ChildNodes.length);
      } catch(e) {
        errors.push('Number of childNodes test failed for: ' + node1.nodeName +
            ' | ' + e.message);
      }
      // only compare if they are equal
      if (node1ChildNodes.length === node2ChildNodes.length) {
        for (var j=0, jj=node1ChildNodes.length; j<jj; ++j) {
          assertElementNodesEqual(
              node1ChildNodes[j], node2ChildNodes[j], options, errors);
        }
      }
    }
  }


  /**
   * Checks if the XML document sort of equals another XML document.
   */
  expect.Assertion.prototype.xmleql = function(obj, options) {
    if (obj && obj.nodeType == 9) {
      obj = obj.documentElement;
    }
    if (this.obj && this.obj.nodeType == 9) {
      this.obj = this.obj.documentElement;
    }
    var errors = [];
    assertElementNodesEqual(obj, this.obj, options, errors);
    var result = (errors.length === 0);
    this.assert(
        !!result,
        function() {
          return 'expected ' + expect.stringify(this.obj) +
              ' to sort of equal ' + expect.stringify(obj) + '\n' +
              errors.join('\n');
        },
        function() {
          return 'expected ' + expect.stringify(this.obj) +
              ' to sort of not equal ' + expect.stringify(obj) + '\n' +
              errors.join('\n');
        });
    return this;
  };


  /**
   * Checks if the array sort of equals another array.
   */
  expect.Assertion.prototype.arreql = function (obj) {
    this.assert(
        goog.array.equals(this.obj, obj),
        function() {
          return 'expected ' + expect.stringify(this.obj) +
              ' to sort of equal ' + expect.stringify(obj);
        },
        function() {
          return 'expected ' + expect.stringify(this.obj) +
              ' to sort of not equal ' + expect.stringify(obj);
        });
    return this;
  };


  /**
   * Checks if the array sort of equals another array (allows NaNs to be equal).
   */
  expect.Assertion.prototype.arreqlNaN = function (obj) {
    function compare(a, b) {
      return a === b || (typeof a === 'number' && typeof b === 'number' &&
          isNaN(a) && isNaN(b));
    }
    this.assert(
        goog.array.equals(this.obj, obj, compare),
        function() {
          return 'expected ' + expect.stringify(this.obj) +
              ' to sort of equal ' + expect.stringify(obj);
        },
        function() {
          return 'expected ' + expect.stringify(this.obj) +
              ' to sort of not equal ' + expect.stringify(obj);
        });
    return this;
  };


})(this);
