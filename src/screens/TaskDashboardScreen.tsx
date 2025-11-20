import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/syncStore';
import { useTaskStore } from '../store/taskStore';
import { useThemeStore } from '../store/themeStore';
import { Task, TaskStatus } from '../types';

// Type for sort options
type SortOption = 'assignedDate' | 'dueDate' | 'title';

// Type for navigation prop
interface TaskDashboardScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

// Type for FlatList render item
interface RenderItemProps {
  item: Task;
}

export const TaskDashboardScreen: React.FC<TaskDashboardScreenProps> = ({
  navigation,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('assignedDate');
  const [filterByStatus, setFilterByStatus] = useState<TaskStatus | undefined>(
    undefined
  );
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const { tasks, isLoading, fetchTasks, filterTasks, deleteTask, syncTasks } =
    useTaskStore();
  const { user, logout } = useAuthStore();
  const { isOnline, pendingActions } = useSyncStore();
  const { isDark, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (user) {
      fetchTasks(user.uid);
    }
  }, [user, fetchTasks]);

  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncTasks(user?.uid || '');
    }
  }, [isOnline, pendingActions.length, syncTasks, user?.uid]);

  const handleRefresh = useCallback(() => {
    if (user) {
      fetchTasks(user.uid);
      if (isOnline) {
        syncTasks(user.uid);
      }
    }
  }, [user, isOnline, fetchTasks, syncTasks]);

  const handleDeleteTask = (taskId: string): void => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTask(taskId),
        },
      ]
    );
  };

  const filteredTasks = filterTasks(searchQuery, sortBy, filterByStatus);

  const renderTaskItem = ({ item }: RenderItemProps): React.ReactElement => {
    const styles = getStyles(isDark);
    return (
      <TouchableOpacity
        style={styles.taskItem}
        onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
      >
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text
              style={[
                styles.taskTitle,
                item.completed && styles.taskTitleCompleted,
              ]}
            >
              {item.title}
            </Text>
            <View style={styles.taskActions}>
              {user?.role === 'admin' && (
                <TouchableOpacity
                  onPress={() => handleDeleteTask(item.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text
            style={[
              styles.taskDescription,
              item.completed && styles.taskDescriptionCompleted,
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <View style={styles.taskMeta}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            {item.dueDate && (
              <Text style={styles.dueDate}>
                Due: {new Date(item.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        {item.completed && (
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        )}
      </TouchableOpacity>
    );
  };

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <Text style={styles.headerSubtitle}>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
          {pendingActions.length > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>{pendingActions.length}</Text>
            </View>
          )}
          <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={24}
              color={isDark ? '#fff' : '#000'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color={isDark ? '#666' : '#999'}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <Ionicons
            name="filter-outline"
            size={20}
            color={isDark ? '#fff' : '#000'}
          />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Sort by:</Text>
          <View style={styles.filterButtons}>
            {(['assignedDate', 'dueDate', 'title'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.filterButtonOption,
                  sortBy === option && styles.filterButtonOptionActive,
                ]}
                onPress={() => setSortBy(option)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    sortBy === option && styles.filterButtonTextActive,
                  ]}
                >
                  {option === 'assignedDate'
                    ? 'Assigned'
                    : option === 'dueDate'
                    ? 'Due Date'
                    : 'Title'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Filter by status:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButtonOption,
                filterByStatus === undefined &&
                  styles.filterButtonOptionActive,
              ]}
              onPress={() => setFilterByStatus(undefined)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterByStatus === undefined &&
                    styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {(['not_started', 'in_progress', 'completed'] as TaskStatus[]).map(
              (status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButtonOption,
                    filterByStatus === status &&
                      styles.filterButtonOptionActive,
                  ]}
                  onPress={() => setFilterByStatus(status)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterByStatus === status &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {status.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      )}

      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item: Task) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color={isDark ? '#444' : '#ccc'}
            />
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        }
      />

      {user?.role === 'admin' && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => {
            console.log('FAB pressed, navigating to TaskDetail');
            navigation.navigate('TaskDetail', { taskId: null });
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
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
      fontSize: 28,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    headerSubtitle: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#666',
      marginTop: 4,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    offlineBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ff9800',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    offlineText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    pendingBadge: {
      backgroundColor: '#2196F3',
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pendingText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    themeButton: {
      padding: 4,
    },
    logoutButton: {
      padding: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      margin: 16,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    filterButton: {
      padding: 4,
    },
    filtersContainer: {
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#ddd',
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    filterButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    filterButtonOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: isDark ? '#2e2e2e' : '#f0f0f0',
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#ddd',
    },
    filterButtonOptionActive: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    filterButtonText: {
      fontSize: 12,
      color: isDark ? '#fff' : '#000',
    },
    filterButtonTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    listContent: {
      padding: 16,
      paddingBottom: 90, // Extra padding for FAB
    },
    taskItem: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
      alignItems: 'center',
    },
    taskContent: {
      flex: 1,
    },
    taskHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    taskTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      flex: 1,
    },
    taskTitleCompleted: {
      textDecorationLine: 'line-through',
      opacity: 0.6,
    },
    taskActions: {
      flexDirection: 'row',
      gap: 8,
    },
    deleteButton: {
      padding: 4,
    },
    taskDescription: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#666',
      marginBottom: 8,
    },
    taskDescriptionCompleted: {
      opacity: 0.6,
    },
    taskMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    statusBadge: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    dueDate: {
      fontSize: 12,
      color: isDark ? '#aaa' : '#666',
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      zIndex: 1000,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#666' : '#999',
      marginTop: 16,
    },
  });