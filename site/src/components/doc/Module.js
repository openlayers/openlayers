import React, {Component, Fragment} from 'react';
import {string, array} from 'prop-types';
import {slugify, getShortModuleName} from '../../utils/doc';
import Func from './Func';
import Class from './Class';

class Module extends Component {
  static propTypes = {
    name: string.isRequired,
    classes: array.isRequired,
    functions: array.isRequired
  };

  renderClasses() {
    if (this.props.classes.length === 0) {
      return null;
    }

    return (
      <Fragment>
        <h3>Classes</h3>
        {this.props.classes.map(cls => <Class key={cls.name} {...cls} />)}
      </Fragment>
    );
  }

  renderFuncs() {
    if (this.props.functions.length === 0) {
      return null;
    }

    return (
      <Fragment>
        <h3>Functions</h3>
        {this.props.functions.map(func => <Func key={func.name} {...func} />)}
      </Fragment>
    );
  }

  render() {
    const name = this.props.name;
    const slug = slugify(name);
    return (
      <section>
        <a name={slug} href={`#${slug}`}>
          <h1>
            <code>{getShortModuleName(name)}</code>
          </h1>
        </a>
        {this.renderClasses()}
        {this.renderFuncs()}
      </section>
    );
  }
}

export default Module;
