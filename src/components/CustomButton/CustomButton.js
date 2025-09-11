import React from 'react';
import styles from './CustomButton.module.css';

const CustomButton = ({
  text = '버튼',
  onClick, 
  backgroundColor = '#BBD66F',
  textColor = '#000000', 
  fontSize = '13px', 
  fontWeight = '600', 
  borderRadius = '10px',
  width = '317px', 
  height = '39px', 
  style
}) => {
  const buttonStyles = {
    backgroundColor: backgroundColor,
    color: textColor,
    fontSize: fontSize,
    fontWeight: fontWeight,
    borderRadius: borderRadius,
    width: width,
    height: height,
    ...style 
  };

  return (
    <button className={styles.customButton} onClick={onClick} style={buttonStyles}>
      {text}
    </button>
  );
};

export default CustomButton;
