import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { ContentData } from './ContentData';

const { width } = Dimensions.get('window');

interface SearchModalProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  onSelect: (item: any) => void;
}

const MODAL_WIDTH = width * 0.65; // 85% del ancho de pantalla

const SearchModal: React.FC<SearchModalProps> = ({ visible, setVisible, onSelect }) => {
  const [query, setQuery] = useState('');
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: width - MODAL_WIDTH,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setQuery('');
    }
  }, [visible]);

  const results = query.length > 0
    ? ContentData.filter(item =>
        item.nombre.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <Modal visible={visible} animationType="none" transparent>
      <TouchableWithoutFeedback onPress={() => setVisible(false)}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.animatedBox, { left: slideAnim, width: MODAL_WIDTH }]}>
        <TextInput
          placeholder="Buscar película o serie..."
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          autoFocus
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
              <Text style={styles.resultText}>{item.nombre}</Text>
            </TouchableOpacity>
          )}
        />
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000a',
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  animatedBox: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    height: '100%',
    backgroundColor: '#222',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: -2, height: 0 },
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  result: { paddingVertical: 10 },
  resultText: { color: '#fff', fontSize: 18 },
});

export default SearchModal;