import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { ContentData } from './ContentData';
import { BlurView } from 'expo-blur';
import TypewriterText from './TypewriterText';

const { width } = Dimensions.get('window');

interface SearchModalProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  onSelect: (item: any) => void;
}

const MODAL_WIDTH = width * 0.65;

const SearchModal: React.FC<SearchModalProps> = ({ visible, setVisible, onSelect }) => {
  const [query, setQuery] = useState('');
  const slideAnim = useRef(new Animated.Value(MODAL_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // Animación de entrada
  useEffect(() => {
    if (visible) {
      overlayOpacity.setValue(1);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Animación de salida personalizada
  const handleClose = () => {
    // Animar overlay y cuadro a la vez
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: MODAL_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setQuery('');
    });
  };

  const results = query.length > 0
    ? ContentData.filter(item =>
        item.nombre.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const maxLength = results.reduce((max, item) => Math.max(max, item.nombre.length), 0);
  const totalDuration = 600; // ms, ajusta a tu gusto

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="auto" />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.animatedBox,
            {
              width: MODAL_WIDTH,
              right: 0,
              transform: [{ translateX: slideAnim }],
              marginTop: '5%',
            },
          ]}
          pointerEvents="box-none"
        >
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.glassTint} pointerEvents="none" />
          <View style={{ flex: 1 }}>
            <TextInput
              placeholder="Buscar película o serie..."
              value={query}
              onChangeText={setQuery}
              style={styles.input}
              autoFocus
              placeholderTextColor="#fff8"
            />
            <FlatList
              data={results}
              keyExtractor={item => item.nombre}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setVisible(false);
                    onSelect(item);
                  }}
                  style={styles.result}
                >
                  <TypewriterText
                    text={item.nombre}
                    totalDuration={totalDuration}
                    style={styles.resultText}
                  />
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000a',
  },
  animatedBox: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    height: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: -2, height: 0 },
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Negro, mucho más opaco
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: '#fff',
    borderRadius: 7,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.18)',
  },
  result: { paddingVertical: 10 },
  resultText: { color: '#fff', fontSize: 18 },
});

export default SearchModal;