import React from 'react';
import styled from 'styled-components';

const H3 = styled.h3`
  margin: 0;
  font-size: 16px;
  color: rgb(217, 83, 79);
`;

export default ({ message }: { message: string }): JSX.Element => (
  <div>
    <H3>An error has occured</H3>
    <p>{message}</p>
  </div>
);
