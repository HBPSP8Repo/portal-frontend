import moment from 'moment';
import React, { useState } from 'react';
import { Button, Panel } from 'react-bootstrap';
import styled from 'styled-components';

import { ExperimentResponse } from '../API/Experiment';
import { ModelResponse } from '../API/Model';
import RenderResult from '../Result/RenderResult';

const StyledPanel = styled(Panel)`
  overflow: hidden !important;
  margin-bottom: 1em;
`;

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
  experiments: ExperimentResponse[] | undefined;
  models: ModelResponse[] | undefined;
  handleSelectExperiment: (
    modelId: string | undefined,
    experimentId: string
  ) => void;
  handleNewExperiment: (modelId: string | undefined) => void;
}
export default ({
  models,
  experiments,
  handleSelectExperiment,
  handleNewExperiment
}: Props) => {
  const [collapsibleState, setCollapsibleState] = useState(['']);

  const handleExpand = (uuid: string) => {
    const nextState =
      collapsibleState && collapsibleState.includes(uuid)
        ? collapsibleState.filter((c: string) => c !== uuid)
        : [uuid, ...collapsibleState] || [uuid];

    setCollapsibleState(nextState);
  };

  return (
    <>
      {!experiments ||
        (experiments && experiments.length === 0 && (
          <p>No experiment available</p>
        ))}
      {experiments &&
        experiments.map(experiment => {
          const model =
            models &&
            models.find(
              (m: ModelResponse) => m.slug === experiment.modelDefinitionId
            );

          const nodes = experiment && experiment.results;

          return (
            <StyledPanel key={experiment.name} defaultExpanded={false}>
              <Heading>
                <Panel.Title
                  toggle={true}
                  style={{ flexGrow: 1 }}
                  // tslint:disable-next-line jsx-no-lambda
                  onClick={() => {
                    handleExpand(experiment.uuid);
                  }}>
                  <h2>
                    <a>{experiment && experiment.name}</a>
                  </h2>
                </Panel.Title>
                <div>
                  <Button
                    bsSize='small'
                    // tslint:disable-next-line jsx-no-lambda
                    onClick={() =>
                      handleNewExperiment(experiment.modelDefinitionId)
                    }>
                    New experiment
                  </Button>
                  <Button
                    bsSize='small'
                    // tslint:disable-next-line jsx-no-lambda
                    onClick={() =>
                      handleSelectExperiment(
                        experiment.modelDefinitionId,
                        experiment.uuid
                      )
                    }>
                    View
                  </Button>
                </div>
              </Heading>
              <Panel.Collapse>
                <PanelBody collapsible={true}>
                  {model && (
                    <>
                      {model.query.variables && (
                        <p>
                          <b>Variables</b>:{' '}
                          {model.query.variables.map((v: any) => v.code)}
                        </p>
                      )}
                      {model.query.coVariables !== undefined &&
                        model.query.coVariables.length > 0 && (
                          <p>
                            <b>Covariables</b>:{' '}
                            {model.query.coVariables.map(
                              (v: any) => `${v.code}, `
                            )}
                          </p>
                        )}
                      {model.query.groupings !== undefined &&
                        model.query.groupings.length > 0 && (
                          <p>
                            <b>Groupings</b>:{' '}
                            {model.query.groupings.map(
                              (v: any) => `${v.code}, `
                            )}
                          </p>
                        )}
                    </>
                  )}
                  {collapsibleState.includes(experiment.uuid) ? (
                    <RenderResult nodes={nodes} />
                  ) : null}
                </PanelBody>
              </Panel.Collapse>
              <PanelFooter>
                <span>
                  by {experiment && experiment.user && experiment.user.username}
                  ,{' '}
                </span>
                <span>
                  {experiment &&
                    experiment.created &&
                    moment(experiment.created).fromNow()}
                </span>
              </PanelFooter>
            </StyledPanel>
          );
        })}
    </>
  );
};
