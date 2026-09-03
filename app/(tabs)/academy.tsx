import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { fetchAcademy } from "../../src/api/client";
import { filterModules, uniqueCategories } from "../../src/api/filter";
import { copyMm } from "../../src/copy/mm";

export default function AcademyScreen() {
  const query = useQuery({ queryKey: ["academy"], queryFn: fetchAcademy });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const modules = query.data?.modules ?? [];
  const categories = useMemo(() => uniqueCategories(modules), [modules]);
  const visible = useMemo(
    () => filterModules(modules, search, category, false),
    [modules, search, category],
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ color: "#64748B", marginBottom: 8, lineHeight: 24 }}>
          {copyMm.academy.count(modules.length)}
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={copyMm.academy.search}
          placeholderTextColor="#94A3B8"
          style={{
            height: 44,
            borderWidth: 1,
            borderColor: "rgba(0,31,63,0.1)",
            borderRadius: 8,
            paddingHorizontal: 12,
            color: "#001F3F",
          }}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <Chip
            active={category === "all"}
            label={copyMm.academy.allTopics}
            onPress={() => setCategory("all")}
          />
          {categories.map((cat) => (
            <Chip key={cat} active={category === cat} label={cat} onPress={() => setCategory(cat)} />
          ))}
        </View>
      </View>
      {query.isLoading ? (
        <ActivityIndicator color="#0D9488" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text style={{ color: "#64748B", padding: 16, lineHeight: 28 }}>
              {copyMm.academy.empty}
            </Text>
          }
          renderItem={({ item }) => (
            <Link href={`/learn/${item.slug}`} asChild>
              <Pressable
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(0,31,63,0.1)",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <Text style={{ color: "#001F3F", fontWeight: "700", fontSize: 16 }}>{item.titleEn}</Text>
                <Text style={{ color: "#64748B", marginTop: 4 }}>{item.category}</Text>
              </Pressable>
            </Link>
          )}
          onRefresh={() => query.refetch()}
          refreshing={query.isRefetching}
        />
      )}
    </View>
  );
}

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 16,
        borderRadius: 999,
        justifyContent: "center",
        backgroundColor: active ? "#001F3F" : "#FFFFFF",
        borderWidth: 1,
        borderColor: "rgba(0,31,63,0.1)",
      }}
    >
      <Text style={{ color: active ? "#FFFFFF" : "#001F3F", fontWeight: "600", lineHeight: 22 }}>{label}</Text>
    </Pressable>
  );
}
