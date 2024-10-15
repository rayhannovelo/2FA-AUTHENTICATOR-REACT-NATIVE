import { useEffect, useState } from "react";
import { View } from "react-native";
import { Link } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

export default function Index() {
  const db = useSQLiteContext();
  const [sqliteVersion, setSqliteVersion] = useState("");

  useEffect(() => {
    async function setup() {
      const result = await db.getFirstAsync<{ "sqlite_version()": string }>(
        "SELECT sqlite_version()"
      );
      setSqliteVersion(result ? result["sqlite_version()"] : "Unknown Version");
    }
    setup();
  }, []);

  return (
    <View className="flex-1 justify-center items-center gap-4">
      <Text>SQLite version: {sqliteVersion}</Text>
      <Link href="/camera" asChild>
        <Button className="w-2/3">
          <Text>Camera</Text>
        </Button>
      </Link>
      <Link href="/scan-qr" asChild>
        <Button className="w-2/3">
          <Text>Scan a QR Code</Text>
        </Button>
      </Link>
    </View>
  );
}
