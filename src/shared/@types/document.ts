// types generated by quicktype during postinstall phase
import { OpenAttestationDocument as OpenAttestationDocumentV2 } from "../../__generated__/schema.2.0";
import { OpenAttestationDocument as OpenAttestationDocumentV3 } from "../../__generated__/schema.3.0";
import { WrappedDocument as WrappedDocumentV2 } from "../../2.0/types";
import { WrappedDocument as WrappedDocumentV3 } from "../../3.0/types";

export type OpenAttestationDocument = OpenAttestationDocumentV2 | OpenAttestationDocumentV3;
export type WrappedDocument<T extends OpenAttestationDocument> = T extends OpenAttestationDocumentV2
  ? WrappedDocumentV2<T>
  : T extends OpenAttestationDocumentV3
  ? WrappedDocumentV3<T>
  : unknown;

export type SignatureProofAlgorithm = "SHA3MerkleProof";
export enum SignatureAlgorithm {
  OpenAttestationMerkleProofSignature2018 = "OpenAttestationMerkleProofSignature2018"
}

export enum SchemaId {
  v2 = "https://schema.openattestation.com/2.0/schema.json",
  v3 = "https://schema.openattestation.com/3.0/schema.json"
}

export interface ProofSigningOptions {
  privateKey: string;
  verificationMethod: string;
  type: ProofType;
  proofPurpose?: ProofPurpose;
}

export interface ObfuscationMetadata {
  obfuscatedData?: string[];
}

export enum ProofType {
  OpenAttestationSignature2018 = "OpenAttestationSignature2018"
}
export enum ProofPurpose {
  AssertionMethod = "assertionMethod"
}
export interface Proof {
  type: ProofType;
  created: string;
  proofPurpose: ProofPurpose;
  verificationMethod: string;
  signature: string;
}