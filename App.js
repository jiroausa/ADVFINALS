// App.js
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase/firebaseConfig";

import HomeScreen from "./screens/homeScreen";
import LoginScreen from "./screens/loginScreen";
import RegisterScreen from "./screens/registerScreen";
import ProfileScreen from "./screens/profileScreen";
import MangaDetailScreen from "./screens/mangaDetailScreen";

const Stack = createNativeStackNavigator();

// Shown when logged OUT
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Shown when logged IN
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="MangaDetail" component={MangaDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null); // null = definitely logged out
    });
    return unsubscribe;
  }, []);

  // Still checking — show splash
  if (user === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0F0F", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#E8272F" size="large" />
      </View>
    );
  }

  return (
    // key={!!user} forces NavigationContainer to fully remount when
    // auth state flips, guaranteeing a clean navigation stack reset
    // on both login AND logout — no stale screens remain.
    <NavigationContainer key={user ? "auth" : "guest"}>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}