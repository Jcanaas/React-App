import React from 'react';
import { ScrollView, Text } from 'react-native';
// import { banners } from './BannerData';
import Banner from './Banner';
import { banners, allBannerData } from './BannerData';

console.log('BANNERS:', banners);
console.log('ALL DATA:', allBannerData);

const BannerList: React.FC = () => {
  console.log('BANNERS:', banners);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {banners.map((item, idx) => {
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