import * as React from "react";
import { View } from "react-native";
import { Link } from "expo-router";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center gap-4">
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
