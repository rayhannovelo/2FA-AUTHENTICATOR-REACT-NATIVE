import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, ScrollView } from "react-native";
import { Link } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { Token } from "~/components/Token";
import { Separator } from "~/components/ui/separator";
import { QrCode } from "~/lib/icons/QrCode";
import { Trash } from "~/lib/icons/Trash";
import { authenticator } from "~/lib/authenticator";

interface RightActionProps {
  prog: SharedValue<number>;
  drag: SharedValue<number>;
  id: number; // Add the id prop
  deleteTwoFa: (id: number) => void;
}

function RightAction({ prog, drag, id, deleteTwoFa }: RightActionProps) {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value + 75 }],
    };
  });

  return (
    <Reanimated.View style={styleAnimation}>
      <View className="w-[75px] bg-red-500 h-full flex justify-center items-center">
        <Button
          variant="destructive"
          className="flex flex-row gap-2 w-3/5"
          onPress={() => deleteTwoFa(id)}
        >
          <Trash className="text-white" />
        </Button>
      </View>
    </Reanimated.View>
  );
}

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

  const deleteTwoFa = async (id: number) => {
    await db.runAsync("DELETE FROM two_fas WHERE id = $id", {
      $id: id,
    });
  };

  useFocusEffect(
    useCallback(() => {
      getTwoFas();
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (authenticator.timeRemaining() === 30) {
        getTwoFas();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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
      <ScrollView className="w-full">
        <GestureHandlerRootView>
          {twoFas?.map((value, key) => {
            return (
              <ReanimatedSwipeable
                key={value.id}
                friction={2}
                enableTrackpadTwoFingerGesture
                rightThreshold={40}
                renderRightActions={(prog, drag) => (
                  <RightAction
                    prog={prog}
                    drag={drag}
                    id={value.id}
                    deleteTwoFa={deleteTwoFa}
                  />
                )}
              >
                <Token key={value.id} value={value} />
              </ReanimatedSwipeable>
            );
          })}
        </GestureHandlerRootView>
      </ScrollView>
    </View>
  );
}
