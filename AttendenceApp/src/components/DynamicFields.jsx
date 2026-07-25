import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react-native';
import { colors, typography } from '../theme';

const inputKeyboard = type => {
  if (['decimal', 'integer'].includes(type)) return 'decimal-pad';
  if (type === 'email') return 'email-address';
  if (type === 'phone') return 'phone-pad';
  if (type === 'url') return 'url';
  return 'default';
};

const FieldLabel = ({ field }) => (
  <Text style={styles.label}>
    {field.label}
    {field.isRequired ? <Text style={styles.required}> *</Text> : null}
  </Text>
);

const OptionPicker = ({
  disabled,
  label,
  onChange,
  options,
  placeholder,
  value,
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);

  return (
    <>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.input,
          styles.picker,
          disabled && styles.disabled,
          pressed && styles.inputPressed,
        ]}
      >
        <Text
          numberOfLines={1}
          style={selected ? styles.inputText : styles.placeholder}
        >
          {selected?.label || placeholder}
        </Text>
        <ChevronDown color={colors.muted} size={18} />
      </Pressable>
      <Modal
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}
      >
        <Pressable onPress={() => setOpen(false)} style={styles.modalBackdrop}>
          <Pressable onPress={() => {}} style={styles.optionSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable
                accessibilityLabel="Close options"
                hitSlop={8}
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <X color={colors.text} size={20} />
              </Pressable>
            </View>
            <ScrollView style={styles.optionList}>
              {options.map(option => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      active && styles.optionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        active && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {active && <Check color={colors.violet} size={18} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export const prepareFieldDefaults = (fields = [], current = {}) =>
  fields.reduce((values, field) => {
    if (
      !field.isSystem &&
      !field.archived &&
      field.isVisible &&
      values[field.key] === undefined &&
      field.defaultValue !== null &&
      field.defaultValue !== undefined
    ) {
      values[field.key] = field.defaultValue;
    }
    return values;
  }, { ...current });

export const validateRequiredFields = (fields = [], values = {}) => {
  const missing = fields.find(field => {
    if (field.isSystem || field.archived || !field.isVisible || !field.isRequired) {
      return false;
    }
    const value = values[field.key];
    return (
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    );
  });
  return missing ? `${missing.label} is required.` : '';
};

const DynamicFields = ({
  disabled = false,
  fields = [],
  members = [],
  onChange,
  values = {},
}) => {
  const customFields = useMemo(
    () =>
      fields
        .filter(field => !field.isSystem && !field.archived && field.isVisible)
        .sort((first, second) => first.sortOrder - second.sortOrder),
    [fields],
  );

  if (!customFields.length) return null;
  const setValue = (field, value) =>
    onChange({ ...values, [field.key]: value });

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelIcon}>
          <SlidersHorizontal color={colors.violet} size={18} />
        </View>
        <View style={styles.panelHeaderText}>
          <Text style={typography.sectionTitle}>Additional details</Text>
          <Text style={styles.panelCaption}>
            Fields configured by your workspace.
          </Text>
        </View>
      </View>

      <View style={styles.fields}>
        {customFields.map(field => {
          const value = values[field.key] ?? field.defaultValue ?? '';
          const options =
            field.type === 'user'
              ? members.map(member => ({
                  label: member.name,
                  value: member.id,
                }))
              : field.options || [];

          return (
            <View key={field.id} style={styles.field}>
              <FieldLabel field={field} />
              {field.type === 'boolean' ? (
                <View style={styles.switchRow}>
                  <Text style={styles.switchValue}>
                    {value ? 'Yes' : 'No'}
                  </Text>
                  <Switch
                    disabled={disabled}
                    onValueChange={nextValue => setValue(field, nextValue)}
                    thumbColor={colors.white}
                    trackColor={{
                      false: '#D0D5DD',
                      true: colors.violet,
                    }}
                    value={Boolean(value)}
                  />
                </View>
              ) : ['select', 'user'].includes(field.type) ? (
                <OptionPicker
                  disabled={disabled}
                  label={field.label}
                  onChange={nextValue => setValue(field, nextValue)}
                  options={options}
                  placeholder="Select an option"
                  value={value}
                />
              ) : field.type === 'multi_select' ? (
                <View style={styles.chips}>
                  {(field.options || []).map(option => {
                    const selected =
                      Array.isArray(value) && value.includes(option.value);
                    return (
                      <Pressable
                        disabled={disabled}
                        key={option.value}
                        onPress={() =>
                          setValue(
                            field,
                            selected
                              ? value.filter(item => item !== option.value)
                              : [
                                  ...(Array.isArray(value) ? value : []),
                                  option.value,
                                ],
                          )
                        }
                        style={[
                          styles.chip,
                          selected && styles.chipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {selected && (
                          <Check color={colors.violet} size={15} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <TextInput
                  autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
                  autoCorrect={!['email', 'url'].includes(field.type)}
                  editable={!disabled}
                  keyboardType={inputKeyboard(field.type)}
                  multiline={field.type === 'long_text'}
                  onChangeText={nextValue => setValue(field, nextValue)}
                  placeholder={
                    field.placeholder ||
                    (field.type === 'date'
                      ? 'YYYY-MM-DD'
                      : field.type === 'datetime'
                        ? 'YYYY-MM-DD HH:mm'
                        : '')
                  }
                  placeholderTextColor="#98A2B3"
                  style={[
                    styles.input,
                    field.type === 'long_text' && styles.textarea,
                    disabled && styles.disabled,
                  ]}
                  value={String(value)}
                />
              )}
              {!!field.description && (
                <Text style={styles.help}>{field.description}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default DynamicFields;

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 11,
  },
  chipSelected: {
    backgroundColor: colors.violetSoft,
    borderColor: '#C4B5FD',
  },
  chipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: { color: colors.violet },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  disabled: { opacity: 0.58 },
  field: { gap: 2 },
  fields: { gap: 18, marginTop: 18 },
  help: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    marginTop: 7,
    minHeight: 46,
    paddingHorizontal: 13,
  },
  inputPressed: { borderColor: '#C4B5FD' },
  inputText: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(16, 24, 40, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  option: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  optionActive: { backgroundColor: colors.violetSoft },
  optionList: { maxHeight: 390 },
  optionSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 22,
  },
  optionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  optionTextActive: { color: colors.violet },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  panelCaption: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
  },
  panelHeaderText: { flex: 1 },
  panelIcon: {
    alignItems: 'center',
    backgroundColor: colors.violetSoft,
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  picker: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  placeholder: {
    color: '#98A2B3',
    flex: 1,
    fontSize: 14,
  },
  required: { color: colors.danger },
  sheetHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  switchRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
    minHeight: 48,
    paddingHorizontal: 13,
  },
  switchValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  textarea: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
});
