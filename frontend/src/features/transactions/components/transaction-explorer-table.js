import React, { Component } from "react";
import { Link } from "react-router"
import '../styles.scss';
const nameMap = {
  'fee': 'Fee',
  'gas': 'Gas',
  'pmt_sqnc': 'Payment Sequence',
  'rsv_sqnc': 'Reserve Sequence',
  'source': 'Source Address',
  'target': 'Target Address'
}
const typeMap = {
  '1': 'Coinbase',
  '2': 'Slash',
  '3': 'Send',
  '4': 'Reserve fund',
  '5': 'Release fund',
  '6': 'Service Payment',
  '7': 'Split Contract',
  '8': 'Update Validators'
}
export default class TransactionExplorerTable extends Component {
  renderContent(key) {
    const { transactionInfo } = this.props;
    switch (key) {
      case 'fee':
        return transactionInfo['fee'].amount;
        break;
      case 'gas':
        return transactionInfo['gas'];
      case 'pmt_sqnc':
        return transactionInfo['pmt_sqnc'];
      case 'rsv_sqnc':
        return transactionInfo['rsv_sqnc'];
      case 'source':
        return transactionInfo['source'].address;
      case 'target':
        return transactionInfo['target'].address;
      case 'Amount':
        return this.getAmount();
      default:
        return null;
    }
  }
  renderAmount(coins, type) {
    let sum = 0, coinType;
    if (type === 'single') {
      sum = coins.amount;
      coinType = coins.denom;
      return sum + ' ' + coinType;
    } else {
      let res = '', coinMap = {};
      coins.forEach(coin => {
        coinType = coin.denom;
        if (coinMap[coinType]) coinMap[coinType] += coin.amount;
        else coinMap[coinType] = coin.amount;
      });
      Object.keys(coinMap).forEach(coinType => {
        res += coinMap[coinType] + ' ' + coinType + ', ';
      })
      return res.substring(0, res.length - 2);
    }
  }
  renderIds(ids) {
    let res = '';
    ids.forEach(id => {
      res += ids + ', '
    })
    return res.substring(0, res.length - 2);
  }
  renderSplits(splits) {
    return (
      <div className="th-tx-text__split">
        {splits.map(split => {
          return <span key={split.address}>{'Address: ' + split.address + '  ' + split.percentage + '%'}</span>
        })
        }
      </div>
    )
  }
  renderOneRow(leftContent, rightContent, isAddress) {
    const content = !isAddress ? rightContent : <Link to={`/user/${rightContent}`} >{rightContent}</Link>;
    return (
      <div className="th-be-table__row">
        <div className="th-be-table__row--left">
          <p className="th-be-table-text">{leftContent}</p>
        </div>
        <div className="th-be-table__row--right">
          <div className="th-be-table-text">
            {content}
          </div>
        </div>
      </div>
    )
  }
  renderType1(transactionInfo) {
    return (
      <div>
        {this.renderOneRow('Hash', transactionInfo.hash)}
        {this.renderOneRow('Coin Type', typeMap[transactionInfo.type])}
        {this.renderOneRow('Amount', this.renderAmount(transactionInfo.data.outputs[0].coins))}
        {this.renderOneRow('Output address', transactionInfo.data.outputs[0].address, true)}
      </div>
    )
  }
  renderType3(transactionInfo) {
    return (
      <div>
        {this.renderOneRow('Hash', transactionInfo.hash)}
        {this.renderOneRow('Coin Type', typeMap[transactionInfo.type])}
        {this.renderOneRow('fee', this.renderAmount(transactionInfo.data.fee, 'single'))}
        {this.renderOneRow('Gas', transactionInfo.data.gas)}
        {this.renderOneRow('Amount', this.renderAmount(transactionInfo.data.inputs[0].coins))}
        {this.renderOneRow('Input address', transactionInfo.data.inputs[0].address, true)}
        {this.renderOneRow('Output address', transactionInfo.data.outputs[0].address, true)}
      </div>
    )
  }
  renderType4(transactionInfo) {
    return (
      <div>
        {this.renderOneRow('Hash', transactionInfo.hash)}
        {this.renderOneRow('Coin Type', typeMap[transactionInfo.type])}
        {this.renderOneRow('fee', this.renderAmount(transactionInfo.data.fee, 'single'))}
        {this.renderOneRow('Gas', transactionInfo.data.gas)}
        {this.renderOneRow('Collateral', this.renderAmount(transactionInfo.data.collateral))}
        {this.renderOneRow('Duration', transactionInfo.data.duration)}
        {this.renderOneRow('Amount', this.renderAmount(transactionInfo.data.source.coins))}
        {this.renderOneRow('Source address', transactionInfo.data.source.address, true)}
        {this.renderOneRow('Resource Ids', this.renderIds(transactionInfo.data.resource_ids))}
      </div>
    )
  }
  renderType6(transactionInfo) {
    return (
      <div>
        {this.renderOneRow('Hash', transactionInfo.hash)}
        {this.renderOneRow('Coin Type', typeMap[transactionInfo.type])}
        {this.renderOneRow('fee', this.renderAmount(transactionInfo.data.fee, 'single'))}
        {this.renderOneRow('Gas', transactionInfo.data.gas)}
        {this.renderOneRow('Payment Sequence', transactionInfo.data.payment_sequence)}
        {this.renderOneRow('Reserve Sequence', transactionInfo.data.reserve_sequence)}
        {this.renderOneRow('Amount', this.renderAmount(transactionInfo.data.source.coins))}
        {this.renderOneRow('Source address', transactionInfo.data.source.address, true)}
        {this.renderOneRow('Target address', transactionInfo.data.target.address, true)}
      </div>
    )
  }
  renderType7(transactionInfo) {
    return (
      <div>
        {this.renderOneRow('Hash', transactionInfo.hash)}
        {this.renderOneRow('Coin Type', typeMap[transactionInfo.type])}
        {this.renderOneRow('fee', this.renderAmount(transactionInfo.data.fee, 'single'))}
        {this.renderOneRow('Gas', transactionInfo.data.gas)}
        {this.renderOneRow('Duration', transactionInfo.data.duration)}
        {this.renderOneRow('Initiator Address', transactionInfo.data.initiator.address, true)}
        {this.renderOneRow('Resource Id', transactionInfo.data.resource_id)}
        {this.renderOneRow('Splits', this.renderSplits(transactionInfo.data.splits))}
      </div>
    )
  }
  render() {
    const { transactionInfo } = this.props;
    console.log(transactionInfo)
    switch (transactionInfo.type) {
      case 1:
        return (
          <div className="th-be-table">
            {this.renderType1(transactionInfo)}
          </div>
        )
        break;
      case 3:
        return (
          <div className="th-be-table">
            {this.renderType3(transactionInfo)}
          </div>
        )
        break;
      case 4:
        return (
          <div className="th-be-table">
            {this.renderType4(transactionInfo)}
          </div>
        )
        break;
      case 6:
        return (
          <div className="th-be-table">
            {this.renderType6(transactionInfo)}
          </div>
        )
        break;
      case 7:
        return (
          <div className="th-be-table">
            {this.renderType7(transactionInfo)}
          </div>
        )
        break;
      default:
        return (<div>Wrong type</div>)
        break;
    }
  }
}
