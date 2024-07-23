import { ethers } from "ethers";
import { SigningFunction, SigningKey, SigningOptions } from "../../../@types/sign";
import { Signer } from "@ethersproject/abstract-signer";
import { Wallet } from "@ethersproject/wallet";

export const name = "Secp256k1VerificationKey2018";

export const sign: SigningFunction = (
  message: string,
  keyOrSigner: SigningKey | Signer,
  options: SigningOptions = {}
): Promise<string> => {
  let signer: Signer;
  if (SigningKey.guard(keyOrSigner)) {
    const wallet = new Wallet(keyOrSigner.private);
    if (!keyOrSigner.public.toLowerCase().includes(wallet.address.toLowerCase())) {
      throw new Error(`Private key is wrong for ${keyOrSigner.public}`);
    }
    signer = wallet;
  } else {
    signer = keyOrSigner;
  }
  return signer.signMessage(options.signAsString ? message : ethers.getBytes(message));
};
