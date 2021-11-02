import React, { useState, useRef, useEffect } from "react";
import get from 'lodash/get';
import map from 'lodash/map';
import merge from 'lodash/merge';
import { ethers } from "ethers";
import smartContractApi from 'common/services/smart-contract-api';
import { smartContractService } from 'common/services/smartContract';
import Theta from '../../libs/Theta';
import ThetaJS from '../../libs/thetajs.esm'

export default function ReadContract(props) {
  const { address } = props;
  const [abi, setAbi] = useState(props.abi);
  useEffect(() => {
    if (abi != null) return;
    // fetch abi if needed
    smartContractService.getAbiByAddress(address.toLowerCase())
      .then(result => {
        if (result.data.type === 'smart_contract_abi') {
          setAbi(result.data.body.abi.filter(isReadFunction))
        }
      })
  }, [abi, address])
  const isReadFunction = (functionData) => {
    const constant = get(functionData, ['constant'], null);
    const stateMutability = get(functionData, ['stateMutability'], null);
    return (stateMutability === "view" || stateMutability === "pure" || constant === true);
  }
  return (<div>
    {abi && abi.map((data, i) => {
      return (<FunctionUnit key={i} functionData={data} index={i + 1} address={address} abi={abi}>{JSON.stringify(data)}</FunctionUnit>)
    })}
  </div>)
}

const FunctionUnit = (props) => {
  const { functionData, index, address, abi } = props;
  const inputs = get(functionData, 'inputs');
  const outputs = get(functionData, 'outputs');
  const [callResult, setCallResult] = useState(null);
  const [inputValues, setInputValues] = useState(new Array(inputs.length));
  const decodedParameters = get(callResult, 'decodedParameters');
  const hasInput = inputs.length > 0 || false;
  const vm_error = get(callResult, 'vm_error');

  async function fetchFunction() {
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
      setCallResult(merge(result, {
        outputs: functionOutputs,
        decodedParameters: abiCoder.decode(outputTypes, outputValues)
      }));
    }
    catch (e) {
      console.log('error occurs:', e)
      //Stop loading and put the error message in the vm_error like it came from the blockchain.
      setCallResult({ vm_error: e.message })
    }
  }
  const onBlur = (e, i) => {
    let val = e.target.value;
    let type = inputs[i].type;
    let newVals = inputValues.slice();
    newVals[i] = val;
    setInputValues(newVals);
  }

  const onSubmit = () => {
    fetchFunction();
  }

  useEffect(() => {
    if (inputs.length === 0) fetchFunction();
  }, [])
  return (<div className="read-contract__wrapper">
    <div className="read-contract__title">{`${index}. ${functionData.name}`}</div>
    <div className="read-contract__content">
      {hasInput &&
        <>
          <div className="read-contract__inputs">
            {inputs.map((input, i) =>
              <React.Fragment key={i}>
                <div className="read-contract__input" >
                  <label>{`${input.name}(${input.type}): `}</label>
                  <div style={{ flex: 1 }}>
                    <input type="text" placeholder={`${input.name}(${input.type})`} onBlur={e => onBlur(e, i)}></input>
                  </div>
                </div>
              </React.Fragment>)}
          </div>
          <div className="read-contract__input--row">
            <button className="read-contract__input--query" onClick={onSubmit}>Query</button>
            {vm_error && <div className="text-danger read-contract__input--error">Error: {vm_error}</div>}
          </div>
          <div className="read-contract__outputs-template">
            &#8627;&nbsp;
            {outputs.map((output, i) => <span key={i}>{(i == 0 ? '' : ', ') + output.name} <i>{output.type}</i></span>)}
            {/* {outputs.map((output, i) => { return ` ${output.name} ${output.type}` } */}
            {/* )} */}
          </div>
        </>}
      {decodedParameters && !hasInput &&
        <div className="read-contract__outputs">
          {outputs.map((output, i) =>
            <div className="read-contract__output" key={i}>
              <div className="read-contract__output--content">{decodedParameters[i].toString()}</div>
              <div className="read-contract__output--unit">{output.type}</div>
            </div>)}
        </div>}
      {decodedParameters && hasInput &&
        <div className="read-contract__outputs">
          <div className="read-contract__output--response">[ <b>{functionData.name}</b> method Response ]</div>
          {outputs.map((output, i) =>
            <div className="read-contract__output" key={i}>
              <div className="read-contract__output--unit">
                <span className="text-green">&#8658;</span>
                {`${output.name} ${output.type}: ${decodedParameters[i]}`}
              </div>
            </div>)}
        </div>}
    </div>
  </div>)
}