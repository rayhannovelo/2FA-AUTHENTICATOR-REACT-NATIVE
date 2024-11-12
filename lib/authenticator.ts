import { Authenticator } from "@otplib/core";
import { createDigest, createRandomBytes } from "@otplib/plugin-crypto-js";
import { keyDecoder, keyEncoder } from "@otplib/plugin-thirty-two";

global.Buffer = global.Buffer || require("buffer").Buffer;

export const authenticator = new Authenticator({
  createDigest,
  createRandomBytes,
  keyDecoder,
  keyEncoder,
});
