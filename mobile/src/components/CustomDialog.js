import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dialog, Portal, Text, Button, TextInput, useTheme } from 'react-native-paper';

/**
 * Reusable Dialog Component to replace Alert.alert and Alert.prompt
 */
export default function CustomDialog({
  visible,
  onDismiss,
  title,
  message,
  type = 'alert', // 'alert', 'confirm', or 'prompt'
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  promptValue = '',
  setPromptValue,
  promptPlaceholder = ''
}) {
  const theme = useTheme();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {type === 'prompt' && (
            <TextInput
              mode="outlined"
              value={promptValue}
              onChangeText={setPromptValue}
              placeholder={promptPlaceholder}
              style={styles.input}
              theme={{ colors: { primary: theme.colors.primary } }}
              autoFocus
            />
          )}
        </Dialog.Content>
        <Dialog.Actions>
          {(type === 'confirm' || type === 'prompt') && (
            <Button onPress={onCancel || onDismiss} color={theme.colors.placeholder}>
              {cancelText}
            </Button>
          )}
          <Button 
            onPress={onConfirm} 
            color={theme.colors.primary}
            mode="contained"
            style={styles.confirmBtn}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontWeight: 'bold',
  },
  message: {
    marginBottom: 10,
    color: '#444',
  },
  input: {
    marginTop: 10,
    backgroundColor: '#fff',
  },
  confirmBtn: {
    marginLeft: 10,
    borderRadius: 8,
  }
});
