import { WrappedDocument, ProofSigningOptions, SignedWrappedDocument } from "../@types/document";
import { sign as EcdsaSecp256k1Signature2019 } from "./EcdsaSecp256k1Signature2019";

export async function sign<T = any>(
  document: WrappedDocument<T>,
  options: ProofSigningOptions
): Promise<SignedWrappedDocument<T>> {
  switch (options.type) {
    case "EcdsaSecp256k1Signature2019": {
      return await EcdsaSecp256k1Signature2019(document, options);
    }
    default: {
      throw new Error(`Proof type: ${options.type} does not exist.`);
    }
  }
}
