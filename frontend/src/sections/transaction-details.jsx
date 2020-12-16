import React, { useCallback, useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import cx from 'classnames';
import get from 'lodash/get';
import map from 'lodash/map';
import merge from 'lodash/merge';
import _truncate from 'lodash/truncate';

import { TxnTypes, TxnClasses, TxnPurpose, ZeroAddress } from 'common/constants';
import { date, age, fee, status, type, gasPrice } from 'common/helpers/transactions';
import { formatCoin, priceCoin, getHex, validateHex, decodeLogs } from 'common/helpers/utils';
import { priceService } from 'common/services/price';
import { transactionsService } from 'common/services/transaction';
import { smartContractService } from 'common/services/smartContract';
import NotExist from 'common/components/not-exist';
import DetailsRow from 'common/components/details-row';
import JsonView from 'common/components/json-view';
import BodyTag from 'common/components/body-tag';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import { ethers } from "ethers";
import smartContractApi from 'common/services/smart-contract-api';
import Theta from '../libs/Theta';
import ThetaJS from '../libs/thetajs.esm'


export default class TransactionExplorer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.backendAddress,
      transaction: null,
      totalTransactionsNumber: undefined,
      errorType: null,
      showRaw: false,
      price: { 'Theta': 0, 'TFuel': 0 },
      abi: []
    };
  }
  componentDidUpdate(preProps) {
    if (preProps.match.params.transactionHash !== this.props.match.params.transactionHash) {
      this.fetchData(this.props.match.params.transactionHash.toLowerCase())
    }
  }
  componentDidMount() {
    const { transactionHash } = this.props.match.params;
    const hash = transactionHash.toLowerCase()
    this.fetchData(hash, false);
  }
  fetchData(hash, hasPrice = true) {
    if (validateHex(hash, 64)) {
      this.getOneTransactionByUuid(hash);
      if (!hasPrice) this.getPrices();
    } else {
      this.setState({
        errorType: 'error_not_found'
      });
    }
  }
  getPrices(counter = 0) {
    priceService.getAllprices()
      .then(res => {
        const prices = get(res, 'data.body');
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
              const type = get(res, 'data.body.type');
              const to = get(res, 'data.body.data.to.address');
              if (type === TxnTypes.SMART_CONTRACT && to !== ZeroAddress) {
                smartContractService.getAbiByAddress(to.toLowerCase())
                  .then(result => {
                    if (result.data.type === 'smart_contract_abi') {
                      this.setState({ abi: result.data.body.abi })
                    }
                  })
              }
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
    }
  }
  handleToggleDetailsClick = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ showRaw: !this.state.showRaw });
  }
  render() {
    const { transaction, errorType, showRaw, price, abi } = this.state;
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
              <SmartContract transaction={transaction} price={price} abi={abi} />}

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
                className="tx-raw"
                abi={abi} />}
          </React.Fragment>}
      </div>);
  }
}


function _getAddressShortHash(address) {
  return address.substring(12) + '...';
}

function _renderIds(ids) {
  return map(ids, i => <div key={i}>{i}</div>)
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
  return (<Link to={`/account/${hash}`}>{truncate ? _truncate(hash, { length: truncate }) : hash}</Link>)
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
        {data.inputs.length > 1 ? <DetailsRow label="From Address" data={map(data.intputs, (input, i) => <CoinbaseOutput key={i} output={input} price={price} />)} />
          : <DetailsRow label="From Address" data={<Address hash={data.inputs[0].address} />} />}
        <DetailsRow label="Amount" data={map(data.outputs, (output, i) => <CoinbaseOutput key={i} output={output} price={price} />)} />
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
        <DetailsRow label="Proposer" data={<Address hash={get(data, 'proposer.address')} />}></DetailsRow>
        <DetailsRow label="Amount" data={map(data.outputs, (output, i) => <CoinbaseOutput key={i} output={output} price={price} />)} />
      </tbody>
    </table>);
}

const WithdrawStake = ({ transaction, price }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        <DetailsRow label="Stake Addr." data={<Address hash={get(data, 'holder.address')} />} />
        <DetailsRow label="Stake" data={<Amount coins={get(data, 'source.coins')} price={price} />} />
        <DetailsRow label="Purpose" data={TxnPurpose[get(data, 'purpose')]} />
        <DetailsRow label="Staker" data={<Address hash={get(data, 'source.address')} />} />
      </tbody>
    </table>);
}

const DepositStake = ({ transaction, price }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        <DetailsRow label="Stake Addr." data={<Address hash={get(data, 'holder.address')} />} />
        <DetailsRow label="Stake" data={<Amount coins={get(data, 'source.coins')} price={price} />} />
        <DetailsRow label="Purpose" data={TxnPurpose[get(data, 'purpose')]} />
        <DetailsRow label="Staker" data={<Address hash={get(data, 'source.address')} />} />
      </tbody>
    </table>);
}

const SmartContract = ({ transaction, abi }) => {
  const [tabIndex, setTabIndex] = useState(0);
  let { data, receipt } = transaction;
  let err = get(receipt, 'EvmErr');
  let receiptAddress = err ? <span className="text-disabled">{get(receipt, 'ContractAddress')}</span> : <Address hash={get(receipt, 'ContractAddress')} />;
  let logs = get(transaction, 'receipt.Logs');
  logs = JSON.parse(JSON.stringify(logs));
  logs = logs.map(obj => {
    obj.data = getHex(obj.data)
    return obj;
  })
  logs = decodeLogs(logs, abi);
  const logLength = (logs || []).length;
  return (
    <Tabs className="theta-tabs" selectedIndex={tabIndex} onSelect={setTabIndex}>
      <TabList>
        <Tab>Overview</Tab>
        <Tab disabled={logLength == 0} >{`Logs(${logLength})`}</Tab>
      </TabList>
      <TabPanel>
        <table className="details txn-details">
          <tbody>
            <DetailsRow label="From Addr." data={<Address hash={get(data, 'from.address')} />} />
            <DetailsRow label="To Addr." data={<Address hash={get(data, 'to.address')} />} />
            {receipt ? <DetailsRow label="Contract Address" data={receiptAddress} /> : null}
            <DetailsRow label="Gas Limit" data={data.gas_limit} />
            {receipt ? <DetailsRow label="Gas Used" data={receipt.GasUsed} /> : null}
            <DetailsRow label="Gas Price" data={<span className="currency tfuel">{gasPrice(transaction) + " TFuel"}</span>} />
            {err ? <DetailsRow label="Error Message" data={<span className="text-danger">{err}</span>} /> : null}
            <DetailsRow label="Data" data={getHex(data.data)} />
            <DetailsRow label="Items" data={<div className="sc-items">{logs.map((log, i) => <Item log={log} abi={abi} key={i} />)}</div>} />
          </tbody>
        </table>
      </TabPanel>
      <TabPanel>
        {logs.map((log, i) => <Log log={log} key={i} abi={abi} />)}
      </TabPanel>
    </Tabs>
  );
}

const Log = ({ log, abi }) => {
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Address" data={<Address hash={get(log, 'address')} />} />
        <DetailsRow label="Name" data={typeof log.decode === 'object' ? <EventName event={log.decode.event} /> : log.decode} />
        <DetailsRow label="Topics" data={<Topics topics={get(log, 'topics')} />} />
        <DetailsRow label="Data" data={<LogData data={get(log, 'data')} decode={log.decode} />} />
        <DetailsRow label="Item" data={<Item log={log} abi={abi} />} />
      </tbody>
    </table>
  )
}
const EventName = ({ event }) => {
  let index = 1;
  return (
    <span className="text-grey">
      {event.name}(
      {event.inputs.map((input, i) => {
        return (<span key={i}>
          {input.indexed ? `indexed_topic_${++index} ` : ''}
          <span className="text-green">{`${input.type} `}</span>
          <span className="text-danger">{`${input.name}`}</span>
          {i === event.inputs.length - 1 ? ')' : ', '}
        </span>)
      })}
    </span>
  )
}
const Topics = ({ topics }) => {
  return (
    <>
      {topics.map((topic, i) => {
        return <p key={i}>{topic}</p>
      })}
    </>
  )
}
const LogData = ({ data, decode }) => {
  const isDisabled = typeof decode !== 'object';
  const [model, setModel] = useState(isDisabled ? 'hex' : 'decode');
  const [decodeData, setDecodeData] = useState({});
  useEffect(() => {
    if (typeof decode === 'string') return;
    let _data = JSON.parse(JSON.stringify(decode.result));
    Object.keys(_data).forEach(k => {
      if (k === '__length__') delete _data[k];
      if (k.match(/^[0-9]+/)) delete _data[k];
    })
    setDecodeData(_data);
  }, [decode]);
  return (<div className="sc-log__data">
    <div className="sc-log__data--buttons">
      <div className={cx("sc-log__data--button", { active: model === 'decode', disabled: isDisabled })}
        onClick={() => isDisabled ? {} : setModel('decode')}> Dec</div>
      <div className={cx("sc-log__data--button", { active: model === 'hex' })}
        onClick={() => setModel('hex')}>Hex</div>
    </div>
    {model === 'hex' ? data : Object.keys(decodeData).map((k, i) => {
      return (<div key={i}>
        <span className="text-grey">{k}: </span>
        {decodeData[k]}
      </div>)
    })}
  </div>)
}
const Item = props => {
  const { log, abi } = props;
  const [item, setItem] = useState();
  useEffect(() => {
    const tokenId = get(log, 'decode.result.tokenId');
    if (tokenId === undefined) return;
    const arr = abi.filter(obj => obj.name == "tokenURI" && obj.type === 'function');
    if (arr.length === 0) return;
    const functionData = arr[0];
    const address = get(log, 'address');
    const inputValues = [tokenId]

    async function fetchUrl() {
      const iface = new ethers.utils.Interface(abi || []);
      const senderSequence = 1;
      const functionInputs = get(functionData, ['inputs'], []);
      const functionOutputs = get(functionData, ['outputs'], []);
      const functionSignature = iface.getSighash(functionData.name)

      const inputTypes = map(functionInputs, ({ name, type }) => {
        return type;
      });
      try {
        var abiCoder = new ethers.utils.AbiCoder();
        var encodedParameters = abiCoder.encode(inputTypes, inputValues).slice(2);;
        const gasPrice = Theta.getTransactionFee(); //feeInTFuelWei;
        const gasLimit = 2000000;
        const data = functionSignature + encodedParameters;
        const tx = Theta.unsignedSmartContractTx({
          from: address,
          to: address,
          data: data,
          value: 0,
          transactionFee: gasPrice,
          gasLimit: gasLimit
        }, senderSequence);
        const rawTxBytes = ThetaJS.TxSigner.serializeTx(tx);
        const callResponse = await smartContractApi.callSmartContract({ data: rawTxBytes.toString('hex').slice(2) }, { network: Theta.chainId });
        const callResponseJSON = await callResponse.json();
        const result = get(callResponseJSON, 'result');
        let outputValues = get(result, 'vm_return');
        const outputTypes = map(functionOutputs, ({ name, type }) => {
          return type;
        });
        outputValues = /^0x/i.test(outputValues) ? outputValues : '0x' + outputValues;
        const url = abiCoder.decode(outputTypes, outputValues)[0];
        fetch(url)
          .then(res => res.json())
          .then(data => {
            setItem(data);
          }).catch(e => {
            console.log('error occurs in fetch url:', e)
          })
      }
      catch (e) {
        console.log('error occurs:', e)
      }
    }
    fetchUrl();
  }, [log, abi])

  return item ? (<div className="sc-item">
    <div className="sc-item__row">
      <span className="text-grey">Name:</span> {item.name}
    </div>
    <div className="sc-item__row">
      <span className="text-grey">Description:</span> {item.description}
    </div>
    <div className="sc-item__row">
      <img className="sc-item__image" src={item.image}></img>
    </div>
  </div>) : <></>
}