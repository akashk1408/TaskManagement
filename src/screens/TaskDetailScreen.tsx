import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';
import { useThemeStore } from '../store/themeStore';
import { TaskStatus } from '../types';

interface TaskDetailScreenProps {
  navigation: any;
  route: any;
}

export const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { taskId } = route.params || {};
  const isNewTask = taskId === null || taskId === undefined;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { tasks, createTask, updateTask, fetchTasks } = useTaskStore();
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (taskId && !isNewTask) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setTitle(task.title);
        setDescription(task.description);
        setStatus(task.status);
        if (task.dueDate) {
          setDueDate(new Date(task.dueDate));
        }
      } else {
        // Task not found, fetch tasks
        if (user) {
          fetchTasks(user.uid).then(() => {
            const updatedTask = tasks.find((t) => t.id === taskId);
            if (updatedTask) {
              setTitle(updatedTask.title);
              setDescription(updatedTask.description);
              setStatus(updatedTask.status);
              if (updatedTask.dueDate) {
                setDueDate(new Date(updatedTask.dueDate));
              }
            }
          });
        }
      }
    }
  }, [taskId, isNewTask, tasks]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setIsSaving(true);

    try {
      if (isNewTask) {
        await createTask(
          title,
          description,
          user.uid,
          dueDate ? dueDate.toISOString() : undefined
        );
      } else {
        await updateTask(taskId, {
          title,
          description,
          status,
          dueDate: dueDate ? dueDate.toISOString() : undefined,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save task'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    // Users can only update status from not_started to in_progress or completed
    if (user?.role === 'user') {
      if (status === 'not_started' && newStatus !== 'not_started') {
        setStatus(newStatus);
      } else if (status === 'in_progress' && newStatus === 'completed') {
        setStatus(newStatus);
      } else if (status === 'completed' && newStatus === 'completed') {
        // Already completed
        return;
      } else {
        Alert.alert(
          'Permission Denied',
          'You can only update tasks from "not started" to "in progress" or "completed"'
        );
        return;
      }
    } else {
      // Admin can change any status
      setStatus(newStatus);
    }
  };

  const handleDeleteDueDate = () => {
    setDueDate(null);
  };

  const styles = getStyles(isDark);
  const canEdit = user?.role === 'admin' || isNewTask;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isNewTask ? 'New Task' : 'Task Details'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || !title.trim()}
        >
          {isSaving ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <Text
              style={[
                styles.saveButton,
                (!title.trim() || isSaving) && styles.saveButtonDisabled,
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task title"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={title}
            onChangeText={setTitle}
            editable={canEdit}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter task description"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={canEdit}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusContainer}>
            {(['not_started', 'in_progress', 'completed'] as TaskStatus[]).map(
              (s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusButton,
                    status === s && styles.statusButtonActive,
                    !canEdit && styles.statusButtonDisabled,
                  ]}
                  onPress={() => handleStatusChange(s)}
                  disabled={!canEdit && user?.role === 'user'}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      status === s && styles.statusButtonTextActive,
                    ]}
                  >
                    {s.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Due Date</Text>
          <View style={styles.dateContainer}>
            {dueDate ? (
              <View style={styles.dateDisplay}>
                <Text style={styles.dateText}>
                  {dueDate.toLocaleDateString()}
                </Text>
                {canEdit && (
                  <TouchableOpacity
                    onPress={handleDeleteDueDate}
                    style={styles.deleteDateButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#ff4444" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                disabled={!canEdit}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={isDark ? '#fff' : '#000'}
                />
                <Text style={styles.dateButtonText}>Set due date</Text>
              </TouchableOpacity>
            )}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDueDate(selectedDate);
                }
              }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 60,
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#ddd',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    saveButton: {
      fontSize: 16,
      fontWeight: '600',
      color: '#007AFF',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    statusContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    statusButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: isDark ? '#2e2e2e' : '#f0f0f0',
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#ddd',
      alignItems: 'center',
    },
    statusButtonActive: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    statusButtonDisabled: {
      opacity: 0.5,
    },
    statusButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      textTransform: 'capitalize',
    },
    statusButtonTextActive: {
      color: '#fff',
    },
    dateContainer: {
      marginTop: 8,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 8,
      padding: 12,
      gap: 8,
    },
    dateButtonText: {
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    dateDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 8,
      padding: 12,
    },
    dateText: {
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    deleteDateButton: {
      padding: 4,
    },
  });

