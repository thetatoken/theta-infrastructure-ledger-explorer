import React from 'react';
import ReactDom from 'react-dom';

import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import Dashboard from './features/dashboard';
import App from './app';
import Transactions from './features/transactions'
import TransactionExplorer from './features/transactions/components/transaction-explorer'
import Blocks from './features/blocks'
import BlockExplorer from './features/blocks/components/block-explorer'
import AccountExplorer from './features/account'
import './styles.scss';

const app = document.querySelector('#root');
const backendAddress = "52.53.243.120:9000";
ReactDom.render(
  <Router history={browserHistory}>
    <Route path='/' component={App}>
      <IndexRoute component={Dashboard}/>
      {/* <Route path='*' component={Home} backendAddress="52.53.243.120:9000"/> */}
      <Route path='/dashboard' component={Dashboard} />
      <Route exact path='/blocks' component={Blocks} backendAddress={backendAddress}/>
      <Route path='/blocks/:blockHeight' component={BlockExplorer} backendAddress={backendAddress}/>
      <Route path='/txs' component={Transactions} backendAddress={backendAddress}/>
      <Route path='/txs/:transactionHash' component={TransactionExplorer} backendAddress={backendAddress}/>
      <Route path='/account/:accountAddress' component={AccountExplorer} backendAddress={backendAddress}/>
    </Route>
  </Router>,
  app
);
