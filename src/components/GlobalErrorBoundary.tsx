import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-[#111827] p-5">
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-xl font-bold text-red-500 mb-2">Error Caught by Boundary</Text>
            <Text className="text-base text-red-400 text-center mb-3">
              {this.state.error?.name}: {this.state.error?.message || "An unexpected error occurred."}
            </Text>
            {this.state.error?.stack && (
              <Text className="text-[11px] text-gray-400 font-mono max-h-[250px]">
                {this.state.error.stack}
              </Text>
            )}
            <Pressable
              className="bg-[#0284C7] px-6 py-3 rounded-lg mt-5"
              onPress={this.handleReset}
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
