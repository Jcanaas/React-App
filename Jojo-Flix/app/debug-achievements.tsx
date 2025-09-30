import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';

export default function DebugAchievements() {
  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView style={styles.content}>
        <Text style={styles.title}>DEBUG: Pantalla de Logros Simplificada</Text>
        
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>Si ves este texto, el problema no es de renderizado básico</Text>
        </View>
        
        <View style={styles.redBox}>
          <Text style={styles.whiteText}>Caja ROJA</Text>
        </View>
        
        <View style={styles.greenBox}>
          <Text style={styles.whiteText}>Caja VERDE</Text>
        </View>
        
        <View style={styles.blueBox}>
          <Text style={styles.whiteText}>Caja AZUL</Text>
        </View>
        
        {Array.from({ length: 5 }, (_, i) => (
          <View key={i} style={styles.achievementCard}>
            <Text style={styles.achievementTitle}>Logro {i + 1}</Text>
            <Text style={styles.achievementDesc}>Descripción del logro {i + 1}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  debugBox: {
    backgroundColor: '#333',
    padding: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  debugText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  redBox: {
    backgroundColor: '#FF0000',
    padding: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  greenBox: {
    backgroundColor: '#00FF00',
    padding: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  blueBox: {
    backgroundColor: '#0000FF',
    padding: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  whiteText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  achievementCard: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DF2892',
  },
  achievementTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  achievementDesc: {
    color: '#CCC',
    fontSize: 14,
  },
});