import React, { useEffect, useState, useRef } from "react";
import { Link } from 'react-router-dom';
import cx from 'classnames';
import get from 'lodash/get';
import map from 'lodash/map';
import _truncate from 'lodash/truncate';
import tns from 'libs/tns';

import { TxnTypes, TxnClasses, TxnPurpose, TxnSplitPurpose, zeroTxAddress, ZeroAddress, CommonFunctionABIs } from 'common/constants';
import { from, to, date, age, fee, status, type, gasPrice, getTfuelBurnt } from 'common/helpers/transactions';
import { formatCoin, priceCoin, sumCoin, getHex, validateHex, decodeLogs, formatQuantity } from 'common/helpers/utils';
import { priceService } from 'common/services/price';
import { transactionsService } from 'common/services/transaction';
import { smartContractService } from 'common/services/smartContract';
import { stakeService } from 'common/services/stake';
import NotExist from 'common/components/not-exist';
import DetailsRow from 'common/components/details-row';
import JsonView from 'common/components/json-view';
import BodyTag from 'common/components/body-tag';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Item from 'common/components/tnt721-item';
import { useIsMountedRef } from 'common/helpers/hooks';

import { ethers } from "ethers";
import smartContractApi from 'common/services/smart-contract-api';
import Theta from '../libs/Theta';
import ThetaJS from '../libs/thetajs.esm'
import { tokenService } from "../common/services/token";

export default class TransactionExplorer extends React.Component {
  _isMounted = true;

  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.backendAddress,
      transaction: null,
      totalTransactionsNumber: undefined,
      errorType: null,
      showRaw: false,
      price: { 'Theta': 0, 'TFuel': 0 },
      abiMap: {}
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
  componentWillUnmount() {
    this._isMounted = false;
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
    const self = this;
    priceService.getAllprices()
      .then(res => {
        if (!self._isMounted) return;
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
    const self = this;
    if (hash) {
      transactionsService.getOneTransactionByUuid(hash.toLowerCase())
        .then(async res => {
          if (!self._isMounted) return;
          switch (res.data.type) {
            case 'transaction':
              this.setState({
                transaction: res.data.body,
                totalTransactionsNumber: res.data.totalTxsNumber,
                errorType: null
              })
              this.setTransactionTNS(res.data.body);
              const type = get(res, 'data.body.type');
              if (type === TxnTypes.SMART_CONTRACT) {
                const addressList = _getAbiAddressList(res.data.body);
                const abiMap = {};
                try {
                  for (let address of addressList) {
                    let res = await smartContractService.getAbiByAddress(address.toLowerCase());
                    abiMap[address] = get(res, 'data.body.abi') || [];
                  }
                } catch (e) {
                  console.log(e);
                }
                this.setState({ abiMap })
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
  setTransactionTNS = async (transaction) => {
    transaction.fromTns = from(transaction) ? await tns.getDomainName(from(transaction)) : null;
    transaction.toTns = to(transaction) ? await tns.getDomainName(to(transaction)) : null;
    this.setState({ transaction });
  }

  handleToggleDetailsClick = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ showRaw: !this.state.showRaw });
  }
  render() {
    const { transaction, errorType, showRaw, price, abiMap } = this.state;
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
                {transaction.eth_tx_hash !== zeroTxAddress && transaction.eth_tx_hash != null && <tr>
                  <th>Eth Hash</th>
                  <td><Link to={`/txs/${transaction.eth_tx_hash}`}>{transaction.eth_tx_hash}</Link></td>
                </tr>}
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

            {transaction.type !== TxnTypes.SMART_CONTRACT && <div className="details-header">
              <div className={cx("txn-type", TxnClasses[transaction.type])}>{type(transaction)}</div>
              <button className="btn tx raw" onClick={this.handleToggleDetailsClick}>view raw txn</button>
            </div>}
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
              <SmartContract transaction={transaction} price={price} abi={[]} abiMap={abiMap}
                handleToggleDetailsClick={this.handleToggleDetailsClick} />}

            {transaction.type === TxnTypes.WITHDRAW_STAKE &&
              <WithdrawStake transaction={transaction} price={price} />}

            {transaction.type === TxnTypes.DEPOSIT_STAKE &&
              <DepositStake transaction={transaction} price={price} />}

            {transaction.type === TxnTypes.DEPOSIT_STAKE_TX_V2 &&
              <DepositStake transaction={transaction} price={price} />}

            {transaction.type === TxnTypes.STAKE_REWARD_DISTRIBUTION &&
              <StakeRewardDistribution transaction={transaction} price={price} />}

            {showRaw &&
              <JsonView
                json={transaction}
                onClose={this.handleToggleDetailsClick}
                className="tx-raw"
                abiMap={abiMap} />}
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

const AddressTNS = ({ hash, tns, truncate = null }) => {
  if (tns) {
    return (
      <div className="value tooltip">
        <div className="tooltip--text">
          <p>{tns}</p>
          <p>({hash})</p>
        </div>
        <Link to={`/account/${hash}`}>{truncate ? _truncate(tns, { length: truncate }) : tns}</Link>
      </div>);
  }
  return (<Link to={`/account/${hash}`}>{truncate ? _truncate(hash, { length: truncate }) : hash}</Link>)
}

const Fee = ({ transaction }) => {
  return (<span className="currency tfuel">{fee(transaction) + " TFuel"}</span>);
}

const CoinbaseOutput = ({ output, price, isSingle, tns }) => {
  const isPhone = window.screen.width <= 560;
  const isSmallPhone = window.screen.width <= 320;
  const truncate = isPhone ? isSmallPhone ? 10 : 15 : null;
  return (
    <div className={cx("coinbase-output", { "single": isSingle })}>
      <div>
        <Amount coins={output.coins} price={price} />
      </div>
      <AddressTNS hash={output.address} tns={tns} truncate={truncate} />
    </div>);
}

const TotalAmount = ({ coins, price }) => {
  return (
    <div>
      <Amount coins={coins} price={price} />
    </div>
  )
}

const ServicePayment = ({ transaction, price }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        <DetailsRow label="TFuel Burnt" data={<span className="currency tfuel">{getTfuelBurnt(transaction) + " TFuel"}</span>} />
        <DetailsRow label="From Address" data={<AddressTNS hash={data.source.address} tns={transaction.fromTns} />} />
        <DetailsRow label="To Address" data={<AddressTNS hash={data.target.address} tns={transaction.toTns} />} />
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
        <DetailsRow label="TFuel Burnt" data={<span className="currency tfuel">{getTfuelBurnt(transaction) + " TFuel"}</span>} />
        <DetailsRow label="Collateral" data={<Amount coins={data.collateral} price={price} />} />
        <DetailsRow label="Duration" data={data.duration} />
        <DetailsRow label="Amount" data={<Amount coins={data.source.coins} price={price} />} />
        <DetailsRow label="Source Address" data={<AddressTNS hash={data.source.address} tns={transaction.fromTns} />} />
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
        <DetailsRow label="TFuel Burnt" data={<span className="currency tfuel">{getTfuelBurnt(transaction) + " TFuel"}</span>} />
        <DetailsRow label="Duration" data={data.duration} />
        <DetailsRow label="Initiator Address" data={<AddressTNS hash={data.initiator.address} tns={transaction.fromTns} />} />
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
  let totalCoins = { "thetawei": 0, "tfuelwei": 0 };
  let hasTotalCoins = data.outputs.length > 1 && data.inputs.length > 1;
  if (hasTotalCoins) {
    totalCoins = getTotalCoins(data.outputs.length > data.inputs.length ? data.inputs : data.outputs);
    function getTotalCoins(inputs) {
      return inputs.reduce((sum, cur) => {
        sum.thetawei = sumCoin(sum.thetawei, cur.coins.thetawei);
        sum.tfuelwei = sumCoin(sum.tfuelwei, cur.coins.tfuelwei);
        return sum;
      }, totalCoins)
    }
  }
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        <DetailsRow label="TFuel Burnt" data={<span className="currency tfuel">{getTfuelBurnt(transaction) + " TFuel"}</span>} />
        {hasTotalCoins ? <DetailsRow label="Total Amount" data={<TotalAmount coins={totalCoins} price={price} />} /> : <></>}
        <DetailsRow label="From Address" data={map(data.inputs, (input, i, inputs) => <CoinbaseOutput key={i} output={input} price={price} isSingle={inputs.length === 1} tns={transaction.fromTns} />)} />
        <DetailsRow label="To Address" data={map(data.outputs, (output, i) => <CoinbaseOutput key={i} output={output} price={price} tns={transaction.toTns} />)} />
      </tbody>
    </table>);
}

const Slash = ({ transaction }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Proposer Address" data={<AddressTNS hash={data.proposer.address} tns={transaction.fromTns} />} />
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
  const [returnTime, setReturnTime] = useState(0);
  useEffect(() => {
    const returnHeight = Number(transaction.block_height) + 28800;
    stakeService.getStakeReturnTime(returnHeight).then(res => {
      let time = get(res, 'data.body.time');
      if (!time) return;
      setReturnTime(time);
    })
  }, [transaction])
  return (
    <table className="details txn-details">
      <tbody>
        {returnTime > 0 && <DetailsRow label="Estimated Return" data={<ReturnTime returnTime={returnTime} />} />}
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        <DetailsRow label="TFuel Burnt" data={<span className="currency tfuel">{getTfuelBurnt(transaction) + " TFuel"}</span>} />
        <DetailsRow label="Stake Addr." data={<AddressTNS hash={get(data, 'holder.address')} tns={transaction.fromTns} />} />
        <DetailsRow label="Stake" data={<Amount coins={get(data, 'source.coins')} price={price} />} />
        <DetailsRow label="Purpose" data={TxnPurpose[get(data, 'purpose')]} />
        <DetailsRow label="Staker" data={<AddressTNS hash={get(data, 'source.address')} tns={transaction.toTns} />} />
      </tbody>
    </table>);
}

const DepositStake = ({ transaction, price }) => {
  let { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        <DetailsRow label="TFuel Burnt" data={<span className="currency tfuel">{getTfuelBurnt(transaction) + " TFuel"}</span>} />
        <DetailsRow label="Stake Addr." data={<AddressTNS hash={get(data, 'holder.address')} tns={transaction.toTns} />} />
        <DetailsRow label="Stake" data={<Amount coins={get(data, 'source.coins')} price={price} />} />
        <DetailsRow label="Purpose" data={TxnPurpose[get(data, 'purpose')]} />
        <DetailsRow label="Staker" data={<AddressTNS hash={get(data, 'source.address')} tns={transaction.fromTns} />} />
      </tbody>
    </table>);
}
const StakeRewardDistribution = ({ transaction, price }) => {
  const { data } = transaction;
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Fee" data={<Fee transaction={transaction} />} />
        <DetailsRow label="TFuel Burnt" data={<span className="currency tfuel">{getTfuelBurnt(transaction) + " TFuel"}</span>} />
        <DetailsRow label="Holder" data={<AddressTNS hash={get(data, 'holder.address')} tns={transaction.fromTns} />} />
        <DetailsRow label="Beneficiary" data={<AddressTNS hash={get(data, 'beneficiary.address')} tns={transaction.toTns} />} />
        <DetailsRow label="Purpose" data={TxnSplitPurpose[get(data, 'purpose')]} />
        <DetailsRow label="Split PERCENTAGE" data={get(data, 'split_basis_point') / 100 + '%'} />
      </tbody>
    </table>);
}
const SmartContract = ({ transaction, handleToggleDetailsClick, price, abiMap }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [feeSplit, setFeeSplit] = useState(null);
  const [tfuelSplit, setTfuelSplit] = useState(null);
  const [hasTnt721Transfer, setHasTnt721Transfer] = useState(false);
  const [hasTnt20Transfer, setHasTnt20Transfer] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [tokenInfoMap, setTokenInfoMap] = useState();
  const [logs, setLogs] = useState([]);
  const [contractTns, setContractTns] = useState(null);

  const isMountedRef = useIsMountedRef();
  let { data, receipt } = transaction;

  let err = get(receipt, 'EvmErr');
  const contractAddress = get(receipt, 'ContractAddress');
  tns.getDomainName(contractAddress).then((x) => {
    setContractTns(x)
  });
  let receiptAddress = err ? <span className="text-disabled">{contractAddress}</span> : <AddressTNS hash={contractAddress} tns={contractTns} />;
  // handle logs
  useEffect(() => {
    if (Object.keys(abiMap).length === 0) return;
    let logs = get(transaction, 'receipt.Logs');
    logs = JSON.parse(JSON.stringify(logs));
    logs = logs.map(obj => {
      obj.data = getHex(obj.data)
      return obj;
    })
    logs = decodeLogs(logs, abiMap);
    setLogs(logs);
  }, [abiMap])

  // handle tokens and tokenInfoMap
  useEffect(() => {
    if (logs.length === 0) return;
    const tokenArr = [];
    const addressMap = {};
    logs.forEach(log => {
      const tokenId = get(log, 'decode.result.tokenId');
      const eventName = get(log, 'decode.eventName');
      if (eventName !== 'Transfer') return;
      const isIndexed = get(log, 'decode.event.inputs[2].indexed')
      const type = isIndexed ? 'TNT-721' : 'TNT-20';
      if (type === "TNT-721" && !hasTnt721Transfer) {
        setHasTnt721Transfer(true);
      }
      if (type === "TNT-20" && !hasTnt20Transfer) {
        setHasTnt20Transfer(true);
      }
      const value = tokenId != null ? 1 : get(log, 'decode.result[2]');
      tokenArr.push({
        from: get(log, 'decode.result[0]'),
        to: get(log, 'decode.result[1]'),
        tokenId,
        value,
        type,
        contractAddress: get(log, 'address')
      })
      if (addressMap[`${get(log, 'address')}`] === undefined) {
        addressMap[`${get(log, 'address')}`] = { type, tokenId };
      }
    })
    setTokens(tokenArr);
    fetchTokenInfoMap();

    async function fetchTokenInfoMap() {
      const map = {};
      for (let address of Object.keys(addressMap)) {
        try {
          const abi = [CommonFunctionABIs.name, CommonFunctionABIs.symbol, CommonFunctionABIs.decimals, CommonFunctionABIs.tokenURI];
          if (addressMap[address].type === 'TNT-20') {
            const name = await fetchData(CommonFunctionABIs.name, [], [CommonFunctionABIs.name], address);
            const symbol = await fetchData(CommonFunctionABIs.symbol, [], [CommonFunctionABIs.symbol], address);
            const decimals = await fetchData(CommonFunctionABIs.decimals, [], [CommonFunctionABIs.decimals], address);
            map[address] = { name, symbol, decimals };
          } else if (addressMap[address].type === 'TNT-721') {
            // fetch image info
            const inputValues = [addressMap[address].tokenId];
            let url = await fetchData(CommonFunctionABIs.tokenURI, inputValues, [CommonFunctionABIs.tokenURI], address);
            if (/^http:\/\/(.*)api.thetadrop.com.*\.json(\?[-a-zA-Z0-9@:%._\\+~#&//=]*){0,1}$/g.test(url) && typeof url === "string") {
              url = url.replace("http://", "https://")
            }
            const isImage = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|svg)/g.test(url);
            if (isImage) {
              map[address] = { image: url };
            } else {
              const data = await fetch(url).then(res => res.json())
              map[address] = data;
            }
            const tokenInfoRes = await tokenService.getTokenInfoByAddressAndTokenId(address);
            const tokenName = get(tokenInfoRes, 'data.body.name');
            if (!map[address]) map[address] = {};
            map[address].tokenName = tokenName;
          }
        } catch (e) {
          console.log('Error in fetchTokenInfoMap:', e.message);
        }
      }
      if (!isMountedRef.current) return;
      setTokenInfoMap(map);

    }
    async function fetchData(functionData, inputValues, abi, address) {
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
        let res = abiCoder.decode(outputTypes, outputValues)[0];
        return res;
      } catch (e) {
        console.log('error occurs:', e);
      }
    }
  }, [logs])

  // handle state feeSplit
  useEffect(() => {
    if (!abiMap) return;
    const abi = abiMap[`${get(transaction, 'receipt.ContractAddress')}`] || [];
    const arr = abi.filter(obj => obj.name == "FeeSplit" && obj.type === 'event');
    if (arr.length === 0) return;
    logs.forEach(log => {
      const eventName = get(log, 'decode.eventName');
      if (eventName !== 'FeeSplit') return;
      const result = get(log, 'decode.result');
      if (feeSplit === null) setFeeSplit(result);
    })
  }, [logs, abiMap])

  // handle state TFuelSplit
  useEffect(() => {
    if (!abiMap) return;
    const abi = abiMap[`${get(transaction, 'receipt.ContractAddress')}`] || [];
    const arr = abi.filter(obj => obj.name == "TFuelSplit" && obj.type === 'event');
    if (arr.length === 0) return;
    logs.forEach(log => {
      const eventName = get(log, 'decode.eventName');
      if (eventName !== 'TFuelSplit') return;
      const result = get(log, 'decode.result');
      if (tfuelSplit === null) setTfuelSplit(result);
    })
  }, [logs, abiMap])

  return (
    <>
      {/* {hasItem && abiMap && <>
        <div className="details-header item">
          <div className="txn-type smart-contract items">Items</div>
        </div>
        <div className="details txn-details item">
          <Items abiMap={abiMap} logs={logs} tokenInfoMap={tokenInfoMap} />
        </div>
      </>} */}
      <Items abiMap={abiMap} logs={logs} tokenInfoMap={tokenInfoMap} />
      <div className="details-header">
        <div className={cx("txn-type", TxnClasses[transaction.type])}>{type(transaction)}</div>
        <button className="btn tx raw" onClick={handleToggleDetailsClick}>view raw txn</button>
      </div>
      <Tabs className="theta-tabs" selectedIndex={tabIndex} onSelect={setTabIndex}>
        <TabList>
          <Tab>Overview</Tab>
          <Tab disabled={logs.length == 0} >{`Logs(${logs.length})`}</Tab>
        </TabList>
        <TabPanel>
          <table className="details txn-details">
            <tbody>
              <DetailsRow label="From Addr." data={<AddressTNS hash={get(data, 'from.address')} tns={transaction.fromTns} />} />
              <DetailsRow label="To Addr." data={<AddressTNS hash={get(data, 'to.address')} tns={transaction.toTns} />} />
              {receipt ? <DetailsRow label="Contract Address" data={receiptAddress} /> : null}
              {hasTnt721Transfer && <DetailsRow label="Transaction Action" data={tokens.map((token, i) => {
                return <TransactionAction
                  key={i}
                  info={tokenInfoMap ? tokenInfoMap[`${token.contractAddress}`] : null}
                  disabled={abiMap[token.contractAddress] ? abiMap[token.contractAddress].length === 0 : true}
                  token={token} />
              })} />}
              {(hasTnt20Transfer || hasTnt721Transfer) && <DetailsRow label="Tokens Transferred" data={tokens.map((token, i) => {
                return <TokenTransferred
                  key={i}
                  info={tokenInfoMap ? tokenInfoMap[`${token.contractAddress}`] : null}
                  disabled={abiMap[token.contractAddress] ? abiMap[token.contractAddress].length === 0 : true}
                  token={token} />
              })} />}
              <DetailsRow label="Gas Limit" data={data.gas_limit} />
              {receipt ? <DetailsRow label="Gas Used" data={receipt.GasUsed} /> : null}
              <DetailsRow label="Gas Price" data={<span className="currency tfuel">{gasPrice(transaction) + " TFuel"}</span>} />
              <DetailsRow label="TFuel Burnt" data={<span className="currency tfuel">{getTfuelBurnt(transaction) + " TFuel"}</span>} />
              {err ? <DetailsRow label="Error Message" data={<span className="text-danger">
                {Buffer.from(get(transaction, 'receipt.EvmRet'), 'base64').toString() || err}
              </span>} /> : null}
              <DetailsRow label="Value" data={<SmartContractValue value={get(data, 'from.coins.tfuelwei')}
                price={price} feeSplit={feeSplit} tfuelSplit={tfuelSplit} />} />
              <DetailsRow label="Data" data={<SmartContractData data={getHex(data.data)} logs={logs}
                hasDetails={false}
              // hasDetails={hasTnt721Transfer ||
              //   (hasTnt20Transfer && tokens.filter(t => t.type === 'TNT-20').reduce((pre, t) => pre && (t.from !== ZeroAddress), true))}
              />} />
            </tbody>
          </table>
        </TabPanel>
        <TabPanel>
          {logs.map((log, i) => <Log log={log} key={i} />)}
        </TabPanel>
      </Tabs>
    </>
  );
}

const SmartContractData = React.memo(({ data, logs, hasDetails }) => {
  const inputRef = useRef();
  const defaultModel = hasDetails ? 'default' : 'original';
  const [defaultStr, setDefaultStr] = useState('');
  const [model, setModel] = useState(defaultModel)
  const handleOnChange = e => setModel(e.target.value);

  useEffect(() => {
    setModel(hasDetails ? 'default' : 'original')
  }, [hasDetails])

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.value = model === 'original' ? data : defaultStr;
    inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
  }, [model, inputRef.current])

  useEffect(() => {
    let defualtStrTmp = '';
    for (let log of logs) {
      if (typeof log.decode !== 'object') continue;
      const evt = log.decode.event;
      defualtStrTmp += `${evt.name}(${evt.inputs.map((input, i) => `${i !== 0 ? ' ' : ''}${input.type} ${input.name}`)})\n\n`
      defualtStrTmp += `MethodID: ${data.slice(0, 9)}\n`;
      for (let i = 0; i < ~~(data.length / 64); i++) {
        defualtStrTmp += `[${i}] ${data.slice(i * 64 + 10, (i + 1) * 64 + 10)}\n`
      }
    }
    setDefaultStr(defualtStrTmp);
  }, [logs, data])

  return <div className="sc-data">
    {model === 'decode' ?
      <SmartContractInputTable logs={logs} /> :
      <textarea className="sc-data__textarea" defaultValue={data} ref={inputRef} readOnly></textarea>
    }

    <div>
      <div className="sc-data__select">
        <div className="sc-data__select--title">View Data As:</div>
        <select value={model} onChange={handleOnChange}>
          <option value='original'>Original</option>
          <option value='default' disabled={!hasDetails}>Default View</option>
          <option value='decode' disabled={!hasDetails}>Decode Data</option>
        </select>
      </div>
    </div>
  </div>
})

const SmartContractInputTable = ({ logs }) => {
  return logs.map((log, i) => {
    return <table key={i} className="sc-input-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Type</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        {log.decode.event.inputs.map((input, j) => {
          return <tr key={j}>
            <td>{j}</td>
            <td>{input.name}</td>
            <td>{input.type}</td>
            <td>{input.type === 'address' ? <Address hash={log.decode.result[input.name]} /> : log.decode.result[input.name]}</td>
          </tr>
        })}
      </tbody>
    </table>
  })
}

const Log = ({ log }) => {
  return (
    <table className="details txn-details">
      <tbody>
        <DetailsRow label="Address" data={<Address hash={get(log, 'address')} />} />
        <DetailsRow label="Name" data={typeof log.decode === 'object' ? <EventName event={log.decode.event} /> : log.decode} />
        <DetailsRow label="Topics" data={<Topics topics={get(log, 'topics')} decode={log.decode} />} />
        <DetailsRow label="Data" data={<LogData data={get(log, 'data')} decode={log.decode} />} />
      </tbody>
    </table>
  )
}

const SmartContractValue = ({ value, price, feeSplit, tfuelSplit }) => {
  return <div className="sc-value">
    <div className="currency tfuel">
      {formatCoin(value)} TFuel
      <div className='price'>{`[\$${priceCoin(value, price['TFuel'])} USD]`}</div>
    </div>
    {feeSplit && <>
      <FeeSplitRow address={feeSplit.userAddress} fee={feeSplit.userPayout} price={price} />
      <FeeSplitRow address={feeSplit.ownerAddress} fee={feeSplit.ownerPayout} price={price} />
    </>}
    {tfuelSplit && <>
      <FeeSplitRow address={tfuelSplit.seller} fee={tfuelSplit.sellerEarning} price={price} />
      <FeeSplitRow address={tfuelSplit.platformFeeRecipient} fee={tfuelSplit.platformFee} price={price} />
    </>}
  </div>
}
const FeeSplitRow = ({ address, fee, price }) => {
  const isMobile = window.screen.width <= 560;
  const truncate = 20;
  return <div className="sc-value__row">
    <div className="sc-value__arrow"></div>
    <div className="currency tfuel">
      {formatCoin(fee)} TFuel
      <div className='price'>{`[\$${priceCoin(fee, price['TFuel'])} USD]`}</div>
    </div>
    <div className="sc-value__address">
      <div className="sc-value__text">To</div>
      <Address hash={address} truncate={isMobile ? truncate : 0} />
    </div>
  </div>
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
          {i === event.inputs.length - 1 ? '' : ', '}
        </span>)
      })})
    </span>
  )
}
const Topics = ({ topics, decode }) => {
  return (
    <>
      {topics.map((topic, i) => {
        return <Topic key={i} topic={topic} decode={decode} i={i} />
      })}
    </>
  )
}

const Topic = ({ topic, decode, i }) => {
  const index = i - 1;
  const isDisabled = typeof decode !== 'object';
  const [model, setModel] = useState(isDisabled ? 'hex' : 'decode');

  const handleOnChange = e => setModel(e.target.value);
  let indexedArr = [];
  if (!isDisabled) {
    get(decode, `event.inputs`).forEach((input, i) => {
      if (input.indexed) indexedArr.push(i);
    });
  }
  return <div className="sc-topic">
    <div className="sc-topic__index">{i}</div>
    {i !== 0 &&
      <>
        <select className="sc-topic__select" onChange={handleOnChange} value={model}>
          <option value="decode" disabled={isDisabled}>Dec</option>
          <option value="hex">Hex</option>
        </select>
        <div className="sc-topic__arrow"></div>
      </>}
    {model === 'hex' || i === 0 ?
      topic : get(decode, `event.inputs.${indexedArr[index]}.type`) === 'address' ?
        <Address hash={get(decode, `result.${indexedArr[index]}`)} /> : get(decode, `result.${indexedArr[index]}`)}
  </div>
}
const LogData = ({ data, decode }) => {
  const isDisabled = typeof decode !== 'object' || data === '0x';
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
    {!isDisabled &&
      <div className="sc-log__data--buttons">
        <div className={cx("sc-log__data--button", { active: model === 'decode', disabled: isDisabled })}
          onClick={() => isDisabled ? {} : setModel('decode')}> Dec</div>
        <div className={cx("sc-log__data--button", { active: model === 'hex' })}
          onClick={() => setModel('hex')}>Hex</div>
      </div>}
    {model === 'hex' ? data : Object.keys(decodeData).map((k, i) => {
      return (<div key={i}>
        <span className="text-grey">{k}: </span>
        {decodeData[k]}
      </div>)
    })}
  </div>)
}

const Items = props => {
  const { logs, abiMap, tokenInfoMap } = props;
  const [filteredLogs, setFiltedLogs] = useState([]);
  const [isHidden, setIsHidden] = useState(true);
  useEffect(() => {
    let ids = new Set();
    let tmpLogs = [];
    logs.forEach(log => {
      const tokenId = get(log, 'decode.result.tokenId');
      if (tokenId === undefined) return;
      if (!ids.has(tokenId)) {
        ids.add(tokenId);
        tmpLogs.push(log);
        if (tokenInfoMap) {
          const address = get(log, 'address');
          const info = tokenInfoMap[address];
          if (info !== undefined && isHidden) {
            setIsHidden(false);
          }
        }
      }
    })
    setFiltedLogs(tmpLogs);
  }, [logs, tokenInfoMap])
  return !isHidden && <>
    <div className="details-header item">
      <div className="txn-type smart-contract items">Items</div>
    </div>
    <div className="details txn-details item">
      {
        filteredLogs.map((log, i) => {
          const tokenId = get(log, 'decode.result.tokenId');
          const address = get(log, 'address');
          return <Item
            tokenId={tokenId}
            address={address}
            abi={abiMap ? abiMap[address] : []}
            item={tokenInfoMap ? tokenInfoMap[address] : {}}
            key={i}
          />
        })
      }
    </div>

  </>
}

const TransactionAction = ({ token, info, disabled }) => {
  const isZeroFrom = ZeroAddress === token.from;
  const address = token.contractAddress;
  const truncate = isZeroFrom ? 0 : 15;
  const TokenId = () => {
    return disabled ? <span className="text-disabled">{token.tokenId}</span> :
      <Link className="token-link__token-id" to={`/token/${address}?a=${token.tokenId}`}>{token.tokenId}</Link>
  }
  const Name = () => {
    const name = info ? info.name : "";
    const tokenName = info ? info.tokenName || name : "";
    return disabled ? <span className="text-disabled name"> {tokenName}</span> :
      <Link className="token-link" to={`/token/${address}`}> {tokenName}</Link>;
  }
  return token.type === "TNT-721" && <div className="transaction-action-row">
    <div className="transaction-action-row__info">
      {isZeroFrom ? <>
        Mint&nbsp;&nbsp;
      </> : <>
        Trannsfer From
        <Address hash={token.from} truncate={truncate} />
      </>
      }
      To
      <Address hash={token.to} truncate={truncate} />
    </div>
    <div className="transaction-action-row__token">
      {/* Note: Disabled token feature */}
      1 of TokenID[<TokenId />]<Name />
      {/* 1 of TokenID[<Link className="token-link__token-id" to="#">{token.tokenId}</Link>]
      <Link className="token-link" to="#">{info ? info.name : ""}</Link> */}
    </div>
  </div>
}

const TokenTransferred = ({ token, info, disabled }) => {
  const truncate = 15;
  const name = info ? info.name : "";
  const tokenName = info ? info.tokenName || name : "";
  const symbol = info ? info.symbol : "";
  const decimals = (info ? info.decimals : 0) || 0;
  const isTnt20 = token.type === "TNT-20";
  const isTnt721 = token.type === "TNT-721";
  const address = get(token, 'contractAddress');
  const Name = () => {
    if (disabled) {
      if (isTnt20) return <span className="text-disabled name">{` ${name} ${symbol ? `(${symbol})` : '-'}`}</span>;
      if (isTnt721) return <span className="text-disabled name"> {tokenName}</span>;
    } else {
      if (isTnt20) return <Link className="token-link" to={`/token/${address}`}>{` ${name} ${symbol ? `(${symbol})` : '-'}`}</Link>;
      if (isTnt721) return <Link className="token-link" to={`/token/${address}`}> {tokenName}</Link>;
    }
  }
  const TokenId = () => {
    return disabled ? <span className="text-disabled">{token.tokenId}</span> :
      <Link className="token-link__token-id" to={`/token/${address}?a=${token.tokenId}`}>{token.tokenId}</Link>
  }
  return <div className="token-transaffered-row">
    <b>From:</b>
    <Address hash={token.from} truncate={truncate} />
    <b>To:</b>
    <Address hash={token.to} truncate={truncate} />
    <b>For</b>
    {isTnt721 && <span className="text-container">
      {/* Note: Disabled token feature */}
      TNT-721 TokenID [<TokenId />]<Name />
      {/* TNT-721 TokenID [<Link className="token-link__token-id" to="#">{token.tokenId}</Link>]
      <Link className="token-link" to="#">{name}</Link> */}
    </span>}
    {isTnt20 && <span className="text-container">
      {/* Note: Disabled token feature */}
      {formatQuantity(token.value, decimals, 2)}<Name />
      {/* {formatCoin(token.value)}<Link to="#">{`${name} (${symbol})`}</Link> */}
    </span>}
  </div>
}
const ReturnTime = props => {
  const { returnTime } = props;
  const [str, setStr] = useState('')
  useEffect(() => {
    let days = ~~(returnTime / 60 / 60 / 24);
    let hours = ~~(returnTime / 60 / 60 % 24);
    let mins = ~~(returnTime / 60 % 60);
    const dayStr = days > 0 ? days + ` day${days > 1 ? 's' : ''} : ` : '';
    const hourStr = (hours < 10 ? '0' + hours : hours) + ' hour' + (hours > 1 ? 's' : '') + ' : ';
    const minStr = (mins < 10 ? '0' + mins : mins) + ' min' + (mins > 1 ? 's' : '');
    setStr('In ' + dayStr + hourStr + minStr)
  }, [returnTime]);
  return <div className="text-grey">{str}</div>
}

function _getAbiAddressList(transaction) {
  let logs = get(transaction, 'receipt.Logs');
  let abiSet = new Set();
  logs.forEach(log => abiSet.add(log.address));
  return [...abiSet];
}