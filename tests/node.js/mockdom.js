XMLHttpRequest = function() { 
    return { 
    'open': function() {  },
    'send': function() {  }
    }
};

navigator = {
  'appName': 'mockdom',
  'userAgent': 'mockdom',
  'appVersion': '0.1',
  'language': 'en',
  'userLanguage': 'en'
}  

element = function(type) {
    type = type || "";

    return {
        'childNodes': [],
        'className': '',
        'tagName': type.toUpperCase(),
        'style': {},
        'setAttribute': function(attr, value) {
            this[attr] = value;
        },    
        'appendChild': function(element) {
            if (this.childNodes.length) {
                this.childNodes[this.childNodes.length - 1].nextSibling = element;
            }  else {
                this.firstChild = element;
            }    
            element.parentNode = this;
            this.childNodes.push(element);

        }, 
        'removeChild': function(element) {
            var i = this.childNodes.indexOf(element);
            this.childNodes.splice(i, 1);
        },    
        'addEventListener': function() {
        },
        'removeEventListener': function() {
        },
        'getElementsByTagName': function(name, externalList) {
            var uc = name.toUpperCase();
            var list = externalList || [];
            for(var i = 0; i < this.childNodes.length; i++) {
                if (this.childNodes[i].tagName == uc) {
                    list.push(this.childNodes[i]);
                }
                this.childNodes[i].getElementsByTagName(name, list);
            }
            return list;
        },
        'getElementById': function(id) {
            for(var i = 0; i < this.childNodes.length; i++) {
                if (this.childNodes[i].id == id) {
                    return this.childNodes[i];
                } else {
                    var elem = this.childNodes[i].getElementById(id);
                    if (elem) { 
                        return elem
                    }
                }
            }
        }
    }
};

document = element();
document.createElement = function(type) {
     return element(type);
};
document.createTextNode = function(text) {
    var e = element("Text");
    e.innerHTML = text;
}

document.appendChild(element("head"));
document.body = element("body");
document.appendChild(document.body);

window = {
    'addEventListener': function() {
    },
    'getSelection': function() {
        return {
            collapseToStart: function() {}
        }
    },
    document: document,
    navigator: navigator,
    location: {
        href: '#',
        port: '',
        hostname: 'openlayers.org',
        host: 'openlayers.org',
        proto: 'https'
    }    
};
document.location = window.location;

window.Function = Function;
