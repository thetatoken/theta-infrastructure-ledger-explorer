import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { tokenService } from 'common/services/token';
import NotExist from 'common/components/not-exist';
import DetailsRow from 'common/components/details-row';
import LoadingPanel from 'common/components/loading-panel';
import TokenTxsTable from "common/components/token-txs-table";
import Pagination from "common/components/pagination";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { smartContractService } from 'common/services/smartContract';
import ReadContract from 'common/components/read-contract';
import Item from 'common/components/tnt721-item';

const NUM_TRANSACTIONS = 20;

const TokenDetails = ({ match, location }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [tokenInfo, setTokenInfo] = useState({});
  const [tokenId, setTokenId] = useState();
  const [errorType, setErrorType] = useState();
  const [transactions, setTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [abi, setAbi] = useState([]);
  const [holders, setHolders] = useState([]);

  useEffect(() => {
    const { contractAddress } = match.params;
    const search = location.search; // could be '?foo=bar'
    const params = new URLSearchParams(search);
    const tId = params.get('a');
    setTokenId(tId)
    fetchInfo();
    fetchTransactions(contractAddress, tId, currentPage);
    if (tId != null) {
      smartContractService.getAbiByAddress(contractAddress.toLowerCase())
        .then(result => {
          if (result.data.type === 'smart_contract_abi') {
            setAbi(result.data.body.abi);
          }
        })
    }

    function fetchInfo() {
      tokenService.getTokenInfoByAddressAndTokenId(contractAddress, tId)
        .then(res => {
          setTokenInfo(res.data.body);
        })
        .catch(console.log)
    }

  }, [match.params.contractAddress, location.search])

  const handlePageChange = (pageNumber) => {
    let { contractAddress } = match.params;
    fetchTransactions(contractAddress, tokenId, pageNumber);
  }

  function fetchTransactions(contractAddress, tId, page = 1) {
    setLoadingTxns(true);
    tokenService.getTokenTxsByAddressAndTokenId(contractAddress, tId, page, NUM_TRANSACTIONS)
      .then(res => {
        let txs = res.data.body;
        txs = txs.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(txs);
        setTotalPages(res.data.totalPageNumber);
        setCurrentPage(res.data.currentPageNumber);
        setLoadingTxns(false);
      })
      .catch(e => {
        setLoadingTxns(false);
      })
  }

  return (
    <div className="content token">
      <div className="page-title account">Token Detail</div>
      {errorType === 'invalid_address' &&
        // <NotExist msg="Note: An account will not be created until the first time it receives some tokens." />
        <NotExist msg="Note: Invalid address." />}
      {tokenInfo && !errorType &&
        <>
          <table className="details token-info">
            <thead>
              <tr>
                <th>Contract</th>
                <th>
                  <Link to={`/account/${match.params.contractAddress}`}>{match.params.contractAddress}</Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {tokenId == null && <>
                <DetailsRow label="Name" data={tokenInfo.name} />
                <DetailsRow label="Type" data={tokenInfo.type} />
                <DetailsRow label="Max Total Supply" data={tokenInfo.max_total_supply} />
                <DetailsRow label="Holders" data={tokenInfo.holders} />
                <DetailsRow label="Transfers" data={tokenInfo.total_transfers} />
              </>}
              {tokenId != null && <>
                {transactions && transactions.length > 0 && <DetailsRow label="Name" data={transactions[0].name} />}
                <DetailsRow label="Token Id" data={tokenId} />
                <DetailsRow label="Transfers" data={transactions.length} />
              </>}
            </tbody>
          </table>
        </>}
      {!transactions && loadingTxns &&
        <LoadingPanel />}
      {transactions && transactions.length > 0 && tokenId != null && <div className="wrap">
        <div className="details-header item">
          <div className="txn-type items">Item</div>
        </div>
        <div className="details item">
          <Item tokenId={tokenId} abi={abi} address={match.params.contractAddress} />
        </div>
      </div>}
      {transactions && transactions.length > 0 &&
        <div className="wrap">
          <Tabs className="theta-tabs" selectedIndex={tabIndex} onSelect={setTabIndex}>
            <TabList>
              <Tab>Transactions</Tab>
              <Tab disabled>Holders</Tab>
              <Tab>Read Contract</Tab>
              <Tab disabled>Write Contract</Tab>
            </TabList>

            <TabPanel>
              <div>
                {loadingTxns &&
                  <LoadingPanel className="fill" />}
                <TokenTxsTable transactions={transactions} type={tokenInfo.type} tabType="token" />
              </div>
              <Pagination
                size={'lg'}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                disabled={loadingTxns} />
            </TabPanel>
            <TabPanel>
              <Holders holders={holders} />
            </TabPanel>
            <TabPanel>
              <ReadContract address={match.params.contractAddress} />
            </TabPanel>
            <TabPanel>
              <h2>Write Contract</h2>
            </TabPanel>
          </Tabs>
        </div>}

    </div>
  );
}

const Holders = (props) => {
  const { holders } = props;
  return <div>Holders template</div>
}

export default TokenDetails;