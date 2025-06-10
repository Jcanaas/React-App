import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

interface Props {
  text: string;
  totalDuration: number; // tiempo total en ms
  style?: any;
}

const TypewriterText: React.FC<Props> = ({ text, totalDuration, style }) => {
  const [displayed, setDisplayed] = useState('');
  const speed = text.length > 0 ? totalDuration / text.length : totalDuration;

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <Text style={style}>{displayed}</Text>;
};

export default TypewriterText;