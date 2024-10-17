import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, TouchableOpacity, ScrollView } from "react-native";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Token } from "~/components/Token";
import { QrCode } from "~/lib/icons/QrCode";
import { Trash } from "~/lib/icons/Trash";
import { authenticator } from "~/lib/authenticator";
import { TriangleAlert } from "~/lib/icons/TriangleAlert";

type TwoFa = {
  id: number;
  reference_id: string;
  issuer: string;
  account: string;
  secret: string;
  created_at: string;
};

type RightActionProps = {
  prog: SharedValue<number>;
  drag: SharedValue<number>;
  id: number;
  issuer: string;
  deleteTwoFa: (id: number) => void;
};

function RightAction({
  prog,
  drag,
  id,
  issuer,
  deleteTwoFa,
}: RightActionProps) {
  const [open, setOpen] = useState(false);

  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value + 75 }],
    };
  });

  return (
    <Reanimated.View style={styleAnimation}>
      <TouchableOpacity
        className="w-[75px] bg-red-500 h-full flex justify-center items-center"
        onPress={() => setOpen(true)}
      >
        <Trash className="text-white" />
      </TouchableOpacity>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center native:text-3xl">
              Remove {issuer}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Text>
                When you remove this account from PPI Authenticator, you won't
                get codes to help you sign in securely anymore. Make sure you
                update your settings for this account to reflect this change.
              </Text>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end">
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                className="flex flex-row gap-2 bg-destructive"
                onPress={() => deleteTwoFa(id)}
              >
                <Trash className="text-white" />
                <Text>Remove Account</Text>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Reanimated.View>
  );
}

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
    getTwoFas();
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
        <Text>Remove All Account</Text>
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
                    issuer={value.issuer}
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
