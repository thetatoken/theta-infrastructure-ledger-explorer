import React, { Component } from "react";
import { Link } from "react-router";
import classnames from 'classnames';
import { BigNumber } from 'bignumber.js';
import '../styles.scss';

const typeMap = {
  '0': 'Coinbase',
  '1': 'Slash',
  '2': 'Send',
  '3': 'Reserve fund',
  '4': 'Release fund',
  '5': 'Service Payment',
  '6': 'Split Contract',
  '7': 'Update Validators'
}
export default class TransactionExplorerTable extends Component {
  renderAmount(amount) {
    return BigNumber(amount, 10).toFormat(0);
  }
  renderFee(fee){
    return this.renderAmount(fee.tfuelwei) + " TFuelWei";
  }
  renderCoins(coins) {
    return this.renderAmount(coins.thetawei) + " ThetaWei, " + this.renderAmount(coins.tfuelwei) + " TFuelWei";
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
    const pre = new Date(timestamp * 1000)
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
  renderOneRow(leftContent, rightContent, isAddress, toolTipText) {
    const content = !isAddress ? rightContent : <Link to={`/account/${rightContent}`} >{rightContent}</Link>;
    return (
      <div className="th-explorer-table__row">
        <div className="th-explorer-table__row--left">
          <p className="th-explorer-table-text">{leftContent}</p>
        </div>
        <div className="th-explorer-table__row--right">
          <div className={classnames('th-explorer-table-text',
            { 'th-explorer-table-text-tooltip': toolTipText })} title={toolTipText}>
            {content}
          </div>
        </div>
      </div>
    )
  }
  renderCommonRows(transactionInfo) {
    return (
      <div>
        {this.renderOneRow('Hash', transactionInfo.hash.toLowerCase())}
        {this.renderOneRow('Type', typeMap[transactionInfo.type])}
        {this.renderOneRow('Block Height', this.renderBlockHeight(transactionInfo.block_height))}
        {this.renderOneRow('Age', this.renderTimeStamp(transactionInfo.timestamp))}
      </div>
    )
  }
  renderCoinBaseAmount(outputs) {
    return (
      <div>
        {outputs.map((output, i) => {
          return (
            <div key={i} className="th-explorer-table-text__coinbase_amount">
              {this.renderCoins(output.coins) + ' To '}
              <Link to={`/account/${output.address}`}>{this.getAddressShortHash(output.address)}</Link>
            </div>)
        })}
      </div>
    )
  }
  getAddressShortHash(address) {
    return address.substring(12) + '...';
  }
  renderCoinBase(transactionInfo) {
    return (
      <div>
        {this.renderCommonRows(transactionInfo)}
        {this.renderOneRow('Amount', this.renderCoinBaseAmount(transactionInfo.data.outputs))}
        {/* {this.renderOneRow('Amount', this.renderAmount(transactionInfo.data.outputs[0].coins))}
        {this.renderOneRow('Output Address', transactionInfo.data.outputs[0].address, true)} */}
      </div>
    )
  }
  renderSlash(transactionInfo) {
    return (
      <div>
        {this.renderCommonRows(transactionInfo)}
        {this.renderOneRow('Proposer Address', transactionInfo.data.proposer.address, true)}
        {this.renderOneRow('Reserved Sequence', transactionInfo.data.reserved_sequence)}
        {this.renderOneRow('Slash Proof', transactionInfo.data.slash_proof.substring(0, 12) + '.......'
          , false, transactionInfo.data.slash_proof)}
        {this.renderOneRow('Slashed Address', transactionInfo.data.slashed_address)}
      </div>
    )
  }
  renderSend(transactionInfo) {
    return (
      <div>
        {this.renderCommonRows(transactionInfo)}
        {this.renderOneRow('Fee', this.renderFee(transactionInfo.data.fee))}
        {this.renderOneRow('Amount', this.renderCoins(transactionInfo.data.inputs[0].coins))}
        {this.renderOneRow('Input Address', transactionInfo.data.inputs[0].address, true)}
        {this.renderOneRow('Output Address', transactionInfo.data.outputs[0].address, true)}
      </div>
    )
  }
  renderReserveFund(transactionInfo) {
    return (
      <div>
        {this.renderCommonRows(transactionInfo)}
        {this.renderOneRow('Fee', this.renderFee(transactionInfo.data.fee))}
        {this.renderOneRow('Collateral', this.renderCoins(transactionInfo.data.collateral))}
        {this.renderOneRow('Duration', transactionInfo.data.duration)}
        {this.renderOneRow('Amount', this.renderCoins(transactionInfo.data.source.coins))}
        {this.renderOneRow('Source Address', transactionInfo.data.source.address, true)}
        {this.renderOneRow('Resource Ids', this.renderIds(transactionInfo.data.resource_ids))}
      </div>
    )
  }
  renderServicePayment(transactionInfo) {
    return (
      <div>
        {this.renderCommonRows(transactionInfo)}
        {this.renderOneRow('Fee', this.renderFee(transactionInfo.data.fee))}
        {this.renderOneRow('Payment Sequence', transactionInfo.data.payment_sequence)}
        {this.renderOneRow('Reserve Sequence', transactionInfo.data.reserve_sequence)}
        {this.renderOneRow('Amount', this.renderCoins(transactionInfo.data.source.coins))}
        {this.renderOneRow('Source Address', transactionInfo.data.source.address, true)}
        {this.renderOneRow('Target Address', transactionInfo.data.target.address, true)}
      </div>
    )
  }
  renderSplitContract(transactionInfo) {
    return (
      <div>
        {this.renderCommonRows(transactionInfo)}
        {this.renderOneRow('Fee', this.renderFee(transactionInfo.data.fee))}
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
      case 0:
        return this.renderCoinBase(transactionInfo)
      case 1:
        return this.renderSlash(transactionInfo)
      case 2:
        return this.renderSend(transactionInfo)
      case 3:
        return this.renderReserveFund(transactionInfo)
      case 5:
        return this.renderServicePayment(transactionInfo)
      case 6:
        return this.renderSplitContract(transactionInfo)
      default:
        return <div>Wrong type</div>
    }
  }
}
