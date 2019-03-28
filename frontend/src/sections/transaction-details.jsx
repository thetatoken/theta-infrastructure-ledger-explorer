import React, { Component } from "react";
import { Link } from 'react-router';
import cx from 'classnames';
import { BigNumber } from 'bignumber.js';

import { TxnTypes, TxnTypeText, TxnClasses } from 'common/constants';
import { date, age, fee, status, type } from 'common/helpers/transactions';
import { formatCoin } from 'common/helpers/utils';
import { transactionsService } from 'common/services/transaction';
import NotExist from 'common/components/not-exist';
import DetailsRow from 'common/components/details-row';
import JsonView from 'common/components/json-view';
import BodyTag from 'common/components/body-tag';



export default class TransactionExplorer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.route.backendAddress,
      transaction: null,
      totalTransactionsNumber: undefined,
      errorType: null,
      showRaw: false
    };
  }
  componentWillUpdate(nextProps) {
    if (nextProps.params.transactionHash !== this.props.params.transactionHash) {
      this.getOneTransactionByUuid(nextProps.params.transactionHash);
    }
  }
  componentDidMount() {
    const { transactionHash } = this.props.params;
    this.getOneTransactionByUuid(transactionHash.toLowerCase());
  }
  getOneTransactionByUuid(hash) {
    if (hash) {
      transactionsService.getOneTransactionByUuid(hash.toLowerCase())
        .then(res => {
          switch (res.data.type) {
            case 'transaction':
              this.setState({
                transaction: res.data.body,
                totalTransactionsNumber: res.data.totalTxsNumber,
                errorType: null
              })
              break;
            case 'error_not_found':
              this.setState({
                errorType: 'error_not_found'
              });
          }
        }).catch(err => {
          console.log(err);
        })
    } else {
      this.setState({
        errorType: 'error_not_found'
      });
      console.log('Wrong Height')
    }
  }
  handleToggleDetailsClick = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ showRaw: !this.state.showRaw });
  }
  render() {
    const { transactionHash } = this.props.params;
    const { transaction, errorType, showRaw } = this.state;
    return (
      <div className="content transaction-details">
        <div className="page-title transactions">Transaction Detail</div>
        <BodyTag className={cx({ 'show-modal': showRaw })} />
        {errorType && 
        <NotExist />}
        { transaction && errorType === null && 
        <React.Fragment>
          <table className="details txn-info">
            <thead>
              <tr>
                <th># Hash</th>
                <th>{transaction.hash}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Type</th>
                <td>{ type(transaction) }</td>
              </tr>
              <tr>
                <th>status</th>
                <td>{ status(transaction) }</td>
              </tr>
              <tr>
                <th>Block</th>
                <td><Link to={`/blocks/${transaction.block_height}`}>{ transaction.block_height }</Link></td>
              </tr>
              <tr>
                <th>Time</th>
                <td title={ age(transaction) }>{ date(transaction) }</td>
              </tr>
            </tbody>
          </table>

          <div className="details-header">
            <div className={cx("txn-type", TxnClasses[transaction.type])}>{ type(transaction) }</div>
            <button className="btn tx raw" onClick={this.handleToggleDetailsClick}>view raw txn</button>
          </div>
          { transaction.type === TxnTypes.COINBASE && 
          <Coinbase transaction={transaction} /> }
          
          { transaction.type === TxnTypes.SLASH && 
          <Slash transaction={transaction} /> }
          
          { transaction.type === TxnTypes.SEND && 
          <Send transaction={transaction} /> }
          
          { transaction.type === TxnTypes.RESERVE_FUND && 
          <ReserveFund transaction={transaction} /> }

          { transaction.type === TxnTypes.RELEASE_FUND && 
          <ReleaseFund transaction={transaction} /> }

          { transaction.type === TxnTypes.SERVICE_PAYMENT && 
          <ServicePayment transaction={transaction} /> }
          
          { transaction.type === TxnTypes.SPLIT_CONTRACT && 
          <SplitContract transaction={transaction} /> }

          { transaction.type === TxnTypes.WITHDRAW_STAKE && 
          <WithdrawStake transaction={transaction} /> }

          { transaction.type === TxnTypes.DEPOSIT_STAKE && 
          <DepositStake transaction={transaction} /> }

          { transaction.type === TxnTypes.SMART_CONTRACT && 
          <SmartContract transaction={transaction} /> }

          { showRaw && 
          <JsonView 
            json={transaction} 
            onClose={this.handleToggleDetailsClick} 
            className="tx-raw" />}
        </React.Fragment>}
      </div>);
  }
}





function _getAddressShortHash(address) {
  return address.substring(12) + '...';
}

function _renderIds(ids) {
  return _.map(ids, i => <div>{i}</div>)
}


const Amount = ({ coins }) => {
  return (
    <React.Fragment>
      <div className="currency theta">{ formatCoin(coins.thetawei) } Theta</div>
      <div className="currency tfuel">{ formatCoin(coins.tfuelwei) } TFuel</div>
    </React.Fragment>)
}

const Address = ({ hash }) => {
  return(<Link to={`/account/${hash}`}>{ hash }</Link>)
}

const Fee = ({ transaction }) => {
  return (<span className="currency tfuel">{ fee(transaction) + " TFuel" }</span>);
}

const CoinbaseOutput = ({ output }) => {
  return (
    <div className="coinbase-output">
      <div>
        <Amount coins={output.coins} />
      </div>
      <Address hash={output.address} />
    </div>);
}

const ServicePayment = ({ transaction }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={ <Fee transaction={transaction} /> } />
        <DetailsRow label="From Address" data={ <Address hash={data.source.address} /> } />
        <DetailsRow label="To Address" data={ <Address hash={data.target.address} /> } />
        <DetailsRow label="Amount" data={ <Amount coins={data.source.coins} /> } />
        <DetailsRow label="Payment Sequence" data={data.payment_sequence} />
        <DetailsRow label="Reserve Sequence" data={data.reserve_sequence} />
        <DetailsRow label="Resource ID" data={data.resource_id} />
      </tbody>
    </table>);
}

const ReserveFund = ({ transaction }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={ <Fee transaction={transaction} /> } />
        <DetailsRow label="Collateral" data={ <Amount coins={data.collateral} /> } />
        <DetailsRow label="Duration" data={data.duration} />
        <DetailsRow label="Amount" data={ <Amount coins={data.source.coins} /> } />
        <DetailsRow label="Source Address" data={ <Address hash={data.source.address} /> } />
        <DetailsRow label="Resource Ids" data={_renderIds(data.resource_ids)} />
      </tbody>
    </table>);
}

const ReleaseFund = ({ transaction }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        
      </tbody>
    </table>);
}

const SplitContract = ({ transaction }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={ <Fee transaction={transaction} /> } />
        <DetailsRow label="Duration" data={data.duration} />
        <DetailsRow label="Initiator Address" data={ <Address hash={data.initiator.address} /> } />
        <DetailsRow label="Resource Id" data={ data.resource_id } />
        <DetailsRow label="Splits" data={
          (<div className="th-tx-text__split">
            {data.splits.map(split => <span key={split.Address}>{'Address: ' + split.Address + '  ' + split.Percentage + '%'}</span>)}
          </div>)} />
      </tbody>
    </table>);
}

const Send = ({ transaction }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={ <Fee transaction={transaction} /> } />
        <DetailsRow label="Amount" data={ <Amount coins={data.outputs[0].coins} /> } />
        <DetailsRow label="From Address" data={ <Address hash={data.inputs[0].address} /> } />
        <DetailsRow label="To Address" data={ <Address hash={data.outputs[0].address} /> } />
      </tbody>
    </table>);
}

const Slash = ({ transaction }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Proposer Address" data={ <Address hash={data.proposer.address} /> } />
        <DetailsRow label="Reserved Sequence" data={data.reserved_sequence} />
        <DetailsRow label="Slash Proof" data={data.slash_proof.substring(0, 12) + '.......'} />
        <DetailsRow label="Slashed Address" data={ <Address hash={data.slashed_address} /> } />
      </tbody>
    </table>);
}

const Coinbase = ({ transaction }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Amount" data={ _.map(data.outputs, (output, i) => <CoinbaseOutput key={i} output={output} />) } />
      </tbody>
    </table>);
}

const WithdrawStake = ({ transaction }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={ <Fee transaction={transaction} /> } />
        <DetailsRow label="Stake Addr." data={ <Address hash={_.get(data, 'holder.address')} /> } />
        <DetailsRow label="Withdrawn" data={ <Amount coins={ _.get(data, 'holder.coins') } /> } />
        <DetailsRow label="Purpose" data={ _.get(data, 'purpose') } />
        <DetailsRow label="Staker" data={ <Address hash={_.get(data, 'source.address')} /> } />
      </tbody>
    </table>);
}

const DepositStake = ({ transaction }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={ <Fee transaction={transaction} /> } />
        <DetailsRow label="Holder" data={ <Address hash={_.get(data, 'holder.address')} /> } />
        <DetailsRow label="Withdrawn" data={ <Amount coins={ _.get(data, 'holder.coins') } /> } />
        <DetailsRow label="Purpose" data={ _.get(data, 'purpose') } />
        <DetailsRow label="Source" data={ <Address hash={_.get(data, 'source.address')} /> } />
      </tbody>
    </table>);
}

const SmartContract = ({ transaction }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        
      </tbody>
    </table>);
}




