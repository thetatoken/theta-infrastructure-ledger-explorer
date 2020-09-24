import React from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import SmartContractCode from './smart-contract-code';

export default class SmartContract extends React.PureComponent {
  constructor(props) {
    super(props)
  }

  render() {
    const { address } = this.props;
    return (
      <React.Fragment>
        <div className='actions'>
          <div className="title">Contract</div>
        </div>
        <Tabs className="theta-tabs">
          <TabList>
            <Tab>Code</Tab>
            <Tab>Read Contract</Tab>
            <Tab disabled>Write Contract</Tab>
          </TabList>

          <TabPanel>
            <SmartContractCode address={address}/>
          </TabPanel>
          <TabPanel>
            <h2>Read Contract</h2>
          </TabPanel>
          <TabPanel>
            <h2>Write Contract</h2>
          </TabPanel>
        </Tabs>
      </React.Fragment>
    );
  }
}
