import React from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import SmartContractCode from './smart-contract-code';
import ReadContract from './read-contract';
import { smartContractService } from 'common/services/smartContract';
import get from 'lodash/get';

export default class SmartContract extends React.PureComponent {
  _isMounted = true;

  constructor(props) {
    super(props)
    this.state = {
      smartContract: null,
      isVerified: false,
      isReleasesReady: false,
      isLoading: false,
      tabIndex: 0
    }
  }
  componentDidMount() {
    this.fetchSmartContract(this.props.address)
  }
  componentDidUpdate(preProps) {
    if (this.props.address !== preProps.address) {
      this.fetchSmartContract(this.props.address)
    }
  }
  componentWillUnmount() {
    this._isMounted = false;
  }
  fetchSmartContract = (address) => {
    if (!address) {
      return;
    }
    const self = this;
    this.setState({ isLoading: true, tabIndex: 0 })
    smartContractService.getOneByAddress(address)
      .then(res => {
        if (!self._isMounted) return;
        switch (res.data.type) {
          case 'smart_contract':
            const smartContract = get(res, 'data.body')
            const isVerified = get(smartContract, 'verification_date')
            const hasSourceCode = get(smartContract, 'source_code')
            this.setState({
              smartContract: smartContract,
              isVerified: isVerified && hasSourceCode
            })
            if (!this.state.isVerified) {
              this.loadReleases(() => {
                if (!self._isMounted) return;
                this.setState({ isReleasesReady: true })
              })
            }
            break;
          case 'error_not_found':
            break;
          default:
            break;
        }
        this.setState({ isLoading: false })
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
  isReadFunction = (functionData) => {
    const constant = get(functionData, ['constant'], null);
    const stateMutability = get(functionData, ['stateMutability'], null);

    return (stateMutability === "view" || stateMutability === "pure" || constant === true);
  }
  setTabIndex = index => {
    this.setState({ tabIndex: index })
  }
  render() {
    const { address } = this.props;
    const { smartContract, isVerified, isLoading, isReleasesReady, tabIndex } = this.state;
    const abi = get(smartContract, 'abi');
    return (
      <Tabs className="theta-tabs" selectedIndex={tabIndex} onSelect={this.setTabIndex}>
        <TabList>
          <Tab>Code</Tab>
          <Tab disabled={!isVerified}>Read Contract</Tab>
          <Tab disabled>Write Contract</Tab>
        </TabList>

        <TabPanel>
          <SmartContractCode address={address} smartContract={smartContract} isVerified={isVerified}
            isLoading={isLoading} isReleasesReady={isReleasesReady} fetchSmartContract={this.fetchSmartContract} />
        </TabPanel>
        <TabPanel>
          {abi && <ReadContract abi={abi.filter(this.isReadFunction)} address={address} />}
        </TabPanel>
        <TabPanel>
          <h2>Write Contract</h2>
        </TabPanel>
      </Tabs>
    );
  }
}
