import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
} from "@react-native-google-signin/google-signin";
import { StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { Button } from "./ui/button";
import { Text } from "~/components/ui/text";
import axios from "axios";

export default function () {
  GoogleSignin.configure({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  });

  return (
    <Button
      variant="outline"
      className="flex flex-row gap-4 w-4/5 rounded-full border-black dark:border-white"
      onPress={async () => {
        try {
          await GoogleSignin.hasPlayServices();
          const response = await GoogleSignin.signIn();
          if (isSuccessResponse(response)) {
            // setState({ userInfo: response.data });
            const data = response.data;
            axios
              .post(
                `${process.env.EXPO_PUBLIC_API_URL}/auth/google-sign-in`,
                {
                  idToken: data.idToken,
                  googleId: data.user.id,
                  platform: Platform.OS,
                },
                {
                  headers: {
                    Accept: "application/json, application/vnd.api+json",
                  },
                }
              )
              .then(function (response) {
                console.log("response", response.data);
              })
              .catch(function (error) {
                console.log("error", error.message);
              });
          } else {
            // sign in was cancelled by user
            console.log("sign in was cancelled by user");
          }
        } catch (error) {
          if (isErrorWithCode(error)) {
            switch (error.code) {
              case statusCodes.IN_PROGRESS:
                // operation (eg. sign in) already in progress
                console.log("operation (eg. sign in) already in progress");
                break;
              case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                // Android only, play services not available or outdated
                console.log(
                  "Android only, play services not available or outdated"
                );
                break;
              default:
                // some other error happened
                console.log("some other error happened");
            }
          } else {
            // an error that's not related to google sign in occurred
            console.log(
              "an error that's not related to google sign in occurred"
            );
          }
        }
      }}
    >
      <Image
        source={require(`../assets/images/google.svg`)}
        style={styles.image}
        cachePolicy={"memory-disk"}
      />
      <Text>Sign In With Google</Text>
    </Button>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 25,
    height: 25,
    // backgroundColor: "white",
    borderRadius: 100,
  },
});
