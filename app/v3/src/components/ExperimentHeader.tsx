import { IExperimentResult } from "@app/types";
import moment from "moment"; // FIXME: change lib, too heavy
import * as React from "react";
import { Button, Panel } from "react-bootstrap";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { Dropdown } from "../components";
import { ExperimentContainer } from "../containers";

interface IProps extends RouteComponentProps<any> {
  experimentContainer: ExperimentContainer;
  experiments: IExperimentResult[] | undefined;
}

export default withRouter(
  ({ experimentContainer, experiments, history }: IProps) => {
    const state = experimentContainer && experimentContainer.state;
    const experiment = state && state.experiment;
    const title = experiment && experiment.name;
    const modelId = experiment && experiment.modelDefinitionId;

    const handleSelectExperiment = async (
      selectedExperiment: IExperimentResult
    ) => {
      const { modelDefinitionId, uuid } = selectedExperiment;
      history.push(`/v3/experiment/${modelDefinitionId}/${uuid}`);

      const load = experimentContainer && experimentContainer.load;
      return await load(uuid);
    };

    return (
      <Panel>
        <Panel.Title className="experiment-header">
          <h3 className="item">
            Results of Experiment <strong>{title}</strong> on{" "}
            <a href={`/models/${modelId}`}>{modelId}</a>
          </h3>
          <div className="item">
            <Button bsStyle="info">SHARE EXPERIMENT</Button>
          </div>
          <div className="item">
            <Dropdown
              items={
                experiment &&
                experiments &&
                experiments.filter(
                  (e: any) =>
                    e.modelDefinitionId === experiment.modelDefinitionId
                )
              }
              title="RELATED EXPERIMENTS"
              handleSelect={handleSelectExperiment}
            />
          </div>
        </Panel.Title>

        <Panel.Body>
          <h5>
            Created{" "}
            {experiment &&
              moment(new Date(experiment.created), "YYYYMMDD").fromNow()}{" "}
            by {experiment && experiment.user.username}
          </h5>
        </Panel.Body>
      </Panel>
    );
  }
);
