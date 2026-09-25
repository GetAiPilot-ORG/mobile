import React, { useState, useEffect } from 'react';
import { BackHandler, StyleSheet, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from '../../../src/components/ProductFloatingBottomBar';
import { CRMDashboardScreen } from "../../../src/features/crm/screens/CRMDashboardScreen";
import { GoogleCalendarScreen } from "../../../src/features/crm/screens/GoogleCalendarScreen";
import { CommunicationScreen } from "../../../src/features/team/screens/CommunicationScreen";
import { PlannerScreen } from "../../../src/features/team/screens/PlannerScreen";
import { TeamScreen } from "../../../src/features/team/screens/TeamScreen";

type CRMTab = "overview" | "team" | "planner" | "calendar" | "communication";

const CRM_TABS: ProductTabItem[] = [
  {
    key: "overview",
    label: "Overview",
    activeIcon: "grid",
    inactiveIcon: "grid-outline",
    description: "CRM dashboard, stats & quick access",
  },
  {
    key: "team",
    label: "Team",
    activeIcon: "people",
    inactiveIcon: "people-outline",
    description: "Members, attendance, leave & presence",
  },
  {
    key: "planner",
    label: "Planner",
    activeIcon: "calendar",
    inactiveIcon: "calendar-outline",
    description: "Upcoming birthdays & company holidays",
  },
  {
    key: "calendar",
    label: "Calendar",
    activeIcon: "calendar-clear",
    inactiveIcon: "calendar-clear-outline",
    description: "Google Calendar integration",
  },
  {
    key: "communication",
    label: "Communication",
    activeIcon: "mail",
    inactiveIcon: "mail-outline",
    description: "Email, team chat & work from home",
  },
];

export default function CRMIndexRoute() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [activeTab, setActiveTab] = useState<CRMTab>("overview");

  useEffect(() => {
    const onHardwareBack = () => {
      if (activeTab !== "overview") {
        setActiveTab("overview");
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      router.replace("/(tabs)/products");
      return true;
    };

    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack
    );
    return () => sub.remove();
  }, [activeTab]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0F1015" : "#F8FAFC" },
      ]}
    >
      <View style={styles.screenContainer}>
        {activeTab === "overview" && (
          <CRMDashboardScreen
            onNavigateSection={(section) => {
              if (section === "team") setActiveTab("team");
              else if (section === "planner") setActiveTab("planner");
              else if (section === "communication") setActiveTab("communication");
            }}
          />
        )}
        {activeTab === "team" && <TeamScreen />}
        {activeTab === "planner" && <PlannerScreen />}
        {activeTab === "calendar" && <GoogleCalendarScreen />}
        {activeTab === "communication" && <CommunicationScreen />}
      </View>

      <ProductFloatingBottomBar
        items={CRM_TABS}
        activeKey={activeTab}
        onChangeTab={(key) => setActiveTab(key as CRMTab)}
        accentColor="#3B82F6"
        moreMenuTitle="CRM Navigation"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
