import React, { Component } from "react";
import { Link } from 'react-router';
import _ from 'lodash';
import cx from 'classnames';



import { formatCoin, priceCoin } from 'common/helpers/utils';
import { CurrencyLabels } from 'common/constants';
import { accountService } from 'common/services/account';
import { transactionsService } from 'common/services/transaction';
import { stakeService } from 'common/services/stake';
import { priceService } from 'common/services/price';
import TransactionTable from "common/components/transactions-table";
import Pagination from "common/components/pagination";
import NotExist from 'common/components/not-exist';
import DetailsRow from 'common/components/details-row';
import LoadingPanel from 'common/components/loading-panel';
import StakeTxsTable from "../common/components/stake-txs";

const NUM_TRANSACTIONS = 5;

export default class AccountDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      account: null,
      transactions: null,
      currentPage: 1,
      totalPages: null,
      errorType: null,
      loading_acct: false,
      loading_txns: false,
      includeService: false,
      hasOtherTxs: true,
      hasStakes: false,
      price: { 'Theta': 0, 'TFuel': 0}
    };
  }
  componentWillUpdate(nextProps) {
    if (nextProps.params.accountAddress !== this.props.params.accountAddress) {
      this.setState({ hasOtherTxs: true, includeService: false })
      this.fetchData(nextProps.params.accountAddress);
    }
  }
  componentDidMount() {
    const { accountAddress } = this.props.params;
    this.fetchData(accountAddress);
  }

  fetchData(address) {
    this.getOneAccountByAddress(address);
    this.getTransactionsByAddress(address, false, 1);
    this.getStakeTransactions(address);
    this.getPrices();
  }
  getPrices() {
    priceService.getAllprices()
      .then(res => {
        const prices = _.get(res, 'data.body');
        prices.forEach(info => {
          switch (info._id) {
            case 'THETA':
              this.setState({ price: { ...this.state.price, 'Theta': info.price } })
              return;
            case 'TFUEL':
              this.setState({ price: { ...this.state.price, 'TFuel': info.price } })
              return;
            default:
              return;
          }
        })
      })
      .catch(err => {
        console.log(err);
      });
  }
  getStakeTransactions(address) {
    if (!address) {
      this.setState({ errorType: 'error_not_found' });
      return;
    }
    stakeService.getStakeByAddress(address)
      .then(res => {
        const stakes = _.get(res, 'data.body');
        this.setState({
          holderTxs: stakes.holderRecords,
          sourceTxs: stakes.sourceRecords,
          hasStakes: stakes.holderRecords.length + stakes.sourceRecords.length > 0
        })
      })
      .catch(err => {
        console.log(err);
      });
  }
  getTransactionsByAddress(address, includeService, page = 1, ) {
    if (!address) {
      this.setState({ errorType: 'error_not_found' });
      return;
    }
    if(this.state.account && !Object.keys(this.state.account.txs_counter).length){
      this.setState({ loading_txns: false });
      return;
    }
    this.setState({ loading_txns: true });
    transactionsService.getTransactionsByAddress(address, page, NUM_TRANSACTIONS, includeService)
      .then(res => {
        const txs = _.get(res, 'data.body');
        if (txs.length !== 0) {
          this.setState({
            transactions: _.get(res, 'data.body'),
            currentPage: _.get(res, 'data.currentPageNumber'),
            totalPages: _.get(res, 'data.totalPageNumber'),
            loading_txns: false,
          })
        } else {
          this.setState({ hasOtherTxs: false })
          this.handleToggleHideTxn();
        }

      })
      .catch(err => {
        this.setState({ loading_txns: false });
        console.log(err);
      });
  }

  getOneAccountByAddress(address) {
    if (!address) {
      this.setState({ errorType: 'error_not_found' });
      return;
    }

    this.setState({ loading_acct: true });
    accountService.getOneAccountByAddress(address)
      .then(res => {
        switch (res.data.type) {
          case 'account':
            this.setState({
              account: res.data.body,
              errorType: null
            })
            break;
          case 'error_not_found':
            this.setState({
              errorType: 'error_not_found'
            });
            break;
          default:
            break;
        }
        this.setState({ loading_acct: false });
      }).catch(err => {
        this.setState({ loading_acct: false });
        console.log(err);
      })
  }

  handlePageChange = pageNumber => {
    let { accountAddress } = this.props.params;
    let { includeService } = this.state;
    this.getTransactionsByAddress(accountAddress, includeService, pageNumber);
  }

  handleToggleHideTxn = () => {
    let { accountAddress } = this.props.params;
    let includeService = !this.state.includeService;
    this.setState({
      includeService,
      currentPage: 1,
      totalPages: null,
    });
    this.getTransactionsByAddress(accountAddress, includeService, 1);
  }

  render() {
    const { account, transactions, currentPage, totalPages, errorType, loading_txns,
      includeService, hasOtherTxs, hasStakes, holderTxs, sourceTxs, price } = this.state;
    return (
      <div className="content account">
        <div className="page-title account">Account Detail</div>
        {errorType === 'error_not_found' &&
          <NotExist msg="Note: An account will not be created until the first time it receives some tokens." />}
        {account && !errorType &&
          <React.Fragment>
            <table className="details account-info">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>{account.address}</th>
                </tr>
              </thead>
              <tbody>
                <DetailsRow label="Balance" data={<Balance balance={account.balance} price={price} />} />
                <DetailsRow label="Sequence" data={account.sequence} />
              </tbody>
            </table>
          </React.Fragment>}
        {hasStakes &&
          <div className="stake-container">
            <StakeTxsTable type='holder' txs={holderTxs} />
            <StakeTxsTable type='source' txs={sourceTxs} />
          </div>
        }
        {!transactions && loading_txns &&
          <LoadingPanel />}
        {transactions && transactions.length > 0 &&
          <React.Fragment>
            <div className="actions">
              <div className="title">Transactions</div>
              {hasOtherTxs &&
                <button className="btn tx">{includeService ? 'Hide' : 'Show'} Service Payments</button>
              }
              <label className="switch">
                <input type="checkbox" checked={!includeService} onChange={this.handleToggleHideTxn}></input>
                <span className="slider"></span>
              </label>
            </div>
            <div>
              {loading_txns &&
                <LoadingPanel className="fill" />}
              <TransactionTable transactions={transactions} account={account} price={price} />
            </div>
            <Pagination
              size={'lg'}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={this.handlePageChange}
              disabled={loading_txns} />
          </React.Fragment>}
      </div>);
  }
}

const Balance = ({ balance, price }) => {
  return (
    <div className="act balance">
      {_.map(balance, (v, k) => <div key={k} className={cx("currency", k)}>
        {`${formatCoin(v)} ${CurrencyLabels[k] || k}`}
        <div className='price'>{`[\$${priceCoin(v, price[CurrencyLabels[k]])} USD]`}</div>
      </div>)}
    </div>)
}

const Address = ({ hash }) => {
  return (<Link to={`/account/${hash}`} target="_blank">{hash}</Link>)
}

const HashList = ({ hashes }) => {
  return (
    <React.Fragment>
      {_.map(_.compact(hashes), (hash, i) => <div key={i}><Link key={hash} to={`/txs/${hash.toLowerCase()}`}>{hash.toLowerCase()}</Link></div>)}
    </React.Fragment>
  )
}

