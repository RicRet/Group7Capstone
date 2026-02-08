// app/test.tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getHealth } from "./lib/api/health";
import { apiBase } from "./lib/config";

const Test = () => {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pingApi = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const data = await getHealth();
      setStatus(`Health ok: ${data.ok} (base: ${apiBase})`);
    } catch (e: any) {
      setStatus(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Test Hub</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/homepage")}>
        <Text style={styles.buttonText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/test2")}>
        <Text style={styles.buttonText}>Map</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/navigation")}>
        <Text style={styles.buttonText}>Navigation</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/Login")}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/Signup")}>
        <Text style={styles.buttonText}>Signup</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/test1")}>
        <Text style={styles.buttonText}>test1</Text>
      </TouchableOpacity>

      <View style={{ height: 8 }} />
      <TouchableOpacity style={[styles.button, styles.secondary]} onPress={pingApi} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Ping API (/v1/health)</Text>
        )}
      </TouchableOpacity>

      {status && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}
    </View>
  );
};

export default Test;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 8,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  secondary: {
    backgroundColor: "#34C759",
  },
  statusBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F2F8FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCE4FF",
  },
  statusText: {
    color: "#003A75",
  },
});