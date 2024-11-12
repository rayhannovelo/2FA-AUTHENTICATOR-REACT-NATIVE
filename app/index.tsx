import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useDebouncedCallback } from "use-debounce";
import GoogleSignIn from "~/components/GoogleSignIn";
import { Token } from "~/components/Token";
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
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";
import { Plus } from "~/lib/icons/Plus";
import { QrCode } from "~/lib/icons/QrCode";
import { Trash } from "~/lib/icons/Trash";

import { useSession } from "../ctx/session";

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
  const { session, signOut } = useSession();

  const { colorScheme } = useNativewindColorScheme();
  const [twoFas, setTwoFas] = useState<TwoFa[]>();
  const [search, setSearch] = useState("");

  const handleSearch = useDebouncedCallback(() => {
    getTwoFas();
  }, 300);

  const getTwoFas = useCallback(async () => {
    if (session) {
      // get data from backend
      axios
        .get(`${process.env.EXPO_PUBLIC_API_URL}/user-2fas`, {
          headers: {
            Accept: "application/json, application/vnd.api+json",
            Authorization: `Bearer ${JSON.parse(session).user_token.token}`,
          },
        })
        .then(async function (response) {
          console.log("response get data", response.data.data);
          if (response.data.data) {
            setTwoFas(response.data.data);
          }
        })
        .catch(function (error) {
          console.log("error get data", error.message);
        });
    } else {
      // get data from local
      const query = search
        ? "SELECT * FROM two_fas WHERE issuer LIKE ? OR account LIKE ?"
        : "SELECT * FROM two_fas";

      const params = search ? [`%${search}%`, `%${search}%`] : [];
      const twoFas = await db.getAllAsync<TwoFa>(query, params);
      setTwoFas(twoFas);
    }
  }, [db, search, session]);

  const deleteTwoFa = async (id: number) => {
    if (session) {
      // delete data from backend
      axios
        .delete(`${process.env.EXPO_PUBLIC_API_URL}/user-2fas/${id}`, {
          headers: {
            Accept: "application/json, application/vnd.api+json",
            Authorization: `Bearer ${JSON.parse(session).user_token.token}`,
          },
        })
        .then(async function (response) {
          getTwoFas();
        })
        .catch(function (error) {
          console.log("error get data", error.message);
        });
    } else {
      await db.runAsync("DELETE FROM two_fas WHERE id = $id", {
        $id: id,
      });
      getTwoFas();
    }
  };

  useFocusEffect(
    useCallback(() => {
      getTwoFas();
    }, [getTwoFas]),
  );

  return twoFas?.length ? (
    <View className="flex-1 justify-start items-center gap-4 pt-6">
      <TouchableOpacity
        className="absolute z-10 bottom-16 right-8 w-16 h-16 bg-primary rounded-xl items-center justify-center shadow-md dark:shadow-slate-100"
        onPress={() => router.push("/scan-qr")}
      >
        <Plus className="text-primary-foreground" size={40} />
      </TouchableOpacity>
      <View className="w-full px-5">
        <Input
          placeholder="Search..."
          value={search}
          onChangeText={(value) => {
            setSearch(value);
            handleSearch();
          }}
          defaultValue=""
        />
      </View>
      {session ? (
        <>
          <Button
            variant="outline"
            className="flex flex-row gap-4 w-4/5 rounded-full"
            onPress={() => getTwoFas()}
          >
            <Text>Refresh</Text>
          </Button>
          <Button
            variant="destructive"
            className="flex flex-row gap-4 w-4/5 rounded-full mb-4"
            onPress={() => signOut()}
          >
            <Text>Sign Out</Text>
          </Button>
        </>
      ) : (
        <GoogleSignIn />
      )}
      <ScrollView className="w-full">
        <GestureHandlerRootView>
          {twoFas?.map((value) => {
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
  ) : (
    <View className="flex-1 justify-center items-center">
      {colorScheme === "dark" ? (
        <Image
          source={require(`../assets/images/cat-dark.svg`)}
          style={styles.image}
          cachePolicy={"memory-disk"}
        />
      ) : (
        <Image
          source={require(`../assets/images/cat.svg`)}
          style={styles.image}
          cachePolicy={"memory-disk"}
        />
      )}
      <Text className="text-center px-8 mb-4">
        No PPI Authenticator codes here yet.
      </Text>
      <Link href="/scan-qr" asChild>
        <Button className="flex flex-row gap-4 w-4/5 rounded-full mb-4">
          <QrCode className="text-background" />
          <Text>Scan QR Code</Text>
        </Button>
      </Link>
      {session ? (
        <Button
          variant="destructive"
          className="flex flex-row gap-4 w-4/5 rounded-full mb-4"
          onPress={() => signOut()}
        >
          <Text>Sign Out</Text>
        </Button>
      ) : (
        <GoogleSignIn />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 200,
    height: 200,
    backgroundColor: "white",
    borderRadius: 100,
  },
});
