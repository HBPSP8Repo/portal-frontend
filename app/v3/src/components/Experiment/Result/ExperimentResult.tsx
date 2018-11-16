// tslint:disable:no-console
import { MIME_TYPES } from "@app/constants";
import { IExperiment, INode } from "@app/types";
import * as React from "react";
import { Panel, Tab, Tabs } from "react-bootstrap";
import { Highchart, JSON, PFA, Plotly } from "./formats";

import "../Experiment.css";

export default ({
  experimentState
}: {
  experimentState: IExperiment;
}) => {
  const experiment = experimentState && experimentState.experiment;
  const nodes = experiment && experiment.results;
  const error =
    (experimentState && experimentState.error) ||
    (experiment && experiment.error);

  const loading = !nodes && !error;

  const methodsDisplay = (thenode: INode) => (
    <Tabs defaultActiveKey={0} id="tabs-methods">
      {thenode.methods &&
        thenode.methods.map((method: any, j: number) => (
          <Tab eventKey={j} title={method.algorithm} key={j}>
            {method.mime === MIME_TYPES.ERROR && (
              <div>
                <h3>An error has occured</h3>
                <p>{method.error}</p>
              </div>
            )}
            {method.mime === MIME_TYPES.JSON &&
              method.data.map((row: any, k: number) => (
                <JSON key={k} row={row} />
              ))}

            {method.mime === MIME_TYPES.PLOTLY &&
              method.data.map((d: { data: any; layout: any }, k: number) => (
                <Plotly data={d.data} layout={d.layout} key={k} />
              ))}
            {method.mime === MIME_TYPES.HIGHCHARTS &&
              method.data.map((d: { data: any }, k: number) => (
                <Highchart options={d} key={k} />
              ))}
            {method.mime === MIME_TYPES.PFA &&
              method.data.map((data: any, k: number) => (
                <PFA key={k} method={method} data={data} />
              ))}
          </Tab>
        ))}
    </Tabs>
  );

  const nodesDisplay = (thenodes: INode[]) => (
    <Tabs defaultActiveKey={0} id="tabs-node">
      {thenodes &&
        thenodes.map((node: any, i: number) => (
          <Tab eventKey={i} title={node.name} key={i}>
            {methodsDisplay(node)}
          </Tab>
        ))}
    </Tabs>
  );

  return (
    <Panel>
      <Panel.Title>
        <div className="flexbox">
          <h3 className="item">Your Experiment</h3>
        </div>
      </Panel.Title>
      <Panel.Body>
        {loading ? (
          <div>
            <h3>Your experiment is currently running...</h3>
            <p>
              Please check back in a few minutes. This page will automatically
              refresh once your experiment has finished executing.
            </p>
          </div>
        ) : null}
        {error ? (
          <div>
            <h3>An error has occured</h3>
            <p>{error}</p>
          </div>
        ) : null}
        {nodes && nodes.length > 1 && nodesDisplay(nodes)}
        {nodes && nodes.length === 1 && methodsDisplay(nodes[0])}
      </Panel.Body>
    </Panel>
  );
};
