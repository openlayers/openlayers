// avoid importing anything that results in an instanceof check
// since these extensions are global, instanceof checks fail with modules

(function(global) {

  // show generated maps for rendering tests
  const showMap = (global.location.search.indexOf('generate') >= 0);

  // show a diff when rendering tests fail
  const showDiff = (global.location.search.indexOf('showdiff') >= 0);

  /**
   * The default tolerance for image comparisons.
   */
  global.IMAGE_TOLERANCE = 1.5;

  function afterLoad(type, path, next) {
    const client = new XMLHttpRequest();
    client.open('GET', path, true);
    client.onload = function() {
      let data;
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
  const expect = global.expect;


  /**
   * Assert value is within some tolerance of a number.
   * @param {Number} n Number.
   * @param {Number} tol Tolerance.
   * @return {expect.Assertion} The assertion.
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


  function getChildNodes(node, options) {
    // check whitespace
    if (options && options.includeWhiteSpace) {
      return node.childNodes;
    } else {
      const nodes = [];
      for (let i = 0, ii = node.childNodes.length; i < ii; i++) {
        const child = node.childNodes[i];
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
      if (options && options.ignoreElementOrder) {
        nodes.sort(function(a, b) {
          return a.nodeName > b.nodeName ? 1 : a.nodeName < b.nodeName ? -1 : 0;
        });
      }
      return nodes;
    }
  }

  function assertElementNodesEqual(node1, node2, options, errors) {
    const testPrefix = (options && options.prefix === true);
    if (node1.nodeType !== node2.nodeType) {
      errors.push('nodeType test failed for: ' + node1.nodeName + ' | ' +
        node2.nodeName + ' | expected ' + node1.nodeType + ' to equal ' +
        node2.nodeType);
    }
    if (testPrefix) {
      if (node1.nodeName !== node2.nodeName) {
        errors.push('nodeName test failed for: ' + node1.nodeName + ' | ' +
            node2.nodeName + ' | expected ' + node1.nodeName + ' to equal ' +
            node2.nodeName);
      }
    } else {
      const n1 = node1.nodeName.split(':').pop();
      const n2 = node2.nodeName.split(':').pop();
      if (n1 !== n2) {
        errors.push('nodeName test failed for: ' + node1.nodeName + ' | ' +
            node2.nodeName + ' | expected ' + n1 + ' to equal ' + n2);
      }
    }
    // for text nodes compare value
    if (node1.nodeType === 3) {
      const nv1 = node1.nodeValue.replace(/\s/g, '');
      const nv2 = node2.nodeValue.replace(/\s/g, '');
      if (nv1 !== nv2) {
        errors.push('nodeValue test failed | expected ' + nv1 + ' to equal ' +
            nv2);
      }
    } else if (node1.nodeType === 1) {
      // for element type nodes compare namespace, attributes, and children
      // test namespace alias and uri
      if (node1.prefix || node2.prefix) {
        if (testPrefix) {
          if (node1.prefix !== node2.prefix) {
            errors.push('Prefix test failed for: ' + node1.nodeName +
                ' | expected ' + node1.prefix + ' to equal ' + node2.prefix);
          }
        }
      }
      if (node1.namespaceURI || node2.namespaceURI) {
        if (node1.namespaceURI !== node2.namespaceURI) {
          errors.push('namespaceURI test failed for: ' + node1.nodeName +
              ' | expected ' + node1.namespaceURI + ' to equal ' +
              node2.namespaceURI);
        }
      }
      // compare attributes - disregard xmlns given namespace handling above
      let node1AttrLen = 0;
      const node1Attr = {};
      let node2AttrLen = 0;
      const node2Attr = {};
      let ga, ea, gn, en;
      let i, ii;
      if (node1.attributes) {
        for (i = 0, ii = node1.attributes.length; i < ii; ++i) {
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
        for (i = 0, ii = node2.attributes.length; i < ii; ++i) {
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
      if (node1AttrLen !== node2AttrLen) {
        errors.push('Number of attributes test failed for: ' + node1.nodeName +
            ' | expected ' + node1AttrLen + ' to equal ' + node2AttrLen);
      }
      for (const name in node1Attr) {
        if (node2Attr[name] === undefined) {
          errors.push('Attribute name ' + node1Attr[name].name +
              ' expected for element ' + node1.nodeName);
          break;
        }
        // test attribute namespace
        // we do not care about the difference between an empty string and
        // null for namespaceURI some tests will fail in IE9 otherwise
        // see also
        // http://msdn.microsoft.com/en-us/library/ff460650(v=vs.85).aspx
        if ((node1Attr[name].namespaceURI || null) !==
            (node2Attr[name].namespaceURI || null)) {
          errors.push('namespaceURI attribute test failed for: ' +
            node1.nodeName + ' | expected ' + node1Attr[name].namespaceURI +
            ' to equal ' + node2Attr[name].namespaceURI);
        }
        if (node1Attr[name].value !== node2Attr[name].value) {
          errors.push('Attribute value test failed for: ' + node1.nodeName +
              ' | expected ' + node1Attr[name].value + ' to equal ' +
              node2Attr[name].value);
        }
      }
      // compare children
      const node1ChildNodes = getChildNodes(node1, options);
      const node2ChildNodes = getChildNodes(node2, options);
      if (node1ChildNodes.length !== node2ChildNodes.length) {
        // check if all child nodes are text, they could be split up in
        // 4096 chunks
        // if so, ignore the childnode count error
        let allText = true;
        let c, cc;
        for (c = 0, cc = node1ChildNodes.length; c < cc; ++c) {
          if (node1ChildNodes[c].nodeType !== 3) {
            allText = false;
            break;
          }
        }
        for (c = 0, cc = node2ChildNodes.length; c < cc; ++c) {
          if (node2ChildNodes[c].nodeType !== 3) {
            allText = false;
            break;
          }
        }
        if (!allText) {
          errors.push('Number of childNodes test failed for: ' +
            node1.nodeName + ' | expected ' + node1ChildNodes.length +
            ' to equal ' + node2ChildNodes.length);
        }
      }
      // only compare if they are equal
      if (node1ChildNodes.length === node2ChildNodes.length) {
        for (let j = 0, jj = node1ChildNodes.length; j < jj; ++j) {
          assertElementNodesEqual(
            node1ChildNodes[j], node2ChildNodes[j], options, errors);
        }
      }
    }
  }


  /**
   * Checks if the XML document sort of equals another XML document.
   * @param {Object} obj The other object.
   * @param {{includeWhiteSpace: (boolean|undefined),
   *     ignoreElementOrder: (boolean|undefined)}=} options The options.
   * @return {expect.Assertion} The assertion.
   */
  expect.Assertion.prototype.xmleql = function(obj, options) {
    if (obj && obj.nodeType == 9) {
      obj = obj.documentElement;
    }
    if (this.obj && this.obj.nodeType == 9) {
      this.obj = this.obj.documentElement;
    }
    const errors = [];
    assertElementNodesEqual(obj, this.obj, options, errors);
    const result = (errors.length === 0);
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


  global.createMapDiv = function(width, height) {
    const target = document.createElement('div');
    const style = target.style;
    style.position = 'absolute';
    style.left = '-1000px';
    style.top = '-1000px';
    style.width = width + 'px';
    style.height = height + 'px';
    document.body.appendChild(target);

    return target;
  };

  global.disposeMap = function(map) {
    const target = map.getTarget();
    map.setTarget(null);
    if (target && target.parentNode) {
      target.parentNode.removeChild(target);
    }
    map.dispose();
  };

  function resembleCanvas(canvas, referenceImage, tolerance, done) {
    if (showMap) {
      const wrapper = document.createElement('div');
      wrapper.style.width = canvas.width + 'px';
      wrapper.style.height = canvas.height + 'px';
      wrapper.appendChild(canvas);
      document.body.appendChild(wrapper);
      document.body.appendChild(document.createTextNode(referenceImage));
    }
    const width = canvas.width;
    const height = canvas.height;
    const image = new Image();
    image.addEventListener('load', function() {
      expect(image.width).to.be(width);
      expect(image.height).to.be(height);
      const referenceCanvas = document.createElement('canvas');
      referenceCanvas.width = image.width;
      referenceCanvas.height = image.height;
      const referenceContext = referenceCanvas.getContext('2d');
      referenceContext.drawImage(image, 0, 0, image.width, image.height);
      const context = canvas.getContext('2d');
      const output = context.createImageData(canvas.width, canvas.height);
      const mismatchPx = pixelmatch(
        context.getImageData(0, 0, width, height).data,
        referenceContext.getImageData(0, 0, width, height).data,
        output.data, width, height);
      const mismatchPct = mismatchPx / (width * height) * 100;
      if (showDiff && mismatchPct > tolerance) {
        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = width;
        diffCanvas.height = height;
        diffCanvas.getContext('2d').putImageData(output, 0, 0);
        document.body.appendChild(diffCanvas);
      }
      expect(mismatchPct).to.be.below(tolerance);
      done();
    });
    image.addEventListener('error', function() {
      expect().fail('Reference image could not be loaded');
      done();
    });
    image.src = referenceImage;
  }
  global.resembleCanvas = resembleCanvas;

  /**
   * Assert that the given map resembles a reference image.
   *
   * @param {ol.PluggableMap} map A map using the canvas renderer.
   * @param {string} referenceImage Path to the reference image.
   * @param {number} tolerance The accepted mismatch tolerance.
   * @param {function} done A callback to indicate that the test is done.
   */
  global.expectResemble = function(map, referenceImage, tolerance, done) {
    map.render();
    map.on('postcompose', function(event) {
      if (event.frameState.animate) {
        // make sure the tile-queue is empty
        return;
      }

      const canvas = event.context.canvas;
      expect(canvas).to.be.a(HTMLCanvasElement);

      resembleCanvas(canvas, referenceImage, tolerance, done);
    });
  };

  const features = {
    ArrayBuffer: 'ArrayBuffer' in global,
    'ArrayBuffer.isView': 'ArrayBuffer' in global && !!ArrayBuffer.isView,
    FileReader: 'FileReader' in global,
    Uint8ClampedArray: ('Uint8ClampedArray' in global),
    WebGL: false
  };

  /**
   * Allow tests to be skipped where certain features are not available.  The
   * provided key must be in the above `features` lookup.  Keys should
   * correspond to the feature that is required, but can be any string.
   * @param {string} key The required feature name.
   * @return {Object} An object with a `describe` function that will run tests
   *     if the required feature is available and skip them otherwise.
   */
  global.where = function(key) {
    if (!(key in features)) {
      throw new Error('where() called with unknown key: ' + key);
    }
    return {
      describe: features[key] ? global.describe : global.xdescribe,
      it: features[key] ? global.it : global.xit
    };
  };

  // throw if anybody appends a div to the body and doesn't remove it
  afterEach(function() {
    const garbage = document.body.getElementsByTagName('div');
    if (garbage.length) {
      throw new Error('Found extra <div> elements in the body');
    }
  });

})(window);
