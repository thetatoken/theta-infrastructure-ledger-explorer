import React from "react";
import { Link } from 'react-router-dom';
import cx from 'classnames';

import { TxnTypes, TxnClasses, TxnPurpose } from 'common/constants';
import { date, age, fee, status, type, gasPrice } from 'common/helpers/transactions';
import { formatCoin, priceCoin, getHex } from 'common/helpers/utils';
import { priceService } from 'common/services/price';
import { transactionsService } from 'common/services/transaction';
import NotExist from 'common/components/not-exist';
import DetailsRow from 'common/components/details-row';
import JsonView from 'common/components/json-view';
import BodyTag from 'common/components/body-tag';



export default class TransactionExplorer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.backendAddress,
      transaction: null,
      totalTransactionsNumber: undefined,
      errorType: null,
      showRaw: false,
      price: { 'Theta': 0, 'TFuel': 0 }
    };
  }
  componentDidUpdate(preProps) {
    if (preProps.match.params.transactionHash !== this.props.match.params.transactionHash) {
      this.getOneTransactionByUuid(this.props.match.params.transactionHash);
      this.getPrices();
    }
  }
  componentDidMount() {
    const { transactionHash } = this.props.match.params;
    this.getOneTransactionByUuid(transactionHash.toLowerCase());
    this.getPrices();
  }
  getPrices(counter = 0) {
    priceService.getAllprices()
      .then(res => {
        const prices = _.get(res, 'data.body');
        let price = {};
        prices.forEach(info => {
          if (info._id === 'THETA') price.Theta = info.price;
          else if (info._id === 'TFUEL') price.TFuel = info.price;
        })
        this.setState({ price })
      })
      .catch(err => {
        console.log(err);
      });
    setTimeout(() => {
      let { price } = this.state;
      if ((!price.Theta || !price.TFuel) && counter++ < 4) {
        this.getPrices(counter);
      }
    }, 1000);
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
    const { transaction, errorType, showRaw, price } = this.state;
    return (
      <div className="content transaction-details">
        <div className="page-title transactions">Transaction Detail</div>
        <BodyTag className={cx({ 'show-modal': showRaw })} />
        {errorType &&
          <NotExist />}
        {transaction && errorType === null &&
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
                  <td>{type(transaction)}</td>
                </tr>
                <tr>
                  <th>status</th>
                  <td>{status(transaction)}</td>
                </tr>
                <tr>
                  <th>Block</th>
                  <td><Link to={`/blocks/${transaction.block_height}`}>{transaction.block_height}</Link></td>
                </tr>
                <tr>
                  <th>Time</th>
                  <td title={age(transaction)}>{date(transaction)}</td>
                </tr>
              </tbody>
            </table>

            <div className="details-header">
              <div className={cx("txn-type", TxnClasses[transaction.type])}>{type(transaction)}</div>
              <button className="btn tx raw" onClick={this.handleToggleDetailsClick}>view raw txn</button>
            </div>
            {transaction.type === TxnTypes.COINBASE &&
              <Coinbase transaction={transaction} price={price} />}

            {transaction.type === TxnTypes.SLASH &&
              <Slash transaction={transaction} />}

            {transaction.type === TxnTypes.TRANSFER &&
              <Send transaction={transaction} price={price} />}

            {transaction.type === TxnTypes.RESERVE_FUND &&
              <ReserveFund transaction={transaction} price={price} />}

            {transaction.type === TxnTypes.RELEASE_FUND &&
              <ReleaseFund transaction={transaction} price={price} />}

            {transaction.type === TxnTypes.SERVICE_PAYMENT &&
              <ServicePayment transaction={transaction} price={price} />}

            {transaction.type === TxnTypes.SPLIT_CONTRACT &&
              <SplitContract transaction={transaction} price={price} />}

            {transaction.type === TxnTypes.SMART_CONTRACT &&
              <SmartContract transaction={transaction} price={price} />}

            {transaction.type === TxnTypes.WITHDRAW_STAKE &&
              <WithdrawStake transaction={transaction} price={price} />}

            {transaction.type === TxnTypes.DEPOSIT_STAKE &&
              <DepositStake transaction={transaction} price={price} />}

            {transaction.type === TxnTypes.DEPOSIT_STAKE_TX_V2 &&
              <DepositStake transaction={transaction} price={price} />}

            {showRaw &&
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
  return _.map(ids, i => <div key={i}>{i}</div>)
}


const Amount = ({ coins, price }) => {
  return (
    <React.Fragment>
      <div className="currency theta">
        {formatCoin(coins.thetawei)} Theta
        <div className='price'>{`[\$${priceCoin(coins.thetawei, price['Theta'])} USD]`}</div>
        <div></div>
      </div>
      <div className="currency tfuel">
        {formatCoin(coins.tfuelwei)} TFuel
        <div className='price'>{`[\$${priceCoin(coins.tfuelwei, price['TFuel'])} USD]`}</div>
      </div>
    </React.Fragment>)
}

const Address = ({ hash, truncate = null }) => {
  return (<Link to={`/account/${hash}`}>{truncate ? _.truncate(hash, { length: truncate }) : hash}</Link>)
}

const Fee = ({ transaction }) => {
  return (<span className="currency tfuel">{fee(transaction) + " TFuel"}</span>);
}

const CoinbaseOutput = ({ output, price }) => {
  const isPhone = window.screen.width <= 560;
  const isSmallPhone = window.screen.width <= 320;
  const truncate = isPhone ? isSmallPhone ? 10 : 15 : null;
  return (
    <div className="coinbase-output">
      <div>
        <Amount coins={output.coins} price={price} />
      </div>
      <Address hash={output.address} truncate={truncate} />
    </div>);
}

const ServicePayment = ({ transaction, price }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        <DetailsRow label="From Address" data={<Address hash={data.source.address} />} />
        <DetailsRow label="To Address" data={<Address hash={data.target.address} />} />
        <DetailsRow label="Amount" data={<Amount coins={data.source.coins} price={price} />} />
        <DetailsRow label="Payment Sequence" data={data.payment_sequence} />
        <DetailsRow label="Reserve Sequence" data={data.reserve_sequence} />
        <DetailsRow label="Resource ID" data={data.resource_id} />
      </tbody>
    </table>);
}

const ReserveFund = ({ transaction, price }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        <DetailsRow label="Collateral" data={<Amount coins={data.collateral} price={price} />} />
        <DetailsRow label="Duration" data={data.duration} />
        <DetailsRow label="Amount" data={<Amount coins={data.source.coins} price={price} />} />
        <DetailsRow label="Source Address" data={<Address hash={data.source.address} />} />
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
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        <DetailsRow label="Duration" data={data.duration} />
        <DetailsRow label="Initiator Address" data={<Address hash={data.initiator.address} />} />
        <DetailsRow label="Resource Id" data={data.resource_id} />
        <DetailsRow label="Splits" data={
          (<div className="th-tx-text__split">
            {data.splits.map(split => <span key={split.Address}>{'Address: ' + split.Address + '  ' + split.Percentage + '%'}</span>)}
          </div>)} />
      </tbody>
    </table>);
}

const Send = ({ transaction, price }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        {data.inputs.length > 1 ? <DetailsRow label="From Address" data={_.map(data.intputs, (input, i) => <CoinbaseOutput key={i} output={input} price={price} />)} />
          : <DetailsRow label="From Address" data={<Address hash={data.inputs[0].address} />} />}
        <DetailsRow label="Amount" data={_.map(data.outputs, (output, i) => <CoinbaseOutput key={i} output={output} price={price} />)} />
      </tbody>
    </table>);
}

const Slash = ({ transaction }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Proposer Address" data={<Address hash={data.proposer.address} />} />
        <DetailsRow label="Reserved Sequence" data={data.reserved_sequence} />
        <DetailsRow label="Slash Proof" data={data.slash_proof.substring(0, 12) + '.......'} />
        <DetailsRow label="Slashed Address" data={<Address hash={data.slashed_address} />} />
      </tbody>
    </table>);
}

const Coinbase = ({ transaction, price }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Proposer" data={<Address hash={_.get(data, 'proposer.address')} />}></DetailsRow>
        <DetailsRow label="Amount" data={_.map(data.outputs, (output, i) => <CoinbaseOutput key={i} output={output} price={price} />)} />
      </tbody>
    </table>);
}

const WithdrawStake = ({ transaction, price }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        <DetailsRow label="Stake Addr." data={<Address hash={_.get(data, 'holder.address')} />} />
        <DetailsRow label="Stake" data={<Amount coins={_.get(data, 'source.coins')} price={price} />} />
        <DetailsRow label="Purpose" data={TxnPurpose[_.get(data, 'purpose')]} />
        <DetailsRow label="Staker" data={<Address hash={_.get(data, 'source.address')} />} />
      </tbody>
    </table>);
}

const DepositStake = ({ transaction, price }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        <DetailsRow label="Stake Addr." data={<Address hash={_.get(data, 'holder.address')} />} />
        <DetailsRow label="Stake" data={<Amount coins={_.get(data, 'source.coins')} price={price} />} />
        <DetailsRow label="Purpose" data={TxnPurpose[_.get(data, 'purpose')]} />
        <DetailsRow label="Staker" data={<Address hash={_.get(data, 'source.address')} />} />
      </tbody>
    </table>);
}

const SmartContract = ({ transaction }) => {
  let { data, receipt } = transaction;
  let err = _.get(receipt, 'EvmErr');
  let receiptAddress = err ? <span className="text-disabled">{_.get(receipt, 'ContractAddress')}</span> : <Address hash={_.get(receipt, 'ContractAddress')} />;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="From Addr." data={<Address hash={_.get(data, 'from.address')} />} />
        <DetailsRow label="To Addr." data={<Address hash={_.get(data, 'to.address')} />} />
        {receipt ? <DetailsRow label="Contract Address" data={receiptAddress} /> : null}
        <DetailsRow label="Gas Limit" data={data.gas_limit} />
        {receipt ? <DetailsRow label="Gas Used" data={receipt.GasUsed} /> : null}
        <DetailsRow label="Gas Price" data={<span className="currency tfuel">{gasPrice(transaction) + " TFuel"}</span>} />
        {err ? <DetailsRow label="Error Message" data={<span className="text-danger">{err}</span>} /> : null}
        <DetailsRow label="Data" data={getHex(data.data)} />
      </tbody>
    </table>);
}




