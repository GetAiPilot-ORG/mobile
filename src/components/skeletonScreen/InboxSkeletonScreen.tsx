import React from "react";
import { ScrollView, View } from "react-native";
import { Skeleton, SkeletonCard, SkeletonCircle, SkeletonRow, SkeletonText } from "../Skeleton";

export function InboxSkeleton() {
  return (
    <View className="flex-1 bg-[#0B0D10]">
      {/* Search Bar */}
      <View className="px-4 pt-3 pb-2">
        <Skeleton width="100%" height={40} borderRadius={10} />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 py-2"
      >
        {[70, 85, 95, 65, 90].map((width, idx) => (
          <Skeleton
            key={idx}
            width={width}
            height={32}
            borderRadius={16}
            className="mr-2"
          />
        ))}
      </ScrollView>

      {/* Conversation List */}
      <InboxListSkeleton />
    </View>
  );
}

export function InboxListSkeleton() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="px-4 pb-24"
    >
      {[1, 2, 3, 4, 5, 6, 7].map((item) => (
        <View
          key={item}
          className="flex-row items-center py-3.5 border-b border-white/5"
        >
          {/* Avatar */}
          <SkeletonCircle size={48} className="mr-3.5" />

          {/* Content info */}
          <View className="flex-1">
            <SkeletonRow className="justify-between mb-1.5">
              <SkeletonText width={item % 2 === 0 ? 140 : 110} height={15} />
              <SkeletonText width={45} height={11} />
            </SkeletonRow>
            <SkeletonRow className="justify-between items-center">
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
  return (
    <View className="flex-1 bg-[#0B0D10]">
      {/* Chat Top Header */}
      <View className="flex-row items-center px-3.5 pt-12 pb-3 bg-[#181A1F] border-b border-[#262930]">
        <Skeleton width={24} height={24} borderRadius={12} className="mr-3" />
        <SkeletonCircle size={40} className="mr-2.5" />
        <View className="flex-1">
          <SkeletonText width={130} height={15} className="mb-1" />
          <SkeletonText width={80} height={11} />
        </View>
        <Skeleton width={28} height={28} borderRadius={14} />
      </View>

      {/* Messages List Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-3.5 pb-5"
      >
        {/* Day divider */}
        <View className="items-center my-3.5">
          <Skeleton width={90} height={22} borderRadius={11} />
        </View>

        {/* Incoming bubble */}
        <View className="mb-2 items-start">
          <SkeletonCard
            className="rounded-2xl p-3 mb-0 self-start w-[72%] bg-[#181A1F] border border-[#262930]"
          >
            <SkeletonText width="95%" height={13} className="mb-1.5" />
            <SkeletonText width="70%" height={13} className="mb-1.5" />
            <SkeletonText width={40} height={10} className="self-end" />
          </SkeletonCard>
        </View>

        {/* Outgoing bubble */}
        <View className="mb-2 items-end">
          <SkeletonCard
            className="rounded-2xl p-3 mb-0 self-end w-[65%] bg-[#005C4B]"
          >
            <SkeletonText width="90%" height={13} className="mb-1.5" />
            <SkeletonText width="50%" height={13} className="mb-1.5" />
            <SkeletonText width={40} height={10} className="self-end" />
          </SkeletonCard>
        </View>

        {/* Incoming short bubble */}
        <View className="mb-2 items-start">
          <SkeletonCard
            className="rounded-2xl p-3 mb-0 self-start w-[55%] bg-[#181A1F] border border-[#262930]"
          >
            <SkeletonText width="85%" height={13} className="mb-1.5" />
            <SkeletonText width={40} height={10} className="self-end" />
          </SkeletonCard>
        </View>

        {/* Outgoing long bubble */}
        <View className="mb-2 items-end">
          <SkeletonCard
            className="rounded-2xl p-3 mb-0 self-end w-[78%] bg-[#005C4B]"
          >
            <SkeletonText width="95%" height={13} className="mb-1.5" />
            <SkeletonText width="85%" height={13} className="mb-1.5" />
            <SkeletonText width="60%" height={13} className="mb-1.5" />
            <SkeletonText width={40} height={10} className="self-end" />
          </SkeletonCard>
        </View>
      </ScrollView>

      {/* Input bar */}
      <View className="flex-row items-center px-3 py-2.5 pb-8 bg-[#181A1F] border-t border-[#262930]">
        <SkeletonCircle size={36} className="mr-2" />
        <Skeleton
          width="72%"
          height={40}
          borderRadius={20}
          className="mr-2"
        />
        <SkeletonCircle size={38} />
      </View>
    </View>
  );
}
