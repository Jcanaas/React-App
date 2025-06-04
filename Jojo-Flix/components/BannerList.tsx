import React from 'react';
import { ScrollView, Text } from 'react-native';
// import { banners } from './BannerData';
import Banner from './Banner';
import { BannerItem, BannerData } from './BannerData';


const BannerList: React.FC = () => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {BannerData.map((item, idx) => {
        console.log('ITEM:', item);
        return (
          <Banner
            key={idx}
            fondo={item.fondo}
            logo={item.logo}
          />
        );
      })}
    </ScrollView>
  );
};

export default BannerList;