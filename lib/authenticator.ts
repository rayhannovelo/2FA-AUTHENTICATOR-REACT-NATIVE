global.Buffer = global.Buffer || require("buffer").Buffer;

import { Authenticator } from "@otplib/core";
import { keyDecoder, keyEncoder } from "@otplib/plugin-thirty-two";
import { createDigest, createRandomBytes } from "@otplib/plugin-crypto-js";

export const authenticator = new Authenticator({
  createDigest,
  createRandomBytes,
  keyDecoder,
  keyEncoder,
});
