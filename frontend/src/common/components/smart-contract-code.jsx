import React, { Component } from "react";

import { smartContractService } from 'common/services/smartContract';

export default class SmartContractCode extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      smartContract: null,
      isReleasesReady: false,
      isVerified: false
    }
    this.version = React.createRef();
    this.sourceCode = React.createRef()
    this.abi = React.createRef();
    this.optimizer = React.createRef();
  }
  componentDidMount() {
    this.fetchSmartContract(this.props.address)
  }
  componentDidUpdate(preProps) {
    if (this.props.address !== preProps.address) {
      this.fetchSmartContract(address)
    }
  }
  fetchSmartContract(address) {
    if (!address) {
      return;
    }
    smartContractService.getOneByAddress(address)
      .then(res => {
        console.log(res)
        switch (res.data.type) {
          case 'smart_contract':
            const smartContract = _.get(res, 'data.body')
            const isVerified = _.get(smartContract, 'verification_date')
            const hasSourceCode = _.get(smartContract, 'sourceCode')
            this.setState({
              smartContract: smartContract,
              isVerified: isVerified && hasSourceCode,
              errorType: null
            })
            if (!this.state.isVerified) {
              this.loadReleases(() => {
                this.setState({ isReleasesReady: true })
              })
            }
            break;
          case 'error_not_found':
            break;
          default:
            break;
        }
      }).catch(err => {
        console.log(err);
      })
  }
  loadReleases = (callback) => {
    const existingScript = document.getElementById('solReleases');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://solc-bin.ethereum.org/bin/list.js';
      script.id = 'solReleases';
      document.body.appendChild(script);

      script.onload = () => {
        if (callback) callback();
      };
    }

    if (existingScript && callback) callback();
  }
  reset = () => {
    let a = this.sourceCode.current.value;
    console.log(a.substring(a.lastIndexOf('contract')))
    // this.sourceCode.current.value = '';
    this.abi.current.value = '';
  }
  submit = () => {
    const sourceCode = this.sourceCode.current.value;
    const abi = this.abi.current.value;
    const version = this.version.current.value;
    const { address } = this.props;
    const byteCode = _.get(this.state, 'smartContract.bytecode')
    const optimizer = this.optimizer.current.value;
    console.log('Submitting to backend.')
    console.log(`sourceCode: ${sourceCode}, abi: ${abi}, version: ${version}, address: ${address}, byteCode: ${byteCode}`)
    smartContractService.verifySouceCode(address, byteCode, sourceCode, abi, version, optimizer)
      .then(res => {
        console.log('res from verify source code:', res);
      })
  }
  render() {
    const { address } = this.props;
    const { smartContract, isReleasesReady } = this.state;
    console.log(`address: ${address}`)
    console.log('sc:', this.state.smartContract)
    return (
      <React.Fragment>
        <div className="selects-container">
          {isReleasesReady ? <div className="select--container">
            <label>Please select Compiler Version</label>
            <div className="select--selector">
              <select ref={this.version}>
                <Options />
              </select>
            </div>
          </div> : ''}
          <div className="select--container optimizer">
            <label>
              <span className="select--tooltip">?
              <span className="select--tooltip__text">
                  Select the option you used when compiling this contract.
              </span></span>
              Optimization
            </label>
            <div className="select--selector optimizer">
              <select ref={this.optimizer} defaultValue={0}>
                <option value={1}>Yes</option>
                <option value={0}>No</option>
              </select>
            </div>
          </div>
        </div>
        <label htmlFor="txtSourceCode">
          <b>Enter the Solidity Contract Code below &nbsp;</b>
          <span className="text-danger">*</span>
        </label>
        <textarea className='code-area' placeholder="Enter your code here." name="txtSourceCode" ref={this.sourceCode} required />
        <label>Constructor Arguments ABI-encoded (for contracts that were created with constructor parameters)</label>
        <textarea className='abi-area' placeholder="Enter your code here." ref={this.abi} />
        <div className="code-buttons">
          <div onClick={this.submit}>Verify and Publish</div>
          <div className='reset' onClick={this.reset}>Reset</div>
        </div>
      </React.Fragment>
    )
  }
}
const Options = () => {
  console.log('releases: ', window.soljsonReleases)
  let releases = window.soljsonReleases;
  return (
    <React.Fragment>
      {Object.keys(releases).map(key => {
        let text = releases[key].match(/^soljson-(.*).js$/)[1];
        return (<option value={text} key={key}>{text}</option>)
      })}
    </React.Fragment>
  )
}