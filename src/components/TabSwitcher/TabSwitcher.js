import React, { useState } from 'react';
import styles from './TabSwitcher.module.css';

const TabSwitcher = ({
  tabs = [
    { label: '저장된 장소', value: 'saved' },
    { label: '루트', value: 'route' }
  ],
  initialTab = 'saved', 
  onTabChange 
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabClick = (tabValue) => {
    setActiveTab(tabValue);
    if (onTabChange) {
      onTabChange(tabValue);
    }
  };


  const activeTabStyle = {
    transform: `translateX(${tabs.findIndex(tab => tab.value === activeTab) * 100}%)`
  };

  return (
    <div className={styles.tabContainer}>
      <div className={styles.activeTabIndicator} style={activeTabStyle}></div>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`${styles.tabButton} ${activeTab === tab.value ? styles.active : ''}`}
          onClick={() => handleTabClick(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabSwitcher;
