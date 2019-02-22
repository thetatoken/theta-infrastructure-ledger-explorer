import React from 'react';
import ReactDom from 'react-dom';

import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import Dashboard from 'features/dashboard';
import App from 'app';
import Transactions from 'features/transactions'
import TransactionExplorer from 'features/transactions/components/transaction-explorer'
import Blocks from 'features/blocks'
import BlockExplorer from 'features/blocks/components/block-explorer'
import AccountExplorer from 'features/account'
import config from '../config';

const app = document.querySelector('#root');
const backendSocketAddress = `${config.socketApi.host}:${config.socketApi.port}`;
 
ReactDom.render(
  <Router history={browserHistory}>
    <Route path='/' component={App}>
      <IndexRoute component={Dashboard} backendAddress={backendSocketAddress}/>
      <Route path='/dashboard' component={Dashboard} backendAddress={backendSocketAddress}/>
      <Route path='/blocks' component={Blocks} />
      <Route path='/blocks/:blockHeight' component={BlockExplorer} />
      <Route path='/txs' component={Transactions} />
      <Route path='/txs/:transactionHash' component={TransactionExplorer} />
      <Route path='/account/:accountAddress' component={AccountExplorer} />
    </Route>
  </Router>,
  app
);
