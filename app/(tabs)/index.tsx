import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';

export default function WelcomeScreen() {
  const [showWelcome, setShowWelcome] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
      router.replace('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!showWelcome) {
    return null;
  }

  return (
    <Animatable.View 
      animation="fadeIn" 
      duration={1000} 
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.content}>
        <Animatable.View 
          animation="bounceIn" 
          delay={500} 
          style={styles.logoContainer}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>Orator.io</Text>
          </View>
        </Animatable.View>
        <Animatable.Text 
          animation="fadeInUp" 
          delay={1000} 
          style={styles.slogan}
        >
          Pitch. Present. Perfect.
        </Animatable.Text>
      </View>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#3282b8',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3282b8',
  },
  slogan: {
    fontSize: 18,
    color: '#cccccc',
    fontWeight: '300',
    letterSpacing: 1,
  },
});