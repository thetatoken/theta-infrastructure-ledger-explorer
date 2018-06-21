import React, { Component } from "react";
import { Link } from "react-router";
// import '../styles.scss';

const nameMap = {
  'height': 'Height',
  'timestamp': 'Timestamp',
  'hash': 'Hash',
  'parent_hash': 'Previous Block Hash',
  'num_txs': 'Number of Transactions',
  'lst_cmt_hash': 'Last commit hash',
  'data_hash': 'Data Hash',
  'vldatr_hash': 'Validators hash',
  'txs': 'Transactions'
}

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
    if (key !== 'txs') return blockInfo[key];
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
        {Object.keys(blockInfo).map(key => {
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
