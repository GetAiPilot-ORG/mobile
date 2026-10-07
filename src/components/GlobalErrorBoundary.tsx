import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getColors } from '@/theme';

const colors = getColors();

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You could also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#111827', padding: 20 }]}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: '#ef4444' }]}>Error Caught by Boundary</Text>
            <Text style={[styles.description, { color: '#f87171', fontSize: 16, marginBottom: 12 }]}>
              {this.state.error?.name}: {this.state.error?.message || "An unexpected error occurred."}
            </Text>
            {this.state.error?.stack && (
              <Text style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'monospace', maxHeight: 250 }}>
                {this.state.error.stack}
              </Text>
            )}
            <Pressable style={[styles.button, { marginTop: 20 }]} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.primaryForeground,
    fontWeight: '600',
  },
});
