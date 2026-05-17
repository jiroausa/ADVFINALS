/**
 * loginScreen.jsx — MangaVault
 * Firebase Auth sign-in for Expo Web + Native.
 * After signIn succeeds, App.js onAuthStateChanged handles navigation automatically.
 */

import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar, Alert,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

const C = {
  bg: "#0F0F0F",
  surface: "#171717",
  border: "#272727",
  borderBright: "#383838",
  accent: "#E8272F",
  accentGold: "#F5C518",
  text: "#F0EDE8",
  textMuted: "#777777",
  textDim: "#444444",
  white: "#FFFFFF",
  panel: "#1C1C1C",
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(null);

  async function handleLogin() {
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // SUCCESS — App.js onAuthStateChanged fires, user state updates,
      // NavigationContainer remounts with AppStack. No navigation call needed here.
    } catch (e) {
      console.error("Login error:", e.code, e.message);
      switch (e.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Incorrect email or password.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Please try again later.");
          break;
        default:
          setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logo}>
              MANGA<Text style={{ color: C.accent }}>VAULT</Text>
            </Text>
            <Text style={styles.logoSub}>Community ratings & reviews</Text>
          </View>

          {/* Lock note */}
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>🔒  Sign in to rate and comment on manga</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Sign In</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, focused === "email" && styles.inputFocused]}
                placeholder="your@email.com"
                placeholderTextColor={C.textDim}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, focused === "password" && styles.inputFocused]}
                placeholder="••••••••"
                placeholderTextColor={C.textDim}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(""); }}
                secureTextEntry
                autoCapitalize="none"
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginBtnText}>
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to MangaVault? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.footerLink}>Create an account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    paddingBottom: 48,
    gap: 20,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },

  logoWrap: { alignItems: "center", marginBottom: 8 },
  logo: {
    fontSize: 32, fontWeight: "900", color: C.white,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    letterSpacing: 2,
  },
  logoSub: { fontSize: 13, color: C.textMuted, marginTop: 4 },

  noteBox: {
    backgroundColor: C.panel,
    borderWidth: 1, borderColor: C.accentGold,
    borderRadius: 8,
    paddingVertical: 12, paddingHorizontal: 16,
    alignItems: "center",
  },
  noteText: { fontSize: 13, color: C.accentGold, fontWeight: "700" },

  form: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 10,
    padding: 22,
    gap: 14,
  },
  formTitle: {
    fontSize: 20, fontWeight: "900", color: C.white,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },

  errorBox: {
    backgroundColor: "#2A0A0A",
    borderWidth: 1, borderColor: C.accent,
    borderRadius: 6,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  errorText: { fontSize: 13, color: C.accent, fontWeight: "600" },

  fieldGroup: { gap: 6 },
  label: { fontSize: 13, color: C.textMuted, fontWeight: "700" },
  input: {
    backgroundColor: C.panel,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: C.text,
  },
  inputFocused: { borderColor: C.accentGold },

  loginBtn: {
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnText: { color: C.white, fontWeight: "900", fontSize: 15 },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  footerText: { fontSize: 14, color: C.textMuted },
  footerLink: { fontSize: 14, color: C.accentGold, fontWeight: "700" },
});
