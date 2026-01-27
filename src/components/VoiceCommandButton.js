/**
 * Voice Command Button Component (FR-28 / M-06)
 * Floating action button for voice commands
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Text,
  TextInput,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceCommand } from '../contexts/VoiceCommandContext';
import { useLanguage } from '../contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VoiceCommandButton = ({ style, position = 'bottom-right' }) => {
  const {
    isEnabled,
    isListening,
    isProcessing,
    transcript,
    lastCommand,
    commandHistory,
    startListening,
    stopListening,
    processTextCommand,
    toggleVoiceCommands,
    getAvailableCommands,
    setRecognizedText,
  } = useVoiceCommand();

  const { language, t } = useLanguage();

  const [showModal, setShowModal] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [textInput, setTextInput] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  // Rotate animation when processing
  useEffect(() => {
    if (isProcessing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isProcessing]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePress = () => {
    if (!isEnabled) {
      toggleVoiceCommands();
      return;
    }
    setShowModal(true);
  };

  const handleLongPress = () => {
    setShowCommands(true);
  };

  const handleMicPress = async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  const handleTextSubmit = async () => {
    if (textInput.trim()) {
      setRecognizedText(textInput);
      await processTextCommand(textInput);
      setTextInput('');
    }
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'bottom-left':
        return { bottom: 100, left: 20 };
      case 'top-right':
        return { top: 100, right: 20 };
      case 'top-left':
        return { top: 100, left: 20 };
      case 'bottom-right':
      default:
        return { bottom: 100, right: 20 };
    }
  };

  const availableCommands = getAvailableCommands();

  const renderCommandItem = ({ item }) => (
    <TouchableOpacity
      style={styles.commandItem}
      onPress={async () => {
        setShowCommands(false);
        await processTextCommand(item);
      }}
    >
      <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
      <Text style={styles.commandText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyTranscript}>{item.transcript}</Text>
      <Text style={[
        styles.historyResult,
        { color: item.result.success ? '#4CAF50' : '#F44336' }
      ]}>
        {item.result.success ? item.result.action : 'Not recognized'}
      </Text>
    </View>
  );

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          getPositionStyle(),
          style,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            isEnabled ? styles.buttonEnabled : styles.buttonDisabled,
            isListening && styles.buttonListening,
          ]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ rotate: isProcessing ? spin : '0deg' }] }}>
            <Ionicons
              name={
                isProcessing
                  ? 'sync'
                  : isListening
                  ? 'mic'
                  : isEnabled
                  ? 'mic-outline'
                  : 'mic-off-outline'
              }
              size={28}
              color="#FFFFFF"
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Voice Command Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'ur' ? 'آواز کمانڈز' : 'Voice Commands'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Microphone Button */}
            <TouchableOpacity
              style={[
                styles.micButton,
                isListening && styles.micButtonListening
              ]}
              onPress={handleMicPress}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons
                  name={isListening ? 'mic' : 'mic-outline'}
                  size={48}
                  color="#FFFFFF"
                />
              </Animated.View>
            </TouchableOpacity>

            <Text style={styles.statusText}>
              {isListening
                ? (language === 'ur' ? 'سن رہا ہوں...' : 'Listening...')
                : isProcessing
                ? (language === 'ur' ? 'پروسیسنگ...' : 'Processing...')
                : (language === 'ur' ? 'مائیکروفون دبائیں' : 'Tap microphone to speak')}
            </Text>

            {/* Transcript Display */}
            {transcript ? (
              <View style={styles.transcriptContainer}>
                <Text style={styles.transcriptLabel}>
                  {language === 'ur' ? 'سنا گیا:' : 'Heard:'}
                </Text>
                <Text style={styles.transcriptText}>{transcript}</Text>
              </View>
            ) : null}

            {/* Last Command Result */}
            {lastCommand && (
              <View style={styles.lastCommandContainer}>
                <Text style={styles.lastCommandLabel}>
                  {language === 'ur' ? 'آخری کمانڈ:' : 'Last command:'}
                </Text>
                <Text style={[
                  styles.lastCommandResult,
                  { color: lastCommand.result.success ? '#4CAF50' : '#F44336' }
                ]}>
                  {lastCommand.result.success
                    ? `${lastCommand.result.action}${lastCommand.result.screen ? ` → ${lastCommand.result.screen}` : ''}`
                    : 'Not recognized'}
                </Text>
              </View>
            )}

            {/* Text Input for Accessibility */}
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={language === 'ur' ? 'کمانڈ لکھیں...' : 'Type a command...'}
                value={textInput}
                onChangeText={setTextInput}
                onSubmitEditing={handleTextSubmit}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleTextSubmit}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Show Commands Button */}
            <TouchableOpacity
              style={styles.showCommandsButton}
              onPress={() => setShowCommands(true)}
            >
              <Ionicons name="list" size={20} color="#4CAF50" />
              <Text style={styles.showCommandsText}>
                {language === 'ur' ? 'دستیاب کمانڈز دیکھیں' : 'View Available Commands'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Available Commands Modal */}
      <Modal
        visible={showCommands}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommands(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commandsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'ur' ? 'دستیاب کمانڈز' : 'Available Commands'}
              </Text>
              <TouchableOpacity onPress={() => setShowCommands(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableCommands}
              renderItem={renderCommandItem}
              keyExtractor={(item, index) => index.toString()}
              style={styles.commandsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonEnabled: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  buttonListening: {
    backgroundColor: '#F44336',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonListening: {
    backgroundColor: '#F44336',
    shadowColor: '#F44336',
  },
  statusText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  transcriptContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 16,
    color: '#333',
  },
  lastCommandContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  lastCommandLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  lastCommandResult: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  showCommandsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  showCommandsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  commandsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '70%',
  },
  commandsList: {
    maxHeight: 400,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commandText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyTranscript: {
    fontSize: 14,
    color: '#333',
  },
  historyResult: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default VoiceCommandButton;
