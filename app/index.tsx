import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, ScrollView } from "react-native";
import { Link } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Token } from "~/components/Token";
import { Separator } from "~/components/ui/separator";
import { QrCode } from "~/lib/icons/QrCode";
import { Trash } from "~/lib/icons/Trash";
import { authenticator } from "~/lib/authenticator";

type TwoFa = {
  id: number;
  reference_id: string;
  issuer: string;
  account: string;
  secret: string;
  created_at: string;
};

export default function Index() {
  const db = useSQLiteContext();
  const [twoFas, setTwoFas] = useState<TwoFa[]>();

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
    }, [getTwoFas])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("a");
      if (authenticator.timeRemaining() === 30) {
        getTwoFas();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [getTwoFas]);

  return (
    <View className="flex-1 justify-start items-center gap-4 pt-6">
      <Link href="/scan-qr" asChild>
        <Button className="flex flex-row gap-2 w-3/5">
          <QrCode className="text-background" />
          <Text>Scan a QR Code</Text>
        </Button>
      </Link>
      <Button
        variant="destructive"
        className="flex flex-row gap-2 w-3/5"
        onPress={deleteTwoFas}
      >
        <Trash className="text-white" />
        <Text>Delete All Token</Text>
      </Button>
      <View className="w-full px-4">
        <Separator />
      </View>
      <ScrollView className="w-full px-4">
        {twoFas?.map((value) => {
          return <Token key={value.id} value={value} />;
        })}
      </ScrollView>
    </View>
  );
}
