import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import _truncate from 'lodash/truncate'
import BigNumber from 'bignumber.js';

import { formatCoin } from 'common/helpers/utils';
import { useIsMountedRef } from 'common/helpers/hooks';
import { CommonFunctionABIs, TDropStakingAddress } from 'common/constants';
import { ethers } from "ethers";
import smartContractApi from 'common/services/smart-contract-api';
import Theta from 'libs/Theta';
import ThetaJS from 'libs/thetajs.esm';
import get from 'lodash/get';
import map from 'lodash/map';
import Config from '../../config';

const MIN_DISPLAY_VALUE = new BigNumber(10).exponentiatedBy(18 - 2);
const TRUNCATE = window.screen.width <= 560 ? 10 : 35;
const contractAddress = TDropStakingAddress[Config.defaultThetaChainID];

const TDropStakeTable = React.memo(({ address }) => {
  const isMountedRef = useIsMountedRef();
  const [balance, setBalance] = useState(0);
  useEffect(() => {

    fetchBalance();

    async function fetchBalance() {
      let balance = await fetchData(CommonFunctionABIs.estimatedTDropOwnedBy, [address],
        [CommonFunctionABIs.estimatedTDropOwnedBy], contractAddress);
      if (!isMountedRef.current) return;
      setBalance(balance);
    }

    async function fetchData(functionData, inputValues, abi, address) {
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
          from: address,
          to: address,
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
        let balance = abiCoder.decode(outputTypes, outputValues)[0];
        return balance.toString();
      } catch (e) {
        console.log('error occurs:', e);
      }
    }
  }, [address])

  return new BigNumber(balance).gt(MIN_DISPLAY_VALUE) && <div className="stake-container">
    <div className="stakes">
      <div className="title">TDROP TOKENS STAKED BY THIS ADDRESS TO TDROP STAKING CONTRACT</div>
      <table className="data">
        <thead>
          <tr>
            <th className="tdrop-token">TOKENS STAKED + REWARD (est.)</th>
            <th className="address">TO CONTRACT</th>
            <th className="status">STATUS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="tdrop-token"><div className="currency tdrop left">{`${formatCoin(balance)} TDrop`}</div></td>
            <td className="address">
              <Link to={`/account/${contractAddress}`}>
                {_truncate(contractAddress, { length: TRUNCATE })}(TDrop Staking)
              </Link>
            </td>
            <td className="status">Staked</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
})

export default TDropStakeTable;