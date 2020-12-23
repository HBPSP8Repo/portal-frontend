import { mount } from 'enzyme';
import * as React from 'react';

import Result from '../../../ExperimentResult/Result';
import { ExperimentParameter, IExperiment } from '../../Experiment';
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

const experiment: Partial<IExperiment> = {
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
    const { error, experiment: result } = await createExperiment({
      experiment
    });

    expect(error).toBeFalsy();
    expect(result).toBeTruthy();

    const uuid = result && result.uuid;
    expect(uuid).toBeTruthy();
    if (!uuid) {
      throw new Error('uuid not defined');
    }

    const experimentState = await waitForResult({ uuid });
    expect(experimentState.error).toBeFalsy();
    expect(experimentState.experiment).toBeTruthy();

    const props = { experimentState };
    const wrapper = mount(<Result {...props} />);
    expect(wrapper.find('.error')).toHaveLength(0);
    expect(wrapper.find('.loading')).toHaveLength(0);
    expect(wrapper.find('.result')).toHaveLength(1);
  });
});
