import React, { Component } from "react";
import { Link } from "react-router";
// import '../styles.scss';

const nameMap = {
  'status': 'Status',
  'height': 'Height',
  'timestamp': 'Timestamp',
  'hash': 'Hash',
  'parent_hash': 'Previous Block Hash',
  'proposer': 'Proposer',
  'state_hash': 'State Hash',
  'transactions_hash': 'Transactions Hash',
  'num_txs': 'Number of Transactions',
  'txs': 'Transactions'
}
const statusMap = {
  0: 'Pending',
  1: 'Valid',
  2: 'Invalid',
  3: 'Committed',
  4: 'Finalized',
  5: 'Finalized',
  6: 'Finalized'
}
const nameOrder = ['height', 'status', 'timestamp', 'hash', 'parent_hash', 'proposer', 'state_hash', 'transactions_hash', 'num_txs', 'txs'];
export default class BlockExplorerTable extends Component {
  renderContent(key, content) {
    if (key === 'parent_hash') {
      return (
        <Link to={`/blocks/${Number(this.props.blockInfo.height) - 1}`} >{content}</Link>
      )
    } else
      return content;
  }
  getInfo(blockInfo, key) {
    if (key === 'status') return statusMap[blockInfo[key]];
    else if (key !== 'txs') return blockInfo[key];
    else if (blockInfo[key]) {
      return (
        <div>
          {blockInfo[key].map((tx, i) => {
            return (
              <div key={i}>
                <Link to={`/txs/${tx.hash}`} >{tx.hash}</Link>
                <br />
              </div>
            )
          })}
        </div>
        // <Link to={`/txs/${blockInfo[key][blockInfo[key].length - 1].hash}`} >{blockInfo[key][blockInfo[key].length - 1].hash}</Link>
      )
    } else return 'Wrong Data';
  }
  render() {
    const { blockInfo } = this.props;
    return (
      <div className="th-explorer-table">
        {nameOrder.map(key => {
          const content = this.getInfo(blockInfo, key);
          return (
            <div className="th-explorer-table__row" key={key}>
              <div className="th-explorer-table__row--left">
                <p className="th-explorer-table-text">{nameMap[key]}</p>
              </div>
              <div className="th-explorer-table__row--right">
                <div className="th-explorer-table-text">
                  {this.renderContent(key, content)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    );
  }
}
