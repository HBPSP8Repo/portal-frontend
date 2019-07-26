import moment from 'moment';
import React from 'react';
import { Panel } from 'react-bootstrap';
import styled from 'styled-components';

const StyledPanel = styled(Panel)``;

const Heading = styled(Panel.Heading)`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  border: 0px none transparent;
  h2 {
    flex: 2;
    font-size: 13px;
    ￼color: #9e9e9e;
    padding: 0;
    margin: 0;
    text-transform: uppercase;
    font-weight: bold;
  }
`;

const PanelBody = styled(Panel.Body)`
  p {
    margin: 0;
  }
`;

const PanelFooter = styled(Panel.Footer)`
  border: 0px none transparent;
  font-size: x-small;
`;

interface Props {
  articles: any[] | undefined;
  history: any;
}
export default ({ articles, history }: Props) => {
  return (
    <>
      {!articles || (articles && articles.length === 0 && (
        <StyledPanel>
          <Heading>
            <h2>No article available</h2>
          </Heading>
        </StyledPanel>
      ))}
      {articles &&
        articles.length > 0 &&
        articles.map(article => (
          <StyledPanel key={article.slug}>
            <Heading>
              <h2>{article.title}</h2>
            </Heading>
            <PanelBody>{article.abstract}</PanelBody>
            <PanelFooter>
              <span>
                by {article.createdBy && article.createdBy.username},{' '}
              </span>
              <span>
                {article.createdAt && moment(article.createdAt).fromNow()}
              </span>
            </PanelFooter>
          </StyledPanel>
        ))}
    </>
  );
};
