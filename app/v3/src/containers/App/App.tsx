import * as React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Provider } from "unstated";
import { Experiment, Experiments, Navigation } from "../../components";

import "./App.css";

class App extends React.Component {
  public render() {
    return (
      <Provider>
        <Router>
          <div className="App">
            <Navigation />
            <Route path="/v3/experiments" component={Experiments} />
            <Route path="/v3/experiment/:slug/:uuid" component={Experiment} />
          </div>
        </Router>
      </Provider>
    );
  }
}

export default App;
