export interface BannerData {
  nombre: string;
  descripcion: string;
  fondo: any;
  logo: any;
  capitulos: number;
  fuente: { episodio: number; url: string }[];
  nombresEpisodios: string[];
  fechaEstreno: string;
  puntuacion: number;
}

export const allBannerData = [
  {
    nombre: 'Beck: Mongolian Chop Squad',
    descripcion: 'Beck: Mongolian Chop Squad es un anime que sigue la historia de Yukio "Koyuki" Tanaka, un adolescente que descubre su pasión por la música y se une a una banda llamada Beck. A medida que Koyuki y sus amigos luchan por alcanzar el éxito en la industria musical, enfrentan desafíos personales y profesionales, explorando temas de amistad, perseverancia y el poder transformador de la música.',
    fondo: require('../assets/images/beck_bg.jpg'),
    logo: require('../assets/images/beck_logo.png'),
    capitulos: 26,
    fuente: [],
    nombresEpisodios: [
        "1. El escenario de un chaval de 14 años",
        "2. Sala de conciertos",
        "3. Moon on the water",
        "4. Rasguea la guitarra",
        "5. Beck",
        "6. Hyodo y la Jaguar",
        "7. Lucille",
        "8. Comunicado del instituto",
        "9. Víspera del concierto",
        "10. Face",
        "11. Vacaciones de verano",
        "12. Concierto secreto",
        "13. Ciel Bleu",
        "14. Sueño",
        "15. Vuelta al insti",
        "16. Indies",
        "17. Tres días",
        "18. Leon Sykes",
        "19. Blues",
        "20. Greatful sound",
        "21. Componer música",
        "22. La víspera del festival",
        "23. El festival",
        "24. El tercer escenario",
        "25. Slip Out",
        "26. América"
    ],
    fechaEstreno: '2004-10-07',
    puntuacion: 8.9,
    categoria: 'Anime'
},
{
    nombre: 'The Last of Us',
    descripcion: 'The Last of Us sigue a Joel, un hombre endurecido por la pérdida, que debe escoltar a Ellie, una joven inmune a una infección que ha devastado al mundo. Juntos cruzan un Estados Unidos postapocalíptico lleno de peligros humanos e infectados, enfrentando desafíos que pondrán a prueba su vínculo, su moral y su voluntad de sobrevivir.',
    fondo: require('../assets/images/tloutemp1.webp'),
    logo: require('../assets/images/The_Last_of_Us_logo.png'),
    capitulos: 9,
    fuente: [],
    nombresEpisodios: [
        "1. Cuando te pierdes en la oscuridad",
        "2. Infectados",
        "3. Mucho, mucho tiempo",
        "4. Por favor, toma mi mano",
        "5. Resistir y sobrevivir",
        "6. Familia",
        "7. Lo que dejamos atrás",
        "8. En nuestras horas más bajas",
        "9. Busca la luz"
    ],
    fechaEstreno: '',
    puntuacion: 9.5,
    categoria: 'Serie'
}
];

console.log('TEST FONDO', allBannerData[0].fondo);
console.log('TEST LOGO', allBannerData[0].logo);
export const banners = allBannerData.map(({ fondo, logo }) => ({ fondo, logo }));

