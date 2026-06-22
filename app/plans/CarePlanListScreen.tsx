import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import dayjs from 'dayjs';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const initialPlans = [
  {
    id: '1',
    type: 'sleep',
    title: 'Care plan for sleep',
    from: '2025-04-20',
    to: '2025-04-24',
  },
  {
    id: '2',
    type: 'mood',
    title: 'Care plan for mood',
    from: '2025-04-18',
    to: '2025-04-23',
  },
  {
    id: '3',
    type: 'sleep',
    title: 'Care plan for sleep',
    from: '2025-04-12',
    to: '2025-04-14',
  },
  {
    id: '4',
    type: 'sleep',
    title: 'Care plan for sleep',
    from: '2025-04-05',
    to: '2025-04-10',
  },
];

const CarePlanListScreen = ({ navigation }: any) => {
  const [plans, setPlans] = useState(initialPlans);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [endDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [tempEndDate, setTempEndDate] = useState(new Date());
  // Use system time for demo
  const today = dayjs('2025-05-01');

  const openDateModal = (plan: any) => {
    setSelectedPlan(plan);
    setTempEndDate(plan.to ? dayjs(plan.to).toDate() : today.toDate());
    setModalVisible(true);
  };

  const confirmDateChange = () => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === selectedPlan.id
          ? { ...p, from: today.format('YYYY-MM-DD'), to: dayjs(tempEndDate).format('YYYY-MM-DD') }
          : p
      )
    );
    setModalVisible(false);
    setSelectedPlan(null);
  };

  const renderPlanCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => openDateModal(item)}
    >
      <View style={styles.cardRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="file-document-outline" size={28} color="#8B5CF6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>{dayjs(item.from).format('MMM DD, YYYY')}</Text>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>{dayjs(item.to).format('MMM DD, YYYY')}</Text>
            </View>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={28} color="#A1A1AA" style={{ marginLeft: 8 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={["#E0F2FE", "#F3E8FF"]}
      style={styles.gradientBg}
    >
    <View style={styles.topBarContainer}>
  <View style={styles.topBar}>
    <Text style={styles.screenTitle}>Care plan</Text>
    <TouchableOpacity onPress={() => navigation?.navigate('OldPlansScreen')}>
      <Text style={styles.oldPlansLink}>Old plans</Text>
    </TouchableOpacity>
  </View>
  <View style={styles.divider} />
</View>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={renderPlanCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Date Picker Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)} />
        <Animated.View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select End Date</Text>
          <View style={styles.modalRow}>
            <View style={styles.modalCol}>
              <Text style={styles.modalLabel}>Start Date</Text>
              <Text style={styles.modalDate}>{today.format('MMM DD, YYYY')}</Text>
            </View>
            <View style={styles.modalCol}>
              <Text style={styles.modalLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.modalDateBtn}
                onPress={() => setEndDatePickerVisible(true)}
              >
                <Text style={styles.modalDate}>{dayjs(tempEndDate).format('MMM DD, YYYY')}</Text>
                <MaterialCommunityIcons name="calendar" size={20} color="#8B5CF6" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={confirmDateChange}>
            <Text style={styles.confirmBtnText}>Confirm</Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={endDatePickerVisible}
            mode="date"
            date={tempEndDate}
            minimumDate={today.toDate()}
            onConfirm={(date) => {
              setTempEndDate(date);
              setEndDatePickerVisible(false);
            }}
            onCancel={() => setEndDatePickerVisible(false)}
          />
        </Animated.View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  topBarContainer: {
    backgroundColor: 'white',
    paddingTop: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 14,
  },
  screenTitle: {
    fontWeight: '600',
    fontSize: 20,
    color: '#22223B',
  },
  oldPlansLink: {
    color: '#8B5CF6',
    fontWeight: '500',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 32,
    paddingTop: 20,
    paddingLeft:24,
    paddingRight:24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    padding: 8,
    marginRight: 14,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
    color: '#22223B',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 24,
  },
  dateCol: {
    marginRight: 18,
  },
  dateLabel: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateValue: {
    color: '#3730A3',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  modalSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#8B5CF6',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalCol: {
    flex: 1,
    alignItems: 'center',
  },
  modalLabel: {
    fontWeight: '500',
    color: '#A1A1AA',
    fontSize: 13,
    marginBottom: 6,
  },
  modalDate: {
    fontWeight: '600',
    fontSize: 15,
    color: '#22223B',
  },
  modalDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default CarePlanListScreen;
