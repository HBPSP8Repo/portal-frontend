// tslint:disable
// FIXME: fix that eval
import * as React from 'react';

const vis = require('vis/dist/vis.min');

interface IProps {
  jsString: any;
}

export default class VISJS extends React.PureComponent<IProps> {
  public componentDidMount() {
    eval(`${this.props.jsString}`);
  }

  public render = () => (
    <div
      id='visualization'
      style={{
        height: '500px'
      }}
    />
  );
}
