import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState } from "react";

import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View className="flex-1 justify-center items-center ">
        <Text>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} className="w-2/3">
          <Text>Grant Access</Text>
        </Button>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  return (
    <CameraView style={styles.camera} facing={facing}>
      <View className="flex-1 justify-end items-center p-16">
        <Button variant="outline" onPress={toggleCameraFacing}>
          <Text>Flip Camera</Text>
        </Button>
      </View>
    </CameraView>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: "100%",
  },
});
