import React, { Component } from "react";
import socketClient from 'socket.io-client';
import BlockInfoRowsBrief from 'features/blocks/components/block-info-rows-brief';
import { blocksService } from '/common/services/block';
import LinkButton from "common/components/link-button";
import '../styles.scss';

export default class BlocksOverView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // backendAddress: this.props.route.backendAddress,
      // backendAddress: "52.53.243.120:9000",
      backendAddress: "localhost:3000",
      blockHeight: 0,
      blockInfoList: []
    };
    this.onSocketEvent = this.onSocketEvent.bind(this);
  }

  componentDidMount() {
    const { backendAddress } = this.state;

    // Initial the socket
    this.socket = socketClient(backendAddress);
    this.socket.on('event', this.onSocketEvent)

  }
  componentWillUnmount() {
    this.socket.disconnect();
  }
  onSocketEvent(data) {
    // console.log(data);
    if (data.type == 'block_list') {
      this.setState({ blockInfoList: data.body })
    }
  }

  render() {
    const { blockInfoList } = this.state;
    return (
      <div className="th-overview">
        <div className="th-blocks-overview__title">Blockchains overview</div>
        {blockInfoList !== undefined ?
          <BlockInfoRowsBrief blockInfoList={blockInfoList} /> : <div></div>}
        <div className="th-blocks-overview__button">
          <LinkButton className="th-blocks-overview__button--a" url="/blocks">View All</LinkButton>
        </div>
      </div>
    );
  }
}