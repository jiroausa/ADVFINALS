
import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Image, ActivityIndicator, TextInput, StatusBar, Platform,
  RefreshControl,
} from "react-native";
import {
  collection, onSnapshot, addDoc, updateDoc, doc, getDocs, query, where,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#0F0F0F",
  surface: "#171717",
  border: "#272727",
  borderBright: "#383838",
  accent: "#E8272F",
  accentGold: "#F5C518",
  accentBlue: "#2B7FE8",
  text: "#F0EDE8",
  textMuted: "#777777",
  textDim: "#444444",
  white: "#FFFFFF",
  ink: "#0D0D0D",
  panel: "#1C1C1C",
};

// ─── 16 Preset Manga ──────────────────────────────────────────────────────────
const PRESET_MANGA = [
  {
    mangaTitle: "One Piece",
    author: "Eiichiro Oda",
    genre: ["Adventure", "Action", "Fantasy"],
    coverUrl: "https://cdn.myanimelist.net/images/manga/2/253146.jpg",
    synopsis: "Monkey D. Luffy, a boy who accidentally ate a Devil Fruit and gained the properties of rubber, dreams of becoming the King of the Pirates. Setting sail from his small village, he assembles a crew of unique companions and embarks on a grand voyage across the seas in search of the legendary treasure known as the 'One Piece'. Along the way they battle corrupt Marines, rival pirates, and world-shaking secrets that challenge everything they know.",
    volumes: 108, chapters: 1122, status: "Publishing", published: "Jul 1997 – Present", serialization: "Weekly Shonen Jump",
  },
  {
    mangaTitle: "Berserk",
    author: "Kentaro Miura",
    genre: ["Dark Fantasy", "Action", "Horror"],
    coverUrl: "https://cdn.myanimelist.net/images/manga/1/157897.jpg",
    synopsis: "Guts is a lone mercenary warrior who has spent his entire life fighting to survive. After a traumatic betrayal by his former commander Griffith — a man he once called a friend — Guts is branded with a mark that attracts demons. Armed with a massive sword called the Dragonslayer, he embarks on a relentless quest for revenge across a dark medieval world filled with monsters, political intrigue, and existential dread.",
    volumes: 41, chapters: 374, status: "Publishing", published: "Aug 1989 – Present", serialization: "Young Animal",
  },
  {
    mangaTitle: "Attack on Titan",
    author: "Hajime Isayama",
    genre: ["Action", "Dark Fantasy", "Mystery"],
    coverUrl: "https://cdn.myanimelist.net/images/manga/2/37846.jpg",
    synopsis: "Centuries ago, mankind was nearly wiped out by giant humanoid creatures called Titans. The survivors retreated behind enormous concentric walls. When a Colossal Titan breaches the outermost wall, young Eren Yeager watches his mother get devoured. He vows to kill every Titan and joins the elite Survey Corps — only to discover that the truth behind the walls is far more horrifying than any monster outside them.",
    volumes: 34, chapters: 139, status: "Finished", published: "Sep 2009 – Apr 2021", serialization: "Bessatsu Shonen Magazine",
  },
  {
    mangaTitle: "Vagabond",
    author: "Takehiko Inoue",
    genre: ["Historical", "Action", "Drama"],
    coverUrl: "https://cdn.myanimelist.net/images/manga/1/259070.jpg",
    synopsis: "Based on Eiji Yoshikawa's novel, Vagabond is a fictionalized retelling of Miyamoto Musashi's life — Japan's most legendary swordsman. Having survived the Battle of Sekigahara, a young Takezo renames himself Musashi and sets off on a journey to become invincible under heaven. The series is a breathtaking meditation on violence, purpose, and what it means to truly live, rendered in some of the most stunning artwork in manga history.",
    volumes: 37, chapters: 327, status: "On Hiatus", published: "Sep 1998 – Present", serialization: "Weekly Morning",
  },
  {
    mangaTitle: "Fullmetal Alchemist",
    author: "Hiromu Arakawa",
    genre: ["Adventure", "Action", "Fantasy"],
    coverUrl: "https://cdn.myanimelist.net/images/manga/3/243675.jpg",
    synopsis: "After a forbidden alchemy ritual to resurrect their mother goes catastrophically wrong, brothers Edward and Alphonse Elric pay a terrible price. Ed loses his arm and leg; Al loses his entire body, his soul bound to a suit of armor. Now State Alchemists, they search for the mythical Philosopher's Stone to restore their bodies — but uncover a vast government conspiracy that threatens the entire nation of Amestris.",
    volumes: 27, chapters: 116, status: "Finished", published: "Jul 2001 – Jun 2010", serialization: "Monthly Shonen GFantasy",
  },
  {
    mangaTitle: "Vinland Saga",
    author: "Makoto Yukimura",
    genre: ["Historical", "Action", "Drama"],
    coverUrl: "https://cdn.myanimelist.net/images/manga/2/188925.jpg",
    synopsis: "Set in the Viking Age, young Thorfinn grows up witnessing his father Thors — one of the greatest warriors alive — murdered by the mercenary Askeladd. Fueled by a desire for revenge, Thorfinn joins Askeladd's crew and fights in countless brutal battles. The series evolves from a tale of vengeance into a profound exploration of what true strength means and whether a warrior can ever find peace.",
    volumes: 27, chapters: 204, status: "Publishing", published: "Apr 2005 – Present", serialization: "Monthly Afternoon",
  },
  {
    mangaTitle: "Demon Slayer",
    author: "Koyoharu Gotouge",
    genre: ["Action", "Supernatural", "Drama"],
    coverUrl: "https://cdn.myanimelist.net/images/manga/3/179023.jpg",
    synopsis: "Tanjiro Kamado lives a peaceful life selling charcoal until he returns home to find his entire family slaughtered by a demon. His younger sister Nezuko is the sole survivor — but she has been transformed into a demon herself. Tanjiro joins the Demon Slayer Corps and trains in Breathing Styles combat to hunt down the demon responsible, Muzan Kibutsuji, all while protecting his sister and searching for a cure.",
    volumes: 23, chapters: 205, status: "Finished", published: "Feb 2016 – May 2020", serialization: "Weekly Shonen Jump",
  },
  {
    mangaTitle: "JoJo's Bizarre Adventure",
    author: "Hirohiko Araki",
    genre: ["Action", "Supernatural", "Comedy"],
    coverUrl: "https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781974708109/jojos-bizarre-adventure-part-4-diamond-is-unbreakable-vol-4-9781974708109_hr.jpg",
    synopsis: "An epic multi-generational saga following the Joestar family bloodline across different eras and continents. Each arc introduces a new JoJo protagonist who battles supernatural evil using increasingly creative powers called Stands — psychic manifestations of fighting spirit. From Victorian England to modern-day Italy, each part is a self-contained story while contributing to one grand, bizarre tapestry of fate and destiny.",
    volumes: 131, chapters: 959, status: "Publishing", published: "Jan 1987 – Present", serialization: "Weekly Shonen Jump / Ultra Jump",
  },
  {
    mangaTitle: "Chainsaw Man",
    author: "Tatsuki Fujimoto",
    genre: ["Action", "Horror", "Dark Comedy"],
    coverUrl: "https://cdn.myanimelist.net/images/manga/3/216464.jpg",
    synopsis: "Denji is a destitute teenage boy saddled with his dead father's yakuza debt, surviving by hunting devils with his devil dog Pochita. When he is killed and betrayed, Pochita merges with his heart and resurrects him as Chainsaw Man — a human-devil hybrid with chainsaws bursting from his body. Recruited by the Public Safety Devil Hunters, Denji navigates a grotesque world of monsters and conspiracies in exchange for the simplest of dreams: a normal life.",
    volumes: 17, chapters: 162, status: "Publishing", published: "Dec 2018 – Present", serialization: "Weekly Shonen Jump / Shonen Jump+",
  },
  {
    mangaTitle: "Hunter x Hunter",
    author: "Yoshihiro Togashi",
    genre: ["Adventure", "Action", "Fantasy"],
    coverUrl: "https://cdn.myanimelist.net/images/manga/1/258245.jpg",
    synopsis: "Twelve-year-old Gon Freecss discovers his father — whom he believed dead — is actually Ging Freecss, a legendary Hunter. Determined to find him, Gon sets out to earn his own Hunter license, a test that only a fraction of applicants survive. Along with his complex friend Killua and other companions, Gon uncovers a world of incredible ability, political intrigue, and moral ambiguity far beyond anything he imagined.",
    volumes: 37, chapters: 400, status: "On Hiatus", published: "Mar 1998 – Present", serialization: "Weekly Shonen Jump",
  },
  {
    mangaTitle: "Slam Dunk",
    author: "Takehiko Inoue",
    genre: ["Sports", "Comedy", "Drama"],
    coverUrl: "https://cdn.myanimelist.net/images/manga/3/265532.jpg",
    synopsis: "Hanamichi Sakuragi is a tall, hot-headed delinquent who has been rejected by 50 girls. When the 51st girl he falls for turns out to love basketball, he joins the Shohoku High School team on a whim — but discovers a genuine passion for the sport along the way. What starts as pure comedy evolves into one of the most emotionally gripping sports stories ever told, culminating in an unforgettable national tournament run.",
    volumes: 31, chapters: 276, status: "Finished", published: "Oct 1990 – Jun 1996", serialization: "Weekly Shonen Jump",
  },
  {
    mangaTitle: "Gantz",
    author: "Hiroya Oku",
    genre: ["Sci-Fi", "Action", "Horror"],
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/1/10/Gantz_vol._1.png/250px-Gantz_vol._1.png",
    synopsis: "Kei Kurono and Masaru Kato are killed by a subway train while trying to help a homeless man, only to find themselves transported to a Tokyo apartment. There, a mysterious black sphere called GANTZ forces them and other recently deceased people to hunt and eliminate alien targets. As the missions grow increasingly deadly and strange, the survivors must confront questions about life, death, and what it means to be human.",
    volumes: 37, chapters: 383, status: "Finished", published: "Jun 2000 – Jun 2013", serialization: "Weekly Young Jump",
  },
  {
    mangaTitle: "Tokyo Ghoul",
    author: "Sui Ishida",
    genre: ["Horror", "Supernatural", "Action"],
    coverUrl: "https://upload.wikimedia.org/wikipedia/en/e/e5/Tokyo_Ghoul_volume_1_cover.jpg",
    synopsis: "Ken Kaneki is a shy college student who barely survives a deadly encounter with a ghoul — a human-eating creature living secretly among people. A medical transplant turns him half-ghoul, forcing him to hide his new nature while navigating two hostile worlds. As he grows stronger and discovers the brutal underground of ghoul society, Kaneki must decide who he truly is and where he belongs.",
    volumes: 14, chapters: 144, status: "Finished", published: "Sep 2011 – Sep 2014", serialization: "Weekly Young Jump",
  },
  {
    mangaTitle: "Death Note",
    author: "Tsugumi Ohba & Takeshi Obata",
    genre: ["Thriller", "Supernatural", "Mystery"],
    coverUrl: "https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781421506265/death-note-vol-5-9781421506265_hr.jpg",
    synopsis: "Prodigy high school student Light Yagami finds a supernatural notebook dropped by a Shinigami (death god). Any human whose name is written in the Death Note will die. Light resolves to use it to rid the world of criminals and become the god of a new, cleansed world. Standing in his way is L — an eccentric but brilliant detective — in a legendary battle of intellect and ideology that spans continents.",
    volumes: 12, chapters: 108, status: "Finished", published: "Dec 2003 – May 2006", serialization: "Weekly Shonen Jump",
  },
  {
    mangaTitle: "Nana",
    author: "Ai Yazawa",
    genre: ["Romance", "Drama", "Slice of Life"],
    coverUrl: "https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781421510217/nana-vol-7-9781421510217_hr.jpg",
    synopsis: "Two young women both named Nana meet by chance on a train to Tokyo and end up becoming roommates. Nana Osaki is a punk rock vocalist chasing her musical dreams; Nana Komatsu is a romantic dreamer following her boyfriend. Their contrasting personalities forge an intense, complex friendship as they both navigate love, heartbreak, ambition, and the painful compromises of adulthood in the city.",
    volumes: 21, chapters: 84, status: "On Hiatus", published: "May 2000 – May 2009", serialization: "Cookie",
  },
  {
    mangaTitle: "Naruto Shippuden",
    author: "Masashi Kishimoto",
    genre: ["Action", "Adventure", "Ninja"],
    coverUrl: "https://static1.cbrimages.com/wordpress/wp-content/uploads/2024/11/naruto-manga-volume-71-cover-art.jpg",
    synopsis: "Two and a half years after leaving his village for intense training, Naruto Uzumaki returns to Konohagakure stronger than ever. But the criminal organization Akatsuki is closing in, hunting the powerful tailed beasts sealed within people like Naruto. As friends fall, alliances shift, and the threat of the legendary Uchiha Madara looms, Naruto must master the full power of the Nine-Tailed Fox and forge his own path to become Hokage — all while trying to save his best friend and rival, Sasuke.",
    volumes: 27, chapters: 247, status: "Finished", published: "Aug 2007 – Nov 2014", serialization: "Weekly Shonen Jump",
  },
];

// ─── Seed helper ──────────────────────────────────────────────────────────────
async function seedPresetManga(reviewsRef) {
  const existing = await getDocs(query(reviewsRef, where("isPreset", "==", true)));
  const existingMap = {};
  existing.docs.forEach((d) => { existingMap[d.data().mangaTitle] = d.id; });

  for (const manga of PRESET_MANGA) {
    if (existingMap[manga.mangaTitle]) {
      // Patch coverUrl/synopsis/genre on existing records so stale URLs get fixed
      await updateDoc(doc(db, "manga_reviews", existingMap[manga.mangaTitle]), {
        coverUrl: manga.coverUrl,
        synopsis: manga.synopsis,
        genre: manga.genre,
        author: manga.author,
        volumes: manga.volumes,
        chapters: manga.chapters,
        status: manga.status,
        published: manga.published,
        serialization: manga.serialization,
      });
    } else {
      await addDoc(reviewsRef, {
        ...manga,
        authorId: "system",
        authorName: "MangaVault",
        userRatings: {},
        comments: [],
        createdAt: Date.now() - Math.floor(Math.random() * 1_000_000),
        isPreset: true,
      });
    }
  }
}

function avgRating(userRatings = {}) {
  const vals = Object.values(userRatings);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function StarDisplay({ rating, size = 13 }) {
  const filled = Math.round(rating || 0);
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={{ fontSize: size, color: s <= filled ? C.accentGold : C.border }}>
          {s <= filled ? "★" : "☆"}
        </Text>
      ))}
    </View>
  );
}

function MangaCover({ uri, title }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <View style={styles.coverWrap}>
      {!loaded && !error && <ActivityIndicator color={C.accentGold} size="small" style={StyleSheet.absoluteFill} />}
      {error ? (
        <View style={styles.coverFallback}>
          <Text style={{ fontSize: 28 }}>📖</Text>
          <Text style={styles.coverFallbackText} numberOfLines={2}>{title}</Text>
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={[styles.cover, !loaded && { opacity: 0 }]}
          resizeMode="cover"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const currentUser = auth.currentUser;
  const [manga, setManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const reviewsRef = collection(db, "manga_reviews");

  useEffect(() => {
    seedPresetManga(reviewsRef).catch(console.error);
    const unsub = onSnapshot(reviewsRef, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        if (a.isPreset && b.isPreset) return a.mangaTitle.localeCompare(b.mangaTitle);
        if (a.isPreset) return 1;
        if (b.isPreset) return -1;
        return b.createdAt - a.createdAt;
      });
      setManga(data);
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, []);

  const filtered = search.trim()
    ? manga.filter((m) => m.mangaTitle.toLowerCase().includes(search.toLowerCase()))
    : manga;

  function renderItem({ item }) {
    const avg = avgRating(item.userRatings);
    const totalVotes = Object.keys(item.userRatings || {}).length;
    const totalComments = item.comments?.length || 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("MangaDetail", { mangaId: item.id })}
        activeOpacity={0.85}
      >
        <MangaCover uri={item.coverUrl} title={item.mangaTitle} />

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.mangaTitle}</Text>

          {/* Author */}
          {item.author ? (
            <Text style={styles.cardAuthor} numberOfLines={1}>by {item.author}</Text>
          ) : null}

          {/* Genre chips */}
          {item.genre?.length > 0 && (
            <View style={styles.genreRow}>
              {item.genre.slice(0, 2).map((g) => (
                <View key={g} style={styles.genreChip}>
                  <Text style={styles.genreChipText}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Rating row */}
          <View style={styles.ratingRow}>
            <StarDisplay rating={avg || 0} size={12} />
            <Text style={styles.ratingText}>
              {avg ? avg.toFixed(2) : "—"}
            </Text>
            <Text style={styles.votesText}>
              {totalVotes ? `  ${totalVotes} rating${totalVotes !== 1 ? "s" : ""}` : "  No ratings yet"}
            </Text>
          </View>

          {/* Synopsis */}
          <Text style={styles.synopsis} numberOfLines={3}>{item.synopsis}</Text>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.commentCount}>💬 {totalComments} comment{totalComments !== 1 ? "s" : ""}</Text>
            <Text style={styles.rateLink}>Rate →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLogo}>MANGA<Text style={{ color: C.accent }}>VAULT</Text></Text>
          <Text style={styles.headerSub}>Community ratings & reviews</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => currentUser ? navigation.navigate("Profile") : navigation.navigate("Login")}
        >
          <Text style={styles.profileBtnText}>{currentUser ? "👤" : "🔑"}</Text>
          <Text style={styles.profileBtnLabel}>{currentUser ? "Profile" : "Sign In"}</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search manga..."
          placeholderTextColor={C.textDim}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} title{filtered.length !== 1 ? "s" : ""}
        </Text>
        {!currentUser && (
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.signInHint}>Sign in to rate & comment →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={styles.loadingText}>Loading manga...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={C.accent} />
          }
          ListEmptyComponent={() => (
            <View style={styles.centered}>
              <Text style={{ fontSize: 36 }}>📭</Text>
              <Text style={styles.emptyText}>No manga found</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerLogo: {
    fontSize: 22, fontWeight: "900", color: C.white, letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  headerSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  profileBtn: { alignItems: "center", gap: 2 },
  profileBtnText: { fontSize: 22 },
  profileBtnLabel: { fontSize: 9, color: C.textMuted, fontWeight: "700", letterSpacing: 1 },

  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.panel,
    marginHorizontal: 14, marginTop: 12, marginBottom: 4,
    borderRadius: 6, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: C.text },
  clearBtn: { fontSize: 14, color: C.textMuted, paddingLeft: 8 },

  countRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 8,
  },
  countText: { fontSize: 12, color: C.textMuted, fontWeight: "700" },
  signInHint: { fontSize: 11, color: C.accentGold, fontWeight: "700" },

  list: { paddingHorizontal: 14, paddingBottom: 32 },
  separator: { height: 1, backgroundColor: C.border, marginVertical: 2 },

  card: {
    flexDirection: "row",
    paddingVertical: 14,
    gap: 12,
  },
  coverWrap: {
    width: 72, height: 108,
    backgroundColor: C.panel,
    borderRadius: 3,
    overflow: "hidden",
    flexShrink: 0,
    borderWidth: 1, borderColor: C.border,
  },
  cover: { width: "100%", height: "100%" },
  coverFallback: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 6,
  },
  coverFallbackText: {
    fontSize: 9, color: C.textMuted, textAlign: "center", marginTop: 4, fontWeight: "700",
  },

  cardInfo: { flex: 1, gap: 5, justifyContent: "flex-start" },
  cardTitle: {
    fontSize: 15, fontWeight: "900", color: C.white,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    lineHeight: 20,
  },
  cardAuthor: { fontSize: 11, color: C.accentGold, fontWeight: "600", marginTop: -2 },

  genreRow: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  genreChip: {
    backgroundColor: C.panel, borderWidth: 1, borderColor: C.borderBright,
    borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2,
  },
  genreChipText: { fontSize: 9, color: C.textMuted, fontWeight: "700" },

  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, color: C.accentGold, fontWeight: "900" },
  votesText: { fontSize: 11, color: C.textMuted },

  synopsis: { fontSize: 12, color: C.textMuted, lineHeight: 17 },

  cardFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2,
  },
  commentCount: { fontSize: 11, color: C.textMuted },
  rateLink: { fontSize: 11, color: C.accent, fontWeight: "900" },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 },
  loadingText: { fontSize: 13, color: C.textMuted },
  emptyText: { fontSize: 15, color: C.textMuted, fontWeight: "700" },
});