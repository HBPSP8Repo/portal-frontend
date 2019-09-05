// import bugsnag from "@bugsnag/js";
// import bugsnagReact from "@bugsnag/plugin-react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { default as AppContainer } from "./components/App/Container";
import "./index.css";
import { unregister } from "./registerServiceWorker";

// const bugsnagClient = bugsnag("87e28aed7927156bee7f8accd10ed20a");
// bugsnagClient.use(bugsnagReact, React);
// const ErrorBoundary = bugsnagClient.getPlugin("react");

ReactDOM.render(
  // <ErrorBoundary>
    <AppContainer />
  // </ErrorBoundary>,
 , document.getElementById("root") as HTMLElement
);
unregister();