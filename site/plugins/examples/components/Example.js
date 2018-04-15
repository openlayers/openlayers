import React, {Component, Fragment} from 'react';
import {object} from 'prop-types';
import injectSheet from 'react-jss';

class Example extends Component {
  render() {
    const example = this.props.data.sitePage.context;

    return (
      <Fragment>
        <h1>{example.frontmatter.title}</h1>
        <iframe
          className={this.props.classes.embed}
          src={example.embedUrl}
          frameBorder="0"
        />
        <h3>script</h3>
        <pre>
          <code>{example.js}</code>
        </pre>
        <h3>markup</h3>
        <pre>
          <code>{example.html}</code>
        </pre>
        {example.css && (
          <Fragment>
            <h3>style</h3>
            <pre>
              <code>{example.css}</code>
            </pre>
          </Fragment>
        )}
      </Fragment>
    );
  }
}

Example.propTypes = {
  data: object.isRequired,
  classes: object.isRequired
};

export const query = graphql`
  query ExampleQuery($slug: String!) {
    sitePage(context: {slug: {eq: $slug}}) {
      context {
        slug
        frontmatter {
          title
        }
        embedUrl
        html
        js
        css
      }
    }
  }
`;

const styles = {
  embed: {
    margin: 0,
    padding: 0,
    height: 350,
    width: '100%'
  }
};

export default injectSheet(styles)(Example);
