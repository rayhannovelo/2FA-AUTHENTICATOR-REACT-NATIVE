import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, ScrollView } from "react-native";
import { Link } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Separator } from "~/components/ui/separator";

type TwoFa = {
  id: number;
  reference_id: string;
  issuer: string;
  account: string;
  secret: string;
  created_at: string;
};

type Table = {
  name: string;
};

export default function Index() {
  const db = useSQLiteContext();

  const [sqliteVersion, setSqliteVersion] = useState("");
  const [migrationVersion, setMigrationVersion] = useState(0);
  const [tables, setTables] = useState<Table[]>();
  const [twoFas, setTwoFas] = useState<TwoFa[]>();

  const dbInfo = async () => {
    const result = await db.getFirstAsync<{ "sqlite_version()": string }>(
      "SELECT sqlite_version()"
    );
    setSqliteVersion(result ? result["sqlite_version()"] : "Unknown Version");

    const resultMigration = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version"
    );
    setMigrationVersion(resultMigration?.user_version ?? 0);

    const tables = await db.getAllAsync<Table>(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    setTables(tables);
  };

  const getTwoFas = async () => {
    const twoFas = await db.getAllAsync<TwoFa>("SELECT * FROM two_fas");
    setTwoFas(twoFas);
  };

  const deleteTwoFas = async () => {
    await db.runAsync("DELETE FROM two_fas");

    getTwoFas();
  };

  useFocusEffect(
    useCallback(() => {
      getTwoFas();

      return () => {};
    }, [])
  );

  useEffect(() => {}, []);

  return (
    <View className="flex-1 justify-start items-center gap-4 pt-6 px-4 ">
      {/* <Text>SQLite version: {sqliteVersion}</Text>
      <Text>Migration version: {migrationVersion}</Text>
      <Text>Table List</Text>
      {tables &&
        tables.map((value, key) => {
          return <Text key={key}>{value.name}</Text>;
        })} */}
      {/* <Link href="/camera" asChild>
        <Button className="w-2/3">
          <Text>Camera</Text>
        </Button>
      </Link> */}
      <Link href="/scan-qr" asChild>
        <Button className="w-2/3">
          <Text>Scan a QR Code</Text>
        </Button>
      </Link>

      <Button variant="destructive" className="w-2/3" onPress={deleteTwoFas}>
        <Text>Delete All Token</Text>
      </Button>

      <Separator className="mt-4" />
      <ScrollView className=" w-full">
        {twoFas?.map((value, key) => {
          return (
            <View key={key} className="flex gap-2">
              <Text className="text-lg font-medium">
                {value.issuer}: {value.account}
              </Text>
              <View className="flex flex-row justify-between items-center">
                <Text className="text-5xl text-info">123456</Text>
                <Text>Circle</Text>
              </View>
              <Separator className="my-2" />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
