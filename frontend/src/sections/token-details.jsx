import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { tokenService } from 'common/services/token';
import NotExist from 'common/components/not-exist';
import DetailsRow from 'common/components/details-row';
import LoadingPanel from 'common/components/loading-panel';
import TokenTxsTable from "common/components/token-txs-table";
import Pagination from "common/components/pagination";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import ReadContract from 'common/components/read-contract';

const TokenDetails = ({ match, location }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [tokenInfo, setTokenInfo] = useState({});
  const [tokenId, setTokenId] = useState();
  const [errorType, setErrorType] = useState();
  const [transactions, setTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState('TNT-721');

  useEffect(() => {
    const { contractAddress } = match.params;
    console.log(location.search)
    const search = location.search; // could be '?foo=bar'
    const params = new URLSearchParams(search);
    const tId = params.get('a');
    setTokenId(tId)
    console.log(contractAddress)
    fetchInfo();
    fetchTransactions();
    //TODO: Add type field in token info
    if (contractAddress === '0x34514a670022f7c8fc2beed94a92db7defc60974' && type === 'TNT-721') {
      setType('TNT-20')
    }
    function fetchTransactions() {
      tokenService.getTokenTxsByAddressAndTokenId(contractAddress, tId)
        .then(res => {
          console.log(res)
          if (res.status === 200 && res.data.type === 'token_info') {
            console.log('setting', res.data.body)
            let txs = res.data.body;
            txs = txs.sort((a, b) => b.timestamp - a.timestamp);
            setTransactions(res.data.body)
          }
        })
        .catch(e => console.log('e:', e))
    }

    function fetchInfo() {
      tokenService.getTokenInfoByAddressAndTokenId(contractAddress, tId)
        .then(res => {
          console.log(res)
          if (res.status === 200 && res.data.type === 'token_info') {
            console.log('setting', res.data.body)
            setTokenInfo(res.data.body)
          }
        })
        .catch(e => console.log('e:', e))
    }
  }, [match.params.contractAddress, location.search])

  const handlePageChange = () => {
    console.log('handle')
  }

  console.log('txs:', transactions)
  return (
    <div className="content account">
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
                <DetailsRow label="Type" data={type} />
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
      {transactions && transactions.length > 0 &&
        <React.Fragment>
          <Tabs className="theta-tabs" selectedIndex={tabIndex} onSelect={setTabIndex}>
            <TabList>
              <Tab>Transactions</Tab>
              <Tab>Read Contract</Tab>
              <Tab disabled>Write Contract</Tab>
            </TabList>

            <TabPanel>
              <div>
                {loadingTxns &&
                  <LoadingPanel className="fill" />}
                <TokenTxsTable transactions={transactions} type={type} />
              </div>
              <Pagination
                size={'lg'}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                disabled={loadingTxns} />
            </TabPanel>
            <TabPanel>
              <ReadContract address={match.params.contractAddress} />
            </TabPanel>
            <TabPanel>
              <h2>Write Contract</h2>
            </TabPanel>
          </Tabs>
        </React.Fragment>}

    </div>
  );
}

export default TokenDetails;