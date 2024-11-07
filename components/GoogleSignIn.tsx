import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import { Text } from "~/components/ui/text";

import { useSession } from "../ctx/session";
import { Button } from "./ui/button";

export default function () {
  const { signIn } = useSession();

  return (
    <Button
      variant="outline"
      className="flex flex-row gap-4 w-4/5 rounded-full border-black dark:border-white mb-4"
      onPress={() => {
        signIn();
      }}
    >
      <Image
        source={require(`../assets/images/google.svg`)}
        style={styles.image}
      />
      <Text>Sign In With Google</Text>
    </Button>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 25,
    height: 25,
    borderRadius: 100,
  },
});
