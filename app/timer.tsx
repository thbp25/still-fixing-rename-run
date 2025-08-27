import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Save, RotateCcw, Play, Pause, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function Timer() {
  const {
    projectId,
    runName,
    duration,
    minutes,
    seconds,
    mode,
    isQuickStart,
  } = useLocalSearchParams();

  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = parseInt(duration as string);
  const initialMinutes = parseInt(minutes as string);
  const initialSeconds = parseInt(seconds as string);

  const [currentTime, setCurrentTime] = useState(totalDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState(mode as 'countdown' | 'stopwatch');
  const [laps, setLaps] = useState<{ number: number; time: string }[]>([]);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (viewMode === 'stopwatch') {
      setCurrentTime(0);
    } else {
      setCurrentTime(totalDuration);
    }
  }, [totalDuration]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (viewMode === 'countdown') {
            return prev - 1;
          } else {
            const newTime = prev + 1;
            if (newTime > totalDuration && !blinkIntervalRef.current) {
              // Start blinking when time is exceeded
              blinkIntervalRef.current = setInterval(() => {
                setIsBlinking(prev => !prev);
              }, 500);
            }
            return newTime;
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, viewMode, totalDuration]);

  useEffect(() => {
    return () => {
      if (blinkIntervalRef.current) {
        clearInterval(blinkIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (timeInSeconds: number) => {
    const isNegative = timeInSeconds < 0;
    const absTime = Math.abs(timeInSeconds);
    const mins = Math.floor(absTime / 60);
    const secs = absTime % 60;
    const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return isNegative ? `-${formattedTime}` : formattedTime;
  };

  const getTimerColor = () => {
    if (viewMode === 'countdown') {
      return currentTime < 0 ? '#F44336' : '#ffffff'; // Red for negative, white for positive
    } else {
      // Stopwatch mode
      if (currentTime > totalDuration) {
        return '#F44336'; // Red when exceeded
      }
      
      const progress = currentTime / totalDuration;
      const timeRemaining = totalDuration - currentTime;
      
      if (timeRemaining <= 60) return '#F44336'; // Red for last minute
      if (progress >= 0.7) return '#FF9800'; // Yellow for last 30%
      return '#4CAF50'; // Green for first 70%
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setLaps([]);
    setIsBlinking(false);
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
    }
    if (viewMode === 'countdown') {
      setCurrentTime(totalDuration);
    } else {
      setCurrentTime(0);
    }
  };

  const handleLap = () => {
    const lapTime = formatTime(viewMode === 'countdown' ? totalDuration - currentTime : currentTime);
    setLaps(prev => [{ number: prev.length + 1, time: lapTime }, ...prev]);
  };

  const toggleView = () => {
    const newMode = viewMode === 'countdown' ? 'stopwatch' : 'countdown';
    setViewMode(newMode);
    
    // Convert current time to the new mode without resetting
    if (newMode === 'stopwatch') {
      // Converting from countdown to stopwatch
      setCurrentTime(totalDuration - currentTime);
    } else {
      // Converting from stopwatch to countdown
      setCurrentTime(totalDuration - currentTime);
    }
  };

  const saveAndExit = async () => {
    if (isQuickStart === 'true') {
      router.back();
      return;
    }

    try {
      const storedProjects = await AsyncStorage.getItem('projects');
      if (storedProjects && projectId) {
        const projects = JSON.parse(storedProjects);
        const projectIndex = projects.findIndex((p: any) => p.id === projectId);
        
        if (projectIndex !== -1) {
          const newRun = {
            id: Date.now().toString(),
            name: runName as string,
            date: new Date().toISOString(),
            duration: viewMode === 'countdown' ? totalDuration - currentTime : currentTime,
            type: viewMode,
          };

          projects[projectIndex].runs.push(newRun);
          await AsyncStorage.setItem('projects', JSON.stringify(projects));
        }
      }
      
      router.back();
    } catch (error) {
      console.error('Error saving run:', error);
      router.back();
    }
  };

  const timerStyle = [
    styles.timer,
    { color: getTimerColor() },
    (viewMode === 'stopwatch' && currentTime > totalDuration && isBlinking) && styles.blinking
  ];

  return (
    <View style={[styles.container, styles.landscape]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={saveAndExit} style={styles.saveButton}>
          <Save size={16} color="#ffffff" />
          <Text style={styles.saveText}>
            {isQuickStart === 'true' ? 'Exit' : 'Save & Exit'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={toggleView} style={styles.toggleButton}>
          <Text style={styles.toggleText}>
            Toggle to {viewMode === 'countdown' ? 'Stopwatch' : 'Countdown'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.leftControls}>
          <TouchableOpacity
            style={[styles.controlButton, (!isRunning || isPaused) && styles.controlButtonDisabled]}
            onPress={handleReset}
            disabled={!isRunning && !isPaused}
          >
            <RotateCcw size={20} color={(!isRunning && !isPaused) ? "#666" : "#ffffff"} />
            <Text style={[styles.controlText, (!isRunning && !isPaused) && styles.controlTextDisabled]}>
              Reset
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton]}
            onPress={isRunning && !isPaused ? handlePause : isPaused ? handleResume : handleStart}
          >
            {isRunning && !isPaused ? (
              <Pause size={24} color="#ffffff" />
            ) : (
              <Play size={24} color="#ffffff" />
            )}
            <Text style={styles.primaryButtonText}>
              {isRunning && !isPaused ? 'Pause' : isPaused ? 'Resume' : 'Start'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, (!isRunning || isPaused) && styles.controlButtonDisabled]}
            onPress={handleLap}
            disabled={!isRunning || isPaused}
          >
            <Clock size={20} color={(!isRunning || isPaused) ? "#666" : "#ffffff"} />
            <Text style={[styles.controlText, (!isRunning || isPaused) && styles.controlTextDisabled]}>
              Lap
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timerContainer}>
          <Text style={timerStyle}>
            {formatTime(currentTime)}
          </Text>
        </View>

        {laps.length > 0 && (
          <View style={styles.lapsContainer}>
            <Text style={styles.lapsTitle}>Laps</Text>
            <ScrollView 
              style={styles.lapsScroll}
              showsVerticalScrollIndicator={true}
            >
              {laps.slice(0, 5).map((lap) => (
                <View key={lap.number} style={styles.lapItem}>
                  <Text style={styles.lapNumber}>Lap {lap.number}</Text>
                  <Text style={styles.lapTime}>{lap.time}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  landscape: {
    transform: [{ rotate: '90deg' }],
    width: height,
    height: width,
    position: 'absolute',
    top: (height - width) / 2,
    left: (width - height) / 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#2a2a2a',
    height: 60,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    backgroundColor: '#3282b8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  leftControls: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 20,
    gap: 20,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3a3a3a',
  },
  controlButtonDisabled: {
    backgroundColor: '#2a2a2a',
  },
  primaryButton: {
    backgroundColor: '#3282b8',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  controlText: {
    fontSize: 10,
    color: '#ffffff',
    marginTop: 2,
    fontWeight: '600',
  },
  controlTextDisabled: {
    color: '#666',
  },
  primaryButtonText: {
    fontSize: 10,
    color: '#ffffff',
    marginTop: 2,
    fontWeight: 'bold',
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 120, // Account for laps container
  },
  timer: {
    fontSize: width * 0.25,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  blinking: {
    opacity: 0.5,
  },
  lapsContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    bottom: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    width: 140,
  },
  lapsScroll: {
    flex: 1,
  },
  lapsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  lapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  lapNumber: {
    fontSize: 11,
    color: '#cccccc',
  },
  lapTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
});