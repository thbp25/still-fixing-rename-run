import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Menu, Sun, Moon, Clock, FolderPlus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

interface Project {
  id: string;
  name: string;
  duration: { minutes: number; seconds: number };
  wordCount: number;
  scriptName?: string;
  runs: Run[];
}

interface Run {
  id: string;
  name: string;
  date: string;
  duration: number;
  type: 'countdown' | 'stopwatch';
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showFabOptions, setShowFabOptions] = useState(false);
  const fabAnimation = new Animated.Value(0);
  const router = useRouter();

  useEffect(() => {
    loadProjects();
    loadTheme();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    try {
      const storedProjects = await AsyncStorage.getItem('projects');
      if (storedProjects) {
        setProjects(JSON.parse(storedProjects));
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('isDarkMode');
      if (storedTheme !== null) {
        setIsDarkMode(JSON.parse(storedTheme));
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
    setShowMenu(false);
  };

  const toggleFabOptions = () => {
    if (showFabOptions) {
      Animated.timing(fabAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowFabOptions(false));
    } else {
      setShowFabOptions(true);
      Animated.timing(fabAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleFabOptionPress = (route: string) => {
    toggleFabOptions();
    setTimeout(() => router.push(route), 100);
  };

  const renderProject = ({ item }: { item: Project }) => (
    <Animatable.View animation="fadeInUp" duration={600}>
      <TouchableOpacity
        style={[styles.projectCard, isDarkMode ? styles.projectCardDark : styles.projectCardLight]}
        onPress={() => router.push(`/project/${item.id}`)}
      >
        <Text style={[styles.projectName, isDarkMode ? styles.textDark : styles.textLight]}>
          {item.name}
        </Text>
        <Text style={[styles.projectDetails, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
          Duration: {item.duration.minutes}:{item.duration.seconds.toString().padStart(2, '0')}
        </Text>
        <Text style={[styles.projectDetails, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
          Words: {item.wordCount}
        </Text>
        <Text style={[styles.projectDetails, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
          Runs: {item.runs.length}
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  const currentStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <View style={[styles.container, currentStyles.container]}>
      <View style={[styles.header, currentStyles.header]}>
        <Text style={[styles.title, currentStyles.title]}>My Projects</Text>
        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
          <Menu size={24} color={isDarkMode ? "#ffffff" : "#000000"} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, currentStyles.emptyText]}>
              Start your first project!
            </Text>
          </View>
        ) : (
          <FlatList
            data={projects}
            renderItem={renderProject}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.projectsList}
          />
        )}
      </View>

      <View style={[styles.adPlaceholder, currentStyles.adPlaceholder]}>
        <Text style={styles.adText}>Google AdSense Placeholder</Text>
      </View>

      {showFabOptions && (
        <TouchableOpacity
          style={styles.fabOverlay}
          activeOpacity={1}
          onPress={toggleFabOptions}
        >
          <Animated.View
            style={[
              styles.fabOptionsContainer,
              {
                opacity: fabAnimation,
                transform: [
                  {
                    translateY: fabAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.fabOption, currentStyles.fabOption]}
              onPress={() => handleFabOptionPress('/quick-start')}
            >
              <Clock size={20} color={isDarkMode ? "#ffffff" : "#000000"} />
              <Text style={[styles.fabOptionText, currentStyles.fabOptionText]}>Quick Start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabOption, currentStyles.fabOption]}
              onPress={() => handleFabOptionPress('/new-project')}
            >
              <FolderPlus size={20} color={isDarkMode ? "#ffffff" : "#000000"} />
              <Text style={[styles.fabOptionText, currentStyles.fabOptionText]}>New Project</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.fab} onPress={toggleFabOptions}>
        <Plus size={28} color="#ffffff" />
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuModal, currentStyles.menuModal]}>
            <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
              {isDarkMode ? (
                <Sun size={20} color="#ffffff" />
              ) : (
                <Moon size={20} color="#000000" />
              )}
              <Text style={[styles.menuItemText, currentStyles.menuItemText]}>
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
  },
  projectsList: {
    paddingBottom: 20,
  },
  projectCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectCardLight: {
    backgroundColor: '#ffffff',
  },
  projectCardDark: {
    backgroundColor: '#2a2a2a',
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  projectDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  textLight: {
    color: '#1a1a2e',
  },
  textDark: {
    color: '#ffffff',
  },
  textSecondaryLight: {
    color: '#666',
  },
  textSecondaryDark: {
    color: '#cccccc',
  },
  adPlaceholder: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    borderRadius: 8,
  },
  adText: {
    color: '#666',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3282b8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  fabOptionsContainer: {
    position: 'absolute',
    bottom: 170,
    right: 20,
    gap: 12,
  },
  fabOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  menuModal: {
    borderRadius: 8,
    padding: 8,
    minWidth: 150,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#ffffff',
  },
  title: {
    color: '#1a1a2e',
  },
  emptyText: {
    color: '#666',
  },
  adPlaceholder: {
    backgroundColor: '#e0e0e0',
  },
  menuModal: {
    backgroundColor: '#ffffff',
  },
  menuItemText: {
    color: '#000000',
  },
  fabOption: {
    backgroundColor: '#ffffff',
  },
  fabOptionText: {
    color: '#000000',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    backgroundColor: '#2a2a2a',
  },
  title: {
    color: '#ffffff',
  },
  emptyText: {
    color: '#cccccc',
  },
  adPlaceholder: {
    backgroundColor: '#3a3a3a',
  },
  menuModal: {
    backgroundColor: '#2a2a2a',
  },
  menuItemText: {
    color: '#ffffff',
  },
  fabOption: {
    backgroundColor: '#2a2a2a',
  },
  fabOptionText: {
    color: '#ffffff',
  },
});