import React, { Component } from "react";
import { Link } from 'react-router';
import _ from 'lodash';
import cx from 'classnames';



import { formatCoin } from 'common/helpers/utils';
import { CurrencyLabels } from 'common/constants';
import { accountService } from 'common/services/account';
import { transactionsService } from 'common/services/transaction';
import TransactionTable from "common/components/transactions-table";
import Pagination from "common/components/pagination";
import NotExist from 'common/components/not-exist';
import DetailsRow from 'common/components/details-row';

const NUM_TRANSACTIONS = 50;

export default class AccountDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      account: null,
      transactions: null,
      pageNumber: 0,
      totalPages: null,
      errorType: null,
    };
  }
  componentWillUpdate(nextProps) {
    if (nextProps.params.accountAddress !== this.props.params.accountAddress) {
      this.fetchData(nextProps.params.accountAddress);
    }
  }
  componentDidMount() {
    const { accountAddress } = this.props.params;
    this.fetchData(accountAddress);
  }

  fetchData(address) {
    this.getOneAccountByAddress(address);
    this.getTransactionsByAddress(address);
  }

  getTransactionsByAddress(address, page = 0) {
    if(!address) {
      this.setState({ errorType: 'error_not_found' });
      return;
    }

    transactionsService.getTransactionsByAddress(address, page, NUM_TRANSACTIONS)
      .then(res => {
        this.setState({ 
          transactions: _.get(res, 'data.body'),
          pageNumber: _.get(res, 'data.currentPageNumber'),
          totalPages: _.get(res, 'data.totalPageNumber'),
        })
      })
      .catch(err => {
        console.log(err);
      });
  }

  getOneAccountByAddress(address) {
    if(!address) {
      this.setState({ errorType: 'error_not_found' });
      return;
    }

    accountService.getOneAccountByAddress(address.toUpperCase())
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
      }).catch(err => {
        console.log(err);
      })
  }

  handlePageChange = pageNumber => {
    this.getTransactionsByAddress(this.state.address, pageNumber);
  }

  render() {
    const { account, transactions, currentPage, totalPages, errorType } = this.state;
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
              <DetailsRow label="Balance" data={<Balance balance={account.balance} />} />
              <DetailsRow label="Sequence" data={account.sequence} />
            </tbody>
          </table>
        </React.Fragment>}
        { transactions && transactions.length && 
        <React.Fragment>
          <TransactionTable transactions={transactions} />
          <Pagination
            size={'lg'}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={this.handlePageChange} />
        </React.Fragment>}
      </div>
    );
  }
}

const Balance = ({ balance }) => {
  return (
    <React.Fragment>
      {_.map(balance, (v, k) => <div key={k} className={cx("currency", k)}>{`${formatCoin(v)} ${CurrencyLabels[k] || k}`}</div>)}
    </React.Fragment>)
}

const Address = ({ hash }) => {
  return (<a href={`/account/${hash}`} target="_blank">{hash}</a>)
}

const HashList = ({ hashes }) => {
  return (
    <React.Fragment>
      {_.map(_.compact(hashes), (hash, i) => <div key={i}><Link key={hash} to={`/txs/${hash.toLowerCase()}`}>{hash.toLowerCase()}</Link></div>)}
    </React.Fragment>
  )
}

