/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/OWSCommon.js
 */

/**
 * Class: OpenLayers.Format.OWSCommon.v1
 * Common readers and writers for OWSCommon v1.X formats
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.OWSCommon.v1 = OpenLayers.Class(OpenLayers.Format.XML, {
   
    /**
     * Property: regExes
     * Compiled regular expressions for manipulating strings.
     */
    regExes: {
        trimSpace: (/^\s*|\s*$/g),
        removeSpace: (/\s*/g),
        splitSpace: (/\s+/),
        trimComma: (/\s*,\s*/g)
    },

    /**
     * Method: read
     *
     * Parameters:
     * data - {DOMElement} An OWSCommon document element.
     * options - {Object} Options for the reader.
     *
     * Returns:
     * {Object} An object representing the OWSCommon document.
     */
    read: function(data, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options);
        var ows = {};
        this.readChildNodes(data, ows);
        return ows;
    },

    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {
        "ows": {
            "Exception": function(node, exceptionReport) {
                var exception = {
                    code: node.getAttribute('exceptionCode'),
                    locator: node.getAttribute('locator'),
                    texts: []
                };
                exceptionReport.exceptions.push(exception);
                this.readChildNodes(node, exception);
            },
            "ExceptionText": function(node, exception) {
                var text = this.getChildValue(node);
                exception.texts.push(text);
            },
            "ServiceIdentification": function(node, obj) {
                obj.serviceIdentification = {};
                this.readChildNodes(node, obj.serviceIdentification);
            },
            "Title": function(node, obj) {
                obj.title = this.getChildValue(node);
            },
            "Abstract": function(node, serviceIdentification) {
                serviceIdentification["abstract"] = this.getChildValue(node);
            },
            "Keywords": function(node, serviceIdentification) {
                serviceIdentification.keywords = {};
                this.readChildNodes(node, serviceIdentification.keywords);
            },
            "Keyword": function(node, keywords) {
                keywords[this.getChildValue(node)] = true;
            },
            "ServiceType": function(node, serviceIdentification) {
                serviceIdentification.serviceType = {
                    codeSpace: node.getAttribute('codeSpace'), 
                    value: this.getChildValue(node)};
            },
            "ServiceTypeVersion": function(node, serviceIdentification) {
                serviceIdentification.serviceTypeVersion = this.getChildValue(node);
            },
            "Fees": function(node, serviceIdentification) {
                serviceIdentification.fees = this.getChildValue(node);
            },
            "AccessConstraints": function(node, serviceIdentification) {
                serviceIdentification.accessConstraints = 
                    this.getChildValue(node);
            },
            "ServiceProvider": function(node, obj) {
                obj.serviceProvider = {};
                this.readChildNodes(node, obj.serviceProvider);
            },
            "ProviderName": function(node, serviceProvider) {
                serviceProvider.providerName = this.getChildValue(node);
            },
            "ProviderSite": function(node, serviceProvider) {
                serviceProvider.providerSite = this.getAttributeNS(node, 
                    this.namespaces.xlink, "href");
            },
            "ServiceContact": function(node, serviceProvider) {
                serviceProvider.serviceContact = {};
                this.readChildNodes(node, serviceProvider.serviceContact);
            },
            "IndividualName": function(node, serviceContact) {
                serviceContact.individualName = this.getChildValue(node);
            },
            "PositionName": function(node, serviceContact) {
                serviceContact.positionName = this.getChildValue(node);
            },
            "ContactInfo": function(node, serviceContact) {
                serviceContact.contactInfo = {};
                this.readChildNodes(node, serviceContact.contactInfo);
            },
            "Phone": function(node, contactInfo) {
                contactInfo.phone = {};
                this.readChildNodes(node, contactInfo.phone);
            },
            "Voice": function(node, phone) {
                phone.voice = this.getChildValue(node);
            },
            "Address": function(node, contactInfo) {
                contactInfo.address = {};
                this.readChildNodes(node, contactInfo.address);
            },
            "DeliveryPoint": function(node, address) {
                address.deliveryPoint = this.getChildValue(node);
            },
            "City": function(node, address) {
                address.city = this.getChildValue(node);
            },
            "AdministrativeArea": function(node, address) {
                address.administrativeArea = this.getChildValue(node);
            },
            "PostalCode": function(node, address) {
                address.postalCode = this.getChildValue(node);
            },
            "Country": function(node, address) {
                address.country = this.getChildValue(node);
            },
            "ElectronicMailAddress": function(node, address) {
                address.electronicMailAddress = this.getChildValue(node);
            },
            "Role": function(node, serviceContact) {
                serviceContact.role = this.getChildValue(node);
            },
            "OperationsMetadata": function(node, obj) {
                obj.operationsMetadata = {};
                this.readChildNodes(node, obj.operationsMetadata);
            },
            "Operation": function(node, operationsMetadata) {
                var name = node.getAttribute("name");
                operationsMetadata[name] = {};
                this.readChildNodes(node, operationsMetadata[name]);
            },
            "DCP": function(node, operation) {
                operation.dcp = {};
                this.readChildNodes(node, operation.dcp);
            },
            "HTTP": function(node, dcp) {
                dcp.http = {};
                this.readChildNodes(node, dcp.http);
            },
            "Get": function(node, http) {
                if (!http.get) {
                    http.get = [];
                }
                var obj = {
                    url: this.getAttributeNS(node, this.namespaces.xlink, "href")
                };
                this.readChildNodes(node, obj);
                http.get.push(obj);
            },
            "Post": function(node, http) {
                if (!http.post) {
                    http.post = [];
                }
                var obj = {
                    url: this.getAttributeNS(node, this.namespaces.xlink, "href")
                };
                this.readChildNodes(node, obj);
                http.post.push(obj);
            },
            "Parameter": function(node, operation) {
                if (!operation.parameters) {
                    operation.parameters = {};
                }
                var name = node.getAttribute("name");
                operation.parameters[name] = {};
                this.readChildNodes(node, operation.parameters[name]);
            },
            "Constraint": function(node, obj) {
                if (!obj.constraints) {
                    obj.constraints = {};
                }
                var name = node.getAttribute("name");
                obj.constraints[name] = {};
                this.readChildNodes(node, obj.constraints[name]);
            },
            "Value": function(node, allowedValues) {
                allowedValues[this.getChildValue(node)] = true;
            },
            "OutputFormat": function(node, obj) {
                obj.formats.push({value: this.getChildValue(node)});
                this.readChildNodes(node, obj);
            },
            "WGS84BoundingBox": function(node, obj) {
                var boundingBox = {};
                boundingBox.crs = node.getAttribute("crs");
                if (obj.BoundingBox) {
                    obj.BoundingBox.push(boundingBox);
                } else {
                    obj.projection = boundingBox.crs;
                    boundingBox = obj;
               }
               this.readChildNodes(node, boundingBox);
            },
            "BoundingBox": function(node, obj) {
                // FIXME: We consider that BoundingBox is the same as WGS84BoundingBox
                // LowerCorner = "min_x min_y"
                // UpperCorner = "max_x max_y"
                // It should normally depend on the projection
                this.readers['ows']['WGS84BoundingBox'].apply(this, [node, obj]);
            },
            "LowerCorner": function(node, obj) {
                var str = this.getChildValue(node).replace(
                    this.regExes.trimSpace, "");
                str = str.replace(this.regExes.trimComma, ",");
                var pointList = str.split(this.regExes.splitSpace);
                obj.left = pointList[0];
                obj.bottom = pointList[1];
            },
            "UpperCorner": function(node, obj) {
                var str = this.getChildValue(node).replace(
                    this.regExes.trimSpace, "");
                str = str.replace(this.regExes.trimComma, ",");
                var pointList = str.split(this.regExes.splitSpace);
                obj.right = pointList[0];
                obj.top = pointList[1];
                obj.bounds = new OpenLayers.Bounds(obj.left, obj.bottom,
                    obj.right, obj.top);
                delete obj.left;
                delete obj.bottom;
                delete obj.right;
                delete obj.top;
            },
            "Language": function(node, obj) {
                obj.language = this.getChildValue(node);
            }
        }
    },

    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "ows": {
            "BoundingBox": function(options) {
                var node = this.createElementNSPlus("ows:BoundingBox", {
                    attributes: {
                        crs: options.projection
                    }
                });
                this.writeNode("ows:LowerCorner", options, node);
                this.writeNode("ows:UpperCorner", options, node);
                return node;
            },
            "LowerCorner": function(options) {
                var node = this.createElementNSPlus("ows:LowerCorner", {
                    value: options.bounds.left + " " + options.bounds.bottom });
                return node;
            },
            "UpperCorner": function(options) {
                var node = this.createElementNSPlus("ows:UpperCorner", {
                    value: options.bounds.right + " " + options.bounds.top });
                return node;
            },
            "Identifier": function(identifier) {
                var node = this.createElementNSPlus("ows:Identifier", {
                    value: identifier });
                return node;
            },
            "Title": function(title) {
                var node = this.createElementNSPlus("ows:Title", {
                    value: title });
                return node;
            },
            "Abstract": function(abstractValue) {
                var node = this.createElementNSPlus("ows:Abstract", {
                    value: abstractValue });
                return node;
            },
            "OutputFormat": function(format) {
                var node = this.createElementNSPlus("ows:OutputFormat", {
                    value: format });
                return node;
            }
        }
    },

    CLASS_NAME: "OpenLayers.Format.OWSCommon.v1"

});
