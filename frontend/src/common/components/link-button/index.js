import React, { Component } from "react";
import { Link } from "react-router"
import './styles.scss';

export default class LinkButton extends Component {
  renderLeftArrow(left){
    return(
      left ? <div className="th-link-button__container--left">&#8678;</div> : null
    )
  }
  renderRightArrow(right){
    return(
      right ? <div className="th-link-button__container--right">&#8680;</div> : null
    )
  }
  render() {
    const { left, right, handleOnClick, url, className, children } = this.props;
    console.log(this.props)
    return (
      <Link to={url} className={`${className} th-link-button`}>
        <div className="th-link-button__container">
          {this.renderLeftArrow(left)}
          <div className="th-link-button__container--content">{children}</div>
          {this.renderRightArrow(right)}
        </div>
      </Link>
    );
  }
}
