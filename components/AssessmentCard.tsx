import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface AssessmentCardProps {
  title: string;
  description: string;
  status: string;
  onPress: () => void;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({ title, description, status, onPress }) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
    <View style={styles.headerRow}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.statusContainer}>
        <Text style={[styles.status, status === 'Completed' ? styles.completed : styles.pending]}>{status}</Text>
        <Icon name="chevron-right" size={22} color="#B0B0B0" />
      </View>
    </View>
    <Text style={styles.description}>{description}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginVertical: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    flex: 1,
    marginRight: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 4,
  },
  completed: {
    color: '#4CAF50',
  },
  pending: {
    color: '#FF9800',
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
});

export default AssessmentCard;
