import React, { useState, useRef } from "react";
import cx from 'classnames';

export const Accordion = props => {
  const { className, header, body, headerClassName, bodyClassName } = props;
  const bodyRef = useRef();
  const arrowRef = useRef();
  const handleOnClick = () => {
    let body = bodyRef.current;
    arrowRef.current.classList.toggle('downwards');
    if (body.style.maxHeight) {
      body.style.maxHeight = null;
      body.style.overflow = 'hidden';
    } else {
      body.style.maxHeight = body.scrollHeight + "px";
      body.style.overflow = 'visible';
    }
  }
  return (
    <div className={cx("accordion", className)}>
      <div className={cx("accordion__header", headerClassName)} onClick={handleOnClick}>
        {header}
        <span className="accordion__header--arrow" ref={arrowRef}></span>
      </div>
      <div className={cx("accordion__body", bodyClassName)} ref={bodyRef}>
        <div className={cx("accordion__body--inner")}>
          {body}
        </div>
      </div>
    </div>)
}
export const AccordionHeader = props => {
  const { title, subTitle } = props;
  return <label>
    {title}
    {subTitle && <span>{subTitle}</span>}
  </label>
}
// export default Accordion;