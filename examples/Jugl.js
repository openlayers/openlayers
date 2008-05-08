/**
 * Jugl.js -- JavaScript Template Library
 *
 * Copyright 2007 Tim Schaub
 * Released under the MIT license.  Please see
 * http://svn.tschaub.net/jugl/trunk/license.txt for the full license.
 */

(function(){var Jugl={prefix:"jugl",namespaceURI:"http://namespace.jugl.org/"};Jugl.Array={indexOf:function(array,obj){for(var i=0;i<array.length;i++){if(array[i]==obj)return i;}
return-1;}};Jugl.Function={bind:function(method,object){var args=[];for(var i=2;i<arguments.length;++i){args.push(arguments[i]);}
return function(){for(var i=0;i<arguments.length;++i){args.push(arguments[i]);}
return method.apply(object,args);}}};Jugl.Node={appendChild:function(parent,child){if(typeof(parent)=="string"){var obj=document.getElementById(parent);if(!obj){throw Error("Element id not found: "+parent);}
parent=obj;}
if(typeof(child)=="string"){var obj=document.getElementById(child);if(!obj){throw Error("Element id not found: "+child);}
child=obj;}
if(child.namespaceURI&&child.xml){var wrapper=document.createElement('div');wrapper.innerHTML=child.xml;var children=wrapper.childNodes;for(var i=0;i<children.length;++i){parent.appendChild(children[i]);}}else{if(parent.ownerDocument&&parent.ownerDocument.importNode){child=parent.ownerDocument.importNode(child,true);}
parent.appendChild(child);}
return child;}};Jugl.Object={extend:function(destination,source){destination=destination||{};source=source||{};for(property in source){destination[property]=source[property];}
return destination;},applyDefaults:function(destination,source){destination=destination||{};source=source||{};for(property in source){if(destination[property]===undefined){destination[property]=source[property];}}
return destination;}};Jugl.Request={loadTemplate:function(url,onComplete,caller){var createTemplate=function(request){var doc,template;try{doc=request.responseXML;template=new Jugl.Template(doc.documentElement);}catch(invalidXML){try{doc=document.createElement("div");doc.innerHTML=request.responseText;template=new Jugl.Template(doc.firstChild);}catch(invalidHTML){var msg="Can't make HTML out of response: "+
request.responseText;Jugl.Console.error(msg);throw invalidHTML;}}
var complete=Jugl.Function.bind(onComplete,caller);complete(template);}
Jugl.Request.loadUrl(url,createTemplate);},loadUrl:function(url,onComplete,caller){var complete=(caller)?Jugl.Function.bind(onComplete,caller):onComplete;var request=Jugl.Request.createXMLHttpRequest();request.open("GET",url);request.onreadystatechange=function(){if(request.readyState==4){complete(request);}}
request.send(null);},createXMLHttpRequest:function(){if(typeof XMLHttpRequest!="undefined"){return new XMLHttpRequest();}else if(typeof ActiveXObject!="undefined"){return new ActiveXObject("Microsoft.XMLHTTP");}else{throw new Error("XMLHttpRequest not supported");}}};Jugl.Class=function(){var Class=function(){if(this===Jugl){var msg="Create an instance of a Jugl "+"class with the new keyword";throw Error(msg);}
this.initialize.apply(this,arguments);}
var extended={toString:function(){return"["+this.CLASS_NAME+"]";}};var parent;for(var i=0;i<arguments.length;++i){if(typeof arguments[i]=="function"){parent=arguments[i].prototype;}else{parent=arguments[i];}
Jugl.Object.extend(extended,parent);}
Class.prototype=extended;return Class;};Jugl.Console={log:function(){},debug:function(){},info:function(){},warn:function(){},error:function(){},assert:function(){},dir:function(){},dirxml:function(){},trace:function(){},group:function(){},groupEnd:function(){},time:function(){},timeEnd:function(){},profile:function(){},profileEnd:function(){},count:function(){}};(function(){if(window.console){var scripts=document.getElementsByTagName("script");for(var i=0;i<scripts.length;++i){if(scripts[i].src.indexOf("firebug.js")!=-1){Jugl.Object.extend(Jugl.Console,console);break;}}}})();Jugl.Attribute=Jugl.Class({element:null,node:null,type:null,nodeValue:null,template:null,initialize:function(element,node,type){this.element=element;this.node=node;this.type=type;this.nodeValue=node.nodeValue;this.nodeName=node.nodeName;this.template=element.template;},splitAttributeValue:function(value){value=(value!=null)?value:this.nodeValue;var matches=this.template.regExes.trimSpace.exec(value);var items;if(matches&&matches.length==3){items=[matches[1],matches[2]];}
return items;},splitExpressionPrefix:function(){var items=this.splitAttributeValue();if(!items||(items[0]!='structure'&&items[0]!='text')){items=[null,this.nodeValue];}
return items;},getAttributeValues:function(){var trimmed=this.nodeValue.replace(/[\t\n]/g,"").replace(/;\s*$/,"");var tabbed=trimmed.replace(/;;/g,"\t");var newlined=tabbed.split(";").join("\n");return newlined.replace(/\t/g,";").split(/\n/g);},removeSelf:function(){this.element.removeAttributeNode(this);},process:function(){return this.processAttribute[this.type].apply(this,[]);},evalInScope:function(str){var expression="with(this.element.scope){"+str+"}";return eval(expression);},processAttribute:{"define":function(){var values=this.getAttributeValues();var pair;for(var i=0;i<values.length;++i){pair=this.splitAttributeValue(values[i]);this.element.scope[pair[0]]=this.evalInScope(pair[1]);}
this.removeSelf();return true;},"condition":function(){var proceed;try{proceed=!!(this.evalInScope(this.nodeValue));}catch(err){var message=err.name+": "+err.message+"\n"+"attribute: "+this.nodeName;Jugl.Console.error(message);throw err;}
this.removeSelf();if(!proceed){this.element.removeSelf();}
return proceed;},"repeat":function(){var pair=this.splitAttributeValue();var key=pair[0];var list=this.evalInScope(pair[1]);this.removeSelf();if(!(list instanceof Array)){var items=new Array();for(var p in list){items.push(p);}
list=items;}
var element;var previousSibling=this.element;var length=list.length;for(var i=0;i<length;++i){element=this.element.clone();element.scope[key]=list[i];element.scope.repeat[key]={index:i,number:i+1,even:!(i%2),odd:!!(i%2),start:(i==0),end:(i==length-1),length:length};previousSibling.insertAfter(element);element.process();previousSibling=element;}
this.element.removeSelf();return false;},"content":function(){var pair=this.splitExpressionPrefix();var str;try{str=this.evalInScope(pair[1]);}catch(err){Jugl.Console.error("Failed to eval in element scope: "+
pair[1]);throw err;}
this.removeSelf();if(pair[0]=='structure'){try{this.element.node.innerHTML=str;}catch(err){var wrapper=document.createElement('div');var msg;try{wrapper.innerHTML=str;}catch(invalidHTML){msg="Can't transform string into valid HTML : "+
str;Jugl.Console.error(msg);throw invalidHTML;}
if(this.element.node.xml&&this.template.xmldom){while(this.element.node.firstChild){this.element.node.removeChild(this.element.node.firstChild);}
this.template.xmldom.loadXML(wrapper.outerHTML);var children=this.template.xmldom.firstChild.childNodes;try{for(var i=0;i<children.length;++i){this.element.node.appendChild(children[i]);}}catch(invalidXML){msg="Can't transform string into valid XHTML : "+
str;Jugl.Console.error(msg);throw invalidXML;}}else{try{this.element.node.innerHTML=wrapper.innerHTML;}catch(invalidXML){msg="Can't transform string into valid XHTML : "+
str;Jugl.Console.error(msg);throw invalidXML;}}}}else{var text;if(this.element.node.xml&&this.template.xmldom){text=this.template.xmldom.createTextNode(str);}else{text=document.createTextNode(str);}
var child=new Jugl.Element(this.template,text);this.element.removeChildNodes();this.element.appendChild(child);}
return true;},"replace":function(){var pair=this.splitExpressionPrefix();var str;try{str=this.evalInScope(pair[1]);}catch(err){Jugl.Console.error("Failed to eval in element scope: "+
pair[1]);throw err;}
this.removeSelf();if(pair[0]=='structure'){var wrapper=document.createElement('div');try{wrapper.innerHTML=str;}catch(err){msg="Can't transform string into valid HTML : "+
str;Jugl.Console.error(msg);throw err;}
if(this.element.node.xml&&this.template.xmldom){try{this.template.xmldom.loadXML(wrapper.outerHTML);}catch(err){msg="Can't transform string into valid XML : "+
str;Jugl.Console.error(msg);throw err;}
wrapper=this.template.xmldom.firstChild;}
while(wrapper.firstChild){var child=wrapper.removeChild(wrapper.firstChild);if(this.element.node.ownerDocument&&this.element.node.ownerDocument.importNode){if(child.ownerDocument!=this.element.node.ownerDocument){child=this.element.node.ownerDocument.importNode(child,true);}}
this.element.node.parentNode.insertBefore(child,this.element.node);}}else{var text;if(this.element.node.xml&&this.template.xmldom){text=this.template.xmldom.createTextNode(str);}else{text=document.createTextNode(str);}
var replacement=new Jugl.Element(this.template,text);this.element.insertBefore(replacement);}
this.element.removeSelf();return true;},"attributes":function(){var values=this.getAttributeValues();var pair,name,value;for(var i=0;i<values.length;++i){pair=this.splitAttributeValue(values[i]);name=pair[0];value=this.evalInScope(pair[1]);if(value!==false){this.element.setAttribute(name,value);}}
this.removeSelf();return true;},"omit-tag":function(){var omit;try{omit=((this.nodeValue=="")||!!(this.evalInScope(this.nodeValue)));}catch(err){Jugl.Console.error("Failed to eval in element scope: "+
this.nodeValue);throw err;}
this.removeSelf();if(omit){var children=this.element.getChildNodes();var child;for(var i=0;i<children.length;++i){this.element.insertBefore(children[i]);}
this.element.removeSelf();}},"reflow":function(){var reflow;try{reflow=((this.nodeValue=="")||!!(this.evalInScope(this.nodeValue)));}catch(err){Jugl.Console.error("Failed to eval in element scope: "+
this.nodeValue);throw err;}
this.removeSelf();if(reflow){if(this.element.node.outerHTML){this.element.node.outerHTML=this.element.node.outerHTML;}else{this.element.node.innerHTML=this.element.node.innerHTML;}}}},CLASS_NAME:"Jugl.Attribute"});Jugl.Element=Jugl.Class({template:null,node:null,scope:null,initialize:function(template,node){this.template=template;this.node=node;this.scope=new Object();this.scope.repeat=new Object();},clone:function(){var node=this.node.cloneNode(true);node.removeAttribute("id");var element=new Jugl.Element(this.template,node);Jugl.Object.extend(element.scope,this.scope);return element;},getAttribute:function(localName){var node;if(this.node.nodeType==1){if(this.template.usingNS){node=this.node.getAttributeNodeNS(Jugl.namespaceURI,localName);}else{node=this.node.getAttributeNode(Jugl.prefix+":"+
localName);}
if(node&&!node.specified){node=false;}}
var attribute;if(node){attribute=new Jugl.Attribute(this,node,localName);}else{attribute=node;}
return attribute;},setAttribute:function(name,value){this.node.setAttribute(name,value);},removeAttributeNode:function(attribute){this.node.removeAttributeNode(attribute.node);},getChildNodes:function(){var numNodes=this.node.childNodes.length;var children=new Array(numNodes);var node,scope;for(var i=0;i<numNodes;++i){node=new Jugl.Element(this.template,this.node.childNodes[i]);node.scope=Jugl.Object.extend({},this.scope);children[i]=node;}
return children;},removeChildNodes:function(){while(this.node.hasChildNodes()){this.node.removeChild(this.node.firstChild);}},removeChild:function(element){this.node.removeChild(element.node);return node;},removeSelf:function(){this.node.parentNode.removeChild(this.node);},importNode:function(element){if(this.node.ownerDocument&&this.node.ownerDocument.importNode){if(element.node.ownerDocument!=this.node.ownerDocument){element.node=this.node.ownerDocument.importNode(element.node,true);}}},appendChild:function(element){this.importNode(element);this.node.appendChild(element.node);},insertAfter:function(element){this.importNode(element);var parent=this.node.parentNode;var sibling=this.node.nextSibling;if(sibling){parent.insertBefore(element.node,sibling);}else{parent.appendChild(element.node);}},insertBefore:function(element){this.importNode(element);var parent=this.node.parentNode;parent.insertBefore(element.node,this.node);},process:function(){var attribute;var keepProcessing=true;var series=["define","condition","repeat"];for(var i=0;i<series.length;++i){attribute=this.getAttribute(series[i]);if(attribute){try{keepProcessing=attribute.process();}catch(err){Jugl.Console.error("Failed to process "+
series[i]+" attribute");throw err;}
if(!keepProcessing){return;}}}
var content=this.getAttribute("content");if(content){try{content.process();}catch(err){Jugl.Console.error("Failed to process content attribute");throw err;}}else{var replace=this.getAttribute("replace");if(replace){try{replace.process();}catch(err){Jugl.Console.error("Failed to process replace attribute");throw err;}}}
var attributes=this.getAttribute("attributes");if(attributes){try{attributes.process();}catch(err){Jugl.Console.error("Failed to process attributes attribute");throw err;}}
if(!content&&!replace){this.processChildNodes();}
var omit=this.getAttribute("omit-tag");if(omit){try{omit.process();}catch(err){Jugl.Console.error("Failed to process omit-tag attribute");throw err;}}
var reflow=this.getAttribute("reflow");if(reflow){try{reflow.process();}catch(err){Jugl.Console.error("Failed to process reflow attribute");throw err;}}},processChildNodes:function(){var children=this.getChildNodes();for(var i=0;i<children.length;++i){try{children[i].process();}catch(err){Jugl.Console.error("Failed to process child node: "+i);throw err;}}},CLASS_NAME:"Jugl.Element"});Jugl.Template=Jugl.Class({node:null,usingNS:false,xhtmlns:"http://www.w3.org/1999/xhtml",xmldom:window.ActiveXObject?new ActiveXObject("Microsoft.XMLDOM"):null,regExes:{trimSpace:(/^\s*(\w+)\s+(.*?)\s*$/)},loaded:false,loading:false,initialize:function(config){if(typeof config=="string"||(config&&config.nodeType==1)){config={node:config};}
config=config||{};if(typeof(config.node)=="string"){config.node=document.getElementById(config.node);if(!config.node){throw Error("Element id not found: "+config.node);}}
if(config.node){this.node=config.node;this.loaded=true;}else if(config.url){this.load({url:config.url,callback:config.callback,scope:config.scope});}},process:function(config){if(config&&!config.context&&!config.clone&&!config.string&&!config.parent){config={context:config}}
config=Jugl.Object.applyDefaults(config,{context:null,clone:false,string:false});if(this.node.getAttributeNodeNS){if(this.node.getAttributeNodeNS(Jugl.xhtmlns,Jugl.prefix)){this.usingNS=true;}}
var element=new Jugl.Element(this,this.node);if(config.clone){element=element.clone();}
if(config.context){element.scope=config.context;}
try{element.process();}catch(err){Jugl.Console.error("Failed to process "+
this.node.nodeName+" node");throw err;}
var data;if(config.string){if(element.node.innerHTML){data=element.node.innerHTML;}else{if(this.xmldom){data=element.node.xml;}else{var serializer=new XMLSerializer();data=serializer.serializeToString(element.node);}}}else{data=element.node;if(config.parent){if(config.clone){data=Jugl.Node.appendChild(config.parent,element.node);}else{this.appendTo(config.parent);}}}
return data;},load:function(config){if(typeof config=="string"){config={url:config};}
config=config||{};this.loading=true;var setNode=function(template){this.node=template.node;this.loading=false;this.loaded=true;if(config.callback){config.callback.apply(config.scope,[template]);}}
Jugl.Request.loadTemplate(config.url,setNode,this);},appendTo:function(parent){this.node=Jugl.Node.appendChild(parent,this.node);return this;},CLASS_NAME:"Jugl.Template"});window["http://jugl.tschaub.net/trunk/lib/Jugl.js"]=Jugl;})();