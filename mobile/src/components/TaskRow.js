import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { PRIORITY_TONE, STATUS_TONE } from './Layout';
import { Badge } from './Layout';
import { OptionSheet } from './OptionSheet';

const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'];
const TASK_PRIORITIES = ['Low', 'Medium', 'High'];

function isOverdue(task) {
  if (!task.dueDate || task.status === 'Completed') return false;
  return new Date(`${task.dueDate}T00:00:00`) < new Date(new Date().toDateString());
}

export function TaskRow({
  task,
  showProject = false,
  busy = false,
  onToggleComplete,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
}) {
  const theme = useAppTheme();
  const [sheet, setSheet] = useState(null);
  const complete = task.status === 'Completed';
  const overdue = isOverdue(task);

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Pressable
        onPress={() => onToggleComplete(task)}
        disabled={busy}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: complete }}
        accessibilityLabel={`Mark ${task.name} as ${complete ? 'pending' : 'completed'}`}
        style={styles.checkbox}
      >
        <View
          style={[
            styles.checkboxBox,
            {
              borderColor: complete ? theme.brand.green600 : theme.borderStrong,
              backgroundColor: complete ? theme.brand.green600 : 'transparent',
            },
          ]}
        >
          {complete ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
        </View>
      </Pressable>

      <Pressable
        style={styles.main}
        onPress={() => onEdit(task)}
        onLongPress={() =>
          Alert.alert(task.name, 'What would you like to do?', [
            { text: 'Edit', onPress: () => onEdit(task) },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(task) },
            { text: 'Cancel', style: 'cancel' },
          ])
        }
        accessibilityRole="button"
        accessibilityLabel={`${task.name}. Tap to edit, long press for more options.`}
      >
        <Text
          style={[
            styles.name,
            { color: complete ? theme.textSubtle : theme.text },
            complete && styles.nameDone,
          ]}
          numberOfLines={2}
        >
          {task.name}
        </Text>

        <Text style={[styles.meta, { color: overdue ? theme.tints.danger.text : theme.textSubtle }]}>
          {showProject ? `${task.projectName} · ` : ''}
          {task.dueDate ? `${overdue ? 'Overdue: ' : 'Due '}${task.dueDate}` : 'No due date'}
        </Text>

        <View style={styles.badges}>
          <Pressable
            onPress={() => setSheet('status')}
            accessibilityRole="button"
            accessibilityLabel={`Change status for ${task.name}, currently ${task.status}`}
            disabled={busy}
          >
            <Badge label={task.status} tone={STATUS_TONE[task.status]} />
          </Pressable>

          <Pressable
            onPress={() => setSheet('priority')}
            accessibilityRole="button"
            accessibilityLabel={`Change priority for ${task.name}, currently ${task.priority}`}
            disabled={busy}
          >
            <Badge label={`${task.priority} priority`} tone={PRIORITY_TONE[task.priority]} />
          </Pressable>
        </View>
      </Pressable>

      <OptionSheet
        visible={sheet === 'status'}
        title="Task status"
        options={TASK_STATUSES}
        value={task.status}
        onSelect={(next) => {
          setSheet(null);
          if (next !== task.status) onStatusChange(task, next);
        }}
        onClose={() => setSheet(null)}
      />

      <OptionSheet
        visible={sheet === 'priority'}
        title="Task priority"
        options={TASK_PRIORITIES}
        value={task.priority}
        onSelect={(next) => {
          setSheet(null);
          if (next !== task.priority) onPriorityChange(task, next);
        }}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  checkbox: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '600' },
  nameDone: { textDecorationLine: 'line-through' },
  meta: { fontSize: 12 },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
});
