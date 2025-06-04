import React from 'react';
import { View, Text } from 'react-native';
import BannerCarousel from './BannerCarousel';
import Banner from './Banner';
import { BannerData, BannerItem } from './BannerData';

const recomendados = ['Monster', 'Devil May Cry'];
const categorias = ['Serie', 'Anime', 'Pelicula'];
// Los nombres recomendados

const CarouselsPorCategoria = () => {
  return (
    <View>
      {/* Carrusel de recomendados */}
      <View>
        <Text style={{fontSize: 22, fontWeight: 'bold', marginVertical: 12}}>Recomendados</Text>
        <BannerCarousel
          banners={BannerData.filter((b: BannerItem) => recomendados.includes(b.nombre))
            .map((b: BannerItem) =>
              <Banner key={b.nombre} fondo={b.fondo} logo={b.logo} />
            )}
        />
      </View>

      {categorias.map(cat => {
        const bannersFiltrados = BannerData.filter((b: BannerItem) => 
          b.categoria?.toLowerCase() === cat.toLowerCase()
        );

        if (!bannersFiltrados.length) return null;

        return (
          <View key={cat}>
            <Text style={{fontSize: 22, fontWeight: 'bold', marginVertical: 12}}>{cat}</Text>
            <BannerCarousel
              banners={bannersFiltrados.map((b: BannerItem) =>
                <Banner key={b.nombre} fondo={b.fondo} logo={b.logo} />
              )}
            />
          </View>
        );
      })}
    </View>
  );
};

export default CarouselsPorCategoria;