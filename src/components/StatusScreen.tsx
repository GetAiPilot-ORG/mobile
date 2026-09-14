// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";
// import {
//   ArrowLeft,
//   Circle,
//   Home,
//   RefreshCw,
//   Sparkles,
//   Wifi,
// } from "lucide-react-native";
// import { useEffect, useRef } from "react";
// import {
//   Animated,
//   Dimensions,
//   Easing,
//   Pressable,
//   StyleSheet,
//   Text,
//   useColorScheme,
//   View,
// } from "react-native";

// const { width } = Dimensions.get("window");

// type StatusType = "404" | "offline";

// interface StatusScreenProps {
//   type: StatusType;
//   onRetry?: () => void;
//   onBack?: () => void;
//   onHome?: () => void;
// }

// export function StatusScreen({
//   type,
//   onRetry,
//   onBack,
//   onHome,
// }: StatusScreenProps) {
//   const isDark = useColorScheme() === "dark";
//   const router = useRouter();

//   const isOffline = type === "offline";

//   /*
//    * ---------------------------------------------------------
//    * Animations
//    * ---------------------------------------------------------
//    */

//   const floatAnim = useRef(new Animated.Value(0)).current;
//   const pulseAnim = useRef(new Animated.Value(1)).current;
//   const rotateAnim = useRef(new Animated.Value(0)).current;
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const scaleAnim = useRef(new Animated.Value(0.88)).current;
//   const glowAnim = useRef(new Animated.Value(0.5)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 700,
//         easing: Easing.out(Easing.cubic),
//         useNativeDriver: true,
//       }),

//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         tension: 45,
//         friction: 7,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     const floating = Animated.loop(
//       Animated.sequence([
//         Animated.timing(floatAnim, {
//           toValue: -12,
//           duration: 1800,
//           easing: Easing.inOut(Easing.sin),
//           useNativeDriver: true,
//         }),
//         Animated.timing(floatAnim, {
//           toValue: 12,
//           duration: 1800,
//           easing: Easing.inOut(Easing.sin),
//           useNativeDriver: true,
//         }),
//       ]),
//     );

//     const pulse = Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulseAnim, {
//           toValue: 1.08,
//           duration: 1200,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//         Animated.timing(pulseAnim, {
//           toValue: 1,
//           duration: 1200,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//       ]),
//     );

//     const glow = Animated.loop(
//       Animated.sequence([
//         Animated.timing(glowAnim, {
//           toValue: 1,
//           duration: 1300,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//         Animated.timing(glowAnim, {
//           toValue: 0.45,
//           duration: 1300,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//       ]),
//     );

//     const rotate = Animated.loop(
//       Animated.timing(rotateAnim, {
//         toValue: 1,
//         duration: 12000,
//         easing: Easing.linear,
//         useNativeDriver: true,
//       }),
//     );

//     floating.start();
//     pulse.start();
//     glow.start();

//     if (isOffline) {
//       rotate.start();
//     }

//     return () => {
//       floating.stop();
//       pulse.stop();
//       glow.stop();
//       rotate.stop();
//     };
//   }, [isOffline]);

//   /*
//    * ---------------------------------------------------------
//    * Colors
//    * ---------------------------------------------------------
//    */

//   const colors = isDark
//     ? {
//         background: "#050816",
//         backgroundSecondary: "#071426",
//         text: "#FFFFFF",
//         secondaryText: "#AAB4C5",
//         mutedText: "#718096",
//         primary: "#0084FF",
//         primaryEnd: "#7C3AED",
//         cyan: "#19D3FF",
//         border: "rgba(255,255,255,0.14)",
//         card: "rgba(255,255,255,0.045)",
//         glow: "#0084FF",
//       }
//     : {
//         background: "#F7FAFF",
//         backgroundSecondary: "#EEF6FF",
//         text: "#111827",
//         secondaryText: "#667085",
//         mutedText: "#98A2B3",
//         primary: "#0084FF",
//         primaryEnd: "#6D5DFB",
//         cyan: "#00A8FF",
//         border: "rgba(0,0,0,0.08)",
//         card: "rgba(255,255,255,0.75)",
//         glow: "#0084FF",
//       };

//   const rotation = rotateAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["0deg", "360deg"],
//   });

//   /*
//    * ---------------------------------------------------------
//    * Actions
//    * ---------------------------------------------------------
//    */

//   const handleBack = () => {
//     if (onBack) {
//       onBack();
//       return;
//     }

//     if (router.canGoBack()) {
//       router.back();
//     } else {
//       router.replace("/");
//     }
//   };

//   const handleHome = () => {
//     if (onHome) {
//       onHome();
//       return;
//     }

//     router.replace("/");
//   };

//   /*
//    * ---------------------------------------------------------
//    * Render
//    * ---------------------------------------------------------
//    */

//   return (
//     <View
//       style={[
//         styles.container,
//         {
//           backgroundColor: colors.background,
//         },
//       ]}
//     >
//       {/* Background glow */}
//       <Animated.View
//         pointerEvents="none"
//         style={[
//           styles.backgroundGlow,
//           {
//             backgroundColor: colors.glow,
//             opacity: glowAnim.interpolate({
//               inputRange: [0.45, 1],
//               outputRange: [0.035, 0.075],
//             }),
//           },
//         ]}
//       />

//       {/* Decorative circles */}
//       <View
//         pointerEvents="none"
//         style={[
//           styles.circleOne,
//           {
//             borderColor: isDark
//               ? "rgba(0,132,255,0.12)"
//               : "rgba(0,132,255,0.10)",
//           },
//         ]}
//       />

//       <View
//         pointerEvents="none"
//         style={[
//           styles.circleTwo,
//           {
//             borderColor: isDark
//               ? "rgba(124,58,237,0.12)"
//               : "rgba(124,58,237,0.10)",
//           },
//         ]}
//       />

//       {/* Main content */}
//       <Animated.View
//         style={[
//           styles.content,
//           {
//             opacity: fadeAnim,
//             transform: [{ scale: scaleAnim }],
//           },
//         ]}
//       >
//         {/* Illustration */}
//         <View style={styles.illustrationWrapper}>
//           <Animated.View
//             style={[
//               styles.illustration,
//               {
//                 transform: [{ translateY: floatAnim }, { scale: pulseAnim }],
//               },
//             ]}
//           >
//             {/* Outer glow */}
//             <Animated.View
//               style={[
//                 styles.iconGlow,
//                 {
//                   backgroundColor: colors.primary,
//                   opacity: glowAnim.interpolate({
//                     inputRange: [0.45, 1],
//                     outputRange: [0.08, 0.18],
//                   }),
//                 },
//               ]}
//             />

//             {/* Main icon card */}
//             <LinearGradient
//               colors={
//                 isOffline
//                   ? ["#062D45", "#063B58", "#071B31"]
//                   : ["#101C62", "#19247A", "#101743"]
//               }
//               style={styles.iconCard}
//             >
//               {/* Decorative stars / dots */}
//               <Animated.View
//                 style={[
//                   styles.star,
//                   styles.starOne,
//                   {
//                     opacity: glowAnim,
//                   },
//                 ]}
//               >
//                 <Sparkles size={14} color={colors.cyan} />
//               </Animated.View>

//               <View style={[styles.star, styles.starTwo]}>
//                 <Circle size={6} color={colors.cyan} fill={colors.cyan} />
//               </View>

//               <View style={[styles.star, styles.starThree]}>
//                 <Circle size={4} color="#A78BFA" fill="#A78BFA" />
//               </View>

//               {/* 404 */}
//               {!isOffline && (
//                 <>
//                   <Text style={styles.big404}>404</Text>

//                   <View style={styles.moon}>
//                     <View style={styles.moonCraterOne} />
//                     <View style={styles.moonCraterTwo} />
//                     <View style={styles.moonCraterThree} />
//                   </View>

//                   <View style={styles.astronaut}>
//                     <View style={styles.astronautHelmet}>
//                       <View style={styles.helmetGlass} />
//                     </View>

//                     <View style={styles.astronautBody} />

//                     <View style={styles.astronautArmLeft} />
//                     <View style={styles.astronautArmRight} />

//                     <View style={styles.astronautLegLeft} />
//                     <View style={styles.astronautLegRight} />
//                   </View>

//                   {/* Planet */}
//                   <Animated.View
//                     style={[
//                       styles.planet,
//                       {
//                         transform: [{ rotate: rotation }],
//                       },
//                     ]}
//                   >
//                     <LinearGradient
//                       colors={["#A78BFA", "#7C3AED", "#312E81"]}
//                       style={styles.planetBody}
//                     />
//                     <View style={styles.planetRing} />
//                   </Animated.View>
//                 </>
//               )}

//               {/* Offline */}
//               {isOffline && (
//                 <>
//                   <Animated.View
//                     style={{
//                       transform: [
//                         {
//                           rotate: "-8deg",
//                         },
//                       ],
//                     }}
//                   >
//                     <Wifi size={105} color="#3DB8FF" strokeWidth={1.5} />
//                   </Animated.View>

//                   <View style={styles.offlineSlash} />

//                   <Animated.View
//                     style={[
//                       styles.offlineGlow,
//                       {
//                         opacity: glowAnim,
//                       },
//                     ]}
//                   />

//                   <View style={styles.offlinePlatform} />

//                   <View style={styles.offlinePlantLeft} />
//                   <View style={styles.offlinePlantRight} />
//                 </>
//               )}
//             </LinearGradient>
//           </Animated.View>
//         </View>

//         {/* Status code */}
//         <Text
//           style={[
//             styles.statusCode,
//             {
//               color: colors.primary,
//             },
//           ]}
//         >
//           {isOffline ? "OFFLINE" : "404"}
//         </Text>

//         {/* Title */}
//         <Text
//           style={[
//             styles.title,
//             {
//               color: colors.text,
//             },
//           ]}
//         >
//           {isOffline ? "No Internet Connection" : "Page Not Found"}
//         </Text>

//         {/* Description */}
//         <Text
//           style={[
//             styles.description,
//             {
//               color: colors.secondaryText,
//             },
//           ]}
//         >
//           {isOffline
//             ? "You're currently offline. Please check your internet connection and try again."
//             : "Sorry, we couldn't find the page you're looking for. It may have been moved or no longer exists."}
//         </Text>

//         {/* Buttons */}
//         <View style={styles.actions}>
//           {isOffline && onRetry ? (
//             <Pressable
//               onPress={onRetry}
//               style={({ pressed }) => [
//                 styles.buttonWrapper,
//                 {
//                   transform: [
//                     {
//                       scale: pressed ? 0.97 : 1,
//                     },
//                   ],
//                 },
//               ]}
//             >
//               <LinearGradient
//                 colors={["#19D3FF", "#0084FF", "#2563EB"]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//                 style={styles.primaryButton}
//               >
//                 <RefreshCw size={19} color="#FFFFFF" strokeWidth={2.4} />

//                 <Text style={styles.primaryButtonText}>Try Again</Text>
//               </LinearGradient>
//             </Pressable>
//           ) : null}

//           {!isOffline && (
//             <Pressable
//               onPress={handleBack}
//               style={({ pressed }) => [
//                 styles.buttonWrapper,
//                 {
//                   transform: [
//                     {
//                       scale: pressed ? 0.97 : 1,
//                     },
//                   ],
//                 },
//               ]}
//             >
//               <LinearGradient
//                 colors={["#19BFFF", "#0084FF", "#7C3AED"]}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 0 }}
//                 style={styles.primaryButton}
//               >
//                 <ArrowLeft size={19} color="#FFFFFF" strokeWidth={2.4} />

//                 <Text style={styles.primaryButtonText}>Go Back</Text>
//               </LinearGradient>
//             </Pressable>
//           )}

//           <Pressable
//             onPress={handleHome}
//             style={({ pressed }) => [
//               styles.secondaryButton,
//               {
//                 borderColor: colors.border,
//                 backgroundColor: colors.card,
//                 transform: [
//                   {
//                     scale: pressed ? 0.97 : 1,
//                   },
//                 ],
//               },
//             ]}
//           >
//             <Home size={18} color={colors.text} strokeWidth={2} />

//             <Text
//               style={[
//                 styles.secondaryButtonText,
//                 {
//                   color: colors.text,
//                 },
//               ]}
//             >
//               Go Home
//             </Text>
//           </Pressable>
//         </View>
//       </Animated.View>

//       {/* Bottom waves */}
//       <View pointerEvents="none" style={styles.bottomDecoration}>
//         <View
//           style={[
//             styles.wave,
//             styles.waveOne,
//             {
//               backgroundColor: isDark
//                 ? "rgba(0,132,255,0.08)"
//                 : "rgba(0,132,255,0.06)",
//             },
//           ]}
//         />

//         <View
//           style={[
//             styles.wave,
//             styles.waveTwo,
//             {
//               backgroundColor: isDark
//                 ? "rgba(124,58,237,0.08)"
//                 : "rgba(124,58,237,0.05)",
//             },
//           ]}
//         />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     overflow: "hidden",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 24,
//   },

//   content: {
//     width: "100%",
//     alignItems: "center",
//     zIndex: 10,
//   },

//   backgroundGlow: {
//     position: "absolute",
//     width: width * 1.4,
//     height: width * 1.4,
//     borderRadius: width,
//     top: -width * 0.65,
//     alignSelf: "center",
//   },

//   circleOne: {
//     position: "absolute",
//     width: 330,
//     height: 330,
//     borderRadius: 165,
//     borderWidth: 1,
//     top: -180,
//     left: -170,
//   },

//   circleTwo: {
//     position: "absolute",
//     width: 280,
//     height: 280,
//     borderRadius: 140,
//     borderWidth: 1,
//     bottom: -160,
//     right: -130,
//   },

//   illustrationWrapper: {
//     width: 270,
//     height: 245,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 12,
//   },

//   illustration: {
//     width: 245,
//     height: 225,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   iconGlow: {
//     position: "absolute",
//     width: 190,
//     height: 190,
//     borderRadius: 95,
//   },

//   iconCard: {
//     width: 215,
//     height: 205,
//     borderRadius: 42,
//     overflow: "hidden",
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#0084FF",
//     shadowOffset: {
//       width: 0,
//       height: 12,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 30,
//     elevation: 15,
//   },

//   star: {
//     position: "absolute",
//   },

//   starOne: {
//     top: 24,
//     left: 24,
//   },

//   starTwo: {
//     top: 48,
//     right: 30,
//   },

//   starThree: {
//     bottom: 40,
//     right: 25,
//   },

//   big404: {
//     position: "absolute",
//     top: 24,
//     fontSize: 76,
//     lineHeight: 82,
//     fontWeight: "900",
//     letterSpacing: -5,
//     color: "rgba(115,190,255,0.95)",
//     textShadowColor: "#0084FF",
//     textShadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     textShadowRadius: 16,
//   },

//   moon: {
//     position: "absolute",
//     width: 150,
//     height: 60,
//     borderRadius: 80,
//     bottom: 8,
//     backgroundColor: "#263C91",
//     transform: [
//       {
//         rotate: "-8deg",
//       },
//     ],
//   },

//   moonCraterOne: {
//     position: "absolute",
//     width: 22,
//     height: 10,
//     borderRadius: 20,
//     backgroundColor: "#1A2D73",
//     left: 30,
//     top: 24,
//   },

//   moonCraterTwo: {
//     position: "absolute",
//     width: 14,
//     height: 7,
//     borderRadius: 20,
//     backgroundColor: "#1A2D73",
//     right: 35,
//     top: 17,
//   },

//   moonCraterThree: {
//     position: "absolute",
//     width: 10,
//     height: 6,
//     borderRadius: 20,
//     backgroundColor: "#1A2D73",
//     left: 82,
//     top: 38,
//   },

//   astronaut: {
//     position: "absolute",
//     bottom: 24,
//     alignItems: "center",
//   },

//   astronautHelmet: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: "#D8E9FF",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 3,
//     borderColor: "#9DCFFF",
//   },

//   helmetGlass: {
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//     backgroundColor: "#081326",
//     borderWidth: 2,
//     borderColor: "#65B8FF",
//   },

//   astronautBody: {
//     width: 43,
//     height: 48,
//     borderRadius: 14,
//     backgroundColor: "#BBD9F7",
//     marginTop: -3,
//   },

//   astronautArmLeft: {
//     position: "absolute",
//     width: 14,
//     height: 34,
//     borderRadius: 8,
//     backgroundColor: "#A9CEF0",
//     left: -8,
//     top: 48,
//     transform: [
//       {
//         rotate: "22deg",
//       },
//     ],
//   },

//   astronautArmRight: {
//     position: "absolute",
//     width: 14,
//     height: 34,
//     borderRadius: 8,
//     backgroundColor: "#A9CEF0",
//     right: -8,
//     top: 48,
//     transform: [
//       {
//         rotate: "-22deg",
//       },
//     ],
//   },

//   astronautLegLeft: {
//     width: 16,
//     height: 25,
//     borderRadius: 8,
//     backgroundColor: "#A9CEF0",
//     position: "absolute",
//     bottom: -18,
//     left: 5,
//     transform: [
//       {
//         rotate: "10deg",
//       },
//     ],
//   },

//   astronautLegRight: {
//     width: 16,
//     height: 25,
//     borderRadius: 8,
//     backgroundColor: "#A9CEF0",
//     position: "absolute",
//     bottom: -18,
//     right: 5,
//     transform: [
//       {
//         rotate: "-10deg",
//       },
//     ],
//   },

//   planet: {
//     position: "absolute",
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     right: 28,
//     top: 25,
//   },

//   planetBody: {
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//   },

//   planetRing: {
//     position: "absolute",
//     width: 62,
//     height: 18,
//     borderRadius: 40,
//     borderWidth: 3,
//     borderColor: "#A78BFA",
//     left: -10,
//     top: 12,
//     transform: [
//       {
//         rotate: "-18deg",
//       },
//     ],
//   },

//   offlineSlash: {
//     position: "absolute",
//     width: 130,
//     height: 9,
//     borderRadius: 10,
//     backgroundColor: "#FF5D78",
//     transform: [
//       {
//         rotate: "-48deg",
//       },
//     ],
//     shadowColor: "#FF5D78",
//     shadowOffset: {
//       width: 0,
//       height: 0,
//     },
//     shadowOpacity: 0.9,
//     shadowRadius: 12,
//     elevation: 10,
//   },

//   offlineGlow: {
//     position: "absolute",
//     width: 145,
//     height: 145,
//     borderRadius: 80,
//     backgroundColor: "#0084FF",
//     opacity: 0.1,
//   },

//   offlinePlatform: {
//     position: "absolute",
//     width: 135,
//     height: 14,
//     borderRadius: 30,
//     backgroundColor: "#0879A9",
//     bottom: 28,
//   },

//   offlinePlantLeft: {
//     position: "absolute",
//     width: 13,
//     height: 32,
//     borderRadius: 10,
//     backgroundColor: "#00A6B7",
//     bottom: 29,
//     left: 38,
//     transform: [
//       {
//         rotate: "-25deg",
//       },
//     ],
//   },

//   offlinePlantRight: {
//     position: "absolute",
//     width: 13,
//     height: 32,
//     borderRadius: 10,
//     backgroundColor: "#00A6B7",
//     bottom: 29,
//     right: 38,
//     transform: [
//       {
//         rotate: "25deg",
//       },
//     ],
//   },

//   statusCode: {
//     fontSize: 14,
//     fontWeight: "800",
//     letterSpacing: 2,
//     marginTop: 8,
//     marginBottom: 8,
//   },

//   title: {
//     fontSize: 27,
//     lineHeight: 34,
//     fontWeight: "800",
//     textAlign: "center",
//     letterSpacing: -0.6,
//     maxWidth: 340,
//   },

//   description: {
//     fontSize: 15,
//     lineHeight: 23,
//     textAlign: "center",
//     maxWidth: 350,
//     marginTop: 12,
//   },

//   actions: {
//     width: "100%",
//     maxWidth: 330,
//     marginTop: 28,
//     gap: 12,
//   },

//   buttonWrapper: {
//     width: "100%",
//   },

//   primaryButton: {
//     height: 54,
//     borderRadius: 16,
//     alignItems: "center",
//     justifyContent: "center",
//     flexDirection: "row",
//     gap: 9,
//     shadowColor: "#0084FF",
//     shadowOffset: {
//       width: 0,
//       height: 8,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 16,
//     elevation: 8,
//   },

//   primaryButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//   },

//   secondaryButton: {
//     height: 54,
//     borderRadius: 16,
//     borderWidth: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     flexDirection: "row",
//     gap: 9,
//   },

//   secondaryButtonText: {
//     fontSize: 16,
//     fontWeight: "600",
//   },

//   bottomDecoration: {
//     position: "absolute",
//     bottom: -10,
//     width: "120%",
//     height: 100,
//   },

//   wave: {
//     position: "absolute",
//     width: "110%",
//     height: 90,
//     borderRadius: 100,
//   },

//   waveOne: {
//     bottom: -55,
//     left: -30,
//     transform: [
//       {
//         rotate: "-4deg",
//       },
//     ],
//   },

//   waveTwo: {
//     bottom: -70,
//     right: -30,
//     transform: [
//       {
//         rotate: "5deg",
//       },
//     ],
//   },
// });

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

interface NetworkStatusScreenProps {
  onRetry?: () => void;
}

export function NetworkStatusScreen({ onRetry }: NetworkStatusScreenProps) {
  const isDark = useColorScheme() === "dark";

  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 120,
        useNativeDriver: true,
      }),

      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#000000" : "#F2F2F7",
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconOuter,
            {
              transform: [{ scale: pulse }],
              backgroundColor: isDark
                ? "rgba(255,69,58,0.12)"
                : "rgba(255,69,58,0.10)",
            },
          ]}
        >
          <View style={styles.iconInner}>
            <Ionicons name="cloud-offline-outline" size={52} color="#FF453A" />
          </View>
        </Animated.View>

        <Text
          style={[
            styles.title,
            {
              color: isDark ? "#FFFFFF" : "#111111",
            },
          ]}
        >
          You're Offline
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: isDark ? "#98989D" : "#6B7280",
            },
          ]}
        >
          No internet connection detected. Check your Wi-Fi or mobile data and
          try again.
        </Text>

        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              borderColor: isDark ? "#2C2C2E" : "#E5E7EB",
            },
          ]}
        >
          <View style={styles.statusIcon}>
            <Ionicons name="wifi-outline" size={20} color="#FF453A" />
          </View>

          <View style={styles.statusText}>
            <Text
              style={[
                styles.statusTitle,
                {
                  color: isDark ? "#FFFFFF" : "#111111",
                },
              ]}
            >
              No Internet
            </Text>

            <Text
              style={[
                styles.statusSubtitle,
                {
                  color: isDark ? "#98989D" : "#6B7280",
                },
              ]}
            >
              Waiting for connection...
            </Text>
          </View>

          <View style={styles.dot} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
          ]}
          onPress={onRetry}
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" />

          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>

        <Text
          style={[
            styles.footer,
            {
              color: isDark ? "#636366" : "#8E8E93",
            },
          ]}
        >
          GetAiPilot will reconnect automatically
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  content: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },

  iconOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },

  iconInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,69,58,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 330,
    marginBottom: 28,
  },

  statusCard: {
    width: "100%",
    minHeight: 70,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,69,58,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  statusText: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },

  statusSubtitle: {
    fontSize: 12,
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#FF453A",
  },

  retryButton: {
    width: "100%",
    height: 50,
    borderRadius: 15,
    backgroundColor: "#0A84FF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  retryButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  footer: {
    fontSize: 11.5,
    marginTop: 18,
  },
});
