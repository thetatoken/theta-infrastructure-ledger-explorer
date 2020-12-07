import React from "react";

import { blocksService } from 'common/services/block';
import BlocksTable from "common/components/blocks-table";
import Pagination from "common/components/pagination";

const MAX_BLOCKS = 50;

export default class Blocks extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.backendAddress,
      blockHeight: 0,
      blockInfoList: [],
      currentPageNumber: 1,
      totalPageNumber: 0
    };
    this.receivedBlocksEvent = this.receivedBlocksEvent.bind(this);
    this.handleGetBlocksByPage = this.handleGetBlocksByPage.bind(this);
  }

  componentDidMount() {
    const { currentPageNumber } = this.state;
    blocksService.getBlocksByPage(currentPageNumber, MAX_BLOCKS)
      .then(res => {
        this.receivedBlocksEvent(res);
      }).catch(err => {
        console.log(err);
      })
  }

  receivedBlocksEvent(data) {
    if (data.data.type == 'block_list') {
      this.setState({
        blockInfoList: data.data.body,
        currentPageNumber: data.data.currentPageNumber,
        totalPageNumber: data.data.totalPageNumber
      })
    }
  }
  handleGetBlocksByPage(pageNumber) {
    blocksService.getBlocksByPage(pageNumber, MAX_BLOCKS)
      .then(res => {
        this.receivedBlocksEvent(res);
      }).catch(err => {
        console.log(err);
      })
  }
  render() {
    const { blockInfoList } = this.state;
    let { currentPageNumber, totalPageNumber } = this.state;
    currentPageNumber = Number(currentPageNumber);
    totalPageNumber = Number(totalPageNumber);
    return (
      <div className="content blocks">
        <div className="page-title blocks">Blocks</div>
        <BlocksTable
          blocks={blockInfoList}
          truncate={70} />
        <Pagination
          size={'lg'}
          totalPages={totalPageNumber}
          currentPage={currentPageNumber}
          onPageChange={this.handleGetBlocksByPage}
        />
      </div>
    );
  }
}