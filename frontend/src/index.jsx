import React from 'react';
import ReactDom from 'react-dom';

import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import Home from './components/views/home';
import App from './components/app';
import NewHome from './components/views/new-home'
import Blocks from './components/views/blocks'

require('./stylesheets/home.scss');

const app = document.querySelector('#app');

ReactDom.render(
  <Router history={browserHistory}>
    <Route path='/' component={App}>
      <IndexRoute component={NewHome} backendAddress="52.53.243.120:9000"/>
      {/* <Route path='*' component={Home} backendAddress="52.53.243.120:9000"/> */}
      <Route path='/home' component={NewHome} />
      <Route path='/blocks' component={Blocks} />
      <Route path='/txs' component={Home} backendAddress="52.53.243.120:9000"/>
    </Route>
  </Router>,
  app
);
