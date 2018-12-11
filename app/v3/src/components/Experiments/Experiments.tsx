import { APIExperiment } from "@app/components/API";
import { MIP } from "@app/types";
import * as React from "react";
import { Label, Panel } from "react-bootstrap";

import "./Experiments.css";

interface IProps {
  apiExperiment: APIExperiment;
}

const renderExperiments = (experiments: MIP.API.IExperimentResponse[] | undefined) => {
  if (experiments === undefined) {
    return <React.Fragment />;
  }

  return (
    <div>
      {experiments.map((experiment: MIP.API.IExperimentResponse) => {
        const nodes = experiment && experiment.results;
        const error = experiment && experiment.error;

        const loading = !nodes && !error;

        const status: [string, string] = loading
          ? ["loading", "info"]
          : experiment.error
          ? [experiment.error, "danger"]
          : ["OK", "success"];
        return (
          <div className="Experiments" key={experiment.uuid}>
            <Panel
              id="collapsible-panel-{experiment.uuid}"
              defaultExpanded={false}
            >
              <Panel.Heading>
                <Panel.Title toggle={true}>
                  <div className="experiment-box">
                    <div className="box">{experiment.name} </div>
                    <div className="box">
                      <Label bsStyle={status[1]}>{status[0]}</Label>
                    </div>
                  </div>
                </Panel.Title>
              </Panel.Heading>
              <Panel.Collapse>
                <Panel.Body>
                  <pre>{JSON.stringify(experiment, null, 2)}</pre>
                </Panel.Body>
              </Panel.Collapse>
            </Panel>
          </div>
        );
      })}
    </div>
  );
};

class Experiments extends React.Component<IProps> {
  public render() {
    const { apiExperiment } = this.props;
    return renderExperiments(apiExperiment.state.experiments);
  }
}

export default Experiments;
