import { mount } from 'enzyme';
import * as React from 'react';

import Result from '../../../ExperimentResult/Result';
import {
  ExperimentParameter,
  IExperiment,
  IExperimentPrototype
} from '../../Experiment';
import {
  createExperiment,
  TEST_PATHOLOGIES,
  waitForResult
} from '../../UtiltyTests';

// config

const modelSlug = `kaplan-meier-${Math.round(Math.random() * 10000)}`;
const algorithmId = 'KAPLAN_MEIER';
const algorithmLabel = 'Kaplan-Meier Estimator';
const parameters: ExperimentParameter[] = [
  {
    name: 'outcome_pos',
    label: 'Positive outcome',
    value: 'AD'
  },
  {
    name: 'outcome_neg',
    label: 'Negative outcome',
    value: 'MCI'
  },
  {
    name: 'max_age',
    label: 'Maximum age',
    value: '100'
  },
  {
    name: 'total_duration',
    label: 'total_duration',
    value: 1100
  },
  {
    name: 'x', // covariable
    value: 'apoe4'
  },
  {
    name: 'y', // variable
    value: 'alzheimerbroadcategory'
  },
  {
    name: 'pathology',
    value: TEST_PATHOLOGIES.dementia.code
  },
  {
    name: 'dataset',
    value: TEST_PATHOLOGIES.dementia.datasets
      .filter(d => d.code !== 'fake_longitudinal')
      .map(d => d.code)
      .toString()
  }
];

const experiment: IExperimentPrototype = {
  algorithm: {
    name: algorithmId,
    parameters,
    type: 'string'
  },
  name: modelSlug
};

// Test

describe('Integration Test for experiment API', () => {
  it(`create ${algorithmId}`, async () => {
    const { experiment: result } = await createExperiment({
      experiment
    });

    expect(result).toBeTruthy();
    expect(result.status).toStrictEqual('pending');

    const uuid = (result as IExperiment)?.uuid;
    expect(uuid).toBeTruthy();

    if (!uuid) {
      throw new Error('uuid not defined');
    }

    const experimentState = await waitForResult({ uuid });
    expect(experimentState.experiment.status).toStrictEqual('success');
    expect(experimentState.experiment).toBeTruthy();

    const props = { experimentState };

    const wrapper = mount(<Result {...props} />);
    expect(wrapper.find('.error')).toHaveLength(0);
    expect(wrapper.find('.loading')).toHaveLength(0);
    expect(wrapper.find('.result')).toHaveLength(1);
  });
});
