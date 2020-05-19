import Ajv from "ajv";
import { getLogger } from "../logger";
import openAttestationSchemav2 from "../../v2/schema/schema.json";
import openAttestationSchemav3 from "../../v3/schema/schema.json";
import { getData } from "../utils";
import { SchemaId } from "../@types/document";

import { OpenAttestationDocument } from "../../__generated__/schemaV3";
import { VerifiableCredential } from "../../shared/@types/document";
import { compact } from "jsonld";

const logger = getLogger("validate");

export const validateSchema = (document: any, validator: Ajv.ValidateFunction): Ajv.ErrorObject[] => {
  if (!validator) {
    throw new Error("No schema validator provided");
  }
  const valid = validator(document.version === SchemaId.v3 ? document : getData(document));
  if (!valid) {
    logger.debug("There are errors in the document");
    logger.debug(validator.errors);
    return validator.errors ?? [];
  }
  logger.debug(`Document is a valid open attestation document v${document.version}`);
  return [];
};

const getId = (objectOrString: any) => {
  if (typeof objectOrString === "string") {
    return objectOrString;
  }
  return objectOrString.id;
};
/* Based on https://tools.ietf.org/html/rfc3339#section-5.6 */
const dateFullYear = /[0-9]{4}/;
const dateMonth = /(0[1-9]|1[0-2])/;
const dateMDay = /([12]\d|0[1-9]|3[01])/;
const timeHour = /([01][0-9]|2[0-3])/;
const timeMinute = /[0-5][0-9]/;
const timeSecond = /([0-5][0-9]|60)/;
const timeSecFrac = /(\.[0-9]+)?/;
const timeNumOffset = new RegExp("[-+]".concat(timeHour.source, ":").concat(timeMinute.source));
const timeOffset = new RegExp("([zZ]|".concat(timeNumOffset.source, ")"));
const partialTime = new RegExp(
  ""
    .concat(timeHour.source, ":")
    .concat(timeMinute.source, ":")
    .concat(timeSecond.source)
    .concat(timeSecFrac.source)
);
const fullDate = new RegExp(
  ""
    .concat(dateFullYear.source, "-")
    .concat(dateMonth.source, "-")
    .concat(dateMDay.source)
);
const fullTime = new RegExp("".concat(partialTime.source).concat(timeOffset.source));
const rfc3339 = new RegExp("".concat(fullDate.source, "[ tT]").concat(fullTime.source));

const isValidRFC3339 = (str: any) => {
  return rfc3339.test(str);
};
export async function validateW3C<T extends OpenAttestationDocument>(
  credential: VerifiableCredential<T>
): Promise<void> {
  // ensure first context is 'https://www.w3.org/2018/credentials/v1'
  if (Array.isArray(credential["@context"]) && credential["@context"][0] !== "https://www.w3.org/2018/credentials/v1") {
    throw new Error("https://www.w3.org/2018/credentials/v1 needs to be first in the " + "list of contexts.");
  }
  // TODO how to ensure issuer is a valid RFC 3986 URI
  const issuerId = getId(credential.issuer);
  if (!issuerId.includes(":")) {
    throw new Error(`Property \`issuer\` id must be a a valid RFC 3986 URI`);
  }

  // ensure issuanceDate is a valid RFC3339 date
  if (!isValidRFC3339(credential.issuanceDate)) {
    throw new Error("Property `issuanceDate` must be a a valid RFC 3339 date");
  }
  // ensure expirationDate is a valid RFC3339 date
  if (credential.expirationDate && !isValidRFC3339(credential.expirationDate)) {
    throw new Error("Property `expirationDate` must be a a valid RFC 3339 date");
  }

  await compact(credential, "https://w3id.org/security/v2", {
    expansionMap: info => {
      if (info.unmappedProperty) {
        throw new Error(
          'The property "' + info.unmappedProperty + '" in the input ' + "was not defined in the context."
        );
      }
    }
  });
}

const ajv = new Ajv({ allErrors: true });
ajv.compile(openAttestationSchemav2);
ajv.compile(openAttestationSchemav3);
export const getSchema = (key: string) => ajv.getSchema(key);