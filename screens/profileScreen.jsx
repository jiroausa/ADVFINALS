/**
 * profileScreen.jsx — MangaVault
 * Clean profile: user info, stats, rated manga, logout.
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Platform, StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { signOut, updateProfile } from "firebase/auth";
import { collection, query, where, onSnapshot, doc as firestoreDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, uploadString, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../firebase/firebaseConfig";

const C = {
  bg: "#0A0A0A", surface: "#141414", surface2: "#1A1A1A",
  border: "#252525", borderBright: "#333333",
  accent: "#E8272F", accentGold: "#F5C518", accentBlue: "#2B7FE8",
  text: "#F0EDE8", textMuted: "#666666", textDim: "#3A3A3A",
  white: "#FFFFFF", panel: "#1A1A1A",
};

function getReaderRank(ratingCount) {
  if (ratingCount === 0) return { rank: "Newcomer", icon: "🌱", color: C.textMuted };
  if (ratingCount < 3) return { rank: "Page Turner", icon: "📖", color: C.accentBlue };
  if (ratingCount < 7) return { rank: "Ink Scholar", icon: "🖊", color: C.accentGold };
  if (ratingCount < 15) return { rank: "Panel Master", icon: "⭐", color: C.accent };
  return { rank: "Vault Legend", icon: "👑", color: C.accentGold };
}

function Stars({ rating = 0, size = 13 }) {
  const filled = Math.round(rating);
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1,2,3,4,5].map((s) => (
        <Text key={s} style={{ fontSize: size, color: s <= filled ? C.accentGold : C.border }}>
          {s <= filled ? "★" : "☆"}
        </Text>
      ))}
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const user = auth.currentUser;
  const [profileImage, setProfileImage] = useState(user?.photoURL || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // Manga the user has RATED (not created)
  const [ratedManga, setRatedManga] = useState([]);
  const [allManga, setAllManga] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(true);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Reader";

  // Fetch all manga where this user left a rating
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "manga_reviews"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllManga(data);
      const rated = data
        .filter((m) => m.userRatings?.[user.uid])
        .sort((a, b) => (b.userRatings?.[user.uid] || 0) - (a.userRatings?.[user.uid] || 0));
      setRatedManga(rated);
      setLoadingRatings(false);
    });
    return unsub;
  }, [user]);

  const myRatingCount = ratedManga.length;
  const rank = getReaderRank(myRatingCount);

  // Comments the user left across all manga
  const myCommentCount = allManga.reduce((acc, m) =>
    acc + (m.comments || []).filter((c) => c.authorId === user?.uid).length, 0
  );
  const avgMyRating = ratedManga.length > 0
    ? (ratedManga.reduce((acc, m) => acc + (m.userRatings?.[user.uid] || 0), 0) / ratedManga.length).toFixed(1)
    : "—";

  async function handleLogout() {
    const doLogout = async () => {
      try { await signOut(auth); } catch (e) {
        const msg = e.message || "Logout failed.";
        Platform.OS === "web" ? window.alert(msg) : Alert.alert("Error", msg);
      }
    };
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to logout?")) doLogout();
    } else {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: doLogout },
      ]);
    }
  }

  async function chooseProfilePhoto() {
    if (Platform.OS !== "web") {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Allow access to your photos.");
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      await uploadPhoto(result.assets[0]);
    }
  }

  async function uploadPhoto(asset) {
    setUploadingPhoto(true);
    try {
      const photoRef = ref(storage, `profilePictures/${user.uid}`);
      if (Platform.OS === "web" && asset.base64) {
        await uploadString(photoRef, asset.base64, "base64", { contentType: asset.mimeType || "image/jpeg" });
      } else {
        const resp = await fetch(asset.uri);
        const blob = await resp.blob();
        await uploadBytes(photoRef, blob);
      }
      const url = await getDownloadURL(photoRef);
      await updateProfile(user, { photoURL: url });
      setProfileImage(url);
    } catch (e) {
      const msg = e.message || "Upload failed.";
      Platform.OS === "web" ? window.alert("Error: " + msg) : Alert.alert("Error", msg);
    } finally {
      setUploadingPhoto(false);
    }
  }

  const STATS = [
    { label: "Rated", value: myRatingCount, icon: "⭐", color: C.accentGold },
    { label: "Comments", value: myCommentCount, icon: "💬", color: C.accentBlue },
    { label: "Avg Rating", value: avgMyRating, icon: "★", color: C.accent },
    { label: "Rank", value: rank.icon, icon: null, color: rank.color },
  ];

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.surface} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
          <Text style={s.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* ── Profile card ── */}
        <View style={s.profileCard}>
          {/* Avatar */}
          <TouchableOpacity style={s.avatarWrap} onPress={chooseProfilePhoto} activeOpacity={0.8}>
            {uploadingPhoto ? (
              <View style={s.avatarPlaceholder}>
                <ActivityIndicator color={C.white} size="large" />
              </View>
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={s.avatar} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>{displayName[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={s.avatarEditBadge}>
              <Text style={s.avatarEditText}>✎</Text>
            </View>
          </TouchableOpacity>

          {/* Info */}
          <View style={s.profileInfo}>
            <Text style={s.displayName}>{displayName}</Text>
            <Text style={s.emailText}>{user?.email}</Text>

            <View style={[s.rankBadge, { borderColor: rank.color }]}>
              <Text style={s.rankIcon}>{rank.icon}</Text>
              <Text style={[s.rankText, { color: rank.color }]}>{rank.rank}</Text>
            </View>

            <View style={s.memberBadge}>
              <Text style={s.memberBadgeText}>★ VAULT MEMBER</Text>
            </View>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={s.statsGrid}>
          {STATS.map((st) => (
            <View key={st.label} style={[s.statCard, { borderTopColor: st.color }]}>
              <Text style={s.statIcon}>{st.icon || st.value}</Text>
              {st.icon && <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>}
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── My Ratings ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionBar, { backgroundColor: C.accentGold }]} />
            <Text style={s.sectionTitle}>MY RATINGS</Text>
            <View style={s.sectionBadge}>
              <Text style={s.sectionBadgeText}>{myRatingCount}</Text>
            </View>
          </View>

          {loadingRatings ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <ActivityIndicator color={C.accent} size="small" />
            </View>
          ) : ratedManga.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>⭐</Text>
              <Text style={s.emptyTitle}>No ratings yet</Text>
              <Text style={s.emptySub}>Tap any manga to leave your first rating!</Text>
              <TouchableOpacity style={s.exploreBtn} onPress={() => navigation.navigate("Home")}>
                <Text style={s.exploreBtnText}>Browse Manga</Text>
              </TouchableOpacity>
            </View>
          ) : (
            ratedManga.map((m) => {
              const myRating = m.userRatings?.[user.uid] || 0;
              const totalRatings = Object.values(m.userRatings || {}).length;
              const avgR = totalRatings > 0
                ? (Object.values(m.userRatings || {}).reduce((a, b) => a + b, 0) / totalRatings).toFixed(1)
                : null;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={s.ratingRow}
                  onPress={() => navigation.navigate("MangaDetail", { mangaId: m.id })}
                  activeOpacity={0.8}
                >
                  {m.coverUrl ? (
                    <Image source={{ uri: m.coverUrl }} style={s.rowCover} resizeMode="cover" />
                  ) : (
                    <View style={[s.rowCover, { backgroundColor: C.surface2, alignItems: "center", justifyContent: "center" }]}>
                      <Text style={{ fontSize: 20 }}>📖</Text>
                    </View>
                  )}
                  <View style={s.rowInfo}>
                    <Text style={s.rowTitle} numberOfLines={1}>{m.mangaTitle}</Text>
                    {m.author ? <Text style={s.rowAuthor}>by {m.author}</Text> : null}
                    <View style={s.rowRatingWrap}>
                      <Stars rating={myRating} size={14} />
                      <Text style={s.rowRatingLabel}>Your rating</Text>
                    </View>
                    {avgR && (
                      <Text style={s.rowCommunity}>Community: {avgR} ★ · {totalRatings} rating{totalRatings !== 1 ? "s" : ""}</Text>
                    )}
                  </View>
                  <Text style={s.rowArrow}>›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={s.logoutBlock} onPress={handleLogout}>
          <Text style={s.logoutBlockText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>MANGAVAULT · v2.0</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingTop: Platform.OS === "ios" ? 54 : 36, paddingBottom: 14,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {},
  backBtnText: { fontSize: 17, color: C.accent, fontWeight: "700" },
  headerTitle: { fontSize: 16, fontWeight: "900", color: C.white, letterSpacing: 0.5 },
  logoutBtn: {
    backgroundColor: "transparent", paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1.5, borderColor: C.accent,
  },
  logoutBtnText: { fontSize: 13, color: C.accent, fontWeight: "700" },

  container: { padding: 18, paddingBottom: 60, gap: 20 },

  // Profile card
  profileCard: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 16, padding: 20,
    flexDirection: "row", gap: 18, alignItems: "center",
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  avatarWrap: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: C.accent, overflow: "hidden",
    position: "relative", flexShrink: 0,
  },
  avatar: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarPlaceholder: {
    width: "100%", height: "100%", backgroundColor: C.accent,
    alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { fontSize: 34, fontWeight: "900", color: C.white },
  avatarEditBadge: {
    position: "absolute", bottom: 2, right: 2,
    backgroundColor: C.accentGold, width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  avatarEditText: { fontSize: 11, fontWeight: "900", color: C.bg },

  profileInfo: { flex: 1, gap: 6 },
  displayName: { fontSize: 19, fontWeight: "900", color: C.white, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" },
  emailText: { fontSize: 11, color: C.textMuted },
  rankBadge: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  rankIcon: { fontSize: 13 },
  rankText: { fontSize: 11, fontWeight: "800" },
  memberBadge: {
    alignSelf: "flex-start", backgroundColor: C.accentGold,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
  },
  memberBadgeText: { fontSize: 9, fontWeight: "900", color: C.bg, letterSpacing: 1.5 },

  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flex: 1, minWidth: "44%",
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderTopWidth: 3, borderRadius: 12,
    alignItems: "center", paddingVertical: 16, paddingHorizontal: 8, gap: 3,
  },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 26, fontWeight: "900" },
  statLabel: { fontSize: 10, color: C.textMuted, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },

  // Section
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionBar: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { flex: 1, fontSize: 12, fontWeight: "900", color: C.white, letterSpacing: 2 },
  sectionBadge: { backgroundColor: C.accent, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  sectionBadgeText: { fontSize: 11, fontWeight: "900", color: C.white },

  // Empty
  empty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: C.white },
  emptySub: { fontSize: 12, color: C.textMuted, textAlign: "center" },
  exploreBtn: {
    backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 8, marginTop: 6,
  },
  exploreBtnText: { color: C.white, fontWeight: "900", fontSize: 13 },

  // Rating rows
  ratingRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, overflow: "hidden", padding: 0,
  },
  rowCover: { width: 60, height: 88 },
  rowInfo: { flex: 1, paddingVertical: 10, gap: 4 },
  rowTitle: { fontSize: 14, fontWeight: "900", color: C.white, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" },
  rowAuthor: { fontSize: 11, color: C.accentGold, fontWeight: "600" },
  rowRatingWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowRatingLabel: { fontSize: 10, color: C.textMuted, fontWeight: "700" },
  rowCommunity: { fontSize: 11, color: C.textMuted },
  rowArrow: { fontSize: 22, color: C.textMuted, paddingRight: 14 },

  // Logout block
  logoutBlock: {
    paddingVertical: 15, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.accent,
    backgroundColor: C.surface, alignItems: "center",
  },
  logoutBlockText: { color: C.accent, fontWeight: "900", fontSize: 14, letterSpacing: 0.5 },

  version: { textAlign: "center", fontSize: 10, color: C.textDim, letterSpacing: 2, fontWeight: "700" },
});