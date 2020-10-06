import React, { useRef, useState, useEffect } from "react";

import LoadingPanel from 'common/components/loading-panel';
import AceEditor from 'common/components/ace-editor';
import { getHex, getArguments } from 'common/helpers/utils';
import { smartContractService } from 'common/services/smartContract';

export default class SmartContractCode extends React.PureComponent {
  setStates = (keys, vals) => {
    let newState = {}
    keys.forEach((key, i) => {
      newState[key] = vals[i]
    })
    this.setState(newState);
  }
  render() {
    const { address, smartContract, isReleasesReady, isLoading, fetchSmartContract } = this.props;
    const showView = _.get(smartContract, 'source_code.length')
    return (
      isLoading ? <LoadingPanel /> :
        showView ? <CodeViewer contract={smartContract} /> : <CodeUploader isReleasesReady={isReleasesReady}
          smartContract={smartContract} address={address} fetchSmartContract={fetchSmartContract} />
    )
  }
}

const Options = () => {
  let releases = window.soljsonReleases;
  return (
    <>
      <option value='' key='empty'>[Please select]</option>
      {Object.keys(releases).map(key => {
        let text = releases[key].match(/^soljson-(.*).js$/)[1];
        return (<option value={text} key={key}>{text}</option>)
      })}
    </>
  )
}
const CodeUploader = props => {
  const { isReleasesReady, address, fetchSmartContract } = props;
  const [isCodeEmpty, setIsCodeEmpty] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [uploaderSourceCode, setUploaderSourceCode] = useState('');
  const [uploaderAbi, setUploaderAbi] = useState('');
  const [uploaderVersion, setUploaderVersion] = useState('');
  const [uploaderOptimizer, setUploaderOptimizer] = useState(0);
  const sourceCodeRef = useRef(null);
  const versionRef = useRef(null);
  const optimizerRef = useRef(null);
  const abiRef = useRef(null);
  useEffect(() => {
    if (sourceCodeRef.current) {
      sourceCodeRef.current.value = uploaderSourceCode;
      abiRef.current.value = uploaderAbi;
      optimizerRef.current.value = uploaderOptimizer;
    }
    if (versionRef.current) versionRef.current.value = uploaderVersion
  })
  const reset = () => {
    sourceCodeRef.current.value = '';
    abiRef.current.value = '';
  }
  const submit = () => {
    const sourceCode = sourceCodeRef.current.value;
    const version = versionRef.current.value;
    if (sourceCode === '') {
      setIsCodeEmpty(true);
      sourceCodeRef.current.focus();
      return;
    } else if(isCodeEmpty){
      setIsCodeEmpty(false);
    }
    if(version === ''){
      versionRef.current.classList.add('isEmpty');
      versionRef.current.focus();
      return;
    }
    const abi = abiRef.current.value;
    const optimizer = optimizerRef.current.value;
    const byteCode = _.get(props, 'smartContract.bytecode');
    setUploaderSourceCode(sourceCode);
    setUploaderAbi(abi);
    setUploaderVersion(version);
    setUploaderOptimizer(optimizer);
    setIsVerifying(true);
    smartContractService.verifySourceCode(address, byteCode, sourceCode, abi, version, optimizer)
      .then(res => {
        setIsVerifying(false);
        console.log('res from verify source code:', res);
        let isVerified = _.get(res, 'data.result.verified')
        let error = _.get(res, 'data.err_msg')
        if (error) { setErrMsg(error) }
        console.log('result: ', isVerified)
        if (isVerified === true) { fetchSmartContract(address) }
        else setErrMsg('Code does not match.')
      })
  }
  const resetBorder = e => {
    if(e.target.value === ''){
      e.target.classList.add('isEmpty')
    }else{
      e.target.classList.remove('isEmpty')
    }
  }
  return (isVerifying ?
    <>
      <div className="code-loading-text">Verifying your source code......</div>
      <LoadingPanel />
    </>
    :
    <>
      <div className="selects-container">
        {isReleasesReady ? <div className="select__container">
          <label>Please select Compiler Version</label>
          <div className="select__selector">
            <select ref={versionRef} defaultValue='' onChange={resetBorder}>
              <Options />
            </select>
          </div>
        </div> : ''}
        <div className="select__container optimizer">
          <label>
            <div className="select__tooltip question-mark">?
              <div className="select__tooltip--text">
                Select the option you used when compiling this contract.
              </div>
            </div>
              Optimization
            </label>
          <div className="select__selector optimizer">
            <select ref={optimizerRef} defaultValue={0}>
              <option value={1}>Yes</option>
              <option value={0}>No</option>
            </select>
          </div>
        </div>
      </div>
      <label htmlFor="txtSourceCode">
        <b>Enter the Solidity Contract Code below &nbsp;</b>
        <span className="text-danger">*</span>
        <span className="text-danger">{isCodeEmpty ? 'source code is reqired. ' : ''}Only Single File Supported</span>
      </label>
      <textarea className='code-area' placeholder="Enter your code here." name="txtSourceCode" ref={sourceCodeRef} required />
      <label>Constructor Arguments ABI-encoded (for contracts that were created with constructor parameters)</label>
      <textarea className='abi-area' placeholder="Enter your code here." ref={abiRef} />
      {errMsg.length ? <div className='code-error-text text-danger'>Validation failed with an error: {errMsg}</div> : null}
      <div className="code-buttons">
        <div onClick={submit}>Verify and Publish</div>
        <div className='reset' onClick={reset}>Reset</div>
      </div>
    </>
  )
}
const CodeViewer = props => {
  const { contract } = props;
  let args = _.get(contract, 'constructor_arguments');
  const hasConstructorArguments = args ? args.length > 0 : false;
  const jsonAbi = contract.abi.map(obj => JSON.stringify(obj))
  return (
    <>
      <div className="contract-info">
        <div className="contract-info__block">
          <div className="contract-info__title verified">Contract Source Code Verified</div>
          <div className="contract-info__general">
            <div className="contract-info__raws">
              <div className="contract-info__cell">
                <div>Contract Name:</div>
                <div>{contract.name}</div>
              </div>
              <div className="contract-info__cell">
                <div>Compiler Version:</div>
                <div>{contract.compiler_version}</div>
              </div>
            </div>
            <div className="contract-info__raws">
              <div className="contract-info__cell">
                <div>Optimization Enabled:</div>
                <div><b>{contract.optimizer === 'enabled' ? 'Yes' : 'No'}</b> with <b>200</b> runs</div>
              </div>
              <div className="contract-info__cell">
                <div>Other Settings:</div>
                <div><b>default</b> evmVersion</div>
              </div>
            </div>
          </div>
        </div>
        <div className="contract-info__block">
          <div className="contract-info__title source-code">Contract Source Code (Solidity)</div>
          <AceEditor value={contract.source_code} name="contract_source_code" />
        </div>
        <div className="contract-info__block">
          <div className="contract-info__title abi">Contract ABI</div>
          <AceEditor value={'[' + jsonAbi + ']'} name="contract_abie" height="200px" showGutter={false} />
        </div>
        <div className="contract-info__block">
          <div className="contract-info__title bytecode">Contract Creation Code</div>
          <AceEditor value={getHex(contract.bytecode)} name="contract_bytecode" height="200px" showGutter={false} />
        </div>
        {hasConstructorArguments ? <div className="contract-info__block">
          <div className="contract-info__title arguments">Constructor Arguments
            <div className="contract-info__title--sub">(ABI-Encoded and is the last bytes of the Contract Creation Code above)</div>
          </div>
          <AceEditor value={getArguments(contract.constructor_arguments)} name="contract_bytecode" height="200px" showGutter={false} />
        </div> : null}
      </div>
    </>)
}