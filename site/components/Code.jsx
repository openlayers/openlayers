import React, {PureComponent} from 'react';
import {string} from 'prop-types';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {coy} from 'react-syntax-highlighter/dist/styles/prism';

class Code extends PureComponent {
  render() {
    let language = this.props.language;
    if (!language) {
      language = 'js';
    }

    return (
      <SyntaxHighlighter language={language} style={coy}>
        {this.props.value}
      </SyntaxHighlighter>
    );
  }
}

Code.propTypes = {
  value: string.isRequired,
  language: string
};

export default Code;
