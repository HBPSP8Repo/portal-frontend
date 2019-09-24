import './Explore.css';

import * as React from 'react';
import { Button, Checkbox, Panel } from 'react-bootstrap';

import { APICore, APIModel } from '../API';
import { VariableEntity } from '../API/Core';
import { ModelResponse } from '../API/Model';
import DropdownModel from '../UI/DropdownModel';
import { D3Model, HierarchyCircularNode, ModelType } from './Container';
import Histograms from './D3Histograms';
import ModelView from './D3Model';
import Search from './D3Search';
import Header from './Header';

export interface ExploreProps {
  apiCore: APICore;
  apiModel: APIModel;
  children?: any;
  selectedNode: HierarchyCircularNode | undefined;
  layout: HierarchyCircularNode;
  histograms?: any;
  d3Model: D3Model;
  handleSelectDataset: (e: VariableEntity) => void;
  handleSelectPathology: (code: string) => void;
  handleSelectNode: (node: HierarchyCircularNode) => void;
  handleUpdateD3Model: Function;
  handleSelectModel: (model?: ModelResponse) => void;
  handleGoToAnalysis: Function;
  zoom: (circleNode: HierarchyCircularNode) => void;
}

export default (props: ExploreProps): JSX.Element => {
  const {
    apiCore,
    apiModel,
    children,
    layout,
    selectedNode,
    histograms,
    d3Model,
    handleSelectNode,
    handleSelectDataset,
    handleSelectPathology,
    handleUpdateD3Model,
    handleSelectModel,
    handleGoToAnalysis,
    zoom
  } = props;

  const model = apiModel.state.model;
  const selectedDatasets =
    (model && model.query && model.query.trainingDatasets) || [];
  const selectedPathology = model && model.query && model.query.pathology;
  const datasets = apiCore.datasetsForPathology(selectedPathology);

  return (
    <div className="Explore">
      <div className="content">
        <div className="sidebar">
          {apiCore.state.pathologies && apiCore.state.pathologies.length > 1 && (
            <Panel className="pathologies">
              <Panel.Title>
                <h3>Medical Conditions</h3>
              </Panel.Title>
              <Panel.Body>
                {apiCore.state.pathologies.map(g => (
                  <label key={g.code}>
                    <input
                      type="radio"
                      id={g.code}
                      name={g.label}
                      value={g.code}
                      checked={selectedPathology === g.code}
                      // tslint:disable jsx-no-lambda
                      onChange={(e): void => {
                        handleSelectPathology(e.target.value);
                      }}
                    />{' '}
                    {g.label}
                  </label>
                ))}
              </Panel.Body>
            </Panel>
          )}
          <Panel className="datasets">
            <Panel.Title>
              <h3>Datasets</h3>
            </Panel.Title>
            <Panel.Body>
              {datasets &&
                datasets.map((dataset: any) => (
                  <Checkbox
                    key={dataset.code}
                    inline={true}
                    // tslint:disable-next-line jsx-no-lambda
                    onChange={() => {
                      handleSelectDataset(dataset);
                    }}
                    checked={selectedDatasets
                      .map(s => s.code)
                      .includes(dataset.code)}
                  >
                    {dataset.label}
                  </Checkbox>
                ))}
            </Panel.Body>
          </Panel>
          <Panel className="model">
            <Panel.Title>
              <h3>Model</h3>
              <div>
                <DropdownModel
                  items={apiModel.state.models}
                  selectedSlug={
                    apiModel.state.model && apiModel.state.model.slug
                  }
                  showClear={true}
                  handleSelect={handleSelectModel}
                />
              </div>
            </Panel.Title>
            <Panel.Body className="model-body">
              <ModelView
                d3Model={d3Model}
                handleUpdateD3Model={handleUpdateD3Model}
                handleSelectNode={handleSelectNode}
                zoom={zoom}
              />
            </Panel.Body>
          </Panel>
        </div>
        <div className="column1">
          <Panel className="circle-pack">
            <Panel.Title>
              <div className="variable-box">
                <h3 className="child">Variables</h3>
                <Search
                  hierarchy={layout}
                  zoom={zoom}
                  handleSelectNode={handleSelectNode}
                />
              </div>
            </Panel.Title>
            <Panel.Body>
              <div className="buttons">
                <div className="child-title">
                  <h5>Add to model</h5>
                </div>
                <Button
                  className="child"
                  bsStyle={'success'}
                  bsSize={'small'}
                  disabled={!selectedNode}
                  // tslint:disable-next-line jsx-no-lambda
                  onClick={() =>
                    handleUpdateD3Model(ModelType.VARIABLE, selectedNode)
                  }
                >
                  {d3Model.variables &&
                  selectedNode &&
                  d3Model.variables.filter(c =>
                    selectedNode.leaves().includes(c)
                  ).length === selectedNode.leaves().length
                    ? '-'
                    : '+'}{' '}
                  AS VARIABLE
                </Button>
                <Button
                  className="child"
                  bsStyle={'warning'}
                  bsSize={'small'}
                  disabled={!selectedNode}
                  // tslint:disable-next-line jsx-no-lambda
                  onClick={() =>
                    handleUpdateD3Model(ModelType.COVARIABLE, selectedNode)
                  }
                >
                  {d3Model.covariables &&
                  selectedNode &&
                  d3Model.covariables.filter(c =>
                    selectedNode.leaves().includes(c)
                  ).length === selectedNode.leaves().length
                    ? '-'
                    : '+'}{' '}
                  AS COVARIABLE
                </Button>
              </div>
              {children}
            </Panel.Body>
          </Panel>
        </div>
        <div className="column2">
          <div className="header">
            <Header handleGoToAnalysis={handleGoToAnalysis} />
          </div>

          <Panel className="statistics">
            <Panel.Title>
              <h3>Statistics Summary</h3>
            </Panel.Title>
            <Panel.Body>
              <Histograms
                histograms={histograms}
                selectedNode={selectedNode}
                handleSelectedNode={handleSelectNode}
                zoom={zoom}
              />
            </Panel.Body>
          </Panel>
        </div>
      </div>
    </div>
  );
};
