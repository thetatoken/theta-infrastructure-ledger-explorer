import React, { Component } from "react";
import { browserHistory } from 'react-router';
import cx from 'classnames';

import BlockExplorerTable from './blocks/components/block-explorer-table';
import { blocksService } from 'common/services/block';
import LinkButton from "common/components/link-button";
import NotExist from 'common/components/not-exist'; 
import { BlockStatus, TxnTypes, TxnClasses } from 'common/constants';
import { date, hash } from 'common/helpers/blocks';


export default class BlocksExplorer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.route.backendAddress,
      block: null,
      totalBlocksNumber: undefined,
      errorType: null
    };
  }
  componentWillUpdate(nextProps) {
    if (nextProps.params.blockHeight !== this.props.params.blockHeight) {
      this.getOneBlockByHeight(nextProps.params.blockHeight);
    } 
  }
  componentDidMount() {
    const { blockHeight } = this.props.params;
    this.getOneBlockByHeight(blockHeight);
  }
  getOneBlockByHeight(height) {
    const { totalBlocksNumber } = this.state;
    const msg = this.props.location.state;
    if (Number(height)
      && (totalBlocksNumber === undefined
        || totalBlocksNumber >= height
        || height > 0)) {
      blocksService.getBlockByHeight(height)
        .then(res => {
          switch (res.data.type) {
            case 'block':
              this.setState({
                block: res.data.body,
                totalBlocksNumber: res.data.totalBlocksNumber,
                errorType: null
              });
              break;
            case 'error_not_found':
              this.setState({
                errorType: msg ? 'error_coming_soon' : 'error_not_found'
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
  renderNoMoreMsg() {
    return (
      <div className="th-explorer__buttons--no-more">No More</div>
    )
  }
  
  render() {
    const { block, totalBlocksNumber, errorType } = this.state;
    const height = Number(this.props.params.blockHeight);
    return (
      <div className="content block-details">
        <div className="page-title blocks">Block Details</div>
        { errorType === 'error_not_found' &&
        <NotExist />}
        { errorType === 'error_coming_soon' &&
        <NotExist msg="This block information is coming soon." />}
        { block && !errorType &&
        <React.Fragment>
          <table className="txn-info details">
            <tbody>
              <tr>
                <th>Height</th>
                <td>{ height }</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>{ BlockStatus[block.status] }</td>
              </tr>
              <tr>
                <th>Timestamp</th>
                <td>{ date(block) }</td>
              </tr>
              <tr>
                <th>Hash</th>
                <td>{ hash(block) }</td>
              </tr>
              <tr>
                <th>Previous Block</th>
                <td>{ block.parent_hash }</td>
              </tr>
              <tr>
                <th>Proposer</th>
                <td>{ block.proposer }</td>
              </tr>
              <tr>
                <th>State Hash</th>
                <td>{ block.state_hash }</td>
              </tr>
              <tr>
                <th>Transactions Hash</th>
                <td>{ block.transactions_hash }</td>
              </tr>
              <tr>
                <th># of Transactions</th>
                <td>{ block.num_txs }</td>
              </tr>
              <tr className="transactions">
                <th>Transactions</th>
                <td>{ _.map(block.txs, (t,i) => <Transaction key={i} txn={t} />)  }</td>
              </tr>
            </tbody>
          </table>
          
          <div className="button-list split">
            { height > 1 
              ? <a className="btn" href={`/blocks/${height - 1}`}><i>&#8678;</i> Prev</a>
              : <div className="th-explorer__buttons--no-more">No More</div>}
            { totalBlocksNumber > height 
              ? <a className="btn" href={`/blocks/${height + 1}`}>Next <i>&#8680;</i></a>
              : <div className="th-explorer__buttons--no-more">No More</div>}
          </div>
        </React.Fragment>}
      </div>);
  }
}

const Transaction = props => {
  let { txn } = props;
  let { hash, type } = txn;
  console.log(txn)
  return(
    <div className="block-txn">
      <span className={cx("txn-type",TxnClasses[type])}>{ TxnTypes[type] }</span>
      <a href={`/txs/${hash}`}>{ hash }</a>
    </div>)
}



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

const nameOrder = ['height', 'status', 'timestamp', 'hash', 'parent_hash', 'proposer', 'state_hash', 'transactions_hash', 'num_txs', 'txs'];
class BlockExplorerTable2 extends Component {
  renderContent(key, content) {
    if (key === 'parent_hash') {
      return (
        <Link to={`/blocks/${Number(this.props.blockInfo.height) - 1}`} >{content}</Link>
      )
    } else
      return content;
  }
  getInfo(blockInfo, key) {
    if (key === 'status') return BlockStatus[blockInfo[key]];
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