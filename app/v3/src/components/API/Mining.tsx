import request from 'request-promise-native';
import { Container } from 'unstated';
import { MIP } from '../../types';
import { backendURL } from '../API';

class Mining extends Container<MIP.Store.IMiningState> {

  public static normalizeHeatmapData = (heatmap: any) => {
    // FIXME: Immutable lib with deepCopy
    const newHeatmap = JSON.parse(JSON.stringify(heatmap));
    if (Array.isArray(heatmap.data)) {
      newHeatmap.data = heatmap.data.map((d: any) => d.data);      
    } else {
      newHeatmap.data = [heatmap.data.data];
    }

    return newHeatmap;
  };
  public state: MIP.Store.IMiningState;

  private cachedMinings: MIP.Store.IMiningResponseShape[] = [];
  private requestedDatasets: Set<MIP.API.IVariable> = new Set();
  private options: request.Options;
  private baseUrl: string;

  constructor(config: any) {
    super();
    this.state = { minings: undefined, heatmap: undefined };
    this.options = config.options;
    this.baseUrl = backendURL;
  }
  public clear = () => {
    this.cachedMinings = [];
    this.requestedDatasets.clear();
    return this.setState((prevState: any) => ({
      error: undefined,
      heatmap: undefined,
      minings: undefined
    }));
  };

  public heatmap = async ({
    payload
  }: {
    payload: MIP.API.IMiningPayload;
  }): Promise<any> => {
    // TODO: return type should be MIP.Store.IMiningState
    // FIXME: datasets: payload.datasets
    await this.setState({
      heatmap: {
        data: undefined,
        dataset: payload.datasets[0],
        error: undefined
      }
    });
    payload = {
      ...payload,
      algorithm: {
        code: 'correlationHeatmap',
        name: 'Correlation heatmap',
        parameters: [],
        validation: false
      }
    };
    const heatmap = await this.fetchOne({ payload });
    return await this.setState({ heatmap: Mining.normalizeHeatmapData(heatmap) });
  };

  // fetch for each dataset, otherwise values are aggregated for all datasets
  public allByDataset = async ({
    payload
  }: {
    payload: MIP.API.IMiningPayload;
  }): Promise<any> => {
    // Filter remaining datasets
    const remainingDatasets = payload.datasets.filter(
      dataset =>
        Array.from(this.requestedDatasets)
          .map(d => d.code)
          .indexOf(dataset.code) === -1
    );
    const remainingPayloads: MIP.API.IMiningPayload[] = remainingDatasets.map(
      dataset => ({
        algorithm: {
          code: 'statisticsSummary',
          name: 'statisticsSummary',
          parameters: [],
          validation: false
        },
        ...payload,
        datasets: [dataset]
      })
    );

    this.requestedDatasets = this.addAll(
      this.requestedDatasets,
      remainingDatasets
    );

    remainingPayloads.map(async pl => {
      const placeholderMining = {
        data: undefined,
        dataset: pl.datasets[0],
        error: undefined
      };
      await this.setState((prevState: any) => {
        const nextState =
          prevState.minings &&
          prevState.minings.filter(
            (m: MIP.Store.IMiningResponseShape) =>
              m.dataset && m.dataset.code !== placeholderMining.dataset.code
          );
        return {
          minings: prevState.minings
            ? [...nextState, placeholderMining]
            : [placeholderMining]
        };
      });

      const mining = await this.fetchOne({ payload: pl });
      this.cachedMinings.push(mining);

      return await this.setState((prevState: any) => {
        const nextState =
          prevState.minings &&
          prevState.minings.filter(
            (m: MIP.Store.IMiningResponseShape) =>
              m.dataset &&
              mining.dataset &&
              m.dataset.code !== mining.dataset.code
          );
        return {
          minings: prevState.minings ? [...nextState, mining] : [mining]
        };
      });
    });
  };

  private addAll = (set: any, items: any) => {
    for (const it of items) {
      set.add(it);
    }
    return set;
  };

  private fetchOne = async ({
    payload
  }: {
    payload: MIP.API.IMiningPayload;
  }): Promise<MIP.Store.IMiningResponseShape> => {
    // FIXME: Immutable lib
    const copyOfDataset = JSON.parse(JSON.stringify(payload.datasets));

    try {
      const response = await request({
        body: JSON.stringify(payload),
        headers: {
          ...this.options.headers,
          'Content-Type': 'application/json;charset=UTF-8'
        },
        method: 'POST',
        uri: `${this.baseUrl}/mining`
      });

      const data = JSON.parse(response).data;

      return { data, dataset: copyOfDataset.pop(), error: undefined };
    } catch (error) {
      return {
        data: undefined,
        dataset: copyOfDataset.pop(),
        error: error.message
      };
    }
  };
}

export default Mining;
