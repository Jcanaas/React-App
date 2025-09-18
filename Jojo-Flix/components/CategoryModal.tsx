import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, FlatList } from 'react-native';
import { ContentData } from './ContentData';

const { width } = Dimensions.get('window');
const MODAL_WIDTH = width * 0.65;

interface CategoryModalProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  selected: string[];
  setSelected: (cats: string[]) => void;
}

const getCategories = () => {
  const all = ContentData.flatMap(item => Array.isArray(item.categoria) ? item.categoria : []);
  return Array.from(new Set(all));
};

const CategoryModal: React.FC<CategoryModalProps> = ({ visible, setVisible, selected, setSelected }) => {
  const slideAnim = useRef(new Animated.Value(-MODAL_WIDTH)).current;
  const categories = getCategories();

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -MODAL_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const toggleCategory = (cat: string) => {
    const newSelected = selected.includes(cat)
      ? selected.filter(c => c !== cat)
      : [...selected, cat];
    
    setSelected(newSelected);
    
    // Cerrar automáticamente el modal después de una breve pausa
    setTimeout(() => {
      handleClose();
    }, 300);
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <TouchableOpacity style={styles.overlay} onPress={handleClose} activeOpacity={1} />
        <Animated.View
          style={[
            styles.animatedBox,
            { width: MODAL_WIDTH, left: 0, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <Text style={styles.title}>Categorías</Text>
          <FlatList
            data={categories}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.category,
                  selected.includes(item) && styles.categorySelected,
                ]}
                onPress={() => toggleCategory(item)}
              >
                <Text style={[
                  styles.categoryText,
                  selected.includes(item) && styles.categoryTextSelected,
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
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
    backgroundColor: '#232323',
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 2, height: 0 },
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    marginTop: 30,
  },
  category: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#333',
  },
  categorySelected: {
    backgroundColor: '#DF2892',
  },
  categoryText: {
    color: '#fff',
    fontSize: 16,
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CategoryModal;