import React from 'react';
import cx from 'classnames';

const ELLIPSE = '&#8230;'

export default class Pagination extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handlePrevious = this.handlePrevious.bind(this);
    this.handleNext = this.handleNext.bind(this);
    this.handleOnPage = this.handleOnPage.bind(this);
  }
  static defaultProps = {
    size: 'lg',
    maxButtons: 5,
  }
  handlePrevious() {
    const previous = this.props.currentPage - 1;
    if (previous > 0) {
      this.handleOnPage(previous);
    }
  }

  handleNext() {
    const next = this.props.currentPage + 1;
    if (next <= this.props.totalPages) {
      this.handleOnPage(next);
    }
  }

  handleOnPage(pageNumber) {
    this.props.onPageChange(pageNumber);
  }

  renderPaginationItems(disabled) {
    const { totalPages, currentPage, maxButtons } = this.props;
    const pageButtons = [];
    const items = totalPages;
    const activePage = currentPage;
    let startPage;
    let endPage;

    if (maxButtons && maxButtons < items) {
      startPage = Math.max(
        Math.min(
          activePage - Math.floor(maxButtons / 2, 10),
          items - maxButtons + 1,
        ),
        1,
      );
      endPage = startPage + maxButtons - 1;
    } else {
      startPage = 1;
      endPage = items;
    }

    for (let page = startPage; page <= endPage; ++page) {
      pageButtons.push(
        <PaginationLink
          key={page}
          onClick={() => this.handleOnPage(page)}
          active={page === activePage}
          className="number"
          disabled={disabled}>
          {page}
        </PaginationLink>);
    }
    if (startPage > 1) {
      pageButtons.unshift(<Ellipse key="e0" />);
    }
    if (endPage < items) {
      pageButtons.push(<Ellipse key="e1" />);
    }

    return pageButtons;
  }

  render() {
    let { size, totalPages, disabled } = this.props;
    return (
      <div className={cx('pagination', size, { disabled })}>
        <PaginationFirst onClick={() => this.handleOnPage(1)} disabled={disabled} className="icon first" />
        <PaginationPrev onClick={this.handlePrevious} disabled={disabled} className="icon prev" />
        {this.renderPaginationItems(disabled)}
        <PaginationNext onClick={this.handleNext} disabled={disabled} className="icon next" />
        <PaginationLast onClick={() => this.handleOnPage(totalPages)} disabled={disabled} className="icon last" />
      </div>);
  }
}

const PaginationLink = props => {
  let { active, onClick, children, className, ...params } = props;
  return (
    <button
      className={cx("btn t", { active: active }, className)}
      onClick={onClick}
      {...params}>{children}</button>);
}
const PaginationFirst = props => <PaginationLink active={false} className="first" {...props}><i /></PaginationLink>
const PaginationPrev = props => <PaginationLink active={false} className="prev" {...props}><i /></PaginationLink>
const PaginationNext = props => <PaginationLink active={false} className="next" {...props}><i /></PaginationLink>
const PaginationLast = props => <PaginationLink active={false} className="last" {...props}><i /></PaginationLink>
const Ellipse = props => <div className="ellipse" {...props}>&#8230;</div>
