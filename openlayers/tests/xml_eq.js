/**
 * File: xml_eq.js
 * Adds a xml_eq method to AnotherWay test objects.
 *
 */

(function() {

    /**
     * Function: createNode
     * Given a string, try to create an XML DOM node.  Throws string messages
     *     on failure.
     * 
     * Parameters:
     * text - {String} An XML string.
     *
     * Returns:
     * {DOMElement} An element node.
     */
    function createNode(text) {
        
        var index = text.indexOf('<');
        if(index > 0) {
            text = text.substring(index);
        }
        
        var doc;
        if(window.ActiveXObject && !this.xmldom) {
            doc = new ActiveXObject("Microsoft.XMLDOM");
            try {
                doc.loadXML(text);
            } catch(err) {
                throw "ActiveXObject loadXML failed: " + err;
            }
        } else if(window.DOMParser) {
            try {
                doc = new DOMParser().parseFromString(text, 'text/xml');
            } catch(err) {
                throw "DOMParser.parseFromString failed";
            }
            if(doc.documentElement && doc.documentElement.nodeName == "parsererror") {
                throw "DOMParser.parseFromString returned parsererror";
            }
        } else {
            var req = new XMLHttpRequest();
            req.open("GET", "data:text/xml;charset=utf-8," +
                     encodeURIComponent(text), false);
            if(req.overrideMimeType) {
                req.overrideMimeType("text/xml");
            }
            req.send(null);
            doc = req.responseXML;
        }
        
        var root = doc.documentElement;
        if(!root) {
            throw "no documentElement";
        }
        return root;
    }
    
    /**
     * Function assertEqual
     * Test two objects for equivalence (based on ==).  Throw an exception
     *     if not equivalent.
     * 
     * Parameters:
     * got - {Object}
     * expected - {Object}
     * msg - {String} The message to be thrown.  This message will be appended
     *     with ": got {got} but expected {expected}" where got and expected are
     *     replaced with string representations of the above arguments.
     */
    function assertEqual(got, expected, msg) {
        if(got === undefined) {
            got = "undefined";
        } else if (got === null) {
            got = "null";
        }
        if(expected === undefined) {
            expected = "undefined";
        } else if (expected === null) {
            expected = "null";
        }
        if(got != expected) {
            throw msg + ": got '" + got + "' but expected '" + expected + "'";
        }
    }
    
    /**
     * Function assertElementNodesEqual
     * Test two element nodes for equivalence.  Nodes are considered equivalent
     *     if they are of the same type, have the same name, have the same
     *     namespace prefix and uri, and if all child nodes are equivalent.
     *     Throws a message as exception if not equivalent.
     * 
     * Parameters:
     * got - {DOMElement}
     * expected - {DOMElement}
     * options - {Object} Optional object for configuring test options.
     *
     * Valid options:
     * prefix - {Boolean} Compare element and attribute
     *     prefixes (namespace uri always tested).  Default is false.
     * includeWhiteSpace - {Boolean} Include whitespace only nodes when
     *     comparing child nodes.  Default is false.
     */
    function assertElementNodesEqual(got, expected, options) {
        var testPrefix = (options && options.prefix === true);
        
        // compare types
        assertEqual(got.nodeType, expected.nodeType, "Node type mismatch");
        
        // compare names
        var gotName = testPrefix ?
            got.nodeName : got.nodeName.split(":").pop();
        var expName = testPrefix ?
            expected.nodeName : expected.nodeName.split(":").pop();
        assertEqual(gotName, expName, "Node name mismatch");
        
        // for text nodes compare value
        if(got.nodeType == 3) {
            assertEqual(
                got.nodeValue, expected.nodeValue, "Node value mismatch"
            );
        }
        // for element type nodes compare namespace, attributes, and children
        else if(got.nodeType == 1) {
            
            // test namespace alias and uri
            if(got.prefix || expected.prefix) {
                if(testPrefix) {
                    assertEqual(
                        got.prefix, expected.prefix,
                        "Bad prefix for " + got.nodeName
                    );
                }
            }
            if(got.namespaceURI || expected.namespaceURI) {
                assertEqual(
                    got.namespaceURI, expected.namespaceURI,
                    "Bad namespaceURI for " + got.nodeName
                );
            }
            
            // compare attributes - disregard xmlns given namespace handling above
            var gotAttrLen = 0;
            var gotAttr = {};
            var expAttrLen = 0;
            var expAttr = {};
            var ga, ea, gn, en;
            for(var i=0; i<got.attributes.length; ++i) {
                ga = got.attributes[i];
                if(ga.specified === undefined || ga.specified === true) {
                    if(ga.name.split(":").shift() != "xmlns") {
                        gn = testPrefix ? ga.name : ga.name.split(":").pop();
                        gotAttr[gn] = ga;
                        ++gotAttrLen;
                    }
                }
            }
            for(var i=0; i<expected.attributes.length; ++i) {
                ea = expected.attributes[i];
                if(ea.specified === undefined || ea.specified === true) {
                    if(ea.name.split(":").shift() != "xmlns") {
                        en = testPrefix ? ea.name : ea.name.split(":").pop();
                        expAttr[en] = ea;
                        ++expAttrLen;
                    }
                }
            }
            assertEqual(
                gotAttrLen, expAttrLen,
                "Attributes length mismatch for " + got.nodeName
            );
            var gv, ev;
            for(var name in gotAttr) {
                if(expAttr[name] == undefined) {
                    throw "Attribute name " + gotAttr[name].name + " expected for element " + got.nodeName;
                }
                // test attribute namespace
                assertEqual(
                    gotAttr[name].namespaceURI, expAttr[name].namespaceURI,
                    "Attribute namespace mismatch for element " +
                    got.nodeName + " attribute name " + gotAttr[name].name
                );
                // test attribute value
                assertEqual(
                    gotAttr[name].value, expAttr[name].value,
                    "Attribute value mismatch for element " + got.nodeName +
                    " attribute name " + gotAttr[name].name
                );
            }
            
            // compare children
            var gotChildNodes = getChildNodes(got, options);
            var expChildNodes = getChildNodes(expected, options);

            assertEqual(
                gotChildNodes.length, expChildNodes.length,
                "Children length mismatch for " + got.nodeName
            );
            for(var j=0; j<gotChildNodes.length; ++j) {
                try {
                    assertElementNodesEqual(
                        gotChildNodes[j], expChildNodes[j], options
                    );
                } catch(err) {
                    throw "Bad child " + j + " for element " + got.nodeName + ": " + err;
                }
            }
        }
        return true;
    }

    /**
     * Function getChildNodes
     * Returns the child nodes of the specified nodes. By default this method
     *     will ignore child text nodes which are made up of whitespace content.
     *     The 'includeWhiteSpace' option is used to control this behaviour.
     * 
     * Parameters:
     * node - {DOMElement}
     * options - {Object} Optional object for test configuration.
     * 
     * Valid options:
     * includeWhiteSpace - {Boolean} Include whitespace only nodes when
     *     comparing child nodes.  Default is false.
     * 
     * Returns:
     * {Array} of {DOMElement}
     */
    function getChildNodes(node, options) {
        //check whitespace
        if (options && options.includeWhiteSpace) {
            return node.childNodes;
        }
        else {
           nodes = [];
           for (var i = 0; i < node.childNodes.length; i++ ) {
              var child = node.childNodes[i];
              if (child.nodeType == 1) {
                 //element node, add it 
                 nodes.push(child);
              }
              else if (child.nodeType == 3) {
                 //text node, add if non empty
                 if (child.nodeValue && 
                       child.nodeValue.replace(/^\s*(.*?)\s*$/, "$1") != "" ) { 

                    nodes.push(child);
                 }
              }
           }
  
           return nodes;
        }
    } 
    
    /**
     * Function: Test.AnotherWay._test_object_t.xml_eq
     * Test if two XML nodes are equivalent.  Tests for same node types, same
     *     node names, same namespace URI, same attributes, and recursively
     *     tests child nodes for same criteria.
     *
     * (code)
     * t.xml_eq(got, expected, message);
     * (end)
     * 
     * Parameters:
     * got - {DOMElement | String} A DOM node or XML string to test.
     * expected - {DOMElement | String} The expected DOM node or XML string.
     * msg - {String} A message to print with test output.
     * options - {Object} Optional object for configuring test.
     *
     * Valid options:
     * prefix - {Boolean} Compare element and attribute
     *     prefixes (namespace uri always tested).  Default is false.
     * includeWhiteSpace - {Boolean} Include whitespace only nodes when
     *     comparing child nodes.  Default is false.
     */
    var proto = Test.AnotherWay._test_object_t.prototype;
    proto.xml_eq = function(got, expected, msg, options) {
        // convert arguments to nodes if string
        if(typeof got == "string") {
            try {
                got = createNode(got);
            } catch(err) {
                this.fail(msg + ": got argument could not be converted to an XML node: " + err);
                return;
            }
        }
        if(typeof expected == "string") {
            try {
                expected = createNode(expected);
            } catch(err) {
                this.fail(msg + ": expected argument could not be converted to an XML node: " + err);
                return;
            }
        }
        
        // test nodes for equivalence
        try {
            assertElementNodesEqual(got, expected, options);
            this.ok(true, msg);
        } catch(err) {
            this.fail(msg + ": " + err);
        }
    }
    
})();
