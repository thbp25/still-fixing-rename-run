import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Play, Clock, CreditCard as Edit, Trash2, Upload, Timer } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadAndParseDocument } from '../../utils/documentParser';
import { useFocusEffect } from '@react-navigation/native';

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

export default function ProjectDetail() {
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [editWordCount, setEditWordCount] = useState('');
  const [editScriptName, setEditScriptName] = useState('');
  const [hasScript, setHasScript] = useState(false);
  const [editMinutes, setEditMinutes] = useState('');
  const [editSeconds, setEditSeconds] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadProject();
    loadTheme();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      loadProject();
    }, [id])
  );

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

  const loadProject = async () => {
    try {
      const storedProjects = await AsyncStorage.getItem('projects');
      if (storedProjects) {
        const projects = JSON.parse(storedProjects);
        const foundProject = projects.find((p: Project) => p.id === id);
        if (foundProject) {
          setProject(foundProject);
          setEditWordCount(foundProject.wordCount.toString());
          setEditScriptName(foundProject.scriptName || '');
          setHasScript(!!foundProject.scriptName);
          setEditMinutes(foundProject.duration.minutes.toString());
          setEditSeconds(foundProject.duration.seconds.toString());
        }
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const createNewRun = () => {
    if (!project) return;
    showViewOptions();
  };

  const showViewOptions = () => {
    Alert.alert(
      'Select View',
      'Choose timer view',
      [
        {
          text: 'Countdown View',
          onPress: () => startRun('countdown'),
        },
        {
          text: 'Stopwatch View',
          onPress: () => startRun('stopwatch'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const startRun = (viewType: 'countdown' | 'stopwatch') => {
    if (!project) return;

    const runName = `Run #${project.runs.length + 1}`;
    const totalSeconds = project.duration.minutes * 60 + project.duration.seconds;
    
    router.push({
      pathname: '/timer',
      params: {
        projectId: project.id,
        runName: runName,
        duration: totalSeconds,
        minutes: project.duration.minutes,
        seconds: project.duration.seconds,
        mode: viewType,
      },
    });
  };

  const uploadNewScript = async () => {
    try {
      const documentInfo = await uploadAndParseDocument();
      
      if (documentInfo) {
        setEditScriptName(documentInfo.name);
        setHasScript(true);
        setEditWordCount(documentInfo.wordCount.toString());
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload script');
    }
  };

  const removeScript = () => {
    setEditScriptName('');
    setHasScript(false);
  };

  const handleLongPressRun = (run: Run) => {
    Alert.alert(
      'Run Options',
      `What would you like to do with "${run.name}"?`,
      [
        {
          text: 'Rename',
          onPress: () => showRenameDialog(run),
        },
        {
          text: 'Delete',
          onPress: () => confirmDeleteRun(run),
          style: 'destructive',
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const showRenameDialog = (run: Run) => {
    // Create a custom modal for renaming since Alert.prompt doesn't work reliably
    const [tempName, setTempName] = useState(run.name);
    
    Alert.alert(
      'Rename Run',
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            // We'll handle this with a proper input modal
            showRenameModal(run);
          },
        },
      ]
    );
  };

  const showRenameModal = (run: Run) => {
    Alert.prompt(
      'Rename Run',
      'Enter new name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (newName) => {
            if (newName && newName.trim()) {
              renameRun(run.id, newName.trim());
            }
          },
        },
      ],
      'plain-text',
      run.name
    );
  };

  const confirmDeleteRun = (run: Run) => {
    Alert.alert(
      'Delete Run',
      `Are you sure you want to delete "${run.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => deleteRun(run.id),
          style: 'destructive',
        },
      ]
    );
  };

  const renameRun = async (runId: string, newName: string) => {
    if (!project) return;

    try {
      const storedProjects = await AsyncStorage.getItem('projects');
      if (storedProjects) {
        const projects = JSON.parse(storedProjects);
        const projectIndex = projects.findIndex((p: Project) => p.id === project.id);
        
        if (projectIndex !== -1) {
          const runIndex = projects[projectIndex].runs.findIndex((r: Run) => r.id === runId);
          if (runIndex !== -1) {
            projects[projectIndex].runs[runIndex].name = newName;
            await AsyncStorage.setItem('projects', JSON.stringify(projects));
            setProject(projects[projectIndex]);
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to rename run');
    }
  };

  const deleteRun = async (runId: string) => {
    if (!project) return;

    try {
      const storedProjects = await AsyncStorage.getItem('projects');
      if (storedProjects) {
        const projects = JSON.parse(storedProjects);
        const projectIndex = projects.findIndex((p: Project) => p.id === project.id);
        
        if (projectIndex !== -1) {
          projects[projectIndex].runs = projects[projectIndex].runs.filter((r: Run) => r.id !== runId);
          await AsyncStorage.setItem('projects', JSON.stringify(projects));
          setProject(projects[projectIndex]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete run');
    }
  };

  const saveChanges = async () => {
    if (!project) return;

    try {
      const storedProjects = await AsyncStorage.getItem('projects');
      if (storedProjects) {
        const projects = JSON.parse(storedProjects);
        const projectIndex = projects.findIndex((p: Project) => p.id === project.id);
        
        if (projectIndex !== -1) {
          projects[projectIndex] = {
            ...project,
            wordCount: parseInt(editWordCount) || 0,
            scriptName: hasScript ? editScriptName : undefined,
          };
          
          await AsyncStorage.setItem('projects', JSON.stringify(projects));
          setProject(projects[projectIndex]);
          setShowEditModal(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleSecondsChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue > 59) {
      const additionalMinutes = Math.floor(numValue / 60);
      const remainingSeconds = numValue % 60;
      const currentMinutes = parseInt(editMinutes) || 0;
      
      setEditMinutes((currentMinutes + additionalMinutes).toString());
      setEditSeconds(remainingSeconds.toString());
    } else {
      setEditSeconds(value);
    }
  };

  const saveDurationChanges = async () => {
    if (!project) return;

    const minutes = parseInt(editMinutes) || 0;
    const seconds = parseInt(editSeconds) || 0;

    if (minutes === 0 && seconds === 0) {
      Alert.alert('Error', 'Duration cannot be zero');
      return;
    }

    try {
      const storedProjects = await AsyncStorage.getItem('projects');
      if (storedProjects) {
        const projects = JSON.parse(storedProjects);
        const projectIndex = projects.findIndex((p: Project) => p.id === project.id);
        
        if (projectIndex !== -1) {
          projects[projectIndex] = {
            ...project,
            duration: { minutes, seconds },
          };
          
          await AsyncStorage.setItem('projects', JSON.stringify(projects));
          setProject(projects[projectIndex]);
          setShowDurationModal(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save duration changes');
    }
  };

  const renderRun = ({ item }: { item: Run }) => (
    <TouchableOpacity 
      style={[styles.runCard, isDarkMode ? styles.runCardDark : styles.runCardLight]}
      onLongPress={() => handleLongPressRun(item)}
      delayLongPress={500}
    >
      <View style={styles.runHeader}>
        <Text style={[styles.runName, isDarkMode ? styles.textDark : styles.textLight]}>
          {item.name}
        </Text>
        <Text style={[styles.runDate, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.runDetails}>
        <Text style={[styles.runDetail, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>
          Duration: {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!project) {
    return (
      <View style={[styles.container, isDarkMode ? darkStyles.container : lightStyles.container]}>
        <Text style={isDarkMode ? styles.textDark : styles.textLight}>Loading...</Text>
      </View>
    );
  }

  const currentStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <View style={[styles.container, currentStyles.container]}>
      <View style={[styles.header, currentStyles.header]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={isDarkMode ? "#ffffff" : "#000000"} />
        </TouchableOpacity>
        <Text style={[styles.title, currentStyles.title]}>{project.name}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.projectInfo}>
          <View style={[styles.infoCard, currentStyles.infoCard]}>
            <Clock size={24} color="#3282b8" />
            <Text style={[styles.infoText, currentStyles.infoText]}>
              {project.duration.minutes}:{project.duration.seconds.toString().padStart(2, '0')}
            </Text>
            <TouchableOpacity onPress={() => setShowDurationModal(true)} style={styles.editButton}>
              <Edit size={16} color="#3282b8" />
            </TouchableOpacity>
          </View>
          <View style={[styles.infoCard, currentStyles.infoCard]}>
            <Text style={[styles.infoLabel, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>Words</Text>
            <Text style={[styles.infoText, currentStyles.infoText]}>{project.wordCount}</Text>
            <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.editButton}>
              <Edit size={16} color="#3282b8" />
            </TouchableOpacity>
          </View>
          {project.scriptName && (
            <View style={[styles.infoCard, currentStyles.infoCard]}>
              <Text style={[styles.infoLabel, isDarkMode ? styles.textSecondaryDark : styles.textSecondaryLight]}>Script</Text>
              <Text style={[styles.infoText, currentStyles.infoText]} numberOfLines={1}>
                {project.scriptName}
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.editButton}>
                <Edit size={16} color="#3282b8" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.newRunButton} onPress={createNewRun}>
          <Play size={20} color="#ffffff" />
          <Text style={styles.newRunButtonText}>New Run</Text>
        </TouchableOpacity>

        <View style={styles.runsSection}>
          <Text style={[styles.sectionTitle, currentStyles.sectionTitle]}>Past Runs</Text>
          {project.runs.length === 0 ? (
            <Text style={[styles.emptyText, currentStyles.emptyText]}>No runs yet</Text>
          ) : (
            <FlatList
              data={project.runs}
              renderItem={renderRun}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      <View style={[styles.adPlaceholder, currentStyles.adPlaceholder]}>
        <Text style={styles.adText}>Google AdSense Placeholder</Text>
      </View>

      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModal, currentStyles.editModal]}>
            <Text style={[styles.modalTitle, currentStyles.modalTitle]}>Edit Project</Text>
            
            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, currentStyles.modalLabel]}>Word Count</Text>
              <TextInput
                style={[
                  styles.modalInput, 
                  currentStyles.modalInput,
                  hasScript && styles.modalInputDisabled
                ]}
                value={editWordCount}
                onChangeText={setEditWordCount}
                placeholder="Enter word count"
                placeholderTextColor={isDarkMode ? "#666" : "#999"}
                keyboardType="numeric"
                editable={!hasScript}
              />
              {hasScript && (
                <Text style={[styles.helperText, currentStyles.helperText]}>
                  Word count is automatically calculated from uploaded script
                </Text>
              )}
            </View>

            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, currentStyles.modalLabel]}>Script</Text>
              {hasScript ? (
                <View style={styles.scriptContainer}>
                  <Text style={[styles.scriptName, currentStyles.scriptName]} numberOfLines={1}>
                    {editScriptName}
                  </Text>
                  <View style={styles.scriptActions}>
                    <TouchableOpacity onPress={uploadNewScript} style={styles.scriptActionButton}>
                      <Upload size={16} color="#3282b8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={removeScript} style={styles.scriptActionButton}>
                      <Trash2 size={16} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.uploadButton, currentStyles.uploadButton]}
                  onPress={uploadNewScript}
                >
                  <Upload size={16} color="#3282b8" />
                  <Text style={[styles.uploadText, currentStyles.uploadText]}>Upload Script</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveChanges}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDurationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDurationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModal, currentStyles.editModal]}>
            <Text style={[styles.modalTitle, currentStyles.modalTitle]}>Edit Duration</Text>
            
            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, currentStyles.modalLabel]}>Duration</Text>
              <View style={styles.durationContainer}>
                <View style={[styles.durationInput, currentStyles.modalInput]}>
                  <TextInput
                    style={[styles.timeInput, currentStyles.timeInput]}
                    value={editMinutes}
                    onChangeText={setEditMinutes}
                    placeholder="0"
                    placeholderTextColor={isDarkMode ? "#666" : "#999"}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.timeLabel, currentStyles.timeLabel]}>min</Text>
                </View>
                <View style={[styles.durationInput, currentStyles.modalInput]}>
                  <TextInput
                    style={[styles.timeInput, currentStyles.timeInput]}
                    value={editSeconds}
                    onChangeText={handleSecondsChange}
                    placeholder="0"
                    placeholderTextColor={isDarkMode ? "#666" : "#999"}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.timeLabel, currentStyles.timeLabel]}>s</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDurationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveDurationChanges}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  projectInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flex: 1,
    minWidth: 120,
  },
  infoLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  newRunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3282b8',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 24,
  },
  newRunButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  runsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  runCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  runCardLight: {
    backgroundColor: '#ffffff',
  },
  runCardDark: {
    backgroundColor: '#2a2a2a',
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  runName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  runDate: {
    fontSize: 12,
  },
  runDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  runDetail: {
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModal: {
    margin: 20,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  scriptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scriptName: {
    flex: 1,
    fontSize: 14,
  },
  scriptActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scriptActionButton: {
    padding: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#3282b8',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 14,
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: '#3282b8',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalInputDisabled: {
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
  sectionTitle: {
    color: '#1a1a2e',
  },
  emptyText: {
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#ffffff',
  },
  infoText: {
    color: '#1a1a2e',
  },
  adPlaceholder: {
    backgroundColor: '#e0e0e0',
  },
  editModal: {
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    color: '#1a1a2e',
  },
  modalLabel: {
    color: '#1a1a2e',
  },
  modalInput: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
    color: '#000000',
  },
  scriptName: {
    color: '#1a1a2e',
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
  timeInput: {
    color: '#000000',
  },
  timeLabel: {
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
  sectionTitle: {
    color: '#ffffff',
  },
  emptyText: {
    color: '#cccccc',
  },
  infoCard: {
    backgroundColor: '#2a2a2a',
  },
  infoText: {
    color: '#ffffff',
  },
  adPlaceholder: {
    backgroundColor: '#3a3a3a',
  },
  editModal: {
    backgroundColor: '#2a2a2a',
  },
  modalTitle: {
    color: '#ffffff',
  },
  modalLabel: {
    color: '#ffffff',
  },
  modalInput: {
    backgroundColor: '#3a3a3a',
    borderColor: '#4a4a4a',
    color: '#ffffff',
  },
  scriptName: {
    color: '#ffffff',
  },
  uploadButton: {
    backgroundColor: '#3a3a3a',
  },
  uploadText: {
    color: '#3282b8',
  },
  helperText: {
    color: '#cccccc',
  },
  timeInput: {
    color: '#ffffff',
  },
  timeLabel: {
    color: '#cccccc',
  },
});