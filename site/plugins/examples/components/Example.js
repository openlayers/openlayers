import React, {Component, Fragment} from 'react';
import {object} from 'prop-types';
import injectSheet from 'react-jss';
import ExampleList from './ExampleList';

class Example extends Component {
  render() {
    const example = this.props.data.sitePage.context;

    return (
      <section className={this.props.classes.wrapper}>
        <div className={this.props.classes.nav}>
          <ExampleList active={example.slug} />
        </div>
        <div className={this.props.classes.content}>
          <h1>{example.frontmatter.title}</h1>
          <iframe
            className={this.props.classes.embed}
            src={example.embedUrl}
            frameBorder="0"
          />
          <aside className={this.props.classes.aside}>
            <p>
              <a href={example.embedUrl}>stand-alone version</a>
            </p>
          </aside>
          <h3>script</h3>
          <pre className={this.props.classes.pre}>
            <code>{example.js}</code>
          </pre>
          <h3>markup</h3>
          <pre className={this.props.classes.pre}>
            <code>{example.html}</code>
          </pre>
          {example.css && (
            <Fragment>
              <h3>style</h3>
              <pre className={this.props.classes.pre}>
                <code>{example.css}</code>
              </pre>
            </Fragment>
          )}
        </div>
      </section>
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
  wrapper: {
    display: 'flex'
  },
  nav: {
    marginRight: '1em'
  },
  content: {
    minWidth: 300,
    flexGrow: 1
  },
  pre: {
    overflow: 'auto'
  },
  embed: {
    margin: 0,
    padding: 0,
    height: 350,
    width: '100%'
  },
  aside: {
    textAlign: 'right',
    fontSize: '0.75em'
  }
};

export default injectSheet(styles)(Example);
