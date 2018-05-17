import React, { Component } from "react";
import { browserHistory } from 'react-router';
import socketClient from 'socket.io-client';


class BlockInfoRows extends Component {
  render() {
    const { blockInfoList } = this.props;
    // var blocks = [].concat(blockInfoList)
    //   .sort((a,b) => a.height > b.height)
    //   .map((blockInfo) => {
    //   return (
    //     <React.Fragment key={blockInfo.height}>
    //       <p>{blockInfo.height}  {blockInfo.hash}.  {blockInfo.timestamp}</p>
    //     </React.Fragment>
    //   );
    // });  <p>Height        Hash        Timestamp</p>


    return (
      <div>
        <table className="tableContainer" cellSpacing="10px" >
          <tbody>
            <tr>
              <th width='300'>Creation Timestamp</th>
              <th width='200'>Block Height</th>
              <th width='300'>Block Hash</th>
              <th width='300'>Number of Transactions</th>
              <th width='300'>Parent Hash</th>
              <th width='300'>Data Hash</th>
            </tr>
            {blockInfoList
              .sort((a, b) => b.height - a.height)
              .map(blockInfo => {
                return (
                  <tr key={blockInfo.height}>
                    <td width='300'>{blockInfo.timestamp}</td>
                    <td width='200'>{blockInfo.height}</td>
                    <td width='300'>{blockInfo.hash}</td>
                    <td width='300'>{blockInfo.num_txs}</td>
                    <td width='300'>{blockInfo.parent_hash}</td>
                    <td width='300'>{blockInfo.data_hash}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  }
}

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // backendAddress: this.props.route.backendAddress,
      backendAddress: "52.53.243.120:9000",
      blockHeight: 0,
      blockInfoList: []
    };
    this.onSocketEvent = this.onSocketEvent.bind(this);
  }

  componentDidMount() {
    browserHistory.push('/txs');

    const { backendAddress } = this.state;
    // console.log(backendAddress);
    this.socket = socketClient(backendAddress);
    this.socket.on('event', this.onSocketEvent)
  }
  componentWillUnmount(){
    this.socket.disconnect();
  }
  onSocketEvent(data) {
    console.log(data);
    if (data.type == 'block_list') {
      this.setState({ blockInfoList: data.body })
    }
  }

  render() {
    const { blockInfoList } = this.state;
    return (
      <div id="home">
        Blockchain Exploror v0.1
        { blockInfoList !== undefined ?
        <BlockInfoRows blockInfoList={blockInfoList} /> : <div></div>}
      </div>
    );
  }
}