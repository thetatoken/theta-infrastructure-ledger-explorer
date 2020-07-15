import React from 'react';
import ReactDom from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';

import App from 'app';
import Home from 'sections/home';
import Transactions from 'sections/transactions'
import TransactionDetails from 'sections/transaction-details'
import Blocks from 'sections/blocks'
import BlockDetails from 'sections/block-details'
import AccountDetails from 'sections/account-details'
// import Check from 'sections/check'
import Stakes from 'sections/stakes'

import config from '../config'; 

const app = document.querySelector('#app-root');
const backendSocketAddress = `${config.socketApi.host}:${config.socketApi.port}`;
 
ReactDom.render(
  <Router history={browserHistory}>
    <Route path='/' component={App}>
      <IndexRoute component={Home} backendAddress={backendSocketAddress}/>
      <Route path='/dashboard' component={Home} backendAddress={backendSocketAddress}/>
      <Route path='/blocks' component={Blocks} />
      <Route path='/blocks/:blockHeight' component={BlockDetails} />
      <Route path='/txs' component={Transactions} />
      <Route path='/txs/:transactionHash' component={TransactionDetails} />
      <Route path='/account/:accountAddress' component={AccountDetails} />
      <Route path='/stakes' component={Stakes} />
      {/* <Route path='/tmp-internal-check' component={Check} /> */}
    </Route>
  </Router>,
  app
);
