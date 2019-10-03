import * as React from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import styled from 'styled-components';

import Helpdesk from './Helpdesk';

const MainBox = styled.div`
  .dropdown-menu {
    right: 0;
    left: auto;
    width: fit-content !important;
    max-height: none;
    overflow-y: auto;
    padding: 0.5em 1em;
    z-index: 1001;

    li {
      padding: 0.5em 0;
      margin: 0;
    }

    li > a {
      padding: 0;
      color: black;
    }
  }
`;

export default () => {
  return (
    <MainBox>
      <DropdownButton
        noCaret={false}
        bsStyle="link"
        id={'help-dropdown'}
        title={'Help'}
      >
        <MenuItem
          // tslint:disable-next-line jsx-no-lambda
          onSelect={() => {
            window.open('https://hbpmedical.github.io/documentation/');
          }}
        >
          <span className="glyphicon-book glyph" /> MIP Documentation
        </MenuItem>
        <MenuItem // tslint:disable-next-line jsx-no-lambda
          onSelect={() => {
            window.open('https://www.youtube.com/watch?v=MNWExzouMJw');
          }}
        >
          <span className="glyphicon-film glyph" /> MIP introduction (video)
        </MenuItem>
        <div>
          <span className="glyphicon-envelope glyph" /> Email us at{' '}
          <a href="mailto://support@humanbrainproject.eu">
            support@humanbrainproject.eu
          </a>
        </div>
        <Helpdesk />
      </DropdownButton>
    </MainBox>
  );
};
