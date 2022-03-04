import React from "react";
import history from 'common/history'
import get from 'lodash/get';
import orderBy from 'lodash/orderBy';
import toNumber from 'lodash/toNumber';
import tns from 'libs/tns';
import { arrayUnique } from 'common/helpers/tns';
import { from, to } from 'common/helpers/transactions';

import { transactionsService } from 'common/services/transaction';
import { priceService } from 'common/services/price';
import Pagination from "common/components/pagination";
import TransactionTable from "common/components/transactions-table";

const NUM_TRANSACTIONS = 50;

export default class Transactions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.backendAddress,
      transactions: [],
      currentPage: 1,
      totalPages: 0,
      loading: false,
      price: { 'Theta': 0, 'TFuel': 0}
    };
  }

  componentDidMount() {
    const { currentPage } = this.state;
    this.fetchData(currentPage);
  }

  fetchData(currentPage) {
    this.setState({ loading: true });
    this.getPrices();
    transactionsService.getTransactionsByPage(currentPage, NUM_TRANSACTIONS)
      .then(res => {
        if (res.data.type == 'transaction_list') {
          this.setState({
            transactions: orderBy(res.data.body, 'number', 'desc'),
            currentPage: toNumber(res.data.currentPageNumber),
            totalPages: toNumber(res.data.totalPageNumber),
            loading: false,
          })
          this.setTransactionsTNS(orderBy(res.data.body, 'number', 'desc'));
        }
      })
      .catch(err => {
        this.setState({ loading: false });
        console.log(err)
      })
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

  setTransactionsTNS = async(transactions) => {
    const uniqueAddresses = arrayUnique(
    transactions.map((x) => from(x))
      .concat(transactions.map((x) => to(x)))
    );
    const domainNames = await tns.getDomainNames(uniqueAddresses);
    transactions.map((transaction) => {
      transaction.fromTns = from(transaction) ? domainNames[from(transaction)] : null;
      transaction.toTns = to(transaction) ? domainNames[to(transaction)] : null;
    });
    this.setState({transactions});
  }

  handlePageChange = (pageNumber) => {
    this.fetchData(pageNumber);
  }

  handleRowClick = (hash) => {
    history.push(`/txs/${hash}`);
  }

  render() {
    const { transactions, currentPage, totalPages, loading, price } = this.state;
    return (
      <div className="content transactions">
        <div className="page-title transactions">Transactions</div>
        <TransactionTable transactions={transactions} price={price} />
        <Pagination
          size={'lg'}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={this.handlePageChange}
          disabled={loading} />
      </div>
    );
  }
}