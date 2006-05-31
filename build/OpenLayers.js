/*

  OpenLayers.js -- OpenLayers Map Viewer Library

  Copyright 2005-2006 MetaCarta, Inc., released under the BSD License.


  Includes compressed code under the following licenses:

  (For uncompressed versions of the code used please see the
  OpenLayers SVN repository: <http://openlayers.org/>)

*/

/*  Prototype JavaScript framework, version 1.4.0
 *  (c) 2005 Sam Stephenson <sam@conio.net>
 *
 *  Prototype is freely distributable under the terms of an MIT-style license.
 *  For details, see the Prototype web site: http://prototype.conio.net/
 *
/*--------------------------------------------------------------------------*/

/**  
*  
*  Contains portions of Rico <http://openrico.org/>
* 
*  Copyright 2005 Sabre Airline Solutions  
*  
*  Licensed under the Apache License, Version 2.0 (the "License"); you
*  may not use this file except in compliance with the License. You
*  may obtain a copy of the License at
*  
*         http://www.apache.org/licenses/LICENSE-2.0  
*  
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
*  implied. See the License for the specific language governing
*  permissions and limitations under the License. 
*
**/

var Prototype={Version:"1.4.0",ScriptFragment:"(?:<script.*?>)((\n|\r|.)*?)(?:</script>)",emptyFunction:function(){
},K:function(x){
return x;
}};
var Class={create:function(){
return function(){
this.initialize.apply(this,arguments);
};
}};
var Abstract=new Object();
Object.extend=function(_2,_3){
for(property in _3){
_2[property]=_3[property];
}
return _2;
};
Object.inspect=function(_4){
try{
if(_4==undefined){
return "undefined";
}
if(_4==null){
return "null";
}
return _4.inspect?_4.inspect():_4.toString();
}
catch(e){
if(e instanceof RangeError){
return "...";
}
throw e;
}
};
Function.prototype.bind=function(){
var _5=this,args=$A(arguments),object=args.shift();
return function(){
return _5.apply(object,args.concat($A(arguments)));
};
};
Function.prototype.bindAsEventListener=function(_6){
var _7=this;
return function(_8){
return _7.call(_6,_8||window.event);
};
};
Object.extend(Number.prototype,{toColorPart:function(){
var _9=this.toString(16);
if(this<16){
return "0"+_9;
}
return _9;
},succ:function(){
return this+1;
},times:function(_a){
$R(0,this,true).each(_a);
return this;
}});
var Try={these:function(){
var _b;
for(var i=0;i<arguments.length;i++){
var _d=arguments[i];
try{
_b=_d();
break;
}
catch(e){
}
}
return _b;
}};
var PeriodicalExecuter=Class.create();
PeriodicalExecuter.prototype={initialize:function(_e,_f){
this.callback=_e;
this.frequency=_f;
this.currentlyExecuting=false;
this.registerCallback();
},registerCallback:function(){
setInterval(this.onTimerEvent.bind(this),this.frequency*1000);
},onTimerEvent:function(){
if(!this.currentlyExecuting){
try{
this.currentlyExecuting=true;
this.callback();
}
finally{
this.currentlyExecuting=false;
}
}
}};
function $(){
var _10=new Array();
for(var i=0;i<arguments.length;i++){
var _12=arguments[i];
if(typeof _12=="string"){
_12=document.getElementById(_12);
}
if(arguments.length==1){
return _12;
}
_10.push(_12);
}
return _10;
}
Object.extend(String.prototype,{stripTags:function(){
return this.replace(/<\/?[^>]+>/gi,"");
},stripScripts:function(){
return this.replace(new RegExp(Prototype.ScriptFragment,"img"),"");
},extractScripts:function(){
var _13=new RegExp(Prototype.ScriptFragment,"img");
var _14=new RegExp(Prototype.ScriptFragment,"im");
return (this.match(_13)||[]).map(function(_15){
return (_15.match(_14)||["",""])[1];
});
},evalScripts:function(){
return this.extractScripts().map(eval);
},escapeHTML:function(){
var div=document.createElement("div");
var _17=document.createTextNode(this);
div.appendChild(_17);
return div.innerHTML;
},unescapeHTML:function(){
var div=document.createElement("div");
div.innerHTML=this.stripTags();
return div.childNodes[0]?div.childNodes[0].nodeValue:"";
},toQueryParams:function(){
var _19=this.match(/^\??(.*)$/)[1].split("&");
return _19.inject({},function(_1a,_1b){
var _1c=_1b.split("=");
_1a[_1c[0]]=_1c[1];
return _1a;
});
},toArray:function(){
return this.split("");
},camelize:function(){
var _1d=this.split("-");
if(_1d.length==1){
return _1d[0];
}
var _1e=this.indexOf("-")==0?_1d[0].charAt(0).toUpperCase()+_1d[0].substring(1):_1d[0];
for(var i=1,len=_1d.length;i<len;i++){
var s=_1d[i];
_1e+=s.charAt(0).toUpperCase()+s.substring(1);
}
return _1e;
},inspect:function(){
return "'"+this.replace("\\","\\\\").replace("'","\\'")+"'";
}});
String.prototype.parseQuery=String.prototype.toQueryParams;
var $break=new Object();
var $continue=new Object();
var Enumerable={each:function(_21){
var _22=0;
try{
this._each(function(_23){
try{
_21(_23,_22++);
}
catch(e){
if(e!=$continue){
throw e;
}
}
});
}
catch(e){
if(e!=$break){
throw e;
}
}
},all:function(_24){
var _25=true;
this.each(function(_26,_27){
_25=_25&&!!(_24||Prototype.K)(_26,_27);
if(!_25){
throw $break;
}
});
return _25;
},any:function(_28){
var _29=true;
this.each(function(_2a,_2b){
if(_29=!!(_28||Prototype.K)(_2a,_2b)){
throw $break;
}
});
return _29;
},collect:function(_2c){
var _2d=[];
this.each(function(_2e,_2f){
_2d.push(_2c(_2e,_2f));
});
return _2d;
},detect:function(_30){
var _31;
this.each(function(_32,_33){
if(_30(_32,_33)){
_31=_32;
throw $break;
}
});
return _31;
},findAll:function(_34){
var _35=[];
this.each(function(_36,_37){
if(_34(_36,_37)){
_35.push(_36);
}
});
return _35;
},grep:function(_38,_39){
var _3a=[];
this.each(function(_3b,_3c){
var _3d=_3b.toString();
if(_3d.match(_38)){
_3a.push((_39||Prototype.K)(_3b,_3c));
}
});
return _3a;
},include:function(_3e){
var _3f=false;
this.each(function(_40){
if(_40==_3e){
_3f=true;
throw $break;
}
});
return _3f;
},inject:function(_41,_42){
this.each(function(_43,_44){
_41=_42(_41,_43,_44);
});
return _41;
},invoke:function(_45){
var _46=$A(arguments).slice(1);
return this.collect(function(_47){
return _47[_45].apply(_47,_46);
});
},max:function(_48){
var _49;
this.each(function(_4a,_4b){
_4a=(_48||Prototype.K)(_4a,_4b);
if(_4a>=(_49||_4a)){
_49=_4a;
}
});
return _49;
},min:function(_4c){
var _4d;
this.each(function(_4e,_4f){
_4e=(_4c||Prototype.K)(_4e,_4f);
if(_4e<=(_4d||_4e)){
_4d=_4e;
}
});
return _4d;
},partition:function(_50){
var _51=[],falses=[];
this.each(function(_52,_53){
((_50||Prototype.K)(_52,_53)?_51:falses).push(_52);
});
return [_51,falses];
},pluck:function(_54){
var _55=[];
this.each(function(_56,_57){
_55.push(_56[_54]);
});
return _55;
},reject:function(_58){
var _59=[];
this.each(function(_5a,_5b){
if(!_58(_5a,_5b)){
_59.push(_5a);
}
});
return _59;
},sortBy:function(_5c){
return this.collect(function(_5d,_5e){
return {value:_5d,criteria:_5c(_5d,_5e)};
}).sort(function(_5f,_60){
var a=_5f.criteria,b=_60.criteria;
return a<b?-1:a>b?1:0;
}).pluck("value");
},toArray:function(){
return this.collect(Prototype.K);
},zip:function(){
var _62=Prototype.K,args=$A(arguments);
if(typeof args.last()=="function"){
_62=args.pop();
}
var _63=[this].concat(args).map($A);
return this.map(function(_64,_65){
_62(_64=_63.pluck(_65));
return _64;
});
},inspect:function(){
return "#<Enumerable:"+this.toArray().inspect()+">";
}};
Object.extend(Enumerable,{map:Enumerable.collect,find:Enumerable.detect,select:Enumerable.findAll,member:Enumerable.include,entries:Enumerable.toArray});
var $A=Array.from=function(_66){
if(!_66){
return [];
}
if(_66.toArray){
return _66.toArray();
}else{
var _67=[];
for(var i=0;i<_66.length;i++){
_67.push(_66[i]);
}
return _67;
}
};
Object.extend(Array.prototype,Enumerable);
Array.prototype._reverse=Array.prototype.reverse;
Object.extend(Array.prototype,{_each:function(_69){
for(var i=0;i<this.length;i++){
_69(this[i]);
}
},clear:function(){
this.length=0;
return this;
},first:function(){
return this[0];
},last:function(){
return this[this.length-1];
},compact:function(){
return this.select(function(_6b){
return _6b!=undefined||_6b!=null;
});
},flatten:function(){
return this.inject([],function(_6c,_6d){
return _6c.concat(_6d.constructor==Array?_6d.flatten():[_6d]);
});
},without:function(){
var _6e=$A(arguments);
return this.select(function(_6f){
return !_6e.include(_6f);
});
},indexOf:function(_70){
for(var i=0;i<this.length;i++){
if(this[i]==_70){
return i;
}
}
return -1;
},reverse:function(_72){
return (_72!==false?this:this.toArray())._reverse();
},shift:function(){
var _73=this[0];
for(var i=0;i<this.length-1;i++){
this[i]=this[i+1];
}
this.length--;
return _73;
},inspect:function(){
return "["+this.map(Object.inspect).join(", ")+"]";
}});
var Hash={_each:function(_75){
for(key in this){
var _76=this[key];
if(typeof _76=="function"){
continue;
}
var _77=[key,_76];
_77.key=key;
_77.value=_76;
_75(_77);
}
},keys:function(){
return this.pluck("key");
},values:function(){
return this.pluck("value");
},merge:function(_78){
return $H(_78).inject($H(this),function(_79,_7a){
_79[_7a.key]=_7a.value;
return _79;
});
},toQueryString:function(){
return this.map(function(_7b){
return _7b.map(encodeURIComponent).join("=");
}).join("&");
},inspect:function(){
return "#<Hash:{"+this.map(function(_7c){
return _7c.map(Object.inspect).join(": ");
}).join(", ")+"}>";
}};
function $H(_7d){
var _7e=Object.extend({},_7d||{});
Object.extend(_7e,Enumerable);
Object.extend(_7e,Hash);
return _7e;
}
ObjectRange=Class.create();
Object.extend(ObjectRange.prototype,Enumerable);
Object.extend(ObjectRange.prototype,{initialize:function(_7f,end,_81){
this.start=_7f;
this.end=end;
this.exclusive=_81;
},_each:function(_82){
var _83=this.start;
do{
_82(_83);
_83=_83.succ();
}while(this.include(_83));
},include:function(_84){
if(_84<this.start){
return false;
}
if(this.exclusive){
return _84<this.end;
}
return _84<=this.end;
}});
var $R=function(_85,end,_87){
return new ObjectRange(_85,end,_87);
};
var Ajax={getTransport:function(){
return Try.these(function(){
return new ActiveXObject("Msxml2.XMLHTTP");
},function(){
return new ActiveXObject("Microsoft.XMLHTTP");
},function(){
return new XMLHttpRequest();
})||false;
},activeRequestCount:0};
Ajax.Responders={responders:[],_each:function(_88){
this.responders._each(_88);
},register:function(_89){
if(!this.include(_89)){
this.responders.push(_89);
}
},unregister:function(_8a){
this.responders=this.responders.without(_8a);
},dispatch:function(_8b,_8c,_8d,_8e){
this.each(function(_8f){
if(_8f[_8b]&&typeof _8f[_8b]=="function"){
try{
_8f[_8b].apply(_8f,[_8c,_8d,_8e]);
}
catch(e){
}
}
});
}};
Object.extend(Ajax.Responders,Enumerable);
Ajax.Responders.register({onCreate:function(){
Ajax.activeRequestCount++;
},onComplete:function(){
Ajax.activeRequestCount--;
}});
Ajax.Base=function(){
};
Ajax.Base.prototype={setOptions:function(_90){
this.options={method:"post",asynchronous:true,parameters:""};
Object.extend(this.options,_90||{});
},responseIsSuccess:function(){
return this.transport.status==undefined||this.transport.status==0||(this.transport.status>=200&&this.transport.status<300);
},responseIsFailure:function(){
return !this.responseIsSuccess();
}};
Ajax.Request=Class.create();
Ajax.Request.Events=["Uninitialized","Loading","Loaded","Interactive","Complete"];
Ajax.Request.prototype=Object.extend(new Ajax.Base(),{initialize:function(url,_92){
this.transport=Ajax.getTransport();
this.setOptions(_92);
this.request(url);
},request:function(url){
var _94=this.options.parameters||"";
if(_94.length>0){
_94+="&_=";
}
try{
this.url=url;
if(this.options.method=="get"&&_94.length>0){
this.url+=(this.url.match(/\?/)?"&":"?")+_94;
}
Ajax.Responders.dispatch("onCreate",this,this.transport);
this.transport.open(this.options.method,this.url,this.options.asynchronous);
if(this.options.asynchronous){
this.transport.onreadystatechange=this.onStateChange.bind(this);
setTimeout((function(){
this.respondToReadyState(1);
}).bind(this),10);
}
this.setRequestHeaders();
var _95=this.options.postBody?this.options.postBody:_94;
this.transport.send(this.options.method=="post"?_95:null);
}
catch(e){
this.dispatchException(e);
}
},setRequestHeaders:function(){
var _96=["X-Requested-With","XMLHttpRequest","X-Prototype-Version",Prototype.Version];
if(this.options.method=="post"){
_96.push("Content-type","application/x-www-form-urlencoded");
if(this.transport.overrideMimeType){
_96.push("Connection","close");
}
}
if(this.options.requestHeaders){
_96.push.apply(_96,this.options.requestHeaders);
}
for(var i=0;i<_96.length;i+=2){
this.transport.setRequestHeader(_96[i],_96[i+1]);
}
},onStateChange:function(){
var _98=this.transport.readyState;
if(_98!=1){
this.respondToReadyState(this.transport.readyState);
}
},header:function(_99){
try{
return this.transport.getResponseHeader(_99);
}
catch(e){
}
},evalJSON:function(){
try{
return eval(this.header("X-JSON"));
}
catch(e){
}
},evalResponse:function(){
try{
return eval(this.transport.responseText);
}
catch(e){
this.dispatchException(e);
}
},respondToReadyState:function(_9a){
var _9b=Ajax.Request.Events[_9a];
var _9c=this.transport,json=this.evalJSON();
if(_9b=="Complete"){
try{
(this.options["on"+this.transport.status]||this.options["on"+(this.responseIsSuccess()?"Success":"Failure")]||Prototype.emptyFunction)(_9c,json);
}
catch(e){
this.dispatchException(e);
}
if((this.header("Content-type")||"").match(/^text\/javascript/i)){
this.evalResponse();
}
}
try{
(this.options["on"+_9b]||Prototype.emptyFunction)(_9c,json);
Ajax.Responders.dispatch("on"+_9b,this,_9c,json);
}
catch(e){
this.dispatchException(e);
}
if(_9b=="Complete"){
this.transport.onreadystatechange=Prototype.emptyFunction;
}
},dispatchException:function(_9d){
(this.options.onException||Prototype.emptyFunction)(this,_9d);
Ajax.Responders.dispatch("onException",this,_9d);
}});
Ajax.Updater=Class.create();
Object.extend(Object.extend(Ajax.Updater.prototype,Ajax.Request.prototype),{initialize:function(_9e,url,_a0){
this.containers={success:_9e.success?$(_9e.success):$(_9e),failure:_9e.failure?$(_9e.failure):(_9e.success?null:$(_9e))};
this.transport=Ajax.getTransport();
this.setOptions(_a0);
var _a1=this.options.onComplete||Prototype.emptyFunction;
this.options.onComplete=(function(_a2,_a3){
this.updateContent();
_a1(_a2,_a3);
}).bind(this);
this.request(url);
},updateContent:function(){
var _a4=this.responseIsSuccess()?this.containers.success:this.containers.failure;
var _a5=this.transport.responseText;
if(!this.options.evalScripts){
_a5=_a5.stripScripts();
}
if(_a4){
if(this.options.insertion){
new this.options.insertion(_a4,_a5);
}else{
Element.update(_a4,_a5);
}
}
if(this.responseIsSuccess()){
if(this.onComplete){
setTimeout(this.onComplete.bind(this),10);
}
}
}});
Ajax.PeriodicalUpdater=Class.create();
Ajax.PeriodicalUpdater.prototype=Object.extend(new Ajax.Base(),{initialize:function(_a6,url,_a8){
this.setOptions(_a8);
this.onComplete=this.options.onComplete;
this.frequency=(this.options.frequency||2);
this.decay=(this.options.decay||1);
this.updater={};
this.container=_a6;
this.url=url;
this.start();
},start:function(){
this.options.onComplete=this.updateComplete.bind(this);
this.onTimerEvent();
},stop:function(){
this.updater.onComplete=undefined;
clearTimeout(this.timer);
(this.onComplete||Prototype.emptyFunction).apply(this,arguments);
},updateComplete:function(_a9){
if(this.options.decay){
this.decay=(_a9.responseText==this.lastText?this.decay*this.options.decay:1);
this.lastText=_a9.responseText;
}
this.timer=setTimeout(this.onTimerEvent.bind(this),this.decay*this.frequency*1000);
},onTimerEvent:function(){
this.updater=new Ajax.Updater(this.container,this.url,this.options);
}});
document.getElementsByClassName=function(_aa,_ab){
var _ac=($(_ab)||document.body).getElementsByTagName("*");
return $A(_ac).inject([],function(_ad,_ae){
if(_ae.className.match(new RegExp("(^|\\s)"+_aa+"(\\s|$)"))){
_ad.push(_ae);
}
return _ad;
});
};
if(!window.Element){
var Element=new Object();
}
Object.extend(Element,{visible:function(_af){
return $(_af).style.display!="none";
},toggle:function(){
for(var i=0;i<arguments.length;i++){
var _b1=$(arguments[i]);
Element[Element.visible(_b1)?"hide":"show"](_b1);
}
},hide:function(){
for(var i=0;i<arguments.length;i++){
var _b3=$(arguments[i]);
_b3.style.display="none";
}
},show:function(){
for(var i=0;i<arguments.length;i++){
var _b5=$(arguments[i]);
_b5.style.display="";
}
},remove:function(_b6){
_b6=$(_b6);
_b6.parentNode.removeChild(_b6);
},update:function(_b7,_b8){
$(_b7).innerHTML=_b8.stripScripts();
setTimeout(function(){
_b8.evalScripts();
},10);
},getHeight:function(_b9){
_b9=$(_b9);
return _b9.offsetHeight;
},classNames:function(_ba){
return new Element.ClassNames(_ba);
},hasClassName:function(_bb,_bc){
if(!(_bb=$(_bb))){
return;
}
return Element.classNames(_bb).include(_bc);
},addClassName:function(_bd,_be){
if(!(_bd=$(_bd))){
return;
}
return Element.classNames(_bd).add(_be);
},removeClassName:function(_bf,_c0){
if(!(_bf=$(_bf))){
return;
}
return Element.classNames(_bf).remove(_c0);
},cleanWhitespace:function(_c1){
_c1=$(_c1);
for(var i=0;i<_c1.childNodes.length;i++){
var _c3=_c1.childNodes[i];
if(_c3.nodeType==3&&!/\S/.test(_c3.nodeValue)){
Element.remove(_c3);
}
}
},empty:function(_c4){
return $(_c4).innerHTML.match(/^\s*$/);
},scrollTo:function(_c5){
_c5=$(_c5);
var x=_c5.x?_c5.x:_c5.offsetLeft,y=_c5.y?_c5.y:_c5.offsetTop;
window.scrollTo(x,y);
},getStyle:function(_c7,_c8){
_c7=$(_c7);
var _c9=_c7.style[_c8.camelize()];
if(!_c9){
if(document.defaultView&&document.defaultView.getComputedStyle){
var css=document.defaultView.getComputedStyle(_c7,null);
_c9=css?css.getPropertyValue(_c8):null;
}else{
if(_c7.currentStyle){
_c9=_c7.currentStyle[_c8.camelize()];
}
}
}
if(window.opera&&["left","top","right","bottom"].include(_c8)){
if(Element.getStyle(_c7,"position")=="static"){
_c9="auto";
}
}
return _c9=="auto"?null:_c9;
},setStyle:function(_cb,_cc){
_cb=$(_cb);
for(name in _cc){
_cb.style[name.camelize()]=_cc[name];
}
},getDimensions:function(_cd){
_cd=$(_cd);
if(Element.getStyle(_cd,"display")!="none"){
return {width:_cd.offsetWidth,height:_cd.offsetHeight};
}
var els=_cd.style;
var _cf=els.visibility;
var _d0=els.position;
els.visibility="hidden";
els.position="absolute";
els.display="";
var _d1=_cd.clientWidth;
var _d2=_cd.clientHeight;
els.display="none";
els.position=_d0;
els.visibility=_cf;
return {width:_d1,height:_d2};
},makePositioned:function(_d3){
_d3=$(_d3);
var pos=Element.getStyle(_d3,"position");
if(pos=="static"||!pos){
_d3._madePositioned=true;
_d3.style.position="relative";
if(window.opera){
_d3.style.top=0;
_d3.style.left=0;
}
}
},undoPositioned:function(_d5){
_d5=$(_d5);
if(_d5._madePositioned){
_d5._madePositioned=undefined;
_d5.style.position=_d5.style.top=_d5.style.left=_d5.style.bottom=_d5.style.right="";
}
},makeClipping:function(_d6){
_d6=$(_d6);
if(_d6._overflow){
return;
}
_d6._overflow=_d6.style.overflow;
if((Element.getStyle(_d6,"overflow")||"visible")!="hidden"){
_d6.style.overflow="hidden";
}
},undoClipping:function(_d7){
_d7=$(_d7);
if(_d7._overflow){
return;
}
_d7.style.overflow=_d7._overflow;
_d7._overflow=undefined;
}});
var Toggle=new Object();
Toggle.display=Element.toggle;
Abstract.Insertion=function(_d8){
this.adjacency=_d8;
};
Abstract.Insertion.prototype={initialize:function(_d9,_da){
this.element=$(_d9);
this.content=_da.stripScripts();
if(this.adjacency&&this.element.insertAdjacentHTML){
try{
this.element.insertAdjacentHTML(this.adjacency,this.content);
}
catch(e){
if(this.element.tagName.toLowerCase()=="tbody"){
this.insertContent(this.contentFromAnonymousTable());
}else{
throw e;
}
}
}else{
this.range=this.element.ownerDocument.createRange();
if(this.initializeRange){
this.initializeRange();
}
this.insertContent([this.range.createContextualFragment(this.content)]);
}
setTimeout(function(){
_da.evalScripts();
},10);
},contentFromAnonymousTable:function(){
var div=document.createElement("div");
div.innerHTML="<table><tbody>"+this.content+"</tbody></table>";
return $A(div.childNodes[0].childNodes[0].childNodes);
}};
var Insertion=new Object();
Insertion.Before=Class.create();
Insertion.Before.prototype=Object.extend(new Abstract.Insertion("beforeBegin"),{initializeRange:function(){
this.range.setStartBefore(this.element);
},insertContent:function(_dc){
_dc.each((function(_dd){
this.element.parentNode.insertBefore(_dd,this.element);
}).bind(this));
}});
Insertion.Top=Class.create();
Insertion.Top.prototype=Object.extend(new Abstract.Insertion("afterBegin"),{initializeRange:function(){
this.range.selectNodeContents(this.element);
this.range.collapse(true);
},insertContent:function(_de){
_de.reverse(false).each((function(_df){
this.element.insertBefore(_df,this.element.firstChild);
}).bind(this));
}});
Insertion.Bottom=Class.create();
Insertion.Bottom.prototype=Object.extend(new Abstract.Insertion("beforeEnd"),{initializeRange:function(){
this.range.selectNodeContents(this.element);
this.range.collapse(this.element);
},insertContent:function(_e0){
_e0.each((function(_e1){
this.element.appendChild(_e1);
}).bind(this));
}});
Insertion.After=Class.create();
Insertion.After.prototype=Object.extend(new Abstract.Insertion("afterEnd"),{initializeRange:function(){
this.range.setStartAfter(this.element);
},insertContent:function(_e2){
_e2.each((function(_e3){
this.element.parentNode.insertBefore(_e3,this.element.nextSibling);
}).bind(this));
}});
Element.ClassNames=Class.create();
Element.ClassNames.prototype={initialize:function(_e4){
this.element=$(_e4);
},_each:function(_e5){
this.element.className.split(/\s+/).select(function(_e6){
return _e6.length>0;
})._each(_e5);
},set:function(_e7){
this.element.className=_e7;
},add:function(_e8){
if(this.include(_e8)){
return;
}
this.set(this.toArray().concat(_e8).join(" "));
},remove:function(_e9){
if(!this.include(_e9)){
return;
}
this.set(this.select(function(_ea){
return _ea!=_e9;
}).join(" "));
},toString:function(){
return this.toArray().join(" ");
}};
Object.extend(Element.ClassNames.prototype,Enumerable);
var Field={clear:function(){
for(var i=0;i<arguments.length;i++){
$(arguments[i]).value="";
}
},focus:function(_ec){
$(_ec).focus();
},present:function(){
for(var i=0;i<arguments.length;i++){
if($(arguments[i]).value==""){
return false;
}
}
return true;
},select:function(_ee){
$(_ee).select();
},activate:function(_ef){
_ef=$(_ef);
_ef.focus();
if(_ef.select){
_ef.select();
}
}};
var Form={serialize:function(_f0){
var _f1=Form.getElements($(_f0));
var _f2=new Array();
for(var i=0;i<_f1.length;i++){
var _f4=Form.Element.serialize(_f1[i]);
if(_f4){
_f2.push(_f4);
}
}
return _f2.join("&");
},getElements:function(_f5){
_f5=$(_f5);
var _f6=new Array();
for(tagName in Form.Element.Serializers){
var _f7=_f5.getElementsByTagName(tagName);
for(var j=0;j<_f7.length;j++){
_f6.push(_f7[j]);
}
}
return _f6;
},getInputs:function(_f9,_fa,_fb){
_f9=$(_f9);
var _fc=_f9.getElementsByTagName("input");
if(!_fa&&!_fb){
return _fc;
}
var _fd=new Array();
for(var i=0;i<_fc.length;i++){
var _ff=_fc[i];
if((_fa&&_ff.type!=_fa)||(_fb&&_ff.name!=_fb)){
continue;
}
_fd.push(_ff);
}
return _fd;
},disable:function(form){
var _101=Form.getElements(form);
for(var i=0;i<_101.length;i++){
var _103=_101[i];
_103.blur();
_103.disabled="true";
}
},enable:function(form){
var _105=Form.getElements(form);
for(var i=0;i<_105.length;i++){
var _107=_105[i];
_107.disabled="";
}
},findFirstElement:function(form){
return Form.getElements(form).find(function(_109){
return _109.type!="hidden"&&!_109.disabled&&["input","select","textarea"].include(_109.tagName.toLowerCase());
});
},focusFirstElement:function(form){
Field.activate(Form.findFirstElement(form));
},reset:function(form){
$(form).reset();
}};
Form.Element={serialize:function(_10c){
_10c=$(_10c);
var _10d=_10c.tagName.toLowerCase();
var _10e=Form.Element.Serializers[_10d](_10c);
if(_10e){
var key=encodeURIComponent(_10e[0]);
if(key.length==0){
return;
}
if(_10e[1].constructor!=Array){
_10e[1]=[_10e[1]];
}
return _10e[1].map(function(_110){
return key+"="+encodeURIComponent(_110);
}).join("&");
}
},getValue:function(_111){
_111=$(_111);
var _112=_111.tagName.toLowerCase();
var _113=Form.Element.Serializers[_112](_111);
if(_113){
return _113[1];
}
}};
Form.Element.Serializers={input:function(_114){
switch(_114.type.toLowerCase()){
case "submit":
case "hidden":
case "password":
case "text":
return Form.Element.Serializers.textarea(_114);
case "checkbox":
case "radio":
return Form.Element.Serializers.inputSelector(_114);
}
return false;
},inputSelector:function(_115){
if(_115.checked){
return [_115.name,_115.value];
}
},textarea:function(_116){
return [_116.name,_116.value];
},select:function(_117){
return Form.Element.Serializers[_117.type=="select-one"?"selectOne":"selectMany"](_117);
},selectOne:function(_118){
var _119="",opt,index=_118.selectedIndex;
if(index>=0){
opt=_118.options[index];
_119=opt.value;
if(!_119&&!("value" in opt)){
_119=opt.text;
}
}
return [_118.name,_119];
},selectMany:function(_11a){
var _11b=new Array();
for(var i=0;i<_11a.length;i++){
var opt=_11a.options[i];
if(opt.selected){
var _11e=opt.value;
if(!_11e&&!("value" in opt)){
_11e=opt.text;
}
_11b.push(_11e);
}
}
return [_11a.name,_11b];
}};
var $F=Form.Element.getValue;
Abstract.TimedObserver=function(){
};
Abstract.TimedObserver.prototype={initialize:function(_11f,_120,_121){
this.frequency=_120;
this.element=$(_11f);
this.callback=_121;
this.lastValue=this.getValue();
this.registerCallback();
},registerCallback:function(){
setInterval(this.onTimerEvent.bind(this),this.frequency*1000);
},onTimerEvent:function(){
var _122=this.getValue();
if(this.lastValue!=_122){
this.callback(this.element,_122);
this.lastValue=_122;
}
}};
Form.Element.Observer=Class.create();
Form.Element.Observer.prototype=Object.extend(new Abstract.TimedObserver(),{getValue:function(){
return Form.Element.getValue(this.element);
}});
Form.Observer=Class.create();
Form.Observer.prototype=Object.extend(new Abstract.TimedObserver(),{getValue:function(){
return Form.serialize(this.element);
}});
Abstract.EventObserver=function(){
};
Abstract.EventObserver.prototype={initialize:function(_123,_124){
this.element=$(_123);
this.callback=_124;
this.lastValue=this.getValue();
if(this.element.tagName.toLowerCase()=="form"){
this.registerFormCallbacks();
}else{
this.registerCallback(this.element);
}
},onElementEvent:function(){
var _125=this.getValue();
if(this.lastValue!=_125){
this.callback(this.element,_125);
this.lastValue=_125;
}
},registerFormCallbacks:function(){
var _126=Form.getElements(this.element);
for(var i=0;i<_126.length;i++){
this.registerCallback(_126[i]);
}
},registerCallback:function(_128){
if(_128.type){
switch(_128.type.toLowerCase()){
case "checkbox":
case "radio":
Event.observe(_128,"click",this.onElementEvent.bind(this));
break;
case "password":
case "text":
case "textarea":
case "select-one":
case "select-multiple":
Event.observe(_128,"change",this.onElementEvent.bind(this));
break;
}
}
}};
Form.Element.EventObserver=Class.create();
Form.Element.EventObserver.prototype=Object.extend(new Abstract.EventObserver(),{getValue:function(){
return Form.Element.getValue(this.element);
}});
Form.EventObserver=Class.create();
Form.EventObserver.prototype=Object.extend(new Abstract.EventObserver(),{getValue:function(){
return Form.serialize(this.element);
}});
if(!window.Event){
var Event=new Object();
}
Object.extend(Event,{KEY_BACKSPACE:8,KEY_TAB:9,KEY_RETURN:13,KEY_ESC:27,KEY_LEFT:37,KEY_UP:38,KEY_RIGHT:39,KEY_DOWN:40,KEY_DELETE:46,element:function(_129){
return _129.target||_129.srcElement;
},isLeftClick:function(_12a){
return (((_12a.which)&&(_12a.which==1))||((_12a.button)&&(_12a.button==1)));
},pointerX:function(_12b){
return _12b.pageX||(_12b.clientX+(document.documentElement.scrollLeft||document.body.scrollLeft));
},pointerY:function(_12c){
return _12c.pageY||(_12c.clientY+(document.documentElement.scrollTop||document.body.scrollTop));
},stop:function(_12d){
if(_12d.preventDefault){
_12d.preventDefault();
_12d.stopPropagation();
}else{
_12d.returnValue=false;
_12d.cancelBubble=true;
}
},findElement:function(_12e,_12f){
var _130=Event.element(_12e);
while(_130.parentNode&&(!_130.tagName||(_130.tagName.toUpperCase()!=_12f.toUpperCase()))){
_130=_130.parentNode;
}
return _130;
},observers:false,_observeAndCache:function(_131,name,_133,_134){
if(!this.observers){
this.observers=[];
}
if(_131.addEventListener){
this.observers.push([_131,name,_133,_134]);
_131.addEventListener(name,_133,_134);
}else{
if(_131.attachEvent){
this.observers.push([_131,name,_133,_134]);
_131.attachEvent("on"+name,_133);
}
}
},unloadCache:function(){
if(!Event.observers){
return;
}
for(var i=0;i<Event.observers.length;i++){
Event.stopObserving.apply(this,Event.observers[i]);
Event.observers[i][0]=null;
}
Event.observers=false;
},observe:function(_136,name,_138,_139){
var _13a=$(_136);
_139=_139||false;
if(name=="keypress"&&(navigator.appVersion.match(/Konqueror|Safari|KHTML/)||_13a.attachEvent)){
name="keydown";
}
this._observeAndCache(_13a,name,_138,_139);
},stopObserving:function(_13b,name,_13d,_13e){
var _13f=$(_13b);
_13e=_13e||false;
if(name=="keypress"&&(navigator.appVersion.match(/Konqueror|Safari|KHTML/)||_13f.detachEvent)){
name="keydown";
}
if(_13f.removeEventListener){
_13f.removeEventListener(name,_13d,_13e);
}else{
if(_13f.detachEvent){
_13f.detachEvent("on"+name,_13d);
}
}
}});
Event.observe(window,"unload",Event.unloadCache,false);
var Position={includeScrollOffsets:false,prepare:function(){
this.deltaX=window.pageXOffset||document.documentElement.scrollLeft||document.body.scrollLeft||0;
this.deltaY=window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0;
},realOffset:function(_140){
var _141=0,valueL=0;
do{
_141+=_140.scrollTop||0;
valueL+=_140.scrollLeft||0;
_140=_140.parentNode;
}while(_140);
return [valueL,_141];
},cumulativeOffset:function(_142){
var _143=0,valueL=0;
do{
_143+=_142.offsetTop||0;
valueL+=_142.offsetLeft||0;
_142=_142.offsetParent;
}while(_142);
return [valueL,_143];
},positionedOffset:function(_144){
var _145=0,valueL=0;
do{
_145+=_144.offsetTop||0;
valueL+=_144.offsetLeft||0;
_144=_144.offsetParent;
if(_144){
p=Element.getStyle(_144,"position");
if(p=="relative"||p=="absolute"){
break;
}
}
}while(_144);
return [valueL,_145];
},offsetParent:function(_146){
if(_146.offsetParent){
return _146.offsetParent;
}
if(_146==document.body){
return _146;
}
while((_146=_146.parentNode)&&_146!=document.body){
if(Element.getStyle(_146,"position")!="static"){
return _146;
}
}
return document.body;
},within:function(_147,x,y){
if(this.includeScrollOffsets){
return this.withinIncludingScrolloffsets(_147,x,y);
}
this.xcomp=x;
this.ycomp=y;
this.offset=this.cumulativeOffset(_147);
return (y>=this.offset[1]&&y<this.offset[1]+_147.offsetHeight&&x>=this.offset[0]&&x<this.offset[0]+_147.offsetWidth);
},withinIncludingScrolloffsets:function(_14a,x,y){
var _14d=this.realOffset(_14a);
this.xcomp=x+_14d[0]-this.deltaX;
this.ycomp=y+_14d[1]-this.deltaY;
this.offset=this.cumulativeOffset(_14a);
return (this.ycomp>=this.offset[1]&&this.ycomp<this.offset[1]+_14a.offsetHeight&&this.xcomp>=this.offset[0]&&this.xcomp<this.offset[0]+_14a.offsetWidth);
},overlap:function(mode,_14f){
if(!mode){
return 0;
}
if(mode=="vertical"){
return ((this.offset[1]+_14f.offsetHeight)-this.ycomp)/_14f.offsetHeight;
}
if(mode=="horizontal"){
return ((this.offset[0]+_14f.offsetWidth)-this.xcomp)/_14f.offsetWidth;
}
},clone:function(_150,_151){
_150=$(_150);
_151=$(_151);
_151.style.position="absolute";
var _152=this.cumulativeOffset(_150);
_151.style.top=_152[1]+"px";
_151.style.left=_152[0]+"px";
_151.style.width=_150.offsetWidth+"px";
_151.style.height=_150.offsetHeight+"px";
},page:function(_153){
var _154=0,valueL=0;
var _155=_153;
do{
_154+=_155.offsetTop||0;
valueL+=_155.offsetLeft||0;
if(_155.offsetParent==document.body){
if(Element.getStyle(_155,"position")=="absolute"){
break;
}
}
}while(_155=_155.offsetParent);
_155=_153;
do{
_154-=_155.scrollTop||0;
valueL-=_155.scrollLeft||0;
}while(_155=_155.parentNode);
return [valueL,_154];
},clone:function(_156,_157){
var _158=Object.extend({setLeft:true,setTop:true,setWidth:true,setHeight:true,offsetTop:0,offsetLeft:0},arguments[2]||{});
_156=$(_156);
var p=Position.page(_156);
_157=$(_157);
var _15a=[0,0];
var _15b=null;
if(Element.getStyle(_157,"position")=="absolute"){
_15b=Position.offsetParent(_157);
_15a=Position.page(_15b);
}
if(_15b==document.body){
_15a[0]-=document.body.offsetLeft;
_15a[1]-=document.body.offsetTop;
}
if(_158.setLeft){
_157.style.left=(p[0]-_15a[0]+_158.offsetLeft)+"px";
}
if(_158.setTop){
_157.style.top=(p[1]-_15a[1]+_158.offsetTop)+"px";
}
if(_158.setWidth){
_157.style.width=_156.offsetWidth+"px";
}
if(_158.setHeight){
_157.style.height=_156.offsetHeight+"px";
}
},absolutize:function(_15c){
_15c=$(_15c);
if(_15c.style.position=="absolute"){
return;
}
Position.prepare();
var _15d=Position.positionedOffset(_15c);
var top=_15d[1];
var left=_15d[0];
var _160=_15c.clientWidth;
var _161=_15c.clientHeight;
_15c._originalLeft=left-parseFloat(_15c.style.left||0);
_15c._originalTop=top-parseFloat(_15c.style.top||0);
_15c._originalWidth=_15c.style.width;
_15c._originalHeight=_15c.style.height;
_15c.style.position="absolute";
_15c.style.top=top+"px";
_15c.style.left=left+"px";
_15c.style.width=_160+"px";
_15c.style.height=_161+"px";
},relativize:function(_162){
_162=$(_162);
if(_162.style.position=="relative"){
return;
}
Position.prepare();
_162.style.position="relative";
var top=parseFloat(_162.style.top||0)-(_162._originalTop||0);
var left=parseFloat(_162.style.left||0)-(_162._originalLeft||0);
_162.style.top=top+"px";
_162.style.left=left+"px";
_162.style.height=_162._originalHeight;
_162.style.width=_162._originalWidth;
}};
if(/Konqueror|Safari|KHTML/.test(navigator.userAgent)){
Position.cumulativeOffset=function(_165){
var _166=0,valueL=0;
do{
_166+=_165.offsetTop||0;
valueL+=_165.offsetLeft||0;
if(_165.offsetParent==document.body){
if(Element.getStyle(_165,"position")=="absolute"){
break;
}
}
_165=_165.offsetParent;
}while(_165);
return [valueL,_166];
};
}
var Rico=new Object();
Rico.Corner={round:function(e,_168){
var e=$(e);
this._setOptions(_168);
var _16a=this.options.color;
if(this.options.color=="fromElement"){
_16a=this._background(e);
}
var _16b=this.options.bgColor;
if(this.options.bgColor=="fromParent"){
_16b=this._background(e.offsetParent);
}
this._roundCornersImpl(e,_16a,_16b);
},changeColor:function(_16c,_16d){
_16c.style.backgroundColor=_16d;
var _16e=_16c.parentNode.getElementsByTagName("span");
for(var _16f=0;_16f<_16e.length;_16f++){
_16e[_16f].style.backgroundColor=_16d;
}
},changeOpacity:function(_170,_171){
var _172=_171;
var _173="alpha(opacity="+_171*100+")";
_170.style.opacity=_172;
_170.style.filter=_173;
var _174=_170.parentNode.getElementsByTagName("span");
for(var _175=0;_175<_174.length;_175++){
_174[_175].style.opacity=_172;
_174[_175].style.filter=_173;
}
},reRound:function(_176,_177){
var _178=_176.parentNode.childNodes[0];
var _179=_176.parentNode.childNodes[2];
_176.parentNode.removeChild(_178);
_176.parentNode.removeChild(_179);
this.round(_176.parentNode,_177);
},_roundCornersImpl:function(e,_17b,_17c){
if(this.options.border){
this._renderBorder(e,_17c);
}
if(this._isTopRounded()){
this._roundTopCorners(e,_17b,_17c);
}
if(this._isBottomRounded()){
this._roundBottomCorners(e,_17b,_17c);
}
},_renderBorder:function(el,_17e){
var _17f="1px solid "+this._borderColor(_17e);
var _180="border-left: "+_17f;
var _181="border-right: "+_17f;
var _182="style='"+_180+";"+_181+"'";
el.innerHTML="<div "+_182+">"+el.innerHTML+"</div>";
},_roundTopCorners:function(el,_184,_185){
var _186=this._createCorner(_185);
for(var i=0;i<this.options.numSlices;i++){
_186.appendChild(this._createCornerSlice(_184,_185,i,"top"));
}
el.style.paddingTop=0;
el.insertBefore(_186,el.firstChild);
},_roundBottomCorners:function(el,_189,_18a){
var _18b=this._createCorner(_18a);
for(var i=(this.options.numSlices-1);i>=0;i--){
_18b.appendChild(this._createCornerSlice(_189,_18a,i,"bottom"));
}
el.style.paddingBottom=0;
el.appendChild(_18b);
},_createCorner:function(_18d){
var _18e=document.createElement("div");
_18e.style.backgroundColor=(this._isTransparent()?"transparent":_18d);
return _18e;
},_createCornerSlice:function(_18f,_190,n,_192){
var _193=document.createElement("span");
var _194=_193.style;
_194.backgroundColor=_18f;
_194.display="block";
_194.height="1px";
_194.overflow="hidden";
_194.fontSize="1px";
var _195=this._borderColor(_18f,_190);
if(this.options.border&&n==0){
_194.borderTopStyle="solid";
_194.borderTopWidth="1px";
_194.borderLeftWidth="0px";
_194.borderRightWidth="0px";
_194.borderBottomWidth="0px";
_194.height="0px";
_194.borderColor=_195;
}else{
if(_195){
_194.borderColor=_195;
_194.borderStyle="solid";
_194.borderWidth="0px 1px";
}
}
if(!this.options.compact&&(n==(this.options.numSlices-1))){
_194.height="2px";
}
this._setMargin(_193,n,_192);
this._setBorder(_193,n,_192);
return _193;
},_setOptions:function(_196){
this.options={corners:"all",color:"fromElement",bgColor:"fromParent",blend:true,border:false,compact:false};
Object.extend(this.options,_196||{});
this.options.numSlices=this.options.compact?2:4;
if(this._isTransparent()){
this.options.blend=false;
}
},_whichSideTop:function(){
if(this._hasString(this.options.corners,"all","top")){
return "";
}
if(this.options.corners.indexOf("tl")>=0&&this.options.corners.indexOf("tr")>=0){
return "";
}
if(this.options.corners.indexOf("tl")>=0){
return "left";
}else{
if(this.options.corners.indexOf("tr")>=0){
return "right";
}
}
return "";
},_whichSideBottom:function(){
if(this._hasString(this.options.corners,"all","bottom")){
return "";
}
if(this.options.corners.indexOf("bl")>=0&&this.options.corners.indexOf("br")>=0){
return "";
}
if(this.options.corners.indexOf("bl")>=0){
return "left";
}else{
if(this.options.corners.indexOf("br")>=0){
return "right";
}
}
return "";
},_borderColor:function(_197,_198){
if(_197=="transparent"){
return _198;
}else{
if(this.options.border){
return this.options.border;
}else{
if(this.options.blend){
return this._blend(_198,_197);
}else{
return "";
}
}
}
},_setMargin:function(el,n,_19b){
var _19c=this._marginSize(n);
var _19d=_19b=="top"?this._whichSideTop():this._whichSideBottom();
if(_19d=="left"){
el.style.marginLeft=_19c+"px";
el.style.marginRight="0px";
}else{
if(_19d=="right"){
el.style.marginRight=_19c+"px";
el.style.marginLeft="0px";
}else{
el.style.marginLeft=_19c+"px";
el.style.marginRight=_19c+"px";
}
}
},_setBorder:function(el,n,_1a0){
var _1a1=this._borderSize(n);
var _1a2=_1a0=="top"?this._whichSideTop():this._whichSideBottom();
if(_1a2=="left"){
el.style.borderLeftWidth=_1a1+"px";
el.style.borderRightWidth="0px";
}else{
if(_1a2=="right"){
el.style.borderRightWidth=_1a1+"px";
el.style.borderLeftWidth="0px";
}else{
el.style.borderLeftWidth=_1a1+"px";
el.style.borderRightWidth=_1a1+"px";
}
}
if(this.options.border!=false){
el.style.borderLeftWidth=_1a1+"px";
}
el.style.borderRightWidth=_1a1+"px";
},_marginSize:function(n){
if(this._isTransparent()){
return 0;
}
var _1a4=[5,3,2,1];
var _1a5=[3,2,1,0];
var _1a6=[2,1];
var _1a7=[1,0];
if(this.options.compact&&this.options.blend){
return _1a7[n];
}else{
if(this.options.compact){
return _1a6[n];
}else{
if(this.options.blend){
return _1a5[n];
}else{
return _1a4[n];
}
}
}
},_borderSize:function(n){
var _1a9=[5,3,2,1];
var _1aa=[2,1,1,1];
var _1ab=[1,0];
var _1ac=[0,2,0,0];
if(this.options.compact&&(this.options.blend||this._isTransparent())){
return 1;
}else{
if(this.options.compact){
return _1ab[n];
}else{
if(this.options.blend){
return _1aa[n];
}else{
if(this.options.border){
return _1ac[n];
}else{
if(this._isTransparent()){
return _1a9[n];
}
}
}
}
}
return 0;
},_hasString:function(str){
for(var i=1;i<arguments.length;i++){
if(str.indexOf(arguments[i])>=0){
return true;
}
}
return false;
},_blend:function(c1,c2){
var cc1=Rico.Color.createFromHex(c1);
cc1.blend(Rico.Color.createFromHex(c2));
return cc1;
},_background:function(el){
try{
return Rico.Color.createColorFromBackground(el).asHex();
}
catch(err){
return "#ffffff";
}
},_isTransparent:function(){
return this.options.color=="transparent";
},_isTopRounded:function(){
return this._hasString(this.options.corners,"all","top","tl","tr");
},_isBottomRounded:function(){
return this._hasString(this.options.corners,"all","bottom","bl","br");
},_hasSingleTextChild:function(el){
return el.childNodes.length==1&&el.childNodes[0].nodeType==3;
}};
_OPENLAYERS_SFL_=true;
OpenLayers=new Object();
OpenLayers._scriptName="lib/OpenLayers.js";
OpenLayers._getScriptLocation=function(){
var _1b4="";
var _1b5=OpenLayers._scriptName;
var _1b6=document.getElementsByTagName("script");
for(var i=0;i<_1b6.length;i++){
var src=_1b6[i].getAttribute("src");
if(src){
var _1b9=src.lastIndexOf(_1b5);
if((_1b9>-1)&&(_1b9+_1b5.length==src.length)){
_1b4=src.slice(0,-_1b5.length);
break;
}
}
}
return _1b4;
};
if(typeof (_OPENLAYERS_SFL_)=="undefined"){
(function(){
var _1ba=new Array("Prototype.js","Rico/Corner.js","Rico/Color.js","OpenLayers/Util.js","OpenLayers/Ajax.js","OpenLayers/Events.js","OpenLayers/Map.js","OpenLayers/Layer.js","OpenLayers/Icon.js","OpenLayers/Marker.js","OpenLayers/Popup.js","OpenLayers/Tile.js","OpenLayers/Feature.js","OpenLayers/Feature/WFS.js","OpenLayers/Tile/Image.js","OpenLayers/Tile/WFS.js","OpenLayers/Layer/Google.js","OpenLayers/Layer/Grid.js","OpenLayers/Layer/Markers.js","OpenLayers/Layer/Text.js","OpenLayers/Layer/WMS.js","OpenLayers/Layer/WFS.js","OpenLayers/Popup/Anchored.js","OpenLayers/Popup/AnchoredBubble.js","OpenLayers/Control.js","OpenLayers/Control/MouseDefaults.js","OpenLayers/Control/KeyboardDefaults.js","OpenLayers/Control/PanZoom.js","OpenLayers/Control/PanZoomBar.js","OpenLayers/Control/LayerSwitcher.js");
var _1bb="";
var host=OpenLayers._getScriptLocation()+"lib/";
var _1bd=1;
try{
x=Prototype;
}
catch(e){
_1bd=0;
}
for(var i=_1bd;i<_1ba.length;i++){
var _1bf="<script src='"+host+_1ba[i]+"'></script>";
_1bb+=_1bf;
}
document.write(_1bb);
})();
}
OpenLayers.ProxyHost="/viewer/Crossbrowser/blindproxy.py?url=";
OpenLayers.nullHandler=function(_1c0){
};
OpenLayers.loadURL=function(uri,_1c2,_1c3,_1c4,_1c5){
if(OpenLayers.ProxyHost&&uri.startsWith("http")){
uri=OpenLayers.ProxyHost+escape(uri);
if(!_1c2){
_1c2="";
}
_1c2+="&cachehack="+new Date().getTime();
}
var _1c6;
var _1c7;
var _1c8=null;
var _1c9=null;
if(_1c4){
_1c6=_1c3.handlers[_1c4];
_1c8=_1c3;
}else{
_1c6=OpenLayers.nullHandler;
}
if(_1c5){
_1c7=_1c3.handlers[_1c5];
_1c9=_1c3;
}else{
_1c7=OpenLayers.nullHandler;
}
new Ajax.Request(uri,{method:"get",parameters:_1c2,onComplete:_1c6.bind(_1c8),onFailure:_1c7.bind(_1c9)});
};
OpenLayers.parseXMLString=function(text){
var _1cb=text.indexOf("<");
if(_1cb>0){
text=text.substring(_1cb);
}
var _1cc=Try.these(function(){
var _1cd=new ActiveXObject("Microsoft.XMLDOM");
_1cd.loadXML(text);
return _1cd;
},function(){
return new DOMParser().parseFromString(text,"text/xml");
},function(){
var req=new XMLHttpRequest();
req.open("GET","data:"+"text/xml"+";charset=utf-8,"+encodeURIComponent(text),false);
if(req.overrideMimeType){
req.overrideMimeType("text/xml");
}
req.send(null);
return req.responseXML;
});
return _1cc;
};
OpenLayers.Control=Class.create();
OpenLayers.Control.prototype={map:null,div:null,position:null,initialize:function(_1cf){
Object.extend(this,_1cf);
},draw:function(px){
if(this.div==null){
this.div=OpenLayers.Util.createDiv();
}
if(px!=null){
this.position=px.copyOf();
}
this.moveTo(this.position);
return this.div;
},moveTo:function(px){
if((px!=null)&&(this.div!=null)){
this.div.style.left=px.x+"px";
this.div.style.top=px.x+"px";
}
},destroy:function(){
this.map=null;
},CLASS_NAME:"OpenLayers.Control"};
OpenLayers.Events=Class.create();
OpenLayers.Events.prototype={BROWSER_EVENTS:["mouseover","mouseout","mousedown","mouseup","mousemove","click","dblclick","resize","focus","blur"],listeners:null,object:null,div:null,eventTypes:null,initialize:function(_1d2,div,_1d4){
this.listeners={};
this.object=_1d2;
this.div=div;
this.eventTypes=_1d4;
if(_1d4){
for(var i=0;i<this.eventTypes.length;i++){
this.listeners[this.eventTypes[i]]=[];
}
}
for(var i=0;i<this.BROWSER_EVENTS.length;i++){
var _1d7=this.BROWSER_EVENTS[i];
this.listeners[_1d7]=[];
Event.observe(div,_1d7,this.handleBrowserEvent.bindAsEventListener(this));
}
Event.observe(div,"dragstart",Event.stop);
},register:function(type,obj,func){
var _1db=this.listeners[type];
_1db.push(func.bindAsEventListener(obj));
},remove:function(type){
this.listeners[type].pop();
},handleBrowserEvent:function(evt){
evt.xy=this.getMousePosition(evt);
this.triggerEvent(evt.type,evt);
},getMousePosition:function(evt){
if(!this.div.offsets){
this.div.offsets=Position.page(this.div);
}
return new OpenLayers.Pixel(evt.clientX-this.div.offsets[0],evt.clientY-this.div.offsets[1]);
},triggerEvent:function(type,evt){
if(evt==null){
evt={};
}
evt.object=this.object;
var _1e1=this.listeners[type];
for(var i=0;i<_1e1.length;i++){
var _1e3=_1e1[i];
_1e3(evt);
}
}};
OpenLayers.Feature=Class.create();
OpenLayers.Feature.prototype={events:null,layer:null,id:null,lonlat:null,data:null,marker:null,popup:null,initialize:function(_1e4,_1e5,data,id){
this.layer=_1e4;
this.lonlat=_1e5;
this.data=(data!=null)?data:new Object();
this.id=(id?id:"f"+Math.random());
},destroy:function(){
this.layer=null;
},createMarker:function(){
var _1e8=null;
if(this.lonlat!=null){
this.marker=new OpenLayers.Marker(this.lonlat,this.data.icon);
}
return this.marker;
},createPopup:function(){
if(this.lonlat!=null){
var id=this.id+"_popup";
var _1ea=(this.marker)?this.marker.icon:null;
this.popup=new OpenLayers.Popup.AnchoredBubble(id,this.lonlat,this.data.popupSize,this.data.popupContentHTML,_1ea);
}
return this.popup;
},CLASS_NAME:"OpenLayers.Feature"};
OpenLayers.Feature.WFS=Class.create();
OpenLayers.Feature.WFS.prototype=Object.extend(new OpenLayers.Feature(),{initialize:function(_1eb,_1ec){
var _1ed=arguments;
if(arguments.length>0){
var data=this.processXMLNode(_1ec);
_1ed=new Array(_1eb,data.lonlat,data,data.id);
}
OpenLayers.Feature.prototype.initialize.apply(this,_1ed);
if(arguments.length>0){
this.createMarker();
this.layer.addMarker(this.marker);
}
},processXMLNode:function(_1ef){
},CLASS_NAME:"OpenLayers.Feature.WFS"});
OpenLayers.Icon=Class.create();
OpenLayers.Icon.prototype={url:null,size:null,offset:null,calculateOffset:null,imageDiv:null,px:null,initialize:function(url,size,_1f2,_1f3){
this.url=url;
this.size=(size)?size:new OpenLayers.Size(20,20);
this.offset=(_1f2)?_1f2:new OpenLayers.Pixel(0,0);
this.calculateOffset=_1f3;
this.imageDiv=OpenLayers.Util.createAlphaImageDiv();
},clone:function(){
return new OpenLayers.Icon(this.size,this.url,this.offset);
},setSize:function(size){
if(size!=null){
this.size=size;
}
this.draw();
},draw:function(px){
OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv,null,null,this.size,this.url,"absolute");
this.moveTo(px);
return this.imageDiv;
},moveTo:function(px){
if(px!=null){
this.px=px;
}
if((this.px!=null)&&(this.imageDiv!=null)){
if(this.calculateOffset){
this.offset=this.calculateOffset(this.size);
}
var _1f7=this.px.offset(this.offset);
OpenLayers.Util.modifyAlphaImageDiv(this.imageDiv,null,_1f7);
}
},CLASS_NAME:"OpenLayers.Icon"};
OpenLayers.Layer=Class.create();
OpenLayers.Layer.prototype={name:null,div:null,map:null,projection:null,initialize:function(name){
if(arguments.length>0){
this.name=name;
if(this.div==null){
this.div=OpenLayers.Util.createDiv();
this.div.style.width="100%";
this.div.style.height="100%";
}
}
},destroy:function(){
this.map=null;
},moveTo:function(_1f9,_1fa){
return;
},getVisibility:function(){
return (this.div.style.display!="none");
},setVisibility:function(_1fb){
this.div.style.display=(_1fb)?"block":"none";
if((_1fb)&&(this.map!=null)){
this.moveTo(this.map.getExtent());
}
},CLASS_NAME:"OpenLayers.Layer"};
OpenLayers.Marker=Class.create();
OpenLayers.Marker.prototype={icon:null,lonlat:null,events:null,map:null,initialize:function(_1fc,icon){
this.lonlat=_1fc;
this.icon=(icon)?icon:OpenLayers.Marker.defaultIcon();
this.events=new OpenLayers.Events(this,this.icon.imageDiv,null);
},draw:function(px){
return this.icon.draw(px);
},moveTo:function(px){
if((px!=null)&&(this.icon!=null)){
this.icon.moveTo(px);
}
},inflate:function(_200){
if(this.icon){
var _201=new OpenLayers.Size(this.icon.size.w*_200,this.icon.size.h*_200);
this.icon.setSize(_201);
}
},CLASS_NAME:"OpenLayers.Marker"};
OpenLayers.Marker.defaultIcon=function(){
var url=OpenLayers.Util.getImagesLocation()+"marker.png";
var size=new OpenLayers.Size(21,25);
var _204=function(size){
return new OpenLayers.Pixel(-(size.w/2),-size.h);
};
return new OpenLayers.Icon(url,size,null,_204);
};
OpenLayers.Popup=Class.create();
OpenLayers.Popup.count=0;
OpenLayers.Popup.WIDTH=200;
OpenLayers.Popup.HEIGHT=200;
OpenLayers.Popup.COLOR="white";
OpenLayers.Popup.OPACITY=1;
OpenLayers.Popup.BORDER="0px";
OpenLayers.Popup.prototype={events:null,id:"",lonlat:null,div:null,size:null,contentHTML:"",backgroundColor:"",opacity:"",border:"",map:null,initialize:function(id,_207,size,_209){
OpenLayers.Popup.count+=1;
this.id=(id!=null)?id:"Popup"+OpenLayers.Popup.count;
this.lonlat=_207;
this.size=(size!=null)?size:new OpenLayers.Size(OpenLayers.Popup.WIDTH,OpenLayers.Popup.HEIGHT);
if(_209!=null){
this.contentHTML=_209;
}
this.backgroundColor=OpenLayers.Popup.COLOR;
this.opacity=OpenLayers.Popup.OPACITY;
this.border=OpenLayers.Popup.BORDER;
this.div=OpenLayers.Util.createDiv(this.id+"_div",null,null,null,null,null,"hidden");
this.events=new OpenLayers.Events(this,this.div,null);
},destroy:function(){
if((this.div)&&(this.div.parentNode)){
this.div.parentNode.removeChild(this.div);
}
this.div=null;
this.map=null;
},draw:function(px){
if(px==null){
if((this.lonlat!=null)&&(this.map!=null)){
px=this.map.getLayerPxFromLonLat(this.lonlat);
}
}
this.setSize();
this.setBackgroundColor();
this.setOpacity();
this.setBorder();
this.setContentHTML();
this.moveTo(px);
return this.div;
},updatePosition:function(){
if((this.lonlat)&&(this.map)){
var px=this.map.getLayerPxFromLonLat(this.lonlat);
this.moveTo(px);
}
},moveTo:function(px){
if((px!=null)&&(this.div!=null)){
this.div.style.left=px.x+"px";
this.div.style.top=px.y+"px";
}
},visible:function(){
return Element.visible(this.div);
},toggle:function(){
Element.toggle(this.div);
},show:function(){
Element.show(this.div);
},hide:function(){
Element.hide(this.div);
},setSize:function(size){
if(size!=undefined){
this.size=size;
}
if(this.div!=null){
this.div.style.width=this.size.w;
this.div.style.height=this.size.h;
}
},setBackgroundColor:function(_20e){
if(_20e!=undefined){
this.backgroundColor=_20e;
}
if(this.div!=null){
this.div.style.backgroundColor=this.backgroundColor;
}
},setOpacity:function(_20f){
if(_20f!=undefined){
this.opacity=_20f;
}
if(this.div!=null){
this.div.style.opacity=this.opacity;
this.div.style.filter="alpha(opacity="+this.opacity*100+")";
}
},setBorder:function(_210){
if(_210!=undefined){
this.border=_210;
}
if(this.div!=null){
this.div.style.border=this.border;
}
},setContentHTML:function(_211){
if(_211!=null){
this.contentHTML=_211;
}
if(this.div!=null){
this.div.innerHTML=this.contentHTML;
}
},CLASS_NAME:"OpenLayers.Popup"};
OpenLayers.Tile=Class.create();
OpenLayers.Tile.prototype={layer:null,url:null,bounds:null,size:null,position:null,initialize:function(_212,_213,_214,url,size){
if(arguments.length>0){
this.layer=_212;
this.position=_213;
this.bounds=_214;
this.url=url;
this.size=size;
}
},destroy:function(){
this.layer=null;
this.bounds=null;
this.size=null;
},draw:function(){
},remove:function(){
},getPosition:function(){
return this.position;
},CLASS_NAME:"OpenLayers.Tile"};
OpenLayers.Util=new Object();
OpenLayers.Pixel=Class.create();
OpenLayers.Pixel.prototype={x:0,y:0,initialize:function(x,y){
this.x=x;
this.y=y;
},toString:function(){
return ("x="+this.x+",y="+this.y);
},copyOf:function(){
return new OpenLayers.Pixel(this.x,this.y);
},equals:function(px){
return ((this.x==px.x)&&(this.y==px.y));
},add:function(x,y){
return new OpenLayers.Pixel(this.x+x,this.y+y);
},offset:function(px){
return this.add(px.x,px.y);
},CLASS_NAME:"OpenLayers.Pixel"};
OpenLayers.Size=Class.create();
OpenLayers.Size.prototype={w:0,h:0,initialize:function(w,h){
this.w=w;
this.h=h;
},toString:function(){
return ("w="+this.w+",h="+this.h);
},copyOf:function(){
return new OpenLayers.Size(this.w,this.h);
},equals:function(sz){
return ((this.w==sz.w)&&(this.h==sz.h));
},CLASS_NAME:"OpenLayers.Size"};
OpenLayers.LonLat=Class.create();
OpenLayers.LonLat.prototype={lon:0,lat:0,initialize:function(lon,lat){
this.lon=lon;
this.lat=lat;
},toString:function(){
return ("lon="+this.lon+",lat="+this.lat);
},toShortString:function(){
return (this.lon+", "+this.lat);
},copyOf:function(){
return new OpenLayers.LonLat(this.lon,this.lat);
},add:function(lon,lat){
return new OpenLayers.LonLat(this.lon+lon,this.lat+lat);
},equals:function(ll){
return ((this.lon==ll.lon)&&(this.lat==ll.lat));
},CLASS_NAME:"OpenLayers.LonLat"};
OpenLayers.LonLat.fromString=function(str){
var pair=str.split(",");
return new OpenLayers.LonLat(parseFloat(pair[0]),parseFloat(pair[1]));
};
OpenLayers.Bounds=Class.create();
OpenLayers.Bounds.prototype={left:0,bottom:0,right:0,top:0,initialize:function(left,_228,_229,top){
this.left=left;
this.bottom=_228;
this.right=_229;
this.top=top;
},copyOf:function(){
return new OpenLayers.Bounds(this.left,this.bottom,this.right,this.top);
},equals:function(_22b){
return ((this.left==_22b.left)&&(this.right==_22b.right)&&(this.top==_22b.top)&&(this.bottom==_22b.bottom));
},toString:function(){
return ("left-bottom=("+this.left+","+this.bottom+")"+" right-top=("+this.right+","+this.top+")");
},toBBOX:function(){
return (this.left+","+this.bottom+","+this.right+","+this.top);
},getWidth:function(){
return (this.right-this.left);
},getHeight:function(){
return (this.top-this.bottom);
},getSize:function(){
return new OpenLayers.Size(this.getWidth(),this.getHeight());
},getCenterPixel:function(){
return new OpenLayers.Pixel(this.left+(this.getWidth()/2),this.bottom+(this.getHeight()/2));
},getCenterLonLat:function(){
return new OpenLayers.LonLat(this.left+(this.getWidth()/2),this.bottom+(this.getHeight()/2));
},add:function(x,y){
return new OpenLayers.Box(this.left+x,this.bottom+y,this.right+x,this.top+y);
},contains:function(x,y,_230){
if(_230==null){
_230=true;
}
var _231=false;
if(_230){
_231=((x>=this.left)&&(x<=this.right)&&(y>=this.bottom)&&(y<=this.top));
}else{
_231=((x>this.left)&&(x<this.right)&&(y>this.bottom)&&(y<this.top));
}
return _231;
},containsBounds:function(_232,_233,_234){
if(_233==null){
_233=false;
}
if(_234==null){
_234=true;
}
var _235;
var _236;
var _237;
var _238;
if(_234){
_235=(_232.left>=this.left)&&(_232.left<=this.right);
_236=(_232.top>=this.bottom)&&(_232.top<=this.top);
_237=(_232.right>=this.left)&&(_232.right<=this.right);
_238=(_232.bottom>=this.bottom)&&(_232.bottom<=this.top);
}else{
_235=(_232.left>this.left)&&(_232.left<this.right);
_236=(_232.top>this.bottom)&&(_232.top<this.top);
_237=(_232.right>this.left)&&(_232.right<this.right);
_238=(_232.bottom>this.bottom)&&(_232.bottom<this.top);
}
return (_233)?(_236||_238)&&(_235||_237):(_236&&_235&&_238&&_237);
},determineQuadrant:function(_239){
var _23a="";
var _23b=this.getCenterLonLat();
_23a+=(_239.lat<_23b.lat)?"b":"t";
_23a+=(_239.lon<_23b.lon)?"l":"r";
return _23a;
},CLASS_NAME:"OpenLayers.Bounds"};
OpenLayers.Bounds.fromString=function(str){
var _23d=str.split(",");
return new OpenLayers.Bounds(parseFloat(_23d[0]),parseFloat(_23d[1]),parseFloat(_23d[2]),parseFloat(_23d[3]));
};
OpenLayers.Bounds.oppositeQuadrant=function(_23e){
var opp="";
opp+=(_23e.charAt(0)=="t")?"b":"t";
opp+=(_23e.charAt(1)=="l")?"r":"l";
return opp;
};
String.prototype.startsWith=function(_240){
return (this.substr(0,_240.length)==_240);
};
String.prototype.trim=function(){
var b=0;
while(this.substr(b,1)==" "){
b++;
}
var e=this.length-1;
while(this.substr(e,1)==" "){
e--;
}
return this.substring(b,e+1);
};
Array.prototype.remove=function(item){
for(var i=0;i<this.length;i++){
if(this[i]==item){
this.splice(i,1);
}
}
return this;
};
Array.prototype.copyOf=function(){
var copy=new Array();
for(var i=0;i<this.length;i++){
copy[i]=this[i];
}
return copy;
};
Array.prototype.prepend=function(item){
this.splice(0,0,item);
};
Array.prototype.append=function(item){
this[this.length]=item;
};
Array.prototype.clear=function(){
this.length=0;
};
Array.prototype.indexOf=function(_249){
var _24a=-1;
for(var i=0;i<this.length;i++){
if(this[i]==_249){
_24a=i;
break;
}
}
return _24a;
};
OpenLayers.Util.modifyDOMElement=function(_24c,id,px,sz,_250,_251,_252){
if(id){
_24c.id=id;
}
if(px){
_24c.style.left=px.x;
_24c.style.top=px.y;
}
if(sz){
_24c.style.width=sz.w+"px";
_24c.style.height=sz.h+"px";
}
if(_250){
_24c.style.position=_250;
}
if(_251){
_24c.style.border=_251;
}
if(_252){
_24c.style.overflow=_252;
}
};
OpenLayers.Util.createDiv=function(id,px,sz,_256,_257,_258,_259){
var dom=document.createElement("div");
dom.style.padding="0";
dom.style.margin="0";
dom.style.cursor="inherit";
if(_256){
dom.style.backgroundImage="url("+_256+")";
}
if(!id){
id="OpenLayersDiv"+(Math.random()*10000%10000);
}
if(!_257){
_257="absolute";
}
OpenLayers.Util.modifyDOMElement(dom,id,px,sz,_257,_258,_259);
return dom;
};
OpenLayers.Util.createImage=function(id,px,sz,_25e,_25f,_260){
image=document.createElement("img");
image.style.alt=id;
image.style.cursor="inherit";
image.galleryImg="no";
if(_25e){
image.src=_25e;
}
if(!id){
id="OpenLayersDiv"+(Math.random()*10000%10000);
}
if(!_25f){
_25f="relative";
}
OpenLayers.Util.modifyDOMElement(image,id,px,sz,_25f,_260);
return image;
};
OpenLayers.Util.alphaHack=function(){
var _261=navigator.appVersion.split("MSIE");
var _262=parseFloat(_261[1]);
return ((document.body.filters)&&(_262>=5.5)&&(_262<7));
};
OpenLayers.Util.modifyAlphaImageDiv=function(div,id,px,sz,_267,_268,_269,_26a){
OpenLayers.Util.modifyDOMElement(div,id,px,sz);
var img=div.childNodes[0];
if(_267){
img.src=_267;
}
OpenLayers.Util.modifyDOMElement(img,div.id+"_innerImage",null,sz,"relative",_269);
if(OpenLayers.Util.alphaHack()){
div.style.display="inline-block";
if(_26a==null){
_26a="scale";
}
div.style.filter="progid:DXImageTransform.Microsoft"+".AlphaImageLoader(src='"+img.src+"', "+"sizingMethod='"+_26a+"')";
img.style.filter="progid:DXImageTransform.Microsoft"+".Alpha(opacity=0)";
}
};
OpenLayers.Util.createAlphaImageDiv=function(id,px,sz,_26f,_270,_271,_272){
var div=OpenLayers.Util.createDiv();
var img=OpenLayers.Util.createImage();
div.appendChild(img);
OpenLayers.Util.modifyAlphaImageDiv(div,id,px,sz,_26f,_270,_271,_272);
return div;
};
OpenLayers.Util.getParameterString=function(_275){
paramsArray=new Array();
for(var key in _275){
var _277=_275[key];
if(typeof _277=="function"){
continue;
}
paramsArray.push(key+"="+_277);
}
return paramsArray.join("&");
};
OpenLayers.Util.getImagesLocation=function(){
return OpenLayers._getScriptLocation()+"img/";
};
OpenLayers.Util.applyDefaults=function(to,from){
for(var key in from){
if(to[key]==null){
to[key]=from[key];
}
}
return to;
};
OpenLayers.Util.getNodes=function(p,_27c){
var _27d=Try.these(function(){
return OpenLayers.Util._getNodes(p.documentElement.childNodes,_27c);
},function(){
return OpenLayers.Util._getNodes(p.childNodes,_27c);
});
return _27d;
};
OpenLayers.Util._getNodes=function(_27e,_27f){
var _280=new Array();
for(var i=0;i<_27e.length;i++){
if(_27e[i].nodeName==_27f){
_280.push(_27e[i]);
}
}
return _280;
};
OpenLayers.Util.getTagText=function(_282,item,_284){
var _285=OpenLayers.Util.getNodes(_282,item);
if(_285&&(_285.length>0)){
if(!_284){
_284=0;
}
if(_285[_284].childNodes.length>1){
return _285.childNodes[1].nodeValue;
}else{
if(_285[_284].childNodes.length==1){
return _285[_284].firstChild.nodeValue;
}
}
}else{
return "";
}
};
OpenLayers.Util.mouseLeft=function(evt,div){
var _288=(evt.relatedTarget)?evt.relatedTarget:evt.toElement;
while(_288!=div&&_288!=null){
_288=_288.parentNode;
}
return (_288!=div);
};
Rico.Color=Class.create();
Rico.Color.prototype={initialize:function(red,_28a,blue){
this.rgb={r:red,g:_28a,b:blue};
},setRed:function(r){
this.rgb.r=r;
},setGreen:function(g){
this.rgb.g=g;
},setBlue:function(b){
this.rgb.b=b;
},setHue:function(h){
var hsb=this.asHSB();
hsb.h=h;
this.rgb=Rico.Color.HSBtoRGB(hsb.h,hsb.s,hsb.b);
},setSaturation:function(s){
var hsb=this.asHSB();
hsb.s=s;
this.rgb=Rico.Color.HSBtoRGB(hsb.h,hsb.s,hsb.b);
},setBrightness:function(b){
var hsb=this.asHSB();
hsb.b=b;
this.rgb=Rico.Color.HSBtoRGB(hsb.h,hsb.s,hsb.b);
},darken:function(_295){
var hsb=this.asHSB();
this.rgb=Rico.Color.HSBtoRGB(hsb.h,hsb.s,Math.max(hsb.b-_295,0));
},brighten:function(_297){
var hsb=this.asHSB();
this.rgb=Rico.Color.HSBtoRGB(hsb.h,hsb.s,Math.min(hsb.b+_297,1));
},blend:function(_299){
this.rgb.r=Math.floor((this.rgb.r+_299.rgb.r)/2);
this.rgb.g=Math.floor((this.rgb.g+_299.rgb.g)/2);
this.rgb.b=Math.floor((this.rgb.b+_299.rgb.b)/2);
},isBright:function(){
var hsb=this.asHSB();
return this.asHSB().b>0.5;
},isDark:function(){
return !this.isBright();
},asRGB:function(){
return "rgb("+this.rgb.r+","+this.rgb.g+","+this.rgb.b+")";
},asHex:function(){
return "#"+this.rgb.r.toColorPart()+this.rgb.g.toColorPart()+this.rgb.b.toColorPart();
},asHSB:function(){
return Rico.Color.RGBtoHSB(this.rgb.r,this.rgb.g,this.rgb.b);
},toString:function(){
return this.asHex();
}};
Rico.Color.createFromHex=function(_29b){
if(_29b.length==4){
var _29c=_29b;
var _29d="#";
for(var i=1;i<4;i++){
_29d+=(_29c.charAt(i)+_29c.charAt(i));
}
}
if(_29d.indexOf("#")==0){
_29d=_29d.substring(1);
}
var red=_29d.substring(0,2);
var _2a0=_29d.substring(2,4);
var blue=_29d.substring(4,6);
return new Rico.Color(parseInt(red,16),parseInt(_2a0,16),parseInt(blue,16));
};
Rico.Color.createColorFromBackground=function(elem){
var _2a3=RicoUtil.getElementsComputedStyle($(elem),"backgroundColor","background-color");
if(_2a3=="transparent"&&elem.parentNode){
return Rico.Color.createColorFromBackground(elem.parentNode);
}
if(_2a3==null){
return new Rico.Color(255,255,255);
}
if(_2a3.indexOf("rgb(")==0){
var _2a4=_2a3.substring(4,_2a3.length-1);
var _2a5=_2a4.split(",");
return new Rico.Color(parseInt(_2a5[0]),parseInt(_2a5[1]),parseInt(_2a5[2]));
}else{
if(_2a3.indexOf("#")==0){
return Rico.Color.createFromHex(_2a3);
}else{
return new Rico.Color(255,255,255);
}
}
};
Rico.Color.HSBtoRGB=function(hue,_2a7,_2a8){
var red=0;
var _2aa=0;
var blue=0;
if(_2a7==0){
red=parseInt(_2a8*255+0.5);
_2aa=red;
blue=red;
}else{
var h=(hue-Math.floor(hue))*6;
var f=h-Math.floor(h);
var p=_2a8*(1-_2a7);
var q=_2a8*(1-_2a7*f);
var t=_2a8*(1-(_2a7*(1-f)));
switch(parseInt(h)){
case 0:
red=(_2a8*255+0.5);
_2aa=(t*255+0.5);
blue=(p*255+0.5);
break;
case 1:
red=(q*255+0.5);
_2aa=(_2a8*255+0.5);
blue=(p*255+0.5);
break;
case 2:
red=(p*255+0.5);
_2aa=(_2a8*255+0.5);
blue=(t*255+0.5);
break;
case 3:
red=(p*255+0.5);
_2aa=(q*255+0.5);
blue=(_2a8*255+0.5);
break;
case 4:
red=(t*255+0.5);
_2aa=(p*255+0.5);
blue=(_2a8*255+0.5);
break;
case 5:
red=(_2a8*255+0.5);
_2aa=(p*255+0.5);
blue=(q*255+0.5);
break;
}
}
return {r:parseInt(red),g:parseInt(_2aa),b:parseInt(blue)};
};
Rico.Color.RGBtoHSB=function(r,g,b){
var hue;
var _2b5;
var _2b6;
var cmax=(r>g)?r:g;
if(b>cmax){
cmax=b;
}
var cmin=(r<g)?r:g;
if(b<cmin){
cmin=b;
}
_2b6=cmax/255;
if(cmax!=0){
_2b5=(cmax-cmin)/cmax;
}else{
_2b5=0;
}
if(_2b5==0){
hue=0;
}else{
var redc=(cmax-r)/(cmax-cmin);
var _2ba=(cmax-g)/(cmax-cmin);
var _2bb=(cmax-b)/(cmax-cmin);
if(r==cmax){
hue=_2bb-_2ba;
}else{
if(g==cmax){
hue=2+redc-_2bb;
}else{
hue=4+_2ba-redc;
}
}
hue=hue/6;
if(hue<0){
hue=hue+1;
}
}
return {h:hue,s:_2b5,b:_2b6};
};
OpenLayers.Util=new Object();
OpenLayers.Pixel=Class.create();
OpenLayers.Pixel.prototype={x:0,y:0,initialize:function(x,y){
this.x=x;
this.y=y;
},toString:function(){
return ("x="+this.x+",y="+this.y);
},copyOf:function(){
return new OpenLayers.Pixel(this.x,this.y);
},equals:function(px){
return ((this.x==px.x)&&(this.y==px.y));
},add:function(x,y){
return new OpenLayers.Pixel(this.x+x,this.y+y);
},CLASS_NAME:"OpenLayers.Pixel"};
OpenLayers.Size=Class.create();
OpenLayers.Size.prototype={w:0,h:0,initialize:function(w,h){
this.w=w;
this.h=h;
},toString:function(){
return ("w="+this.w+",h="+this.h);
},copyOf:function(){
return new OpenLayers.Size(this.w,this.h);
},equals:function(sz){
return ((this.w==sz.w)&&(this.h==sz.h));
},CLASS_NAME:"OpenLayers.Size"};
OpenLayers.LonLat=Class.create();
OpenLayers.LonLat.prototype={lon:0,lat:0,initialize:function(lon,lat){
this.lon=lon;
this.lat=lat;
},toString:function(){
return ("lon="+this.lon+",lat="+this.lat);
},toShortString:function(){
return (this.lon+", "+this.lat);
},copyOf:function(){
return new OpenLayers.LonLat(this.lon,this.lat);
},add:function(lon,lat){
return new OpenLayers.LonLat(this.lon+lon,this.lat+lat);
},equals:function(ll){
return ((this.lon==ll.lon)&&(this.lat==ll.lat));
},CLASS_NAME:"OpenLayers.LonLat"};
OpenLayers.LonLat.fromString=function(str){
var pair=str.split(",");
return new OpenLayers.LonLat(parseFloat(pair[0]),parseFloat(pair[1]));
};
OpenLayers.Bounds=Class.create();
OpenLayers.Bounds.prototype={left:0,bottom:0,right:0,top:0,initialize:function(left,_2cc,_2cd,top){
this.left=left;
this.bottom=_2cc;
this.right=_2cd;
this.top=top;
},copyOf:function(){
return new OpenLayers.Bounds(this.left,this.bottom,this.right,this.top);
},toString:function(){
return ("left-bottom=("+this.left+","+this.bottom+")"+" right-top=("+this.right+","+this.top+")");
},toBBOX:function(){
return (this.left+","+this.bottom+","+this.right+","+this.top);
},getWidth:function(){
return (this.right-this.left);
},getHeight:function(){
return (this.top-this.bottom);
},getSize:function(){
return new OpenLayers.Size(this.getWidth(),this.getHeight());
},getCenterPixel:function(){
return new OpenLayers.Pixel(this.left+(this.getWidth()/2),this.bottom+(this.getHeight()/2));
},getCenterLonLat:function(){
return new OpenLayers.LonLat(this.left+(this.getWidth()/2),this.bottom+(this.getHeight()/2));
},add:function(x,y){
return new OpenLayers.Box(this.left+x,this.bottom+y,this.right+x,this.top+y);
},contains:function(x,y,_2d3){
if(_2d3==null){
_2d3=true;
}
var _2d4=false;
if(_2d3){
_2d4=((x>=this.left)&&(x<=this.right)&&(y>=this.bottom)&&(y<=this.top));
}else{
_2d4=((x>this.left)&&(x<this.right)&&(y>this.bottom)&&(y<this.top));
}
return _2d4;
},containsBounds:function(_2d5,_2d6,_2d7){
if(_2d6==null){
_2d6=false;
}
if(_2d7==null){
_2d7=true;
}
var _2d8;
var _2d9;
var _2da;
var _2db;
if(_2d7){
_2d8=(_2d5.left>=this.left)&&(_2d5.left<=this.right);
_2d9=(_2d5.top>=this.bottom)&&(_2d5.top<=this.top);
_2da=(_2d5.right>=this.left)&&(_2d5.right<=this.right);
_2db=(_2d5.bottom>=this.bottom)&&(_2d5.bottom<=this.top);
}else{
_2d8=(_2d5.left>this.left)&&(_2d5.left<this.right);
_2d9=(_2d5.top>this.bottom)&&(_2d5.top<this.top);
_2da=(_2d5.right>this.left)&&(_2d5.right<this.right);
_2db=(_2d5.bottom>this.bottom)&&(_2d5.bottom<this.top);
}
return (_2d6)?(_2d9||_2db)&&(_2d8||_2da):(_2d9&&_2d8&&_2db&&_2da);
},determineQuadrant:function(_2dc){
var _2dd="";
var _2de=this.getCenterLonLat();
_2dd+=(_2dc.lat<_2de.lat)?"b":"t";
_2dd+=(_2dc.lon<_2de.lon)?"l":"r";
return _2dd;
},CLASS_NAME:"OpenLayers.Bounds"};
OpenLayers.Bounds.fromString=function(str){
var _2e0=str.split(",");
return new OpenLayers.Bounds(parseFloat(_2e0[0]),parseFloat(_2e0[1]),parseFloat(_2e0[2]),parseFloat(_2e0[3]));
};
String.prototype.startsWith=function(_2e1){
return (this.substr(0,_2e1.length)==_2e1);
};
String.prototype.trim=function(){
var b=0;
while(this.substr(b,1)==" "){
b++;
}
var e=this.length-1;
while(this.substr(e,1)==" "){
e--;
}
return this.substring(b,e+1);
};
Array.prototype.remove=function(item){
for(var i=0;i<this.length;i++){
if(this[i]==item){
this.splice(i,1);
}
}
return this;
};
Array.prototype.copyOf=function(){
var copy=new Array();
for(var i=0;i<this.length;i++){
copy[i]=this[i];
}
return copy;
};
Array.prototype.prepend=function(item){
this.splice(0,0,item);
};
Array.prototype.append=function(item){
this[this.length]=item;
};
Array.prototype.clear=function(){
this.length=0;
};
Array.prototype.indexOf=function(_2ea){
var _2eb=-1;
for(var i=0;i<this.length;i++){
if(this[i]==_2ea){
_2eb=i;
break;
}
}
return _2eb;
};
OpenLayers.Util.createDiv=function(id,px,sz,_2f0,img,_2f2){
var x,y,w,h;
if(px){
x=px.x;
y=px.y;
}else{
x=y=0;
}
if(!_2f2){
_2f2="absolute";
}
if(!id){
id="OpenLayersDiv"+(Math.random()*10000%10000);
}
var dom=document.createElement("div");
dom.id=id;
if(_2f0){
dom.style.overflow=_2f0;
}
if(sz){
dom.style.width=sz.w+"px";
dom.style.height=sz.h+"px";
}
dom.style.position=_2f2;
dom.style.top=y;
dom.style.left=x;
dom.style.padding="0";
dom.style.margin="0";
dom.style.cursor="inherit";
if(img){
dom.style.backgroundImage="url("+img+")";
}
return dom;
};
OpenLayers.Util.createImage=function(img,sz,xy,_2f8,id,_2fa){
image=document.createElement("img");
if(id){
image.id=id;
image.style.alt=id;
}
if(xy){
image.style.left=xy.x;
image.style.top=xy.y;
}
if(sz){
image.style.width=sz.w;
image.style.height=sz.h;
}
if(_2f8){
image.style.position=_2f8;
}else{
image.style.position="relative";
}
if(_2fa){
image.style.border=_2fa+"px solid";
}else{
image.style.border=0;
}
image.style.cursor="inherit";
if(img){
image.src=img;
}
image.galleryImg="no";
return image;
};
OpenLayers.Util.alphaHack=function(){
var _2fb=navigator.appVersion.split("MSIE");
var _2fc=parseFloat(_2fb[1]);
return ((_2fc>=5.5)&&(_2fc<7)&&(document.body.filters));
};
OpenLayers.Util.createAlphaImage=function(img,sz,xy,_300,id,_302){
if(OpenLayers.Util.alphaHack()){
var _303=ol.Util.createImage(img,sz,new OpenLayers.Pixel(0,0),id+"img",_302);
var div=OpenLayers.Util.createDiv(id,xy,sz);
div.appendChild(_303);
div.style.display="inline-block";
div.style.filter="progid:DXImageTransform.Microsoft"+".AlphaImageLoader(src='"+img+"')";
_303.style.filter="progid:DXImageTransform.Microsoft"+".Alpha(opacity=0)";
return div;
}else{
var _305=ol.Util.createImage(img,sz,xy,id+"img",_302);
return _305;
}
};
OpenLayers.Util.getParameterString=function(_306){
paramsArray=new Array();
for(var key in _306){
var _308=_306[key];
if(typeof _308=="function"){
continue;
}
paramsArray.push(key+"="+_308);
}
return paramsArray.join("&");
};
OpenLayers.Util.getImagesLocation=function(){
return OpenLayers._getScriptLocation()+"img/";
};
OpenLayers.Util.applyDefaults=function(to,from){
for(var key in from){
if(to[key]==null){
to[key]=from[key];
}
}
return to;
};
OpenLayers.Util.getNodes=function(p,_30d){
var _30e=Try.these(function(){
return OpenLayers.Util._getNodes(p.documentElement.childNodes,_30d);
},function(){
return OpenLayers.Util._getNodes(p.childNodes,_30d);
});
return _30e;
};
OpenLayers.Util._getNodes=function(_30f,_310){
var _311=new Array();
for(var i=0;i<_30f.length;i++){
if(_30f[i].nodeName==_310){
_311.push(_30f[i]);
}
}
return _311;
};
OpenLayers.Util.getTagText=function(_313,item,_315){
var _316=OpenLayers.Util.getNodes(_313,item);
if(_316&&(_316.length>0)){
if(!_315){
_315=0;
}
if(_316[_315].childNodes.length>1){
return _316.childNodes[1].nodeValue;
}else{
if(_316[_315].childNodes.length==1){
return _316[_315].firstChild.nodeValue;
}
}
}else{
return "";
}
};
OpenLayers.Util.mouseLeft=function(evt,div){
var _319=(evt.relatedTarget)?evt.relatedTarget:evt.toElement;
while(_319!=div&&_319!=null){
_319=_319.parentNode;
}
return (_319!=div);
};
OpenLayers.Control.PanZoom=Class.create();
OpenLayers.Control.PanZoom.X=4;
OpenLayers.Control.PanZoom.Y=4;
OpenLayers.Control.PanZoom.prototype=Object.extend(new OpenLayers.Control(),{buttons:null,initialize:function(){
OpenLayers.Control.prototype.initialize.apply(this,arguments);
this.position=new OpenLayers.Pixel(OpenLayers.Control.PanZoom.X,OpenLayers.Control.PanZoom.Y);
},draw:function(px){
OpenLayers.Control.prototype.draw.apply(this,arguments);
px=this.position;
this.buttons=new Array();
var sz=new OpenLayers.Size(18,18);
var _31c=new OpenLayers.Pixel(px.x+sz.w/2,px.y);
this._addButton("panup","north-mini.png",_31c,sz);
px.y=_31c.y+sz.h;
this._addButton("panleft","west-mini.png",px,sz);
this._addButton("panright","east-mini.png",px.add(sz.w,0),sz);
this._addButton("pandown","south-mini.png",_31c.add(0,sz.h*2),sz);
this._addButton("zoomin","zoom-plus-mini.png",_31c.add(0,sz.h*3+5),sz);
this._addButton("zoomout","zoom-minus-mini.png",_31c.add(0,sz.h*5+5),sz);
return this.div;
},_addButton:function(id,img,xy,sz){
var _321=OpenLayers.Util.getImagesLocation()+img;
var btn=OpenLayers.Util.createAlphaImageDiv("OpenLayers_Control_PanZoom_"+id,xy,sz,_321,"absolute");
this.div.appendChild(btn);
btn.onmousedown=this.buttonDown.bindAsEventListener(btn);
btn.ondblclick=this.doubleClick.bindAsEventListener(btn);
btn.action=id;
btn.map=this.map;
this.buttons.push(btn);
return btn;
},doubleClick:function(evt){
Event.stop(evt);
},buttonDown:function(evt){
switch(this.action){
case "panup":
var _325=this.map.getResolution();
var _326=this.map.getCenter();
this.map.setCenter(new OpenLayers.LonLat(_326.lon,_326.lat+(_325*50)));
break;
case "pandown":
var _327=this.map.getResolution();
var _328=this.map.getCenter();
this.map.setCenter(new OpenLayers.LonLat(_328.lon,_328.lat-(_327*50)));
break;
case "panleft":
var _329=this.map.getResolution();
var _32a=this.map.getCenter();
this.map.setCenter(new OpenLayers.LonLat(_32a.lon-(_329*50),_32a.lat));
break;
case "panright":
var _32b=this.map.getResolution();
var _32c=this.map.getCenter();
this.map.setCenter(new OpenLayers.LonLat(_32c.lon+(_32b*50),_32c.lat));
break;
case "zoomin":
this.map.zoomIn();
break;
case "zoomout":
this.map.zoomOut();
break;
case "zoomworld":
this.map.zoomExtent();
break;
}
Event.stop(evt);
},destroy:function(){
OpenLayers.Control.prototype.destroy.apply(this,arguments);
for(i=0;i<this.buttons.length;i++){
this.buttons[i].map=null;
}
}});
OpenLayers.Control.KeyboardDefaults=Class.create();
OpenLayers.Control.KeyboardDefaults.prototype=Object.extend(new OpenLayers.Control(),{initialize:function(){
OpenLayers.Control.prototype.initialize.apply(this,arguments);
},draw:function(){
Event.observe(document,"keypress",this.defaultKeyDown.bind(this.map));
},defaultKeyDown:function(evt){
var i=0;
switch(evt.keyCode){
case Event.KEY_LEFT:
var _32f=this.getResolution();
var _330=this.getCenter();
this.setCenter(new OpenLayers.LonLat(_330.lon-(_32f*50),_330.lat));
Event.stop(evt);
break;
case Event.KEY_RIGHT:
var _331=this.getResolution();
var _332=this.getCenter();
this.setCenter(new OpenLayers.LonLat(_332.lon+(_331*50),_332.lat));
Event.stop(evt);
break;
case Event.KEY_UP:
var _333=this.getResolution();
var _334=this.getCenter();
this.setCenter(new OpenLayers.LonLat(_334.lon,_334.lat+(_333*50)));
Event.stop(evt);
break;
case Event.KEY_DOWN:
var _335=this.getResolution();
var _336=this.getCenter();
this.setCenter(new OpenLayers.LonLat(_336.lon,_336.lat-(_335*50)));
Event.stop(evt);
break;
}
}});
OpenLayers.Control.LayerSwitcher=Class.create();
OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR="darkblue";
OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR="lightblue";
OpenLayers.Control.LayerSwitcher.prototype=Object.extend(new OpenLayers.Control(),{activeColor:"",nonActiveColor:"",mode:"checkbox",initialize:function(_337){
this.activeColor=OpenLayers.Control.LayerSwitcher.ACTIVE_COLOR;
this.nonActiveColor=OpenLayers.Control.LayerSwitcher.NONACTIVE_COLOR;
this.backdrops=[];
OpenLayers.Control.prototype.initialize.apply(this,arguments);
},draw:function(){
OpenLayers.Control.prototype.draw.apply(this);
this.div.style.position="absolute";
this.div.style.top="10px";
this.div.style.right="0px";
this.div.style.left="";
this.div.style.fontFamily="sans-serif";
this.div.style.color="white";
this.div.style.fontWeight="bold";
this.div.style.marginTop="3px";
this.div.style.marginLeft="3px";
this.div.style.marginBottom="3px";
this.div.style.fontSize="smaller";
this.div.style.width="10em";
this.map.events.register("addlayer",this,this.redraw);
return this.redraw();
},redraw:function(){
this.div.innerHTML="";
var _338=false;
for(var i=0;i<this.map.layers.length;i++){
if(_338&&this.mode=="radio"){
this.map.layers[i].setVisibility(false);
}else{
_338=this.map.layers[i].getVisibility();
}
this.addTab(this.map.layers[i]);
}
return this.div;
},singleClick:function(evt){
var div=Event.element(evt);
var _33c=div.layer;
if(this.mode=="radio"){
for(var i=0;i<this.backdrops.length;i++){
this.setTabActivation(this.backdrops[i],false);
this.backdrops[i].layer.setVisibility(false);
}
this.setTabActivation(div,true);
_33c.setVisibility(true);
}else{
var _33e=_33c.getVisibility();
this.setTabActivation(div,!_33e);
_33c.setVisibility(!_33e);
}
Event.stop(evt);
},doubleClick:function(evt){
Event.stop(evt);
},addTab:function(_340){
var _341=document.createElement("div");
_341.id="LayerSwitcher_"+_340.name+"_Tab";
_341.style.marginTop="4px";
_341.style.marginBottom="4px";
var _342=document.createElement("p");
_342.innerHTML=_340.name;
_342.style.marginTop="0px";
_342.style.marginBottom="0px";
_342.style.paddingLeft="10px";
_342.style.paddingRight="10px";
_342.layer=_340;
_342.ondblclick=this.doubleClick.bindAsEventListener(this);
_342.onmousedown=this.singleClick.bindAsEventListener(this);
_341.appendChild(_342);
this.backdrops.append(_342);
this.div.appendChild(_341);
Rico.Corner.round(_341,{corners:"tl bl",bgColor:"transparent",color:"white",blend:false});
this.setTabActivation(_342,_340.getVisibility());
},setTabActivation:function(div,_344){
var _345=(_344)?this.activeColor:this.nonActiveColor;
Rico.Corner.changeColor(div,_345);
},CLASS_NAME:"OpenLayers.Control.LayerSwitcher"});
OpenLayers.Control.MouseDefaults=Class.create();
OpenLayers.Control.MouseDefaults.prototype=Object.extend(new OpenLayers.Control(),{initialize:function(){
OpenLayers.Control.prototype.initialize.apply(this,arguments);
},draw:function(){
this.map.events.register("dblclick",this,this.defaultDblClick);
this.map.events.register("mousedown",this,this.defaultMouseDown);
this.map.events.register("mouseup",this,this.defaultMouseUp);
this.map.events.register("mousemove",this,this.defaultMouseMove);
this.map.events.register("mouseout",this,this.defaultMouseOut);
},defaultDblClick:function(evt){
var _347=this.map.getLonLatFromScreenPx(evt.xy);
this.map.setCenter(_347,this.map.zoom+1);
},defaultMouseDown:function(evt){
this.mouseDragStart=evt.xy.copyOf();
if(evt.shiftKey){
this.map.div.style.cursor="crosshair";
this.zoomBox=OpenLayers.Util.createDiv("zoomBox",this.mouseDragStart,null,null,"absolute","2px solid red");
this.zoomBox.style.backgroundColor="white";
this.zoomBox.style.filter="alpha(opacity=50)";
this.zoomBox.style.opacity="0.50";
this.zoomBox.style.zIndex=this.map.Z_INDEX_BASE["Popup"]-1;
this.map.viewPortDiv.appendChild(this.zoomBox);
}else{
this.map.div.style.cursor="move";
}
Event.stop(evt);
},defaultMouseMove:function(evt){
if(this.mouseDragStart!=null){
if(this.zoomBox){
var _34a=Math.abs(this.mouseDragStart.x-evt.xy.x);
var _34b=Math.abs(this.mouseDragStart.y-evt.xy.y);
this.zoomBox.style.width=_34a+"px";
this.zoomBox.style.height=_34b+"px";
if(evt.xy.x<this.mouseDragStart.x){
this.zoomBox.style.left=evt.xy.x+"px";
}
if(evt.xy.y<this.mouseDragStart.y){
this.zoomBox.style.top=evt.xy.y+"px";
}
}else{
var _34c=this.mouseDragStart.x-evt.xy.x;
var _34d=this.mouseDragStart.y-evt.xy.y;
var size=this.map.getSize();
var _34f=new OpenLayers.Pixel(size.w/2+_34c,size.h/2+_34d);
var _350=this.map.getLonLatFromScreenPx(_34f);
this.map.setCenter(_350);
this.mouseDragStart=evt.xy.copyOf();
}
}
},defaultMouseUp:function(evt){
if(this.zoomBox){
var _352=this.map.getLonLatFromScreenPx(this.mouseDragStart);
var end=this.map.getLonLatFromScreenPx(evt.xy);
var top=Math.max(_352.lat,end.lat);
var _355=Math.min(_352.lat,end.lat);
var left=Math.min(_352.lon,end.lon);
var _357=Math.max(_352.lon,end.lon);
var _358=new OpenLayers.Bounds(left,_355,_357,top);
var zoom=this.map.getZoomForExtent(_358);
this.map.setCenter(new OpenLayers.LonLat((_352.lon+end.lon)/2,(_352.lat+end.lat)/2),zoom);
this.map.viewPortDiv.removeChild(document.getElementById("zoomBox"));
this.zoomBox=null;
}
this.mouseDragStart=null;
this.map.div.style.cursor="default";
},defaultMouseOut:function(evt){
if(this.mouseDragStart!=null&&OpenLayers.Util.mouseLeft(evt,this.map.div)){
this.defaultMouseUp(evt);
}
}});
OpenLayers.Control.PanZoom=Class.create();
OpenLayers.Control.PanZoom.X=4;
OpenLayers.Control.PanZoom.Y=4;
OpenLayers.Control.PanZoom.prototype=Object.extend(new OpenLayers.Control(),{buttons:null,initialize:function(){
OpenLayers.Control.prototype.initialize.apply(this,arguments);
this.position=new OpenLayers.Pixel(OpenLayers.Control.PanZoom.X,OpenLayers.Control.PanZoom.Y);
},draw:function(px){
OpenLayers.Control.prototype.draw.apply(this,arguments);
px=this.position;
this.buttons=new Array();
var sz=new OpenLayers.Size(18,18);
var _35d=new OpenLayers.Pixel(px.x+sz.w/2,px.y);
this._addButton("panup","north-mini.png",_35d,sz);
px.y=_35d.y+sz.h;
this._addButton("panleft","west-mini.png",px,sz);
this._addButton("panright","east-mini.png",px.add(sz.w,0),sz);
this._addButton("pandown","south-mini.png",_35d.add(0,sz.h*2),sz);
this._addButton("zoomin","zoom-plus-mini.png",_35d.add(0,sz.h*3+5),sz);
this._addButton("zoomworld","zoom-world-mini.png",_35d.add(0,sz.h*4+5),sz);
this._addButton("zoomout","zoom-minus-mini.png",_35d.add(0,sz.h*5+5),sz);
return this.div;
},_addButton:function(id,img,xy,sz){
var _362=OpenLayers.Util.getImagesLocation()+img;
var btn=OpenLayers.Util.createAlphaImageDiv("OpenLayers_Control_PanZoom_"+id,xy,sz,_362,"absolute");
this.div.appendChild(btn);
btn.onmousedown=this.buttonDown.bindAsEventListener(btn);
btn.ondblclick=this.doubleClick.bindAsEventListener(btn);
btn.action=id;
btn.map=this.map;
this.buttons.push(btn);
return btn;
},doubleClick:function(evt){
Event.stop(evt);
},buttonDown:function(evt){
switch(this.action){
case "panup":
var _366=this.map.getResolution();
var _367=this.map.getCenter();
this.map.setCenter(new OpenLayers.LonLat(_367.lon,_367.lat+(_366*50)));
break;
case "pandown":
var _368=this.map.getResolution();
var _369=this.map.getCenter();
this.map.setCenter(new OpenLayers.LonLat(_369.lon,_369.lat-(_368*50)));
break;
case "panleft":
var _36a=this.map.getResolution();
var _36b=this.map.getCenter();
this.map.setCenter(new OpenLayers.LonLat(_36b.lon-(_36a*50),_36b.lat));
break;
case "panright":
var _36c=this.map.getResolution();
var _36d=this.map.getCenter();
this.map.setCenter(new OpenLayers.LonLat(_36d.lon+(_36c*50),_36d.lat));
break;
case "zoomin":
this.map.zoomIn();
break;
case "zoomout":
this.map.zoomOut();
break;
case "zoomworld":
this.map.zoomExtent();
break;
}
Event.stop(evt);
},destroy:function(){
OpenLayers.Control.prototype.destroy.apply(this,arguments);
for(i=0;i<this.buttons.length;i++){
this.buttons[i].map=null;
}
}});
OpenLayers.Layer.Google=Class.create();
OpenLayers.Layer.Google.prototype=Object.extend(new OpenLayers.Layer(),{gmap:null,initialize:function(name){
OpenLayers.Layer.prototype.initialize.apply(this,[name]);
this.gmap=new GMap2(this.div);
},moveTo:function(){
center=this.map.getCenter();
this.gmap.setCenter(new GLatLng(center.lat,center.lon),this.map.getZoom());
}});
OpenLayers.Layer.Grid=Class.create();
OpenLayers.Layer.Grid.TILE_WIDTH=256;
OpenLayers.Layer.Grid.TILE_HEIGHT=256;
OpenLayers.Layer.Grid.prototype=Object.extend(new OpenLayers.Layer(),{url:null,params:null,tileSize:null,grid:null,initialize:function(name,url,_371){
var _372=arguments;
if(arguments.length>0){
_372=[name];
}
OpenLayers.Layer.prototype.initialize.apply(this,_372);
this.url=url;
this.params=_371;
this.tileSize=new OpenLayers.Size(OpenLayers.Layer.Grid.TILE_WIDTH,OpenLayers.Layer.Grid.TILE_HEIGHT);
},setTileSize:function(size){
this.tileSize=size.copyOf();
},moveTo:function(_374,_375){
if(!this.getVisibility()){
if(_375){
this.grid=null;
}
return;
}
if(!this.grid||_375){
this._initTiles();
}else{
var i=0;
while(this.getGridBounds().bottom>_374.bottom){
this.insertRow(false);
}
while(this.getGridBounds().left>_374.left){
this.insertColumn(true);
}
while(this.getGridBounds().top<_374.top){
this.insertRow(true);
}
while(this.getGridBounds().right<_374.right){
this.insertColumn(false);
}
}
},getGridBounds:function(){
var _377=this.grid[0][0];
var _378=this.grid[this.grid.length-1][this.grid[0].length-1];
return new OpenLayers.Bounds(_377.bounds.left,_378.bounds.bottom,_378.bounds.right,_377.bounds.top);
},_initTiles:function(){
this.div.innerHTML="";
this.clearGrid();
this.grid=new Array();
var _379=this.map.getSize();
var _37a=this.map.getExtent();
var _37b=this.map.getFullExtent();
var _37c=this.map.getResolution();
var _37d=_37c*this.tileSize.w;
var _37e=_37c*this.tileSize.h;
var _37f=_37a.left-_37b.left;
var _380=Math.floor(_37f/_37d);
var _381=_37f/_37d-_380;
var _382=-_381*this.tileSize.w;
var _383=_37b.left+_380*_37d;
var _384=_37a.top-(_37b.bottom+_37e);
var _385=Math.ceil(_384/_37e);
var _386=_385-_384/_37e;
var _387=-_386*this.tileSize.h;
var _388=_37b.bottom+_385*_37e;
_382=Math.round(_382);
_387=Math.round(_387);
this.origin=new OpenLayers.Pixel(_382,_387);
var _389=_382;
var _38a=_383;
do{
var row=new Array();
this.grid.append(row);
_383=_38a;
_382=_389;
do{
var _38c=new OpenLayers.Bounds(_383,_388,_383+_37d,_388+_37e);
var tile=this.addTile(_38c,new OpenLayers.Pixel(_382,_387));
row.append(tile);
_383+=_37d;
_382+=this.tileSize.w;
}while(_383<_37a.right);
_388-=_37e;
_387+=this.tileSize.h;
}while(_388>_37a.bottom-_37e);
},insertRow:function(_38e){
var _38f=(_38e)?0:(this.grid.length-1);
var _390=this.grid[_38f];
var _391=new Array();
var _392=this.map.getResolution();
var _393=(_38e)?-this.tileSize.h:this.tileSize.h;
var _394=_392*-_393;
for(var i=0;i<_390.length;i++){
var _396=_390[i];
var _397=_396.bounds.copyOf();
var _398=_396.position.copyOf();
_397.bottom=_397.bottom+_394;
_397.top=_397.top+_394;
_398.y=_398.y+_393;
var _399=this.addTile(_397,_398);
_391.append(_399);
}
if(_391.length>0){
if(_38e){
this.grid.prepend(_391);
}else{
this.grid.append(_391);
}
}
},insertColumn:function(_39a){
var _39b;
var _39c=(_39a)?-this.tileSize.w:this.tileSize.w;
var _39d=this.map.getResolution();
var _39e=_39d*_39c;
for(var i=0;i<this.grid.length;i++){
var row=this.grid[i];
modelTileIndex=(_39a)?0:(row.length-1);
var _3a1=row[modelTileIndex];
var _3a2=_3a1.bounds.copyOf();
var _3a3=_3a1.position.copyOf();
_3a2.left=_3a2.left+_39e;
_3a2.right=_3a2.right+_39e;
_3a3.x=_3a3.x+_39c;
var _3a4=this.addTile(_3a2,_3a3);
if(_39a){
row=row.prepend(_3a4);
}else{
row=row.append(_3a4);
}
}
},getFullRequestString:function(_3a5){
var _3a6="";
this.params.srs=this.projection;
var _3a7=Object.extend(_3a5,this.params);
var _3a8=OpenLayers.Util.getParameterString(_3a7);
var _3a9=this.url;
var _3aa=_3a9.charAt(_3a9.length-1);
if((_3aa=="&")||(_3aa=="?")){
_3a6=_3a9+_3a8;
}else{
if(_3a9.indexOf("?")==-1){
_3a6=_3a9+"?"+_3a8;
}else{
_3a6=_3a9+"&"+_3a8;
}
}
return _3a6;
},clearGrid:function(){
if(this.grid){
while(this.grid.length>0){
var row=this.grid[0];
while(row.length>0){
var tile=row[0];
tile.destroy();
row.remove(tile);
}
this.grid.remove(row);
}
}
}});
OpenLayers.Layer.Markers=Class.create();
OpenLayers.Layer.Markers.prototype=Object.extend(new OpenLayers.Layer(),{markers:null,initialize:function(name){
OpenLayers.Layer.prototype.initialize.apply(this,arguments);
this.markers=new Array();
},moveTo:function(_3ae,_3af){
if(_3af){
this.redraw();
}
},addMarker:function(_3b0){
this.markers.append(_3b0);
if(this.map&&this.map.getExtent()){
this.drawMarker(_3b0);
}
},redraw:function(){
for(i=0;i<this.markers.length;i++){
this.drawMarker(this.markers[i]);
}
},drawMarker:function(_3b1){
var px=this.map.getLayerPxFromLonLat(_3b1.lonlat);
var _3b3=_3b1.draw(px);
if(!_3b1.drawn){
this.div.appendChild(_3b3);
_3b1.drawn=true;
}
},CLASS_NAME:"OpenLayers.Layer.Markers"});
OpenLayers.Map=Class.create();
OpenLayers.Map.prototype={Z_INDEX_BASE:{Layer:100,Popup:200,Control:1000},EVENT_TYPES:["addlayer","removelayer","movestart","move","moveend","zoomend","layerchanged","popupopen","popupclose","addmarker","removemarker","clearmarkers","mouseover","mouseout","mousemove","dragstart","drag","dragend"],maxZoomLevel:16,maxExtent:new OpenLayers.Bounds(-180,-90,180,90),projection:"EPSG:4326",maxResolution:null,div:null,viewPortDiv:null,layerContainerDiv:null,layers:null,controls:null,popups:null,center:null,zoom:null,events:null,mouseDragStart:null,initialize:function(div,_3b5){
Object.extend(this,_3b5);
this.div=div=$(div);
var id=div.id+"_OpenLayers_ViewPort";
this.viewPortDiv=OpenLayers.Util.createDiv(id,null,null,null,"relative",null,"hidden");
this.viewPortDiv.style.width="100%";
this.viewPortDiv.style.height="100%";
this.div.appendChild(this.viewPortDiv);
id=div.id+"_OpenLayers_Container";
this.layerContainerDiv=OpenLayers.Util.createDiv(id);
this.viewPortDiv.appendChild(this.layerContainerDiv);
this.events=new OpenLayers.Events(this,div,this.EVENT_TYPES);
this.updateSize();
if(this.maxResolution==null){
this.maxResolution=Math.max(this.maxExtent.getWidth()/this.size.w,this.maxExtent.getHeight()/this.size.h);
}
this.events.register("resize",this,this.updateSize);
this.layers=[];
if(!this.controls){
this.controls=[];
this.addControl(new OpenLayers.Control.MouseDefaults());
this.addControl(new OpenLayers.Control.PanZoom());
}
this.popups=new Array();
Event.observe(window,"unload",this.destroy.bindAsEventListener(this));
},destroy:function(){
if(this.layers!=null){
for(var i=0;i<this.layers.length;i++){
this.layers[i].destroy();
}
this.layers=null;
}
if(this.controls!=null){
for(var i=0;i<this.controls.length;i++){
this.controls[i].destroy();
}
this.controls=null;
}
},addLayer:function(_3b9,_3ba){
_3b9.map=this;
_3b9.projection=this.projection;
_3b9.div.style.overflow="";
if(_3ba){
_3b9.div.style.zIndex=_3ba;
}else{
_3b9.div.style.zIndex=this.Z_INDEX_BASE["Layer"]+this.layers.length;
}
this.layerContainerDiv.appendChild(_3b9.div);
this.layers.push(_3b9);
this.events.triggerEvent("addlayer");
},addLayers:function(_3bb){
for(var i=0;i<_3bb.length;i++){
this.addLayer(_3bb[i]);
}
},addControl:function(_3bd,px){
_3bd.map=this;
this.controls.push(_3bd);
var div=_3bd.draw(px);
if(div){
div.style.zIndex=this.Z_INDEX_BASE["Control"]+this.controls.length;
this.viewPortDiv.appendChild(div);
}
},addPopup:function(_3c0){
_3c0.map=this;
this.popups.push(_3c0);
var _3c1=_3c0.draw();
if(_3c1){
_3c1.style.zIndex=this.Z_INDEX_BASE["Popup"]+this.popups.length;
this.layerContainerDiv.appendChild(_3c1);
}
},removePopup:function(_3c2){
this.popups.remove(_3c2);
if(_3c2.div){
this.layerContainerDiv.removeChild(_3c2.div);
}
},getResolution:function(){
return this.maxResolution/Math.pow(2,this.zoom);
},getZoom:function(){
return this.zoom;
},getSize:function(){
return this.size;
},updateSize:function(){
this.size=new OpenLayers.Size(this.div.clientWidth,this.div.clientHeight);
this.events.div.offsets=null;
if(this.size.w==0&&this.size.h==0){
this.size.w=parseInt(this.div.style.width);
this.size.h=parseInt(this.div.style.height);
}
},getCenter:function(){
return this.center;
},getExtent:function(){
if(this.center){
var res=this.getResolution();
var size=this.getSize();
var _3c5=size.w*res;
var _3c6=size.h*res;
return new OpenLayers.Bounds(this.center.lon-_3c5/2,this.center.lat-_3c6/2,this.center.lon+_3c5/2,this.center.lat+_3c6/2);
}else{
return null;
}
},getFullExtent:function(){
return this.maxExtent;
},getZoomLevels:function(){
return this.maxZoomLevel;
},getZoomForExtent:function(_3c7){
var size=this.getSize();
var _3c9=_3c7.getWidth();
var _3ca=_3c7.getHeight();
var _3cb=(_3c9>_3ca?_3c9/size.w:_3ca/size.h);
var zoom=Math.log(this.maxResolution/_3cb)/Math.log(2);
return Math.floor(Math.max(zoom,0));
},getScreenPxFromLayerPx:function(_3cd){
var _3ce=_3cd.copyOf();
_3ce.x+=parseInt(this.layerContainerDiv.style.left);
_3ce.y+=parseInt(this.layerContainerDiv.style.top);
return _3ce;
},getLayerPxFromScreenPx:function(_3cf){
var _3d0=_3cf.copyOf();
_3d0.x-=parseInt(this.layerContainerDiv.style.left);
_3d0.y-=parseInt(this.layerContainerDiv.style.top);
return _3d0;
},getLonLatFromLayerPx:function(px){
px=this.getScreenPxFromLayerPx(px);
return this.getLonLatFromScreenPx(px);
},getLonLatFromScreenPx:function(_3d2){
var _3d3=this.getCenter();
var res=this.getResolution();
var size=this.getSize();
var _3d6=_3d2.x-(size.w/2);
var _3d7=_3d2.y-(size.h/2);
return new OpenLayers.LonLat(_3d3.lon+_3d6*res,_3d3.lat-_3d7*res);
},getLayerPxFromLonLat:function(_3d8){
var px=this.getScreenPxFromLonLat(_3d8);
return this.getLayerPxFromScreenPx(px);
},getScreenPxFromLonLat:function(_3da){
var _3db=this.getResolution();
var _3dc=this.getExtent();
return new OpenLayers.Pixel(Math.round(1/_3db*(_3da.lon-_3dc.left)),Math.round(1/_3db*(_3dc.top-_3da.lat)));
},setCenter:function(_3dd,zoom){
if(this.center){
this.moveLayerContainer(_3dd);
}
this.center=_3dd.copyOf();
var _3df=null;
if(zoom!=null&&zoom!=this.zoom&&zoom>=0&&zoom<=this.getZoomLevels()){
_3df=(this.zoom==null?0:this.zoom);
this.zoom=zoom;
}
this.events.triggerEvent("movestart");
this.moveToNewExtent(_3df);
this.events.triggerEvent("moveend");
},moveToNewExtent:function(_3e0){
if(_3e0!=null){
this.layerContainerDiv.style.left="0px";
this.layerContainerDiv.style.top="0px";
for(var i=0;i<this.popups.length;i++){
this.popups[i].updatePosition();
}
}
var _3e2=this.getExtent();
for(var i=0;i<this.layers.length;i++){
this.layers[i].moveTo(_3e2,(_3e0!=null));
}
this.events.triggerEvent("move");
if(_3e0!=null){
this.events.triggerEvent("zoomend",{oldZoom:_3e0,newZoom:this.zoom});
}
},zoomIn:function(){
if(this.zoom!=null&&this.zoom<=this.getZoomLevels()){
this.zoomTo(this.zoom+=1);
}
},zoomTo:function(zoom){
if(zoom>=0&&zoom<=this.getZoomLevels()){
var _3e5=this.zoom;
this.zoom=zoom;
this.moveToNewExtent(_3e5);
}
},zoomOut:function(){
if(this.zoom!=null&&this.zoom>0){
this.zoomTo(this.zoom-1);
}
},zoomExtent:function(){
var _3e6=this.getFullExtent();
var _3e7=this.zoom;
this.setCenter(new OpenLayers.LonLat((_3e6.left+_3e6.right)/2,(_3e6.bottom+_3e6.top)/2),0);
},moveLayerContainer:function(_3e8){
var _3e9=this.layerContainerDiv;
var _3ea=this.getResolution();
var _3eb=Math.round((this.center.lon-_3e8.lon)/_3ea);
var _3ec=Math.round((this.center.lat-_3e8.lat)/_3ea);
var _3ed=parseInt(_3e9.style.left);
var _3ee=parseInt(_3e9.style.top);
_3e9.style.left=(_3ed+_3eb)+"px";
_3e9.style.top=(_3ee-_3ec)+"px";
},CLASS_NAME:"OpenLayers.Map"};
OpenLayers.Popup.Anchored=Class.create();
OpenLayers.Popup.Anchored.prototype=Object.extend(new OpenLayers.Popup(),{relativePosition:null,anchor:null,initialize:function(id,_3f0,size,_3f2,_3f3){
var _3f4=new Array(id,_3f0,size,_3f2);
OpenLayers.Popup.prototype.initialize.apply(this,_3f4);
this.anchor=(_3f3!=null)?_3f3:{size:new OpenLayers.Size(0,0),offset:new OpenLayers.Pixel(0,0)};
},draw:function(px){
if(px==null){
if((this.lonlat!=null)&&(this.map!=null)){
px=this.map.getLayerPxFromLonLat(this.lonlat);
}
}
this.relativePosition=this.calculateRelativePosition(px);
return OpenLayers.Popup.prototype.draw.apply(this,arguments);
},calculateRelativePosition:function(px){
var _3f7=this.map.getLonLatFromLayerPx(px);
var _3f8=this.map.getExtent();
var _3f9=_3f8.determineQuadrant(_3f7);
return OpenLayers.Bounds.oppositeQuadrant(_3f9);
},moveTo:function(px){
var _3fb=this.calculateNewPx(px);
var _3fc=new Array(_3fb);
OpenLayers.Popup.prototype.moveTo.apply(this,_3fc);
},setSize:function(size){
OpenLayers.Popup.prototype.setSize.apply(this,arguments);
if((this.lonlat)&&(this.map)){
var px=this.map.getLayerPxFromLonLat(this.lonlat);
this.moveTo(px);
}
},calculateNewPx:function(px){
var _400=px.offset(this.anchor.offset);
var top=(this.relativePosition.charAt(0)=="t");
_400.y+=(top)?-this.size.h:this.anchor.size.h;
var left=(this.relativePosition.charAt(1)=="l");
_400.x+=(left)?-this.size.w:this.anchor.size.w;
return _400;
},CLASS_NAME:"OpenLayers.Popup.Anchored"});
OpenLayers.Tile.Image=Class.create();
OpenLayers.Tile.Image.prototype=Object.extend(new OpenLayers.Tile(),{img:null,initialize:function(_403,_404,_405,url,size){
OpenLayers.Tile.prototype.initialize.apply(this,arguments);
},draw:function(){
OpenLayers.Tile.prototype.draw.apply(this,arguments);
this.img=OpenLayers.Util.createImage(null,this.position,this.size,this.url,"absolute");
},CLASS_NAME:"OpenLayers.Tile.Image"});
OpenLayers.Tile.WFS=Class.create();
OpenLayers.Tile.WFS.prototype=Object.extend(new OpenLayers.Tile(),{handlers:null,features:null,initialize:function(_408,_409,_40a,url,size){
OpenLayers.Tile.prototype.initialize.apply(this,arguments);
this.features=new Array();
this.handlers=new Array();
this.handlers["requestSuccess"]=this.requestSuccess;
},draw:function(){
OpenLayers.Tile.prototype.draw.apply(this,arguments);
this.loadFeaturesForRegion("requestSuccess");
},loadFeaturesForRegion:function(_40d,_40e){
if(!this.loaded){
if(this.url!=""){
this.loaded=true;
OpenLayers.loadURL(this.url,null,this,_40d,_40e);
}
}
},requestSuccess:function(_40f){
var doc=_40f.responseXML;
if(!doc||_40f.fileType!="XML"){
doc=OpenLayers.parseXMLString(_40f.responseText);
}
var _411=OpenLayers.Util.getNodes(doc,"gml:featureMember");
this.features=new Array();
for(var i=0;i<_411.length;i++){
var _413=new this.layer.featureClass(this.layer,_411[i]);
this.features.append(_413);
}
},CLASS_NAME:"OpenLayers.Tile.WFS"});
OpenLayers.Control.PanZoomBar=Class.create();
OpenLayers.Control.PanZoomBar.X=4;
OpenLayers.Control.PanZoomBar.Y=4;
OpenLayers.Control.PanZoomBar.prototype=Object.extend(new OpenLayers.Control.PanZoom(),{buttons:null,zoomStopWidth:18,zoomStopHeight:11,initialize:function(){
OpenLayers.Control.PanZoom.prototype.initialize.apply(this,arguments);
this.position=new OpenLayers.Pixel(OpenLayers.Control.PanZoomBar.X,OpenLayers.Control.PanZoomBar.Y);
},draw:function(px){
OpenLayers.Control.prototype.draw.apply(this,arguments);
px=this.position;
this.buttons=new Array();
var sz=new OpenLayers.Size(18,18);
var _416=new OpenLayers.Pixel(px.x+sz.w/2,px.y);
this._addButton("panup","north-mini.png",_416,sz);
px.y=_416.y+sz.h;
this._addButton("panleft","west-mini.png",px,sz);
this._addButton("panright","east-mini.png",px.add(sz.w,0),sz);
this._addButton("pandown","south-mini.png",_416.add(0,sz.h*2),sz);
this._addButton("zoomin","zoom-plus-mini.png",_416.add(0,sz.h*3+5),sz);
_416=this._addZoomBar(_416.add(0,sz.h*4+5));
this._addButton("zoomout","zoom-minus-mini.png",_416,sz);
return this.div;
},_addZoomBar:function(_417){
var _418=OpenLayers.Util.getImagesLocation();
var id="OpenLayers_Control_PanZoomBar_Slider"+this.map.id;
var _41a=OpenLayers.Util.createAlphaImageDiv(id,_417.add(-1,(this.map.getZoomLevels())*this.zoomStopHeight),new OpenLayers.Size(20,9),_418+"slider.png","absolute");
_41a.style.zIndex=this.div.zIndex+5;
this.slider=_41a;
this.sliderEvents=new OpenLayers.Events(this,_41a);
this.sliderEvents.register("mousedown",this,this.zoomBarDown);
this.sliderEvents.register("mousemove",this,this.zoomBarDrag);
this.sliderEvents.register("mouseup",this,this.zoomBarUp);
this.sliderEvents.register("dblclick",this,this.doubleClick);
sz=new OpenLayers.Size();
sz.h=this.zoomStopHeight*(this.map.getZoomLevels()+1);
sz.w=this.zoomStopWidth;
var div=null;
if(OpenLayers.Util.alphaHack()){
var id="OpenLayers_Control_PanZoomBar"+this.map.id;
div=OpenLayers.Util.createAlphaImageDiv(id,_417,new OpenLayers.Size(sz.w,this.zoomStopHeight),_418+"zoombar.png","absolute",null,"crop");
div.style.height=sz.h;
}else{
div=OpenLayers.Util.createDiv("OpenLayers_Control_PanZoomBar_Zoombar"+this.map.id,_417,sz,_418+"zoombar.png");
}
this.zoombarDiv=div;
this.divEvents=new OpenLayers.Events(this,div);
this.divEvents.register("mousedown",this,this.divClick);
this.divEvents.register("mousemove",this,this.passEventToSlider);
this.divEvents.register("dblclick",this,this.doubleClick);
this.div.appendChild(div);
this.startTop=parseInt(div.style.top);
this.div.appendChild(_41a);
this.map.events.register("zoomend",this,this.moveZoomBar);
_417=_417.add(0,this.zoomStopHeight*(this.map.getZoomLevels()+1));
return _417;
},passEventToSlider:function(evt){
this.sliderEvents.handleBrowserEvent(evt);
},divClick:function(evt){
var y=evt.xy.y;
var top=Position.page(evt.object)[1];
var _421=Math.floor((y-top)/this.zoomStopHeight);
this.map.zoomTo(this.map.getZoomLevels()-_421);
Event.stop(evt);
},zoomBarDown:function(evt){
this.map.events.register("mousemove",this,this.passEventToSlider);
this.map.events.register("mouseup",this,this.passEventToSlider);
this.mouseDragStart=evt.xy.copyOf();
this.zoomStart=evt.xy.copyOf();
this.div.style.cursor="move";
Event.stop(evt);
},zoomBarDrag:function(evt){
if(this.mouseDragStart!=null){
var _424=this.mouseDragStart.y-evt.xy.y;
var _425=Position.page(this.zoombarDiv);
if((evt.clientY-_425[1])>0&&(evt.clientY-_425[1])<parseInt(this.zoombarDiv.style.height)-2){
var _426=parseInt(this.slider.style.top)-_424;
this.slider.style.top=_426+"px";
}
this.mouseDragStart=evt.xy.copyOf();
}
Event.stop(evt);
},zoomBarUp:function(evt){
if(this.zoomStart){
this.div.style.cursor="default";
this.map.events.remove("mousemove");
this.map.events.remove("mouseup");
var _428=this.zoomStart.y-evt.xy.y;
this.map.zoomTo(this.map.zoom+Math.round(_428/this.zoomStopHeight));
this.moveZoomBar();
this.mouseDragStart=null;
Event.stop(evt);
}
},moveZoomBar:function(){
var _429=(this.map.getZoomLevels()-this.map.getZoom())*this.zoomStopHeight+this.startTop+1;
this.slider.style.top=_429+"px";
},CLASS_NAME:"OpenLayers.Control.PanZoomBar"});
OpenLayers.Layer.Text=Class.create();
OpenLayers.Layer.Text.prototype=Object.extend(new OpenLayers.Layer.Markers(),{location:null,selectedFeature:null,initialize:function(name,_42b){
OpenLayers.Layer.Markers.prototype.initialize.apply(this,[name]);
this.location=_42b;
new Ajax.Request(_42b,{method:"get",onComplete:this.parseData.bind(this)});
},parseData:function(_42c){
var text=_42c.responseText;
var _42e=text.split("\n");
var _42f;
for(var lcv=0;lcv<(_42e.length-1);lcv++){
var _431=_42e[lcv].replace(/^\s*/,"").replace(/\s*$/,"");
if(_431.charAt(0)!="#"){
if(!_42f){
_42f=_431.split("\t");
}else{
var vals=_431.split("\t");
var _433=new OpenLayers.LonLat(0,0);
var _434;
var url;
var icon,iconSize,iconOffset;
var set=false;
for(var _438=0;_438<vals.length;_438++){
if(vals[_438]){
if(_42f[_438]=="point"){
var _439=vals[_438].split(",");
_433.lat=parseFloat(_439[0]);
_433.lon=parseFloat(_439[1]);
set=true;
}else{
if(_42f[_438]=="lat"){
_433.lat=parseFloat(vals[_438]);
set=true;
}else{
if(_42f[_438]=="lon"){
_433.lon=parseFloat(vals[_438]);
set=true;
}else{
if(_42f[_438]=="title"){
_434=vals[_438];
}else{
if(_42f[_438]=="image"||_42f[_438]=="icon"){
url=vals[_438];
}else{
if(_42f[_438]=="iconSize"){
var size=vals[_438].split(",");
iconSize=new OpenLayers.Size(parseFloat(size[0]),parseFloat(size[1]));
}else{
if(_42f[_438]=="iconOffset"){
var _43b=vals[_438].split(",");
iconOffset=new OpenLayers.Pixel(parseFloat(_43b[0]),parseFloat(_43b[1]));
}else{
if(_42f[_438]=="title"){
_434=vals[_438];
}else{
if(_42f[_438]=="description"){
description=vals[_438];
}
}
}
}
}
}
}
}
}
}
}
if(set){
var data=new Object();
if(url!=null){
data.icon=new OpenLayers.Icon(url,iconSize,iconOffset);
}else{
data.icon=OpenLayers.Marker.defaultIcon();
if(iconSize!=null){
data.icon.setSize(iconSize);
}
}
if((_434!=null)&&(description!=null)){
data["popupContentHTML"]="<h2>"+_434+"</h2><p>"+description+"</p>";
}
var _43d=new OpenLayers.Feature(this,_433,data);
var _43e=_43d.createMarker();
_43e.events.register("click",_43d,this.markerClick);
this.addMarker(_43e);
}
}
}
}
},markerClick:function(evt){
sameMarkerClicked=(this==this.layer.selectedFeature);
this.layer.selectedFeature=(!sameMarkerClicked)?this:null;
for(var i=0;i<this.layer.map.popups.length;i++){
this.layer.map.removePopup(this.layer.map.popups[i]);
}
if(!sameMarkerClicked){
this.layer.map.addPopup(this.createPopup());
}
Event.stop(evt);
}});
OpenLayers.Layer.WFS=Class.create();
OpenLayers.Layer.WFS.prototype=Object.extend(new OpenLayers.Layer.Grid(),Object.extend(new OpenLayers.Layer.Markers(),{featureClass:null,DEFAULT_PARAMS:{service:"WFS",version:"1.0.0",request:"GetFeature",typename:"docpoint"},initialize:function(name,url,_443,_444){
this.featureClass=_444;
var _445=new Array();
if(arguments.length>0){
_445.push(name,url,_443);
}
OpenLayers.Layer.Grid.prototype.initialize.apply(this,_445);
OpenLayers.Layer.Markers.prototype.initialize.apply(this,_445);
if(arguments.length>0){
OpenLayers.Util.applyDefaults(this.params,this.DEFAULT_PARAMS);
}
},moveTo:function(_446,_447){
OpenLayers.Layer.Grid.prototype.moveTo.apply(this,arguments);
OpenLayers.Layer.Markers.prototype.moveTo.apply(this,arguments);
},clone:function(name,_449){
var _44a={};
Object.extend(_44a,this.params);
Object.extend(_44a,_449);
var obj=new OpenLayers.Layer.WFS(name,this.url,_44a);
obj.setTileSize(this.tileSize);
return obj;
},addTile:function(_44c,_44d){
url=this.getFullRequestString({bbox:_44c.toBBOX()});
var tile=new OpenLayers.Tile.WFS(this,_44d,_44c,url,this.tileSize);
tile.draw();
return tile;
},CLASS_NAME:"OpenLayers.Layer.WFS"}));
OpenLayers.Layer.WMS=Class.create();
OpenLayers.Layer.WMS.prototype=Object.extend(new OpenLayers.Layer.Grid(),{DEFAULT_PARAMS:{service:"WMS",version:"1.1.1",request:"GetMap",styles:"",exceptions:"application/vnd.ogc.se_inimage",format:"image/jpeg"},initialize:function(name,url,_451){
OpenLayers.Layer.Grid.prototype.initialize.apply(this,arguments);
OpenLayers.Util.applyDefaults(this.params,this.DEFAULT_PARAMS);
},clone:function(name,_453){
var _454={};
Object.extend(_454,this.params);
Object.extend(_454,_453);
var obj=new OpenLayers.Layer.WMS(name,this.url,_454);
obj.setTileSize(this.tileSize);
return obj;
},addTile:function(_456,_457){
url=this.getFullRequestString({bbox:_456.toBBOX(),width:this.tileSize.w,height:this.tileSize.h});
var tile=new OpenLayers.Tile.Image(this,_457,_456,url,this.tileSize);
tile.draw();
this.div.appendChild(tile.img);
return tile;
},CLASS_NAME:"OpenLayers.Layer.WMS"});
OpenLayers.Popup.AnchoredBubble=Class.create();
OpenLayers.Popup.AnchoredBubble.CORNER_SIZE=5;
OpenLayers.Popup.AnchoredBubble.prototype=Object.extend(new OpenLayers.Popup.Anchored(),{contentDiv:null,initialize:function(id,_45a,size,_45c,_45d){
OpenLayers.Popup.Anchored.prototype.initialize.apply(this,arguments);
},draw:function(px){
OpenLayers.Popup.Anchored.prototype.draw.apply(this,arguments);
var _45f=this.size.copyOf();
_45f.h-=(2*OpenLayers.Popup.AnchoredBubble.CORNER_SIZE);
var id=this.div.id+"-contentDiv";
this.contentDiv=OpenLayers.Util.createDiv(id,null,_45f,null,"relative",null,"auto");
this.div.appendChild(this.contentDiv);
this.setContentHTML();
this.setRicoCorners(true);
this.setBackgroundColor();
this.setOpacity();
return this.div;
},setSize:function(size){
OpenLayers.Popup.Anchored.prototype.setSize.apply(this,arguments);
if(this.contentDiv!=null){
var _462=this.size.copyOf();
_462.h-=(2*OpenLayers.Popup.AnchoredBubble.CORNER_SIZE);
this.contentDiv.style.height=_462.h+"px";
this.setRicoCorners(false);
}
},setBackgroundColor:function(_463){
if(_463!=undefined){
this.backgroundColor=_463;
}
if(this.div!=null){
if(this.contentDiv!=null){
this.div.style.background="transparent";
Rico.Corner.changeColor(this.contentDiv,this.backgroundColor);
}
}
},setOpacity:function(_464){
if(_464!=undefined){
this.opacity=_464;
}
if(this.div!=null){
if(this.contentDiv!=null){
Rico.Corner.changeOpacity(this.contentDiv,this.opacity);
}
}
},setBorder:function(_465){
this.border=0;
},setContentHTML:function(_466){
if(_466!=null){
this.contentHTML=_466;
}
if(this.contentDiv!=null){
this.contentDiv.innerHTML=this.contentHTML;
}
},setRicoCorners:function(_467){
var _468=this.getCornersToRound(this.relativePosition);
var _469={corners:_468,color:this.backgroundColor,bgColor:"transparent",blend:false};
if(_467){
Rico.Corner.round(this.div,_469);
}else{
Rico.Corner.reRound(this.contentDiv,_469);
this.setBackgroundColor();
this.setOpacity();
}
},getCornersToRound:function(){
var _46a=["tl","tr","bl","br"];
var _46b=OpenLayers.Bounds.oppositeQuadrant(this.relativePosition);
_46a.remove(_46b);
return _46a.join(" ");
},CLASS_NAME:"OpenLayers.Popup.AnchoredBubble"});

