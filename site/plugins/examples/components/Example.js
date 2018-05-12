import {object} from 'prop-types';
import ExampleList from './ExampleList';
import React, {Component, Fragment} from 'react';
import styled from 'react-emotion';

const Wrapper = styled('div')({
  display: 'flex'
});

const Sidebar = styled('div')({
  marginRight: '1em'
});

const Content = styled('div')({
  minWidth: 300,
  flexGrow: 1
});

const Embed = styled('iframe')({
  margin: 0,
  padding: 0,
  height: 350,
  width: '100%'
});

const Aside = styled('aside')({
  textAlign: 'right',
  fontSize: '0.75em'
});

const Block = styled('pre')({
  overflow: 'auto'
});

class Example extends Component {
  render() {
    const example = this.props.data.sitePage.context;

    return (
      <Wrapper>
        <Sidebar>
          <ExampleList active={example.slug} />
        </Sidebar>
        <Content>
          <h1>{example.frontmatter.title}</h1>
          <Embed src={example.embedUrl} frameBorder="0" />
          <Aside>
            <p>
              <a href={example.embedUrl}>stand-alone version</a>
            </p>
          </Aside>
          <h3>script</h3>
          <Block>
            <code>{example.js}</code>
          </Block>
          <h3>markup</h3>
          <Block>
            <code>{example.html}</code>
          </Block>
          {example.css && (
            <Fragment>
              <h3>style</h3>
              <Block>
                <code>{example.css}</code>
              </Block>
            </Fragment>
          )}
        </Content>
      </Wrapper>
    );
  }
}

Example.propTypes = {
  data: object.isRequired
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

export default Example;
