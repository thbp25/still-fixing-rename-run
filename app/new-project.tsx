import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Upload, FileText } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadAndParseDocument } from '../utils/documentParser';

export default function NewProject() {
  const [projectName, setProjectName] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [wordCount, setWordCount] = useState('');
  const [scriptUploaded, setScriptUploaded] = useState(false);
  const [scriptName, setScriptName] = useState('');
  const [manualWordCount, setManualWordCount] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const router = useRouter();

  useEffect(() => {
    generateDefaultName();
    loadTheme();
  }, []);

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

  const generateDefaultName = async () => {
    try {
      const storedProjects = await AsyncStorage.getItem('projects');
      const projects = storedProjects ? JSON.parse(storedProjects) : [];
      
      let counter = 1;
      let defaultName = 'Untitled';
      
      while (projects.some((p: any) => p.name === defaultName)) {
        defaultName = `Untitled ${counter}`;
        counter++;
      }
      
      setProjectName(defaultName);
    } catch (error) {
      setProjectName('Untitled');
    }
  };

  const handleSecondsChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue > 59) {
      const additionalMinutes = Math.floor(numValue / 60);
      const remainingSeconds = numValue % 60;
      const currentMinutes = parseInt(minutes) || 0;
      
      setMinutes((currentMinutes + additionalMinutes).toString());
      setSeconds(remainingSeconds.toString());
    } else {
      setSeconds(value);
    }
  };

  const uploadScript = async () => {
    try {
      const documentInfo = await uploadAndParseDocument();
      
      if (documentInfo) {
        setScriptName(documentInfo.name);
        setScriptUploaded(true);
        setManualWordCount(false);
        setWordCount(documentInfo.wordCount.toString());
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload script');
    }
  };

  const createProject = async () => {
    if (!projectName.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    if (!minutes && !seconds) {
      Alert.alert('Error', 'Please enter a duration');
      return;
    }

    if (!scriptUploaded && !wordCount) {
      Alert.alert('Error', 'Please upload a script or enter word count manually');
      return;
    }

    try {
      const storedProjects = await AsyncStorage.getItem('projects');
      const projects = storedProjects ? JSON.parse(storedProjects) : [];
      
      const newProject = {
        id: Date.now().toString(),
        name: projectName,
        duration: {
          minutes: parseInt(minutes) || 0,
          seconds: parseInt(seconds) || 0,
        },
        wordCount: parseInt(wordCount) || 0,
        scriptName: scriptUploaded ? scriptName : undefined,
        runs: [],
      };

      projects.push(newProject);
      await AsyncStorage.setItem('projects', JSON.stringify(projects));
      
      // Navigate to the project detail page instead of dashboard
      router.replace(`/project/${newProject.id}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create project');
    }
  };

  const currentStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <View style={[styles.container, currentStyles.container]}>
      <View style={[styles.header, currentStyles.header]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={isDarkMode ? "#ffffff" : "#000000"} />
        </TouchableOpacity>
        <Text style={[styles.title, currentStyles.title]}>New Project</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.label, currentStyles.label]}>Project Name</Text>
          <TextInput
            style={[styles.input, currentStyles.input]}
            value={projectName}
            onChangeText={setProjectName}
            placeholder="Enter project name"
            placeholderTextColor={isDarkMode ? "#666" : "#999"}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, currentStyles.label]}>Duration</Text>
          <View style={styles.durationContainer}>
            <View style={[styles.durationInput, currentStyles.input]}>
              <TextInput
                style={[styles.timeInput, currentStyles.timeInput]}
                value={minutes}
                onChangeText={setMinutes}
                placeholder="0"
                placeholderTextColor={isDarkMode ? "#666" : "#999"}
                keyboardType="numeric"
              />
              <Text style={[styles.timeLabel, currentStyles.timeLabel]}>min</Text>
            </View>
            <View style={[styles.durationInput, currentStyles.input]}>
              <TextInput
                style={[styles.timeInput, currentStyles.timeInput]}
                value={seconds}
                onChangeText={handleSecondsChange}
                placeholder="0"
                placeholderTextColor={isDarkMode ? "#666" : "#999"}
                keyboardType="numeric"
              />
              <Text style={[styles.timeLabel, currentStyles.timeLabel]}>s</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              currentStyles.uploadButton,
              scriptUploaded && styles.uploadButtonActive
            ]}
            onPress={uploadScript}
          >
            <Upload size={20} color={scriptUploaded ? "#ffffff" : "#3282b8"} />
            <Text style={[
              styles.uploadText,
              currentStyles.uploadText,
              scriptUploaded && styles.uploadTextActive
            ]}>
              {scriptUploaded ? `Uploaded: ${scriptName}` : 'Upload Script'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, currentStyles.label]}>Enter Word Count Manually</Text>
          <TextInput
            style={[
              styles.input,
              currentStyles.input,
              scriptUploaded && styles.inputDisabled
            ]}
            value={wordCount}
            onChangeText={setWordCount}
            placeholder="Enter word count"
            placeholderTextColor={isDarkMode ? "#666" : "#999"}
            keyboardType="numeric"
            editable={!scriptUploaded}
          />
          {scriptUploaded && (
            <Text style={[styles.helperText, currentStyles.helperText]}>
              Word count is automatically calculated from uploaded script
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.createButton} onPress={createProject}>
          <Text style={styles.createButtonText}>Create Project</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  durationContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  durationInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  timeLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3282b8',
    borderStyle: 'dashed',
  },
  uploadButtonActive: {
    backgroundColor: '#3282b8',
    borderStyle: 'solid',
  },
  uploadText: {
    fontSize: 16,
    marginLeft: 8,
  },
  uploadTextActive: {
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#3282b8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
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
  label: {
    color: '#1a1a2e',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
    color: '#000000',
  },
  timeInput: {
    color: '#000000',
  },
  timeLabel: {
    color: '#666',
  },
  uploadButton: {
    backgroundColor: '#ffffff',
  },
  uploadText: {
    color: '#3282b8',
  },
  helperText: {
    color: '#666',
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
  label: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
    color: '#ffffff',
  },
  timeInput: {
    color: '#ffffff',
  },
  timeLabel: {
    color: '#cccccc',
  },
  uploadButton: {
    backgroundColor: '#2a2a2a',
  },
  uploadText: {
    color: '#3282b8',
  },
  helperText: {
    color: '#cccccc',
  },
});