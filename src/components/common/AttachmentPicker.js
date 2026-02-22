import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { pickInvoice, takePhoto, pickFromGallery } from '../../services/fileService';
import { showAlert } from '../../utils/alertUtils';

const OPTIONS = [
  { key: 'camera', icon: 'camera', label: 'Take Photo', hint: 'Open camera to capture' },
  { key: 'gallery', icon: 'images', label: 'Choose from Gallery', hint: 'Pick an image' },
  { key: 'file', icon: 'document-attach', label: 'Choose File', hint: 'PDF, Word, or image' },
];

const AttachmentPicker = ({ visible, onClose, onFilePicked, accentColor }) => {
  const accent = accentColor || COLORS.primary;

  const handleOption = async (key) => {
    onClose();

    let result;
    if (key === 'camera') {
      result = await takePhoto();
    } else if (key === 'gallery') {
      result = await pickFromGallery();
    } else {
      result = await pickInvoice();
    }

    if (result.success) {
      onFilePicked(result.file);
    } else if (!result.canceled && result.message) {
      showAlert('Error', result.message);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Attach File</Text>

          {OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              style={({ pressed }) => [styles.option, pressed && { backgroundColor: accent + '08' }]}
              onPress={() => handleOption(opt.key)}
            >
              <View style={[styles.optionIcon, { backgroundColor: accent + '14' }]}>
                <Ionicons name={opt.icon} size={22} color={accent} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionHint}>{opt.hint}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
            </Pressable>
          ))}

          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface || '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border || '#DDD',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: 2,
  },
  optionHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.background || '#F5F5F5',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.textSecondary,
  },
});

export default AttachmentPicker;
