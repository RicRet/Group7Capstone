// MapScreen.tsx
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Addroute from "./addroute";
import Homepage from "./test2";

/** google navigation sdk imports (kept minimal) */
import {
    NavigationCallbacks,
    NavigationView,
    useNavigation,
    type ArrivalEvent,
    type NavigationInitErrorCode,
    type NavigationViewController,
} from "@googlemaps/react-native-navigation-sdk";

const MapScreen: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [currentSheet, setCurrentSheet] = useState<string>("home");

  // when true, NavigationView shows and bottom sheet is hidden
  const [showNavigation, setShowNavigation] = useState<boolean>(false);

  const [navigationViewController, setNavigationViewController] =
    useState<NavigationViewController | null>(null);

  const { navigationController, addListeners, removeListeners } = useNavigation();

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  // Render bottom sheet contents. Important: we pass wrapper functions so types match.
  const renderSheetContent = () => {
    switch (currentSheet) {
      case "home":
        return (
          <Homepage
            onNavigate={(screen: string) => setCurrentSheet(screen)}
            startNavigation={() => setShowNavigation(true)} // exact () => void
          />
        );
      case "addroute":
        return <Addroute onNavigate={(s: string) => setCurrentSheet(s)} />;
      default:
        return (
          <Homepage
            onNavigate={(screen: string) => setCurrentSheet(screen)}
            startNavigation={() => setShowNavigation(true)}
          />
        );
    }
  };

  const onNavigationReady = useCallback(() => {
    console.log("Navigation ready");
  }, []);

  const onNavigationInitError = useCallback((error: NavigationInitErrorCode) => {
    console.error("Navigation init error:", error);
  }, []);

  const navigationCallbacks: NavigationCallbacks = useMemo(
    () => ({
      onNavigationReady,
      onArrival: (event: ArrivalEvent) => {
        console.log("Arrived at destination:", event.isFinalDestination);
        navigationController.stopGuidance();
        setShowNavigation(false);
      },
      onNavigationInitError,
    }),
    [navigationController, onNavigationReady, onNavigationInitError]
  );

  React.useEffect(() => {
    addListeners(navigationCallbacks);
    return () => {
      removeListeners(navigationCallbacks);
    };
  }, [navigationCallbacks, addListeners, removeListeners]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* NavigationView (only shown when navigating) */}
            {showNavigation && (
              <NavigationView
                style={StyleSheet.absoluteFillObject}
                navigationViewCallbacks={{}}
                onNavigationViewControllerCreated={setNavigationViewController}
                onMapViewControllerCreated={() => {}}
                mapViewCallbacks={{}}
              />
            )}

            {/* Floating Menu Button */}
            <View style={styles.topRightContainer}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowMenu(!showMenu)}
              >
                <Text style={styles.menuIcon}>☰</Text>
              </TouchableOpacity>

              {showMenu && (
                <View style={styles.menuContainer}>
                  {["Home", "Settings", "Profile", "Help"].map((tab, index) => (
                    <TouchableOpacity key={index} style={styles.menuItem}>
                      <Text style={styles.menuText}>{tab}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Bottom Sheet: hidden when navigating */}
      {!showNavigation && (
        <BottomSheet
          ref={sheetRef}
          index={1}
          snapPoints={snapPoints}
          backgroundStyle={styles.bottomSheetBackground}
        >
          <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
            {renderSheetContent()}
          </BottomSheetScrollView>
        </BottomSheet>
      )}
    </GestureHandlerRootView>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  topRightContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 45,
  },
  menuButton: {
    backgroundColor: "#3f3f3f",
    padding: 12,
    borderRadius: 10,
    elevation: 4,
  },
  menuIcon: { fontSize: 22, color: "#65d159", fontWeight: "700" },
  menuContainer: {
    backgroundColor: "#3f3f3f",
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 6,
    width: 120,
    elevation: 4,
  },
  menuItem: { paddingVertical: 8, paddingHorizontal: 10 },
  menuText: { fontSize: 16, color: "#006A31", fontWeight: "500" },

  bottomSheetBackground: {
    backgroundColor: "#3f3f3f",
  },
  contentContainer: {
    padding: 20,
  },
});

