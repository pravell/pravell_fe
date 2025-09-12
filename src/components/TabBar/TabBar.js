import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TabBar.module.css';

const TabBar = () => {
  const [activeTab, setActiveTab] = useState('plan');
  const navigate = useNavigate();

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'plan') {
      navigate('/');
    } else if (tabName === 'map') {
      navigate('/map');
    } else if (tabName === 'my') {
      navigate('/my');
    }
  };

  return (
    <div className={styles.tabBarContainer}>
      <div 
        className={`${styles.tabItem} ${activeTab === 'plan' ? styles.active : ''}`} 
        onClick={() => handleTabClick('plan')}
      >
        <span className={styles.activeBar}></span>
        <img src="/image/character6.png" alt="여행 플랜" className={styles.tabIcon} />
        <span className={styles.tabLabel}>여행 플랜</span>
      </div>
      <div 
        className={`${styles.tabItem} ${activeTab === 'map' ? styles.active : ''}`} 
        onClick={() => handleTabClick('map')}
      >
        <span className={styles.activeBar}></span>
        <img src="/image/character2.png" alt="지도" className={styles.tabIcon} />
        <span className={styles.tabLabel}>지도</span>
      </div>
      <div 
        className={`${styles.tabItem} ${activeTab === 'my' ? styles.active : ''}`} 
        onClick={() => handleTabClick('my')}
      >
        <span className={styles.activeBar}></span>
        <img src="/image/character1.png" alt="MY" className={styles.tabIcon} />
        <span className={styles.tabLabel}>MY</span>
      </div>
    </div>
  );
};

export default TabBar;
