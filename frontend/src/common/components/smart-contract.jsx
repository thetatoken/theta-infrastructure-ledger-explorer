import React from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import SmartContractCode from './smart-contract-code';
import ReadContract from './read-contract';
import { smartContractService } from 'common/services/smartContract';
import get from 'lodash/get';
import history from 'common/history'

const tabNames = ['Code', 'ReadContract', 'WriteContract'];

export default class SmartContract extends React.PureComponent {
  _isMounted = true;

  constructor(props) {
    super(props)
    let tabName = this.props.urlHash.replace("#", "").split('-')[1];
    this.state = {
      smartContract: null,
      isVerified: false,
      isReleasesReady: false,
      isLoading: false,
      tabIndex: tabNames.indexOf(tabName) === -1 ? 0 : tabNames.indexOf(tabName)
    }
  }
  getDefaultTabIndex() {

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
    this.setState({ isLoading: true })
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
        if (this.props.handleHashScroll) {
          this.props.handleHashScroll();
        }
      }).catch(err => {
        console.log(err);
      })
  }
  loadReleases = async (callback) => {
    try {
      const res = await fetch('https://binaries.soliditylang.org/bin/list.json');
      if (!res.ok) throw new Error("Failed to fetch solc versions");
      const data = await res.json();
      window.soljsonReleases = data.releases;
      if (callback) callback();
    } catch (e) {
      console.error("Error loading releases:", e);
      window.soljsonReleases = window.soljsonReleases || {
        "0.8.26": "soljson-v0.8.26+commit.45c2d7f2.js",
        "0.8.25": "soljson-v0.8.25+commit.59dbf8f1.js",
        "0.8.24": "soljson-v0.8.24+commit.7e36bb15.js",
        "0.8.23": "soljson-v0.8.23+commit.8df45f5f.js",
        "0.8.22": "soljson-v0.8.22+commit.8b3a9e20.js",
        "0.8.21": "soljson-v0.8.21+commit.d4a1f52f.js",
        "0.8.20": "soljson-v0.8.20+commit.a1b79de0.js",
        "0.8.19": "soljson-v0.8.19+commit.7dd6d404.js",
        "0.8.18": "soljson-v0.8.18+commit.87f61d96.js",
        "0.8.17": "soljson-v0.8.17+commit.8df45f5f.js",
        "0.8.16": "soljson-v0.8.16+commit.07a7930e.js",
        "0.8.15": "soljson-v0.8.15+commit.e14f2714.js",
        "0.8.14": "soljson-v0.8.14+commit.80d49f37.js",
        "0.8.13": "soljson-v0.8.13+commit.abaa5c0e.js",
        "0.8.12": "soljson-v0.8.12+commit.f00d7308.js",
        "0.8.11": "soljson-v0.8.11+commit.869f8a7e.js",
        "0.8.10": "soljson-v0.8.10+commit.fc410830.js",
        "0.8.9": "soljson-v0.8.9+commit.e5eed63a.js",
        "0.8.8": "soljson-v0.8.8+commit.dddeac2f.js",
        "0.8.7": "soljson-v0.8.7+commit.e28d00a7.js",
        "0.8.6": "soljson-v0.8.6+commit.11564f7e.js",
        "0.8.5": "soljson-v0.8.5+commit.a4f2e591.js",
        "0.8.4": "soljson-v0.8.4+commit.c7e474f2.js",
        "0.7.6": "soljson-v0.7.6+commit.7338295f.js",
        "0.7.5": "soljson-v0.7.5+commit.eb77ed08.js",
        "0.7.4": "soljson-v0.7.4+commit.3f05b770.js",
        "0.7.3": "soljson-v0.7.3+commit.9bfce1f6.js",
        "0.7.2": "soljson-v0.7.2+commit.51b20bc0.js",
        "0.7.1": "soljson-v0.7.1+commit.f4a555be.js",
        "0.7.0": "soljson-v0.7.0+commit.9e61f92b.js"
      };
      if (callback) callback();
    }
  };
  isReadFunction = (functionData) => {
    const constant = get(functionData, ['constant'], null);
    const stateMutability = get(functionData, ['stateMutability'], null);

    return (stateMutability === "view" || stateMutability === "pure" || constant === true);
  }
  setTabIndex = (index) => {
    this.setState({ tabIndex: index })
    history.replace(`#Contract-${tabNames[index]}`);
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
