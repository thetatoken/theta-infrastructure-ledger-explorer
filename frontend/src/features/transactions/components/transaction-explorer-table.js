import React, { Component } from "react";
import { Link } from "react-router";
import '../styles.scss';
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
  renderAmount(coins, type) {
    let sum = 0, coinType;
    if (type === 'single') {
      coinType = (coins.denom.includes('Wei') && coins.amount > 100000) ?
        coins.denom.substring(0, coins.denom.length - 3) : coins.denom;
      sum = (coins.denom.includes('Wei') && coins.amount > 100000) ?
        coins.amount / 1000000 : coins.amount;
      return sum + ' ' + coinType;
    } else {
      let res = '', coinMap = {};
      coins.forEach(coin => {
        coinType = coin.denom;
        if (coinMap[coinType]) coinMap[coinType] += coin.amount;
        else coinMap[coinType] = coin.amount;
      });
      Object.keys(coinMap).forEach(coinType => {
        let denom = coinType;
        let amount = coinMap[coinType];
        if (denom.includes('Wei') && amount > 99999) {
          denom = denom.substring(0, denom.length - 3);
          amount /= 1000000;
        }
        res += amount + ' ' + denom + ', ';
      })
      return res.substring(0, res.length - 2);
    }
  }
  renderIds(ids) {
    let res = '';
    ids.forEach(id => {
      res += id + ', '
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
  renderBlockHeight(height) {
    return <Link to={`/blocks/${height}`} >{height}</Link>;
  }
  renderTimeStamp(timestamp) {
    const now = new Date(Date.now())
    const pre = new Date(timestamp)
    // const res = this.getTimeString(now - 1528990059783);
    const res = this.getTimeString(now - pre);
    return res;
  }
  getTimeString(diff) {
    let res;
    let cur = diff;
    cur /= 1000;
    const diffSecs = Math.round(cur % 60);
    cur /= 60;
    const diffMins = Math.round(cur % 60);
    cur /= 60;
    const diffHrs = Math.round(cur % 24);
    cur = Math.round(cur / 24);
    if (cur > 0) res = cur + ' days ' + diffHrs + ' hrs ago';
    else if (diffHrs > 0) res = diffHrs + ' hrs ' + diffMins + ' mins ago';
    else if (diffMins > 0) res = diffMins + ' mins ' + diffSecs + ' secs ago';
    else res = diffSecs + ' secs ago';
    // console.log(cur + 'days ' + diffHrs + ' hrs ' + diffMins + ' mins ' + diffSecs + ' secs ago.')
    return res;
  }
  renderOneRow(leftContent, rightContent, isAddress) {
    const content = !isAddress ? rightContent : <Link to={`/account/${rightContent}`} >{rightContent}</Link>;
    return (
      <div className="th-explorer-table__row">
        <div className="th-explorer-table__row--left">
          <p className="th-explorer-table-text">{leftContent}</p>
        </div>
        <div className="th-explorer-table__row--right">
          <div className="th-explorer-table-text">
            {content}
          </div>
        </div>
      </div>
    )
  }
  renderCommonRows(transactionInfo) {
    return (
      <div>
        {this.renderOneRow('Hash', transactionInfo.hash)}
        {this.renderOneRow('Type', typeMap[transactionInfo.type])}
        {this.renderOneRow('Block Height', this.renderBlockHeight(transactionInfo.block_height))}
        {this.renderOneRow('Age', this.renderTimeStamp(transactionInfo.timestamp))}
      </div>
    )
  }
  renderType1Amount(outputs) {
    return (
      <div>
        {outputs.map(output => {
          return output.coins.map((coin, i) => {
            return (
              <div key={i} className="th-explorer-table-text__type1_amount">
                {this.renderAmount(coin, 'single') + ' To '}
                <Link to={`/account/${output.address}`}>{this.getAddressShortHash(output.address)}</Link>
              </div>)
          })
        })}
      </div>
    )
  }
  getAddressShortHash(address) {
    return address.substring(12) + '...';
  }
  renderType1(transactionInfo) {
    return (
      <div>
        {this.renderCommonRows(transactionInfo)}
        {this.renderOneRow('Amount', this.renderType1Amount(transactionInfo.data.outputs))}
        {/* {this.renderOneRow('Amount', this.renderAmount(transactionInfo.data.outputs[0].coins))}
        {this.renderOneRow('Output Address', transactionInfo.data.outputs[0].address, true)} */}
      </div>
    )
  }
  renderType3(transactionInfo) {
    return (
      <div>
        {this.renderCommonRows(transactionInfo)}
        {this.renderOneRow('Fee', this.renderAmount(transactionInfo.data.fee, 'single'))}
        {this.renderOneRow('Gas', transactionInfo.data.gas)}
        {this.renderOneRow('Amount', this.renderAmount(transactionInfo.data.inputs[0].coins))}
        {this.renderOneRow('Input Address', transactionInfo.data.inputs[0].address, true)}
        {this.renderOneRow('Output Address', transactionInfo.data.outputs[0].address, true)}
      </div>
    )
  }
  renderType4(transactionInfo) {
    return (
      <div>
        {this.renderCommonRows(transactionInfo)}
        {this.renderOneRow('Fee', this.renderAmount(transactionInfo.data.fee, 'single'))}
        {this.renderOneRow('Gas', transactionInfo.data.gas)}
        {this.renderOneRow('Collateral', this.renderAmount(transactionInfo.data.collateral))}
        {this.renderOneRow('Duration', transactionInfo.data.duration)}
        {this.renderOneRow('Amount', this.renderAmount(transactionInfo.data.source.coins))}
        {this.renderOneRow('Source Address', transactionInfo.data.source.address, true)}
        {this.renderOneRow('Resource Ids', this.renderIds(transactionInfo.data.resource_ids))}
      </div>
    )
  }
  renderType6(transactionInfo) {
    return (
      <div>
        {this.renderCommonRows(transactionInfo)}
        {this.renderOneRow('Fee', this.renderAmount(transactionInfo.data.fee, 'single'))}
        {this.renderOneRow('Gas', transactionInfo.data.gas)}
        {this.renderOneRow('Payment Sequence', transactionInfo.data.payment_sequence)}
        {this.renderOneRow('Reserve Sequence', transactionInfo.data.reserve_sequence)}
        {this.renderOneRow('Amount', this.renderAmount(transactionInfo.data.source.coins))}
        {this.renderOneRow('Source Address', transactionInfo.data.source.address, true)}
        {this.renderOneRow('Target Address', transactionInfo.data.target.address, true)}
      </div>
    )
  }
  renderType7(transactionInfo) {
    return (
      <div>
        {this.renderCommonRows(transactionInfo)}
        {this.renderOneRow('Fee', this.renderAmount(transactionInfo.data.fee, 'single'))}
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
    // console.log(transactionInfo)
    switch (transactionInfo.type) { // TODO: Add other type cases
      case 1:
        return this.renderType1(transactionInfo)
      case 3:
        return this.renderType3(transactionInfo)
      case 4:
        return this.renderType4(transactionInfo)
      case 6:
        return this.renderType6(transactionInfo)
      case 7:
        return this.renderType7(transactionInfo)
      default:
        return <div>Wrong type</div>
    }
  }
}
