import React, { useEffect, useState } from "react";
import Popup from "reactjs-popup";
import { Link } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import get from 'lodash/get';
import map from 'lodash/map';
import cx from 'classnames';
import tns from 'libs/tns';
import { arrayUnique } from 'common/helpers/tns';
import { from, to } from 'common/helpers/transactions';
import history from 'common/history'

import { formatCoin, priceCoin, validateHex, fetchBalanceByAddress, formatQuantity } from 'common/helpers/utils';
import { CurrencyLabels, TypeOptions, TxnTypeText } from 'common/constants';
import { accountService } from 'common/services/account';
import { transactionsService } from 'common/services/transaction';
import { stakeService } from 'common/services/stake';
import { priceService } from 'common/services/price';
import { tokenService } from "../common/services/token";
import { rewardDistributionService } from 'common/services/rewardDistribution';
import TransactionTable from "common/components/transactions-table";
import Pagination from "common/components/pagination";
import NotExist from 'common/components/not-exist';
import DetailsRow from 'common/components/details-row';
import LoadingPanel from 'common/components/loading-panel';
import StakeTxsTable from "../common/components/stake-txs";
import SmartContract from 'common/components/smart-contract';
import TokenTxsTable from "common/components/token-txs-table";
import TDropStakeTable from "common/components/tdrop-stake-table";

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Multiselect } from 'multiselect-react-dropdown';
import { useIsMountedRef } from 'common/helpers/hooks';
const NUM_TRANSACTIONS = 20;
const today = new Date().toISOString().split("T")[0];
const INITIAL_TOKEN_BALANCE = { TDrop: '0', WTFuel: '0', TBill: '0' };
let scrollTimes = 0;
let maxScrollTimes = 1;

export default class AccountDetails extends React.Component {
  _isMounted = true;

  constructor(props) {
    super(props);
    this.state = {
      account: this.getEmptyAccount(this.props.match.params.accountAddress),
      accountTNS: null,
      transactions: null,
      currentPage: 1,
      totalPages: null,
      errorType: null,
      loading_acct: false,
      loading_txns: false,
      includeService: false,
      hasOtherTxs: true,
      hasThetaStakes: false,
      hasTfuelStakes: false,
      hasDownloadTx: false,
      hasStartDateErr: false,
      hasEndDateErr: false,
      price: { 'Theta': 0, 'TFuel': 0 },
      isDownloading: false,
      hasRefreshBtn: false,
      selectedTypes: TypeOptions.filter(obj => obj.value !== '5'),
      typeOptions: null,
      rewardSplit: 0,
      beneficiary: "",
      beneficiaryTNS: null,
      tabIndex: 0,
      hasTNT721: false,
      hasTNT20: false,
      hasInternalTxs: false,
      hasToken: false,
      hasXChainTxs: false,
      hasXChainTNT721: false,
      hasXChainTNT20: false,
      hasXChainTNT1155: false,
      tokenBalance: INITIAL_TOKEN_BALANCE,
      tabNames: []
    };
    this.downloadTrasanctionHistory = this.downloadTrasanctionHistory.bind(this);
    this.download = React.createRef();
    this.startDateRef = React.createRef();
    this.endDateRef = React.createRef();
    this.select = React.createRef();
    this.handleInput = this.handleInput.bind(this);
    this.resetInput = this.resetInput.bind(this);
  }
  setSingleTNS = async (address, stateKey) => {
    const name = await tns.getDomainName(address);
    let state = {};
    state[stateKey] = name;
    this.setState(state);
  }
  setTransactionsTNS = async (transactions) => {
    const address = this.state.account.address;
    const uniqueAddresses = arrayUnique(
      transactions.map((x) => from(x, null, address))
        .concat(transactions.map((x) => to(x, null, address)))
    );
    const domainNames = await tns.getDomainNames(uniqueAddresses);
    transactions.map((transaction) => {
      transaction.fromTns = from(transaction, null, address) ? domainNames[from(transaction, null, address)] : null;
      transaction.toTns = to(transaction, null, address) ? domainNames[to(transaction, null, address)] : null;
    });
    this.setState({ transactions });
  }
  setStakesTNS = async (thetaSourceTxs, tfuelSourceTxs, thetaHolderTxs, tfuelHolderTxs) => {
    const uniqueAddresses = arrayUnique(
      thetaSourceTxs.map((x) => x.holder)
        .concat(tfuelSourceTxs.map((x) => x.holder))
        .concat(thetaHolderTxs.map((x) => x.source))
        .concat(tfuelHolderTxs.map((x) => x.source))
    );
    const domainNames = await tns.getDomainNames(uniqueAddresses);
    thetaSourceTxs.map((x) => { x.toTns = x.holder ? domainNames[x.holder] : null });
    tfuelSourceTxs.map((x) => { x.toTns = x.holder ? domainNames[x.holder] : null });
    thetaHolderTxs.map((x) => { x.toTns = x.source ? domainNames[x.source] : null });
    tfuelHolderTxs.map((x) => { x.toTns = x.source ? domainNames[x.source] : null });
    this.setState({
      thetaHolderTxs,
      thetaSourceTxs,
      tfuelHolderTxs,
      tfuelSourceTxs,
      hasThetaStakes: thetaHolderTxs.length + thetaSourceTxs.length > 0,
      hasTfuelStakes: tfuelHolderTxs.length + tfuelSourceTxs.length > 0
    });
  }
  getEmptyAccount(address) {
    return {
      address: address.toLowerCase(),
      balance: { thetawei: 0, tfuelwei: 0 },
      sequence: 0,
      reserved_funds: [],
      txs_counter: {}
    }
  }
  componentDidUpdate(preProps, preState) {
    if (preProps.match.params.accountAddress !== this.props.match.params.accountAddress) {
      this.setState({
        hasOtherTxs: true,
        includeService: false,
        rewardSplit: 0,
        beneficiary: "",
        tabIndex: 0,
        hasToken: false,
        hasTNT20: false,
        hasTNT721: false,
        hasXChainTxs: false,
        hasXChainTNT721: false,
        hasXChainTNT20: false,
        hasXChainTNT1155: false,
        tokenBalance: INITIAL_TOKEN_BALANCE
      })
      this.fetchData(this.props.match.params.accountAddress);
    }
    if (preState.account !== this.state.account
      || preState.transactions !== this.state.transactions
      || preState.hasInternalTxs !== this.state.hasInternalTxs
      || preState.hasTNT20 !== this.state.hasTNT20
      || preState.hasTNT721 !== this.state.hasTNT721
      || preState.hasXChainTNT20 !== this.state.hasXChainTNT20
      || preState.hasXChainTNT721 !== this.state.hasXChainTNT721
      || preState.hasXChainTNT1155 !== this.state.hasXChainTNT1155
      || preState.hasXChainTxs !== this.state.hasXChainTxs) {
      let tabNames = [];
      const { transactions, account, hasInternalTxs, hasTNT20, hasTNT721,
        hasXChainTxs, hasXChainTNT20, hasXChainTNT721, hasXChainTNT1155 } = this.state;
      if (transactions && transactions.length > 0 || hasInternalTxs || hasTNT20 || hasTNT721) {
        tabNames.push('IntraChainTxns');
      }
      if (hasXChainTxs || hasXChainTNT20 || hasXChainTNT721 || hasXChainTNT1155) {
        tabNames.push('CrossChainTxns');
      }
      if (account.code && account.code !== '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470') {
        tabNames.push('Contract');
      }
      let tabName = this.props.location.hash.replace("#", "").split('-')[0];
      let tabIndex = tabNames.indexOf(tabName) === -1 ? 0 : tabNames.indexOf(tabName);
      if (tabName) {
        maxScrollTimes++;
      } else {
        maxScrollTimes = 0;
      }
      this.handleHashScroll();
      this.setState({ tabNames, tabIndex });
    }
  }

  async componentDidMount() {
    const { accountAddress } = this.props.match.params;
    if (accountAddress.endsWith(".theta")) {

      const address = await tns.getAddress(accountAddress);
      if (address) {
        history.push(`/account/${address}`);
        return;
      }
    }
    this.fetchData(accountAddress, false);
  }
  componentWillUnmount() {
    this._isMounted = false;
  }
  fetchData(address, hasPrice = true) {
    if (validateHex(address, 40)) {
      this.getOneAccountByAddress(address);
      this.getStakeTransactions(address);
      this.fetchTokenBalance(address);
      this.getTokenTransactionsNumber(address);
      if (!hasPrice) this.getPrices();
      this.setSingleTNS(address, "accountTNS");
    } else {
      this.setState({ errorType: 'invalid_address' })
    }
  }
  getSplitPercent(address) {
    rewardDistributionService.getRewardDistributionByAddress(address)
      .then(res => {
        let rewardSplit = get(res, 'data.body.splitBasisPoint') || 0;
        let beneficiary = get(res, 'data.body.beneficiary') || "";
        this.setState({ rewardSplit, beneficiary })
        this.setSingleTNS(beneficiary, "beneficiaryTNS");
      }).catch(err => {
        console.log(err)
      })
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

  getStakeTransactions(address) {
    if (!address) {
      return;
    }
    const self = this;
    stakeService.getStakeByAddress(address)
      .then(res => {
        if (!self._isMounted) return;
        const stakes = get(res, 'data.body');
        let thetaHolderTxs = [], tfuelHolderTxs = [];
        let thetaSourceTxs = [], tfuelSourceTxs = [];
        stakes.holderRecords.forEach(tx => {
          if (tx.type === 'eenp') tfuelHolderTxs.push(tx)
          else thetaHolderTxs.push(tx);
        })
        stakes.sourceRecords.forEach(tx => {
          if (tx.type === 'eenp') tfuelSourceTxs.push(tx)
          else thetaSourceTxs.push(tx);
        })
        if (thetaHolderTxs.length > 0 || tfuelHolderTxs.length > 0) {
          this.getSplitPercent(address);
        }
        this.setStakesTNS(thetaSourceTxs, tfuelSourceTxs, thetaHolderTxs, tfuelHolderTxs);
      })
      .catch(err => {
        console.log(err);
      });
  }
  getTransactionsByAddress(address, types, page = 1) {
    if (!address) {
      return;
    }
    const self = this;
    this.setState({ loading_txns: true });
    transactionsService.getTransactionsByAddress(address, page, NUM_TRANSACTIONS, types)
      .then(res => {
        if (!self._isMounted) return;
        const txs = get(res, 'data.body');
        if (!txs) {
          this.setState({ hasOtherTxs: false, currentPage: 1, totalPages: null, transactions: [] })
          return
        }
        if (txs.length !== 0) {
          this.setState({
            transactions: get(res, 'data.body'),
            currentPage: get(res, 'data.currentPageNumber'),
            totalPages: get(res, 'data.totalPageNumber'),
            loading_txns: false,
          })
          this.setTransactionsTNS(get(res, 'data.body'));
        } else {
          this.setState({ hasOtherTxs: false, loading_txns: false })
        }

      })
      .catch(err => {
        this.setState({ loading_txns: false });
        console.log(err);
      });
  }

  getTokenTransactionsNumber(address) {
    const tokenList = ["TNT-721", "TNT-20", "TFUEL", "XCHAIN_TFUEL", "XCHAIN_TNT20", "XCHAIN_TNT721", "XCHAIN_TNT1155"];
    const self = this;
    for (let name of tokenList) {
      tokenService.getTokenTxsNumByAccountAndType(address, name)
        .then(res => {
          if (!self._isMounted) return;
          const num = get(res, 'data.body.total_number');
          if (num > 0) {
            if (name === 'TNT-721') {
              this.setState({ hasTNT721: true });
            } else if (name === 'TNT-20') {
              this.setState({ hasTNT20: true });
            } else if (name === 'TFUEL') {
              this.setState({ hasInternalTxs: true });
            } else if (name === 'XCHAIN_TFUEL') {
              this.setState({ hasXChainTxs: true });
            } else if (name === "XCHAIN_TNT20") {
              this.setState({ hasXChainTNT20: true });
            } else if (name === "XCHAIN_TNT721") {
              this.setState({ hasXChainTNT721: true });
            } else if (name === "XCHAIN_TNT1155") {
              this.setState({ hasXChainTNT1155: true })
            }
          }
        })
    }
  }
  getOneAccountByAddress(address) {
    if (!address) {
      return;
    }
    const self = this;
    this.setState({ loading_acct: true });
    accountService.getOneAccountByAddress(address)
      .then(res => {
        if (!self._isMounted) return;
        switch (res.data.type) {
          case 'account':
            const txs_counter = get(res, 'data.body.txs_counter');
            let typeOptions = Object.keys(txs_counter).map(k => ({ value: k, label: TxnTypeText[k] }))
            let restOptions = typeOptions.filter(o => o.value !== '5');
            let selectedTypes = restOptions.length > 0 ? restOptions : typeOptions;
            this.setState({
              account: res.data.body,
              errorType: null,
              selectedTypes: selectedTypes,
              typeOptions: typeOptions
            })
            break;
          case 'error_not_found':
            break;
          default:
            break;
        }
        this.setState({
          loading_acct: false, hasDownloadTx: (res.data.body.txs_counter[0]
            || res.data.body.txs_counter[2] || res.data.body.txs_counter[5]) !== undefined
        });
        let types = this.state.selectedTypes.map(o => o.value);
        this.getTransactionsByAddress(address, types, 1);
      }).catch(err => {
        this.setState({ loading_acct: false });
        console.log(err);
      })
  }

  handlePageChange = pageNumber => {
    let { accountAddress } = this.props.match.params;
    let { selectedTypes } = this.state;
    let types = selectedTypes.map(o => o.value);
    this.getTransactionsByAddress(accountAddress, types, pageNumber);
  }

  downloadTrasanctionHistory() {
    const { accountAddress } = this.props.match.params;
    const startDate = (new Date(this.startDateRef.current.value).getTime() / 1000).toString();
    const endDate = (new Date(this.endDateRef.current.value).getTime() / 1000).toString();
    let hasStartDateErr = false, hasEndDateErr = false;
    if (this.startDateRef.current.value === '' || this.endDateRef.current.value === '') {
      if (this.startDateRef.current.value === '') hasStartDateErr = true;
      if (this.endDateRef.current.value === '') hasEndDateErr = true;
      this.setState({ hasStartDateErr, hasEndDateErr })
      return
    }
    this.setState({ isDownloading: true })
    const self = this;
    accountService.getTransactionHistory(accountAddress, startDate, endDate)
      .then(res => {
        if (!self._isMounted) return;
        if (res.status === 200) {
          function convertToCSV(objArray) {
            var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
            var str = '';
            var line = '';
            for (var index in array[0]) {
              if (line != '') line += ','
              line += index;
            }
            str += line + '\r\n';
            for (var i = 0; i < array.length; i++) {
              var line = '';
              for (var index in array[i]) {
                if (line != '') line += ','

                line += array[i][index];
              }

              str += line + '\r\n';
            }
            return str;
          }
          var json = JSON.stringify(res.data.body);
          var csv = convertToCSV(json);
          var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          // var blob = new Blob([json], { type: "application/json" });
          var url = URL.createObjectURL(blob);
          this.download.current.download = 'transactions.csv';
          this.download.current.href = url;
          this.download.current.click();
          this.setState({ isDownloading: false })
        }
      });
  }
  handleInput(type) {
    if (type === 'start') {
      let date = new Date(this.startDateRef.current.value)
      date.setDate(date.getDate() + 7);
      this.endDateRef.current.min = this.startDateRef.current.value;
      let newDate = this.getDate(date);
      this.endDateRef.current.max = newDate < today ? newDate : today;
    } else if (type === 'end') {
      let date = new Date(this.endDateRef.current.value)
      date.setDate(date.getDate() - 7);
      this.startDateRef.current.max = this.endDateRef.current.value;
      this.startDateRef.current.min = this.getDate(date);
    }
    if (type === 'start' && !this.hasStartDateErr) this.setState({ hasStartDateErr: false })
    if (type === 'end' && !this.hasEndDateErr) this.setState({ hasEndDateErr: false })
  }
  getDate(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;
    return year + '-' + month + '-' + day;
  }
  resetInput() {
    this.startDateRef.current.value = '';
    this.startDateRef.current.max = today;
    this.startDateRef.current.min = '';
    this.endDateRef.current.value = '';
    this.endDateRef.current.max = today;
    this.endDateRef.current.min = '';
  }
  handleSelect = (selectedList, selectedItem) => {
    this.setState({
      selectedTypes: selectedList,
      hasRefreshBtn: selectedList.length > 0 ? true : false
    })
  }
  handleTxsRefresh = () => {
    const { accountAddress } = this.props.match.params;
    const { selectedTypes } = this.state;
    const types = selectedTypes.map(o => o.value);
    this.getTransactionsByAddress(accountAddress, types, 1);
    this.setState({ hasRefreshBtn: false });
  }
  setTabIndex = index => {
    let tabName = this.state.tabNames[index];
    this.setState({ tabIndex: index })
    history.replace(`#${tabName}`);
  }
  setHasToken = hasToken => {
    this.setState({ hasToken });
  }
  fetchTokenBalance = async (accountAddress) => {
    const tokenMap = {
      // TDrop: '0x1336739B05C7Ab8a526D40DCC0d04a826b5f8B03', //address for mainnet
      TDrop: '0x08a0c0e8EFd07A98db11d79165063B6Bc2469ADF', //address for testnet
      WTFuel: '0x4dc08b15ea0e10b96c41aec22fab934ba15c983e',
      TBill: '0x22Cb20636c2d853DE2b140c2EadDbFD6C3643a39'
    }
    const decimalsMap = {
      'TBill': 9,
      'WTFuel': 18,
      'TDrop': 18
    }
    let keys = Object.keys(tokenMap);
    let tokenBalance = this.state.tokenBalance;
    const self = this;
    for (let key of keys) {
      let balanceBN = await fetchBalanceByAddress(tokenMap[key], accountAddress);
      let balance = balanceBN.toString();
      tokenBalance[key] = balance;
      const MIN_DISPLAY_VALUE = new BigNumber(10).exponentiatedBy(decimalsMap[key] - 2);

      if (new BigNumber(balance).gt(MIN_DISPLAY_VALUE)) {
        if (!self._isMounted) return;
        this.setState({ tokenBalance })
        if (!this.state.hasToken) {
          this.setState({ hasToken: true })
        }
      }
    }
  }
  handleHashScroll = () => {
    let tabName = this.props.location.hash.replace("#", "").split('-')[0];
    if (tabName && this.tabRef && scrollTimes < maxScrollTimes) {
      setTimeout(() => this.tabRef.scrollIntoView({ behavior: "smooth" }));
      scrollTimes++;
    }
  }
  render() {
    const { account, transactions, currentPage, totalPages, errorType, loading_txns, tokenBalance,
      hasOtherTxs, hasThetaStakes, hasTfuelStakes, thetaHolderTxs, hasDownloadTx, thetaSourceTxs,
      tfuelHolderTxs, tfuelSourceTxs, price, hasStartDateErr, hasEndDateErr, isDownloading, hasRefreshBtn,
      typeOptions, rewardSplit, beneficiary, tabIndex, hasTNT20, hasTNT721, hasToken, hasInternalTxs,
      hasXChainTxs, hasXChainTNT20, hasXChainTNT721, hasXChainTNT1155, accountTNS, beneficiaryTNS, selectedTypes } = this.state;
    const { accountAddress } = this.props.match.params;
    const { location } = this.props;
    const hasIntraChainTxn = hasInternalTxs || hasTNT20 || hasTNT721;
    const hasXChainTxn = hasXChainTxs || hasXChainTNT20 || hasXChainTNT721 || hasXChainTNT1155;
    return (
      <div className="content account">
        <div className="page-title account">Account Detail</div>
        {errorType === 'invalid_address' &&
          // <NotExist msg="Note: An account will not be created until the first time it receives some tokens." />
          <NotExist msg="Note: Invalid address." />}
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
                {accountTNS && <DetailsRow label="TNS" data={accountTNS} />}
                <DetailsRow label="Balance" data={<Balance balance={account.balance} price={price} />} />
                <DetailsRow label="Sequence" data={account.sequence} />
                {hasToken && <DetailsRow label="Token" data={<Token tokenBalance={tokenBalance} />} />}
                {((hasThetaStakes && thetaHolderTxs.length > 0) || (hasTfuelStakes && tfuelHolderTxs.length > 0)) &&
                  <DetailsRow label="Reward Split" data={rewardSplit / 100 + '%'} />}
                {rewardSplit !== 0 && <DetailsRow label="Beneficiary" data={<AddressTNS hash={beneficiary} tns={beneficiaryTNS} />} />}
              </tbody>
            </table>
          </React.Fragment>}
        {hasThetaStakes &&
          <div className="stake-container">
            {thetaSourceTxs.length > 0 && <StakeTxsTable type='source' stakeCoinType='theta' txs={thetaSourceTxs} price={price} />}
            {thetaHolderTxs.length > 0 && <StakeTxsTable type='holder' stakeCoinType='theta' txs={thetaHolderTxs} price={price} />}
          </div>
        }
        {hasTfuelStakes &&
          <div className="stake-container">
            {tfuelSourceTxs.length > 0 && <StakeTxsTable type='source' stakeCoinType='tfuel' txs={tfuelSourceTxs} price={price} />}
            {tfuelHolderTxs.length > 0 && <StakeTxsTable type='holder' stakeCoinType='tfuel' txs={tfuelHolderTxs} price={price} />}
          </div>
        }
        <TDropStakeTable address={accountAddress} />
        <div ref={e => { this.tabRef = e }}></div>
        <Tabs className="theta-tabs" selectedIndex={tabIndex} onSelect={this.setTabIndex}>
          <TabList>
            {/* {transactions && transactions.length > 0 && <Tab>Transactions</Tab>} */}
            {(transactions && transactions.length > 0 || hasIntraChainTxn) && <Tab>Intra-Chain Txns</Tab>}
            {hasXChainTxn && <Tab>Cross-Chain Txns</Tab>}
            {account.code && account.code !== '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470' &&
              <Tab>Contract</Tab>
            }
          </TabList>
          {(transactions && transactions.length > 0 || hasIntraChainTxn) && <TabPanel>
            <TxsTab type='intraChain' hasTxs={hasInternalTxs} hasTNT20={hasTNT20} hasTNT721={hasTNT721}
              address={account.address} handleHashScroll={this.handleHashScroll} location={location} hasTransaction={transactions && transactions.length > 0}
              txProps={{
                currentPage, totalPages, loading_txns, hasOtherTxs, hasDownloadTx, hasStartDateErr, hasEndDateErr, isDownloading,
                hasRefreshBtn, typeOptions, transactions, selectedTypes, account, price,
                startDate: this.startDateRef,
                endDate: this.endDateRef,
                handleInput: this.handleInput,
                resetInput: this.resetInput,
                downloadTrasanctionHistory: this.downloadTrasanctionHistory,
                download: this.download,
                handleTxsRefresh: this.handleTxsRefresh,
                handlePropSelect: this.handleSelect,
                handlePageChange: this.handlePageChange
              }} />
          </TabPanel>}
          {hasXChainTxn && <TabPanel>
            <TxsTab type='xChain' hasTxs={hasXChainTxs} hasTNT20={hasXChainTNT20} hasTNT721={hasXChainTNT721}
              hasTNT1155={hasXChainTNT1155} address={account.address} handleHashScroll={this.handleHashScroll}
              location={location} txProps={{}} />
          </TabPanel>}
          {account.code && account.code !== '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470' &&
            <TabPanel>
              <SmartContract address={account.address} handleHashScroll={this.handleHashScroll} urlHash={location.hash} />
            </TabPanel>
          }
        </Tabs>
      </div >);
  }
}

const Balance = ({ balance, price }) => {
  return (
    <div className="act balance">
      {map(balance, (v, k) => <div key={k} className={cx("currency", k)}>
        {`${formatCoin(v)} ${CurrencyLabels[k] || k}`}
        <div className='price'>{`[\$${priceCoin(v, price[CurrencyLabels[k]])} USD]`}</div>
      </div>)}
    </div>)
}

const Token = ({ tokenBalance }) => {
  const tokenMap = {
    // TDrop: '0x1336739B05C7Ab8a526D40DCC0d04a826b5f8B03', //address for mainnet
    TDrop: '0x08a0c0e8EFd07A98db11d79165063B6Bc2469ADF', //address for testnet
    WTFuel: '0x4dc08b15ea0e10b96c41aec22fab934ba15c983e',
    TBill: '0x22Cb20636c2d853DE2b140c2EadDbFD6C3643a39'
  }
  const decimalsMap = {
    'TBill': 9,
    'WTFuel': 18,
    'TDrop': 18
  }
  return (
    <div className="act balance">
      {map(tokenBalance, (v, k) => {
        const isZero = v === '0';
        return !isZero && <div key={k} className={cx("currency", k.toLowerCase())}>
          {`${formatQuantity(v, decimalsMap[k], 2)}`}
          {k === 'TBill' ? <span className="text-disabled currency-link">{CurrencyLabels[k] || k}</span>
            : <Link className="currency-link" to={`/token/${tokenMap[k]}`}>{CurrencyLabels[k] || k}</Link>}
        </div>
      })}
    </div>)
}

const AddressTNS = ({ hash, tns }) => {
  if (tns) {
    return (
      <div className="value tooltip">
        <div className="tooltip--text">
          <p>{tns}</p>
          <p>({hash})</p>
        </div>
        <Link to={`/account/${hash}`}>{tns}</Link>
      </div>);
  }
  return (<Link to={`/account/${hash}`}>{hash}</Link>)
}


const TokenTab = React.memo(props => {
  const { type, address, handleHashScroll } = props;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [tokenMap, setTokenMap] = useState({});
  const isMountedRef = useIsMountedRef();

  useEffect(() => {
    fetchTokenTransactions(address, type, currentPage);
  }, [type, address])

  const handlePageChange = pageNumber => {
    fetchTokenTransactions(address, type, pageNumber);
  }

  const setTokensTNS = async (transactions) => {
    const uniqueAddresses = arrayUnique(
      transactions.map((x) => x.from)
        .concat(transactions.map((x) => x.to))
    );
    try {
      const domainNames = await tns.getDomainNames(uniqueAddresses);
      transactions.map((transaction) => {
        transaction.fromTns = transaction.from ? domainNames[transaction.from] : null;
        transaction.toTns = transaction.to ? domainNames[transaction.to] : null;
      });
    } catch (e) {
      console.log('error in getDomainNames:', e.message);
    }
    if (!isMountedRef.current) return;
    setTransactions(transactions);
  }


  const fetchTokenTransactions = (address, type, page) => {
    tokenService.getTokenTxsByAccountAndType(address, type, page, NUM_TRANSACTIONS)
      .then(res => {
        if (!isMountedRef.current) return;
        let txs = res.data.body;
        txs = txs.sort((a, b) => b.timestamp - a.timestamp);
        setTotalPages(res.data.totalPageNumber);
        setCurrentPage(res.data.currentPageNumber);
        setLoadingTxns(false);
        setTokensTNS(txs);
        let addressSet = new Set();
        txs.forEach(tx => {
          if (tx.contract_address) {
            addressSet.add(tx.contract_address);
          }
        })
        if (addressSet.size === 0) {
          return;
        }
        tokenService.getTokenInfoByAddressList([...addressSet])
          .then(res => {
            if (!isMountedRef.current) return;
            let infoList = get(res, 'data.body') || [];
            let map = {};
            infoList.forEach(info => {
              map[info.contract_address] = {
                name: info.name,
                decimals: info.decimals
              }
            })
            setTokenMap(map);
          })
          .catch(e => console.log(e.message))
      })
      .catch(e => {
        setLoadingTxns(false);
      })
  }

  return <>
    <div>
      {loadingTxns &&
        <LoadingPanel className="fill" />}
      {!loadingTxns && <TokenTxsTable transactions={transactions} type={type} address={address} tokenMap={tokenMap} handleHashScroll={handleHashScroll} />}
    </div>
    <Pagination
      size={'lg'}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      disabled={loadingTxns} />
  </>
})

const TxsTab = React.memo(props => {
  const { type, hasTransaction, hasTxs, hasTNT20, hasTNT721, hasTNT1155, address, handleHashScroll, location, txProps } = props;
  const { currentPage, totalPages, loading_txns, hasOtherTxs, hasDownloadTx, hasStartDateErr, hasEndDateErr, isDownloading,
    hasRefreshBtn, typeOptions, transactions, startDate, endDate, handleInput, resetInput, downloadTrasanctionHistory,
    download, handleTxsRefresh, handlePropSelect, selectedTypes, account, price, handlePageChange } = txProps;
  const [tabIndex, setTabIndex] = useState(0);
  const [tabNames, setTabNames] = useState([]);

  useEffect(() => {
    let names = [];
    if (hasTransaction) {
      names.push('Transactions');
    }
    if (hasTxs) {
      names.push(type === 'intraChain' ? 'InternalTxns' : 'TFuelTxns');
    }
    if (hasTNT20) {
      names.push(type === 'intraChain' ? 'TNT20TokenTxns' : 'CrossChainTNT20Txns');
    }
    if (hasTNT721) {
      names.push(type === 'intraChain' ? 'TNT721TokenTxns' : 'CrossChainTNT721Txns');
    }

    if (hasTNT1155) {
      names.push(type === 'intraChain' ? 'TNT1155TokenTxns' : 'CrossChainTNT1155Txns')
    }

    let tabName = location.hash.replace("#", "").split('-')[1];
    let tabIndex = names.indexOf(tabName) === -1 ? 0 : names.indexOf(tabName);
    setTabNames(names);
    setTabIndex(tabIndex);
  }, [type, hasTxs, hasTNT20, hasTNT721])
  const handleSelect = index => {
    let tabName = tabNames[index];
    setTabIndex(index);
    const prefix = type === 'intraChain' ? "IntraChainTxns" : "CrossChainTxns";
    history.replace(`#${prefix}-${tabName}`);
  }

  return <Tabs className="theta-tabs" selectedIndex={tabIndex} onSelect={handleSelect}>
    <TabList>
      {hasTransaction && <Tab>Transactions</Tab>}
      {hasTxs && <Tab>{type === 'intraChain' ? 'Internal Txns' : 'TFuel Txns'}</Tab>}
      {hasTNT20 && <Tab>TNT20 Token Txns</Tab>}
      {hasTNT721 && <Tab>TNT721 Token Txns</Tab>}
      {hasTNT1155 && <Tab>TNT1155 Token Txns</Tab>}
    </TabList>
    {hasTransaction && transactions && transactions.length > 0 && <TabPanel>
      {!transactions && loading_txns &&
        <LoadingPanel />}
      {transactions && transactions.length > 0 &&
        <>
          <div className="actions">
            {hasDownloadTx && <Popup trigger={<div className="download btn tx export">Export Transaction History (CSV)</div>} position="right center">
              <>
                <div className="popup-row header">Choose the time period. Must within 7 days.</div>
                <div className="popup-row">
                  <div className="popup-label">Start Date:</div>
                  <input className="popup-input" type="date" ref={startDate} onChange={() => handleInput('start')} max={today}></input>
                </div>
                <div className={cx("popup-row err-msg", { 'disable': !hasStartDateErr })}>Input Valid Start Date</div>
                <div className="popup-row">
                  <div className="popup-label">End Date: </div>
                  <input className="popup-input" type="date" ref={endDate} onChange={() => handleInput('end')} max={today}></input>
                </div>
                <div className={cx("popup-row err-msg", { 'disable': !hasEndDateErr })}>Input Valid End Date</div>
                <div className="popup-row buttons">
                  <div className={cx("popup-reset", { disable: isDownloading })} onClick={resetInput}>Reset</div>
                  <div className={cx("popup-download export", { disable: isDownloading })} onClick={downloadTrasanctionHistory}>Download</div>
                  <div className={cx("popup-downloading", { disable: !isDownloading })}>Downloading......</div>
                </div>
              </>
            </Popup>}
            <a ref={download}></a>
            {hasOtherTxs &&
              <div className="filter">
                {hasRefreshBtn && <span className="refresh" onClick={handleTxsRefresh}>&#x21bb;</span>}
                Display
                <Multiselect
                  options={typeOptions || TypeOptions} // Options to display in the dropdown
                  displayValue="label" // Property name to display in the dropdown options
                  style={{
                    multiselectContainer: { width: "200px", marginLeft: '5px', marginRight: '5px' },
                    searchBox: { maxHeight: '35px', overflow: 'hidden', padding: 0 },
                    optionContainer: { background: '#1b1f2a' },
                    inputField: { margin: 0, height: '100%', width: '100%' },
                    chips: { display: 'none' }
                  }}
                  onSelect={handlePropSelect}
                  onRemove={handlePropSelect}
                  closeOnSelect={false}
                  showCheckbox={true}
                  avoidHighlightFirstOption={true}
                  placeholder={`${selectedTypes.length} selected types`}
                  selectedValues={selectedTypes}
                />
                Txs
              </div>
            }

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
            onPageChange={handlePageChange}
            disabled={loading_txns} />
        </>}
    </TabPanel>}
    {hasTxs && <TabPanel>
      <TokenTab type={type === 'intraChain' ? "TFUEL" : "XCHAIN_TFUEL"} address={address} handleHashScroll={handleHashScroll} />
    </TabPanel>}
    {hasTNT20 && <TabPanel>
      <TokenTab type={type === 'intraChain' ? "TNT-20" : "XCHAIN_TNT20"} address={address} handleHashScroll={handleHashScroll} />
    </TabPanel>}
    {hasTNT721 && <TabPanel>
      <TokenTab type={type === 'intraChain' ? "TNT-721" : "XCHAIN_TNT721"} address={address} handleHashScroll={handleHashScroll} />
    </TabPanel>}
    {hasTNT1155 && <TabPanel>
      <TokenTab type={type === 'intraChain' ? "TNT-1155" : "XCHAIN_TNT1155"} address={address} handleHashScroll={handleHashScroll} />
    </TabPanel>}
  </Tabs>
})