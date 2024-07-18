import { ErrorObject } from "ajv";

import * as v2 from "../../__generated__/schema.2.0";
import { getData } from "../../2.0/utils";
import { WrappedDocument as WrappedDocumentV2 } from "../../2.0/types";
import { OpenAttestationDocument as OpenAttestationDocumentV2 } from "../../__generated__/schema.2.0";

import * as v3 from "../../__generated__/schema.3.0";
import { WrappedDocument as WrappedDocumentV3 } from "../../3.0/types";
import { OpenAttestationDocument as OpenAttestationDocumentV3 } from "../../__generated__/schema.3.0";

import { V4WrappedDocument } from "../../4.0/types";
import { ContextUrl } from "../../4.0/context";

import { OpenAttestationDocument, WrappedDocument, SchemaId } from "../@types/document";
import {
  isRawV2Document,
  isWrappedV2Document,
  isRawV3Document,
  isWrappedV3Document,
  isWrappedV4Document,
  isRawV4Document,
} from "./guard";
import { Version } from "./diagnose";

export function getIssuerAddress(document: any): any {
  if (isWrappedV2Document(document)) {
    const data = getData(document);
    return data.issuers.map((issuer) => issuer.certificateStore || issuer.documentStore || issuer.tokenRegistry);
  } else if (isWrappedV3Document(document)) {
    return document.openAttestationMetadata.proof.value;
  }
  // TODO: OA v4 proof schema not updated to support document store issuance yet
  // else if (isWrappedV4Document(document)) {
  //   return document.proof.?
  // }
  throw new Error(
    "Unsupported document type: Only can retrieve issuer address from wrapped OpenAttestation v2 & v3 documents."
  );
}

export const getMerkleRoot = (document: any): string => {
  if (isWrappedV2Document(document)) return document.signature.merkleRoot;
  else if (isWrappedV3Document(document)) return document.proof.merkleRoot;
  else if (isWrappedV4Document(document)) return document.proof.merkleRoot;

  throw new Error(
    "Unsupported document type: Only can retrieve merkle root from wrapped OpenAttestation v2, v3 & v4 documents."
  );
};

export const getTargetHash = (document: any): string => {
  if (isWrappedV2Document(document)) return document.signature.targetHash;
  else if (isWrappedV3Document(document)) return document.proof.targetHash;
  else if (isWrappedV4Document(document)) return document.proof.targetHash;

  throw new Error(
    "Unsupported document type: Only can retrieve target hash from wrapped OpenAttestation v2, v3 & v4 documents."
  );
};

// get template url from raw document for document renderer preview.
export const getTemplateURL = (document: any): string | undefined => {
  if (isWrappedV2Document(document)) {
    const unwrappedDocument = getData(document);
    if (typeof unwrappedDocument.$template === "string") return unwrappedDocument.$template;
    else return unwrappedDocument.$template?.url;
  } else if (isRawV2Document(document)) {
    if (typeof document.$template === "string") return document.$template;
    else return document.$template?.url;
  } else if (isRawV3Document(document) || isWrappedV3Document(document)) {
    return document.openAttestationMetadata.template?.url;
  } else if (isRawV4Document(document) || isWrappedV4Document(document)) {
    return document.renderMethod && document.renderMethod[0].id;
  }

  throw new Error(
    "Unsupported document type: Only can retrieve template url from OpenAttestation v2, v3 & v4 documents."
  );
};

export const getDocumentData = (document: WrappedDocument<OpenAttestationDocument>): OpenAttestationDocument => {
  if (isWrappedV3Document(document) || isWrappedV4Document(document)) {
    const omit = (keys: any, obj: any): any =>
      Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
    return omit(["proof"], document);
  } else if (isWrappedV2Document(document)) {
    return getData(document);
  }

  throw new Error(
    "Unsupported document type: Only can retrieve document data for wrapped OpenAttestation v2, v3 & v4 documents."
  );
};

export const isTransferableAsset = (document: any): boolean => {
  return (
    !!getData(document)?.issuers[0]?.tokenRegistry ||
    document?.openAttestationMetadata?.proof?.method === "TOKEN_REGISTRY"
  );
};

export const isDocumentRevokable = (document: any): boolean => {
  if (isTransferableAsset(document)) {
    return false;
  } else if (isWrappedV2Document(document)) {
    const issuer = getData(document)?.issuers[0];
    const isDidRevokableV2 =
      (issuer.identityProof?.type === v2.IdentityProofType.Did ||
        issuer.identityProof?.type === v2.IdentityProofType.DNSDid) &&
      (issuer.revocation?.type === v2.RevocationType.RevocationStore ||
        issuer.revocation?.type === v2.RevocationType.OcspResponder);
    const isDocumentStoreRevokableV2 = !!issuer.certificateStore || !!issuer.documentStore;

    return isDocumentStoreRevokableV2 || isDidRevokableV2;
  } else if (isWrappedV3Document(document)) {
    const isDidRevokableV3 =
      (document.openAttestationMetadata.proof.method === (v3.IdentityProofType.Did as string) ||
        document.openAttestationMetadata.proof.method === (v3.IdentityProofType.DNSDid as string)) &&
      document.openAttestationMetadata.proof.revocation?.type === v3.RevocationType.RevocationStore;
    const isDocumentStoreRevokableV3 =
      document.openAttestationMetadata.proof.method === v3.Method.DocumentStore &&
      !!document.openAttestationMetadata.proof.value;

    return isDocumentStoreRevokableV3 || isDidRevokableV3;
  } else if (isWrappedV4Document(document)) {
    if (typeof document.issuer === "string" || !document.credentialStatus) return false;
    const isDidRevokableV4 =
      document.issuer.identityProof?.identityProofType === "DNS-DID"
        ? document.credentialStatus.type === "OpenAttestationOcspResponder"
        : false;
    // TODO: OA v4 issuer schema not updated to support document store issuance yet
    // const isDocumentStoreRevokableV4 = ?

    return isDidRevokableV4;
  }

  return false;
};

export const getAssetId = (document: any): string => {
  if (isTransferableAsset(document)) {
    return getTargetHash(document);
  }

  throw new Error(
    "Unsupported document type: Only can retrieve asset id from wrapped OpenAttestation v2 & v3 transferable documents."
  );
};

export class SchemaValidationError extends Error {
  constructor(message: string, public validationErrors: ErrorObject[], public document: any) {
    super(message);
  }
}
export const isSchemaValidationError = (error: any): error is SchemaValidationError => {
  return !!error.validationErrors;
};

// make it available for consumers
export { keccak256 } from "js-sha3";

export const isObfuscated = (
  document:
    | WrappedDocumentV2<OpenAttestationDocumentV2>
    | WrappedDocumentV3<OpenAttestationDocumentV3>
    | V4WrappedDocument
): boolean => {
  if (isWrappedV2Document(document)) {
    return !!document.privacy?.obfuscatedData?.length;
  } else if (isWrappedV3Document(document)) {
    return !!document.proof.privacy.obfuscated.length;
  } else if (isWrappedV4Document(document)) {
    return !!document.proof.privacy.obfuscated.length;
  }

  throw new Error(
    "Unsupported document type: Can only check if there are obfuscated data from wrapped OpenAttestation v2 & v3 documents."
  );
};

export const getObfuscatedData = (
  document:
    | WrappedDocumentV2<OpenAttestationDocumentV2>
    | WrappedDocumentV3<OpenAttestationDocumentV3>
    | V4WrappedDocument
): string[] => {
  if (isWrappedV2Document(document)) {
    return document.privacy?.obfuscatedData || [];
  } else if (isWrappedV3Document(document)) {
    return document.proof.privacy.obfuscated || [];
  } else if (isWrappedV4Document(document)) {
    return document.proof.privacy.obfuscated || [];
  }

  throw new Error(
    "Unsupported document type: Can only retrieve obfuscated data from wrapped OpenAttestation v2 & v3 documents."
  );
};

export const getVersion = (document: unknown): Version => {
  if (typeof document === "object" && document !== null) {
    if ("version" in document && typeof document.version === "string") {
      switch (document.version) {
        case SchemaId.v2:
          return "2.0";
        case SchemaId.v3:
          return "3.0";
      }
    } else if ("@context" in document && Array.isArray(document["@context"])) {
      if (document["@context"].includes(ContextUrl.oa_vc_v4)) {
        return "4.0";
      }
    }
  }

  throw new Error("Unknown document version: Can only determine between OpenAttestation v2, v3 & v4 documents.");
};
