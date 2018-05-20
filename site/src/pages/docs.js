import React, {Component} from 'react';

import info from '../../../build/info.json';

const modules = [];
const moduleLookup = {};
info.modules.forEach(mod => {
  moduleLookup[mod.path] = mod;
  modules.push(mod);
});

info.symbols.forEach(symbol => {
  const mod = moduleLookup[symbol.path];
  if (!mod) {
    throw new Error(`No module for symbol ${symbol.name}`);
  }
  if (
    (symbol.memberof && symbol.memberof.indexOf('~') !== -1) ||
    symbol.kind === 'class'
  ) {
    const name = symbol.kind === 'class' ? symbol.name : symbol.memberof;
    if (!mod.classes) {
      mod.classes = {};
    }
    if (!mod.classes[name]) {
      mod.classes[name] = {};
    }
    mod.classes[name][symbol.name] = symbol;
  }
  if (!mod.symbols) {
    mod.symbols = [];
  }
  mod.symbols.push(symbol);
});

function getModuleName(longname) {
  return longname.slice(7);
}

function getName(longname) {
  return longname.split(/[~\.]/).pop();
}

function isMember(symbol) {
  return symbol.name.indexOf('#') !== -1;
}

function slugify(name) {
  return name.replace(/[#~\.]/g, '-');
}

class Docs extends Component {
  renderModule = mod => {
    const slug = slugify(mod.name);
    return (
      <section key={mod.name}>
        <a name={slug} href={`#${slug}`}>
          <h1>{getModuleName(mod.name)}</h1>
          <h2>Classes</h2>
          {mod.classes &&
            Object.keys(mod.classes).map(cls => this.renderClass(cls, mod))}
          <h2>Functions</h2>
          {mod.symbols &&
            mod.symbols
              .filter(sym => sym.kind === 'function' && !isMember(sym))
              .map(fn => this.renderFunction(fn, mod))}
          <h2>Constants</h2>
          {mod.symbols &&
            mod.symbols
              .filter(sym => sym.kind === 'constant' && !isMember(sym))
              .map(constant => this.renderConstant(constant, mod))}
        </a>
      </section>
    );
  };

  renderImport(longname, mod) {
    return (
      <code>
        import {getName(longname)} from &apos;{getModuleName(mod.name)}&apos;;
      </code>
    );
  }

  renderConstructor(cls, mod) {
    if (cls in mod.classes && cls in mod.classes[cls]) {
      return (
        <div>
          <p>{this.renderImport(cls, mod)}</p>
          <h4>new {getName(cls)}()</h4>
        </div>
      );
    }
  }

  renderClass(cls, mod) {
    return (
      <div key={cls}>
        <h3>{getName(cls)}</h3>
        {this.renderConstructor(cls, mod)}
      </div>
    );
  }

  renderFunction(fn, mod) {
    return <p key={fn.name}>{this.renderImport(fn.name, mod)}</p>;
  }

  renderConstant(constant, mod) {
    return <p key={constant.name}>{this.renderImport(constant.name, mod)}</p>;
  }

  render() {
    return <div>{modules.map(this.renderModule)}</div>;
  }
}

export default Docs;
