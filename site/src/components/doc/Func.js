import React, {Component, Fragment} from 'react';
import {string, array} from 'prop-types';
import Markdown from 'react-markdown';
import {slugify, getShortName, getShortModuleName} from '../../utils/doc';

class Func extends Component {
  static propTypes = {
    name: string.isRequired,
    description: string,
    params: array,
    exported: string
  };

  renderArguments() {
    if (!this.props.params) {
      return null;
    }

    return (
      <Fragment>
        <h4>Arguments</h4>
        <ul>{this.props.params.map(this.renderArgument)}</ul>
      </Fragment>
    );
  }

  renderArgument(arg) {
    return (
      <li key={arg.name}>
        <code>{arg.name}</code>: {arg.description}
      </li>
    );
  }

  render() {
    const name = this.props.name;
    const shortName = getShortName(name);
    const moduleName = getShortModuleName(name);
    const slug = slugify(name);
    const exported = this.props.exported;

    let importSyntax;
    if (exported) {
      if (exported === 'default') {
        importSyntax = `import ${shortName} from '${moduleName}';\n\n`;
      } else if (exported !== shortName) {
        importSyntax = `import {${exported} as ${shortName}} from '${moduleName}';\n\n`;
      } else {
        importSyntax = `import {${exported}} from '${moduleName}';\n\n`;
      }
    }

    const params = this.props.params || [];
    const usage = `${shortName}(${params
      .map(param => param.name)
      .join(', ')});`;

    const description = this.props.description || '';

    return (
      <Fragment>
        <a name={slug} href={`#${slug}`} />
        <pre>
          <code>
            {importSyntax}
            {usage}
          </code>
        </pre>
        <Markdown source={description} />
        {this.renderArguments()}
      </Fragment>
    );
  }
}

export default Func;
