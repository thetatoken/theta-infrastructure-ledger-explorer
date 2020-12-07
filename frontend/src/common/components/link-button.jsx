import React from "react";
import { Link } from "react-router-dom";


export default class LinkButton extends React.Component {
  constructor(props){
    super(props);
  }
  renderLeftArrow(left){
    return(
      left ? <div>&#8678;</div> : null
    )
  }
  renderRightArrow(right){
    return(
      right ? <div>&#8680;</div> : null
    )
  }
  render() {
    const { left, right, handleOnClick, url, className, children } = this.props;
    return (
      <Link to={url} className={`${className} th-link-button`} onClick={handleOnClick}>
        <div className="th-link-button__container">
          {this.renderLeftArrow(left)}
          <div>{children}</div>
          {this.renderRightArrow(right)}
        </div>
      </Link>
    );
  }
}
