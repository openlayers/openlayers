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
          {mod.symbols
            .filter(sym => sym.kind === 'class')
            .map(cls => this.renderClass(cls, mod))}
          <h2>Functions</h2>
          {mod.symbols
            .filter(sym => sym.kind === 'function' && !isMember(sym))
            .map(fn => this.renderFunction(fn, mod))}
          <h2>Constants</h2>
          {mod.symbols
            .filter(sym => sym.kind === 'constant' && !isMember(sym))
            .map(constant => this.renderConstant(constant, mod))}
        </a>
      </section>
    );
  };

  renderClass(cls, mod) {
    return (
      <p key={cls.name}>
        <code>
          import {getName(cls.name)} from &apos;{getModuleName(mod.name)}&apos;;
        </code>
      </p>
    );
  }

  renderFunction(fn, mod) {
    return (
      <p key={fn.name}>
        <code>
          import &#123;{getName(fn.name)}&#125; from &apos;{getModuleName(
            mod.name
          )}&apos;;
        </code>
      </p>
    );
  }

  renderConstant(constant, mod) {
    return (
      <p key={constant.name}>
        <code>
          import &#123;{getName(constant.name)}&#125; from &apos;{getModuleName(
            mod.name
          )}&apos;;
        </code>
      </p>
    );
  }

  render() {
    return (
      <div>{modules.filter(mod => !!mod.symbols).map(this.renderModule)}</div>
    );
  }
}

export default Docs;
