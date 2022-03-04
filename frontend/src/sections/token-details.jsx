import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { validateHex, formatQuantity } from 'common/helpers/utils';
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
import HolderTable from 'common/components/holder-table';
import { ethers } from "ethers";
import smartContractApi from 'common/services/smart-contract-api';
import Theta from 'libs/Theta';
import ThetaJS from 'libs/thetajs.esm';
import get from 'lodash/get';
import map from 'lodash/map';
import cx from 'classnames';
import { useIsMountedRef } from 'common/helpers/hooks';
import { arrayUnique } from 'common/helpers/tns';
import tns from 'libs/tns';


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
  const [item, setItem] = useState();
  const isMountedRef = useIsMountedRef();

  useEffect(() => {
    const { contractAddress } = match.params;
    if (!validateHex(contractAddress, 40)) {
      setErrorType("invalid_address");
      return;
    }
    const search = location.search; // could be '?foo=bar'
    const params = new URLSearchParams(search);
    const tId = params.get('a');
    setTokenId(tId)
    fetchInfo();
    fetchTransactions(contractAddress, tId, currentPage);
    fetchHolders(contractAddress, tId);
    if (tId != null) {
      smartContractService.getAbiByAddress(contractAddress.toLowerCase())
        .then(result => {
          if (result.data.type === 'smart_contract_abi') {
            if (!isMountedRef.current) return;
            setAbi(result.data.body.abi || []);
          }
        })
    }

    function fetchInfo() {
      tokenService.getTokenInfoByAddressAndTokenId(contractAddress, tId)
        .then(res => {
          if (!isMountedRef.current) return;
          if (res.data.type === "error_not_found") {
            setErrorType("error_not_found");
            return;
          }
          if (tId != null && get(res, 'data.body.total_transfers') === 0) {
            setErrorType("error_not_found");
            return;
          }
          setTokenInfo(res.data.body);
        })
        .catch(console.log)
    }

  }, [match.params.contractAddress, location.search])

  const handlePageChange = (pageNumber) => {
    let { contractAddress } = match.params;
    fetchTransactions(contractAddress, tokenId, pageNumber);
  }

  const setTransactionsTNS = async (transactions) => {
    const uniqueAddresses = arrayUnique(
      transactions.map((x) => x.from)
        .concat(transactions.map((x) => x.to))
    );
    const domainNames = await tns.getDomainNames(uniqueAddresses);
    transactions.map((tx) => {
      tx.fromTns = tx.from ? domainNames[tx.from] : null;
      tx.toTns = tx.to ? domainNames[tx.to] : null;
    });
    setTransactions(transactions);
    setLoadingTxns(false);
  }

  function fetchTransactions(contractAddress, tId, page = 1) {
    setLoadingTxns(true);
    tokenService.getTokenTxsByAddressAndTokenId(contractAddress, tId, page, NUM_TRANSACTIONS)
      .then(res => {
        if (!isMountedRef.current) return;
        let txs = res.data.body;
        txs = txs.sort((a, b) => b.timestamp - a.timestamp);
        setTransactionsTNS(txs)
        setTotalPages(res.data.totalPageNumber);
        setCurrentPage(res.data.currentPageNumber);
      })
      .catch(e => {
        setLoadingTxns(false);
      })
  }

  function fetchHolders(address, tokenId) {
    tokenService.getHoldersByAccountAndTokenId(address, tokenId)
      .then(res => {
        if (!isMountedRef.current) return;
        if (res.data.type === "error_not_found") {
          return;
        }
        let h = get(res, 'data.body.holders').sort((a, b) => b.amount - a.amount || a.address - b.address);
        setHolders(h)
      })
  }

  useEffect(() => {
    if (tokenId === undefined) return;
    const arr = abi.filter(obj => obj.name == "tokenURI" && obj.type === 'function');
    if (arr.length === 0) return;
    const { contractAddress } = match.params;
    const functionData = arr[0];
    const inputValues = [tokenId]

    async function fetchUrl() {
      const iface = new ethers.utils.Interface(abi || []);
      const senderSequence = 1;
      const functionInputs = get(functionData, ['inputs'], []);
      const functionOutputs = get(functionData, ['outputs'], []);
      const functionSignature = iface.getSighash(functionData.name)

      const inputTypes = map(functionInputs, ({ name, type }) => {
        return type;
      });
      try {
        var abiCoder = new ethers.utils.AbiCoder();
        var encodedParameters = abiCoder.encode(inputTypes, inputValues).slice(2);;
        const gasPrice = Theta.getTransactionFee(); //feeInTFuelWei;
        const gasLimit = 2000000;
        const data = functionSignature + encodedParameters;
        const tx = Theta.unsignedSmartContractTx({
          from: contractAddress,
          to: contractAddress,
          data: data,
          value: 0,
          transactionFee: gasPrice,
          gasLimit: gasLimit
        }, senderSequence);
        const rawTxBytes = ThetaJS.TxSigner.serializeTx(tx);
        const callResponse = await smartContractApi.callSmartContract({ data: rawTxBytes.toString('hex').slice(2) }, { network: Theta.chainId });
        const callResponseJSON = await callResponse.json();
        const result = get(callResponseJSON, 'result');
        let outputValues = get(result, 'vm_return');
        const outputTypes = map(functionOutputs, ({ name, type }) => {
          return type;
        });
        outputValues = /^0x/i.test(outputValues) ? outputValues : '0x' + outputValues;
        let url = abiCoder.decode(outputTypes, outputValues)[0];
        if (/^http:\/\/(.*)api.thetadrop.com.*\.json(\?[-a-zA-Z0-9@:%._\\+~#&//=]*){0,1}$/g.test(url) && typeof url === "string") {
          url = url.replace("http://", "https://")
        }
        const isImage = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|svg)/g.test(url);
        if (!isMountedRef.current) return;
        if (isImage) {
          setItem({ image: url });
        } else {
          fetch(url)
            .then(res => res.json())
            .then(data => {
              if (!isMountedRef.current) return;
              setItem(data);
            }).catch(e => {
              console.log('error occurs in fetch url:', e)
              setItem('Error occurs')
            })
        }
      }
      catch (e) {
        console.log('error occurs:', e);
        setItem('Error occurs')
      }
    }
    fetchUrl();
  }, [tokenId, abi, match.params.contractAddress])
  let name = get(item, 'name') || get(transactions[0], 'name');
  return (
    <div className="content token">
      <div className="page-title account">Token Detail</div>
      {errorType === 'invalid_address' &&
        <NotExist msg="Note: Invalid address." />}
      {errorType === "error_not_found" &&
        <NotExist />}
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
                <DetailsRow label="Name" data={<TokenName info={tokenInfo} />} />
                <DetailsRow label="Type" data={tokenInfo.type} />
                <DetailsRow label="Total Supply" data={formatQuantity(tokenInfo.max_total_supply, tokenInfo.decimals, 4)} />
                <DetailsRow label="Holders" data={tokenInfo.holders} />
                <DetailsRow label="Transfers" data={tokenInfo.total_transfers} />
              </>}
              {tokenId != null && <>
                {name && <DetailsRow label="Name" data={name} />}
                <DetailsRow label="Token Id" data={tokenId} />
                <DetailsRow label="Transfers" data={transactions.length} />
              </>}
            </tbody>
          </table>
        </>}
      {!transactions && loadingTxns &&
        <LoadingPanel />}
      {tokenInfo && !errorType && transactions && transactions.length > 0 && tokenId != null && <div className="wrap">
        <div className="details-header item">
          <div className="txn-type items">Item</div>
        </div>
        <div className="details item">
          <Item item={item} />
        </div>
      </div>}
      {tokenInfo && !errorType && transactions && transactions.length > 0 &&
        <div className="wrap">
          <Tabs className="theta-tabs" selectedIndex={tabIndex} onSelect={setTabIndex}>
            <TabList>
              <Tab>Transactions</Tab>
              {/* <Tab>Holders</Tab> */}
              <Tab>Read Contract</Tab>
              <Tab disabled>Write Contract</Tab>
            </TabList>

            <TabPanel>
              <div>
                {loadingTxns &&
                  <LoadingPanel className="fill" />}
                <TokenTxsTable transactions={transactions} type={tokenInfo.type} tabType="token"
                  tokenMap={{ [tokenInfo.contract_address]: { name: tokenInfo.name, decimals: tokenInfo.decimals } }} />
              </div>
              <Pagination
                size={'lg'}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                disabled={loadingTxns} />
            </TabPanel>
            {/* <TabPanel>
              <HolderTable holders={holders} totalSupply={tokenInfo.max_total_supply} />
            </TabPanel> */}
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

const TokenName = ({ info }) => {
  return <div className={cx({ 'currency tdrop': info.name === 'TDrop Token' })}>
    {info.name}{info.type === 'TNT-20' && info.symbol && `  (${info.symbol})`}
  </div>
}
export default TokenDetails;