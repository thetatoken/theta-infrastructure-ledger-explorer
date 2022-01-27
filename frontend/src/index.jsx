import React from 'react';
import { render } from 'react-dom';
import { Router, Switch, Route } from "react-router-dom";
import history from 'common/history'
import App from 'app';
import Home from 'sections/home';
import Transactions from 'sections/transactions'
import TransactionDetails from 'sections/transaction-details'
import Blocks from 'sections/blocks'
import BlockDetails from 'sections/block-details'
import AccountDetails from 'sections/account-details'
import TokenDetails from './sections/token-details';
// import Check from 'sections/check'
import Stakes from 'sections/stakes'

import config from './config';

const app = document.querySelector('#app-root');
const backendSocketAddress = `${config.socketApi.host}:${config.socketApi.port}`;

render(
  <Router history={history}>
    <App backendAddress={backendSocketAddress} >
      <Switch>
        <Route path='/blocks/:blockHeight' component={BlockDetails} />
        <Route path='/blocks' component={Blocks} />
        <Route path='/block/:blockHeight' component={BlockDetails} />
        <Route path='/txs/:transactionHash' component={TransactionDetails} />
        <Route path='/tx/:transactionHash' component={TransactionDetails} />
        <Route path='/txs' component={Transactions} />
        <Route path='/account/:accountAddress' component={AccountDetails} />
        <Route path='/address/:accountAddress' component={AccountDetails} />
        <Route path='/stakes/tfuel' component={() => <Stakes stakeCoinType='tfuel' />} />
        <Route path='/stakes' component={() => <Stakes stakeCoinType='theta' />} />
        
        {/* Note: Disabled token feature */}
        <Route path='/token/:contractAddress' component={TokenDetails} />

        {/* <Route path='/tmp-internal-check' component={Check} />*/}
        <Route path='/' component={() => <Home backendAddress={backendSocketAddress} />} />
      </Switch>
    </App>
  </Router>,
  app
);
