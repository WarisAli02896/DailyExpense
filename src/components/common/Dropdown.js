import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

const Dropdown = ({
  label,
  value,
  options = [],
  onSelect,
  placeholder = 'Select an option',
  error,
  style,
}) => {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find((o) => o.value === value);

  const handleSelect = (option) => {
    onSelect(option.value);
    setVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        style={({ pressed }) => [
          styles.selector,
          error && styles.selectorError,
          pressed && styles.selectorPressed,
        ]}
        onPress={() => setVisible(true)}
        role="button"
        aria-label={label || placeholder}
      >
        <Text style={[styles.selectorText, !selectedOption && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select'}</Text>
              <Pressable onPress={() => setVisible(false)} role="button" aria-label="Close">
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    item.value === value && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => handleSelect(item)}
                  role="button"
                  aria-label={item.label}
                >
                  {item.icon && (
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.value === value ? COLORS.primary : COLORS.textSecondary}
                      style={styles.optionIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
    marginBottom: 6,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectorError: {
    borderColor: COLORS.danger,
  },
  selectorPressed: {
    borderColor: COLORS.primary,
  },
  selectorText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.textLight,
  },
  errorText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.danger,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 30,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  optionSelected: {
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
  },
  optionPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
    flex: 1,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: FONTS.weights.semiBold,
  },
});

export default Dropdown;
