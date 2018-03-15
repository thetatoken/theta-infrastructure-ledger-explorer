import React from 'react';
import ReactDom from 'react-dom';

import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import routes from './routes';
import home from './components/views/home'

require('./stylesheets/home.scss');

const app = document.querySelector('#app');

ReactDom.render(
  <Router history={browserHistory}>
    <Route path='/' components = {home} backendAddress="52.53.243.120:9000"/>
  </Router>,
  app
);
