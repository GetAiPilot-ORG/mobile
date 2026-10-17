import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
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
        <SafeAreaView style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            alwaysBounceVertical={true}
          >
            <View style={styles.header}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Application Error</Text>
              </View>
              <Text style={styles.title}>Error Caught by Boundary</Text>
              <Text selectable style={styles.description}>
                {this.state.error?.name ? `${this.state.error.name}: ` : ''}
                {this.state.error?.message || "An unexpected error occurred."}
              </Text>
            </View>

            {this.state.error?.stack ? (
              <View style={styles.stackBox}>
                <Text style={styles.stackHeader}>Stack Trace</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  style={styles.horizontalScroll}
                >
                  <Text selectable style={styles.stackText}>
                    {this.state.error.stack}
                  </Text>
                </ScrollView>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                { opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
              ]}
              onPress={this.handleReset}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1117',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 48,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#f87171',
    marginBottom: 8,
  },
  stackBox: {
    backgroundColor: '#181B26',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  stackHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  horizontalScroll: {
    maxHeight: 340,
  },
  stackText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
