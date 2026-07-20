import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config/colors';
import { Typography } from '../config/typography';
import { Spacing, BorderRadius, PaddingSizes, MarginSizes } from '../config/spacing';

const { width } = Dimensions.get('window');

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmButtonColor?: string;
  confirmTextColor?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackgroundColor?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmButtonColor = Colors.error,
  confirmTextColor = Colors.background,
  iconName = 'warning-outline',
  iconColor = Colors.error,
  iconBackgroundColor = Colors.errorBackground,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Icon Container */}
              <View style={[styles.iconWrapper, { backgroundColor: iconBackgroundColor }]}>
                <Ionicons name={iconName} size={28} color={iconColor} />
              </View>

              {/* Text Content */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: confirmButtonColor }]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.confirmButtonText, { color: confirmTextColor }]}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>

                {cancelText && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onCancel}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.backgroundOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: PaddingSizes.large,
  },
  modalContainer: {
    width: width - Spacing['2xl'] * 2,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: PaddingSizes.extraLarge,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: MarginSizes.medium,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: MarginSizes.small,
  },
  description: {
    ...Typography.body_medium,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: MarginSizes.extraLarge,
    lineHeight: 20,
  },
  actionsContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  confirmButton: {
    width: '100%',
    paddingVertical: PaddingSizes.normal,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    ...Typography.body_large,
    fontWeight: '600',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: PaddingSizes.normal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...Typography.body_large,
    color: Colors.text,
    fontWeight: '600',
  },
});
