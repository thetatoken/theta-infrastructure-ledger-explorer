import React from 'react';
import { Pagination as ReactstrapPagination, PaginationItem, PaginationLink } from 'reactstrap';
import classnames from 'classnames';
import './styles.scss';

class Pagination extends React.Component {
  constructor(props){
    super(props);
    this.handlePrevious = this.handlePrevious.bind(this);
    this.handleNext = this.handleNext.bind(this);
    this.handleOnPage = this.handleOnPage.bind(this);
  }
  handlePrevious(){
    const previous = this.props.currentPage - 1;
    if (previous >= 1) {
      this.handleOnPage(previous);
    }
  }

  handleNext(){
    const next = this.props.currentPage + 1;
    if (next <= (this.props.totalPages - 1)) {
      this.handleOnPage(next);
    }
  }

  handleOnPage(pageNumber){
    this.props.callback(pageNumber);
  }

  renderPaginationItems() {
    const { totalPages, currentPage } = this.props;
    console.log(totalPages);
    console.log(currentPage)
    const pageButtons = [];
    const maxButtons = 10;
    const items = totalPages;
    const activePage = currentPage;
    let startPage;
    let endPage;

    if (maxButtons && maxButtons < items) {
      startPage = Math.max(
        Math.min(
          activePage - Math.floor(maxButtons / 2, 10),
          items - maxButtons,
        ),
        0,
      );
      endPage = startPage + maxButtons - 1;
    } else {
      startPage = 0;
      endPage = items - 1;
    }
    console.log(startPage)
    for (let page = startPage; page <= endPage; ++page) {
      pageButtons.push(
        <PaginationItem disabled={this.props.isDisabled} key={page} active={page === activePage}>
          <PaginationLink onClick={() => this.handleOnPage(page)}>
            {page + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }
    if (startPage > 1) {
      if (startPage > 2) {
        pageButtons.unshift(
          <PaginationItem
            key="ellipsisFirst"
            disabled
          >
            <PaginationLink>
              &#8230;
            </PaginationLink>
          </PaginationItem>,
        );
      }

      pageButtons.unshift(
        <PaginationItem disabled={this.props.isDisabled} key={0} active={false}>
          <PaginationLink onClick={() => this.handleOnPage(0)}>1</PaginationLink>
        </PaginationItem>
      );
    }
    if (endPage < items) {
      if (endPage < items - 1) {
        pageButtons.push(
          <PaginationItem
            key="ellipsis"
            disabled
          >
            <PaginationLink>
              &#8230;
            </PaginationLink>
          </PaginationItem>,
        );
      }
    }
    return pageButtons;
  }

  render() {
    return (
      <ReactstrapPagination className={classnames('th-pagination',
        { 'th-pagination--lg': this.props.size === 'lg' })}>
        <PaginationItem disabled={this.props.isDisabled}>
          <PaginationLink onClick={() => this.handleOnPage(0)}>
            First
          </PaginationLink>
        </PaginationItem>
        <PaginationItem disabled={this.props.isDisabled}>
          <PaginationLink onClick={this.handlePrevious}>
            Previous
          </PaginationLink>
        </PaginationItem>
        {this.renderPaginationItems()}
        <PaginationItem disabled={this.props.isDisabled}>
          <PaginationLink onClick={this.handleNext}>
            Next
          </PaginationLink>
        </PaginationItem>
        <PaginationItem disabled={this.props.isDisabled}>
          <PaginationLink onClick={() => this.handleOnPage(this.props.totalPages - 1)}>
            Last
          </PaginationLink>
        </PaginationItem>
      </ReactstrapPagination>
    );
  }
}

export default Pagination;
