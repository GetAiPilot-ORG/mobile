import React from "react";
import { ScrollView, StyleSheet, View, useColorScheme } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function InboxSkeleton() {
  const isDark = useColorScheme() === "dark";

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#0B141A" : "#FFFFFF" }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Skeleton width="100%" height={40} borderRadius={10} />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {[70, 85, 95, 65, 90].map((width, idx) => (
          <Skeleton
            key={idx}
            width={width}
            height={32}
            borderRadius={16}
            style={{ marginRight: 8 }}
          />
        ))}
      </ScrollView>

      {/* Conversation List */}
      <InboxListSkeleton />
    </View>
  );
}

export function InboxListSkeleton() {
  const isDark = useColorScheme() === "dark";
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    >
      {[1, 2, 3, 4, 5, 6, 7].map((item) => (
        <View
          key={item}
          style={[
            styles.convRow,
            { borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9" },
          ]}
        >
          {/* Avatar */}
          <SkeletonCircle size={48} style={{ marginRight: 14 }} />

          {/* Content info */}
          <View style={{ flex: 1 }}>
            <SkeletonRow style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <SkeletonText width={item % 2 === 0 ? 140 : 110} height={15} />
              <SkeletonText width={45} height={11} />
            </SkeletonRow>
            <SkeletonRow style={{ justifyContent: "space-between", alignItems: "center" }}>
              <SkeletonText width={item % 2 === 0 ? "75%" : "60%"} height={13} />
              {item % 3 === 0 && <Skeleton width={18} height={18} borderRadius={9} />}
            </SkeletonRow>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

export function ConversationSkeleton() {
  const isDark = useColorScheme() === "dark";

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#0B141A" : "#ECE5DD" }]}>
      {/* Chat Top Header */}
      <View
        style={[
          styles.chatHeader,
          { backgroundColor: isDark ? "#1F2C34" : "#F0F2F5" },
        ]}
      >
        <Skeleton width={24} height={24} borderRadius={12} style={{ marginRight: 12 }} />
        <SkeletonCircle size={40} style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <SkeletonText width={130} height={15} style={{ marginBottom: 4 }} />
          <SkeletonText width={80} height={11} />
        </View>
        <Skeleton width={28} height={28} borderRadius={14} />
      </View>

      {/* Messages List Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContainer}
      >
        {/* Day divider */}
        <View style={{ alignItems: "center", marginVertical: 14 }}>
          <Skeleton width={90} height={22} borderRadius={11} />
        </View>

        {/* Incoming bubble */}
        <View style={styles.incomingWrapper}>
          <SkeletonCard
            style={[
              styles.bubble,
              {
                backgroundColor: isDark ? "#1F2C34" : "#FFFFFF",
                alignSelf: "flex-start",
                width: "72%",
              },
            ]}
          >
            <SkeletonText width="95%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonText width="70%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonText width={40} height={10} style={{ alignSelf: "flex-end" }} />
          </SkeletonCard>
        </View>

        {/* Outgoing bubble */}
        <View style={styles.outgoingWrapper}>
          <SkeletonCard
            style={[
              styles.bubble,
              {
                backgroundColor: isDark ? "#005C4B" : "#D9FDD3",
                alignSelf: "flex-end",
                width: "65%",
              },
            ]}
          >
            <SkeletonText width="90%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonText width="50%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonText width={40} height={10} style={{ alignSelf: "flex-end" }} />
          </SkeletonCard>
        </View>

        {/* Incoming short bubble */}
        <View style={styles.incomingWrapper}>
          <SkeletonCard
            style={[
              styles.bubble,
              {
                backgroundColor: isDark ? "#1F2C34" : "#FFFFFF",
                alignSelf: "flex-start",
                width: "55%",
              },
            ]}
          >
            <SkeletonText width="85%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonText width={40} height={10} style={{ alignSelf: "flex-end" }} />
          </SkeletonCard>
        </View>

        {/* Outgoing long bubble */}
        <View style={styles.outgoingWrapper}>
          <SkeletonCard
            style={[
              styles.bubble,
              {
                backgroundColor: isDark ? "#005C4B" : "#D9FDD3",
                alignSelf: "flex-end",
                width: "78%",
              },
            ]}
          >
            <SkeletonText width="95%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonText width="85%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonText width="60%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonText width={40} height={10} style={{ alignSelf: "flex-end" }} />
          </SkeletonCard>
        </View>
      </ScrollView>

      {/* Input bar */}
      <View
        style={[
          styles.inputBar,
          { backgroundColor: isDark ? "#1F2C34" : "#F0F2F5" },
        ]}
      >
        <SkeletonCircle size={36} style={{ marginRight: 8 }} />
        <Skeleton
          width="72%"
          height={40}
          borderRadius={20}
          style={{ marginRight: 8 }}
        />
        <SkeletonCircle size={38} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 48,
    paddingBottom: 12,
  },
  messagesContainer: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  incomingWrapper: {
    marginBottom: 8,
    alignItems: "flex-start",
  },
  outgoingWrapper: {
    marginBottom: 8,
    alignItems: "flex-end",
  },
  bubble: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 0,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 30,
  },
});
