import React, { Component } from "react";
import { browserHistory } from 'react-router';
import socketClient from 'socket.io-client';
import BlockInfoRows from './components/block-info-rows';
import { blocksService } from '/common/services/block';
// import './styles.scss';

export default class Blocks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // backendAddress: this.props.route.backendAddress,
      // backendAddress: "52.53.243.120:9000",
      backendAddress: "localhost:9000",
      // backendAddress: "localhost:3000",
      blockHeight: 0,
      blockInfoList: []
    };
    this.receivedBlocksEvent = this.receivedBlocksEvent.bind(this);
  }

  componentDidMount() {
    browserHistory.push('/blocks');

    const { backendAddress } = this.state;
    blocksService.getTopBlocks()
      .then(res => {
        this.receivedBlocksEvent(res);
      }).catch(err => {
        console.log(err);
      })
    // Initial the socket
    // this.socket = socketClient(backendAddress);
    // this.socket.on('event', this.onSocketEvent)

  }
  componentWillUnmount() {
    // this.socket.disconnect();
  }
  receivedBlocksEvent(data) {
    console.log(data);
    if (data.data.type == 'block_list') {
      this.setState({ blockInfoList: data.data.body })
    }
  }

  render() {
    const { blockInfoList } = this.state;
    return (
      <div>
        {blockInfoList !== undefined ?
          <BlockInfoRows blockInfoList={blockInfoList} /> : <div></div>}
      </div>
    );
  }
}