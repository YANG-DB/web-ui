import React from "react";
import { Header } from "./components";
import { Research, Schema, Api } from "./pages";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";

import styles from "./App.module.css";

const links = {
  SCHEMA: "schema",
  RESEARCH: "research",
  API: "api"
};

export default function App() {
  return (
    <Router>
      <div className={styles.app}>
        <Header links={links} />
        <Switch>
          {/* This first route defines the default route for the app */}
          <Route
            exact
            path={`/`}
            render={() => <Redirect to={`/${links.RESEARCH}`} />}
          />
          <Route path={`/${links.RESEARCH}`}>
            <Research />
          </Route>
          <Route path={`/${links.SCHEMA}`}>
            <Schema />
          </Route>
          <Route path={`/${links.API}`}>
            <Api />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
