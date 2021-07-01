import { JsonLdObj, RemoteDocument } from "jsonld/jsonld-spec";
import fetch, { Response } from "node-fetch";

const preloadedContextUrls: string[] = [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/examples/v1",
    "https://schemata.openattestation.com/com/openattestation/1.0/DrivingLicenceCredential.json",
    "https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json",
    "https://schemata.openattestation.com/com/openattestation/1.0/CustomContext.json",
];

// Module scoped - subsequent imports and calls to ContextLoader.loadContext will receive the latest updated value
// https://stackoverflow.com/a/48173881/6514532
const contextMap: Map<string, RemoteDocument> = new Map();

let isCached: Promise<true>;

export class ContextLoader {

    constructor() {
        isCached = this.preLoad();
    }

    private async fetchContext (url: string): Promise<any> {
        const repsonse = await fetch(url, { headers: { accept: "application/json" } })
        return repsonse.json();
    }    

    private async preLoad(): Promise<true> {
        console.log(`preloading ...`);
        const promises: Promise<null>[] = preloadedContextUrls.map(async (url) => {
            const jsonLdObj = (await this.fetchContext(url)) as JsonLdObj;
            const remoteDocument: RemoteDocument = {
                contextUrl: undefined, 
                document: jsonLdObj, 
                documentUrl: url,
            }
            contextMap.set(url, remoteDocument);
            return null;
        });
        // let all promises resolve or reject concurrently
        // return true when all promises have completed, regardless of outcome
        await Promise.allSettled(promises);
        return true;
    }

    async loadContext(url: string): Promise<RemoteDocument> {
        // wait for caching to complete
        await isCached;
        console.log(contextMap);

        if (contextMap.get(url) != null) {
            console.log(`preloaded key found! ${url}`);
            return contextMap.get(url) as RemoteDocument;
        }

        const jsonLdObj = (await this.fetchContext(url));
        const remoteDocument: RemoteDocument = {
            contextUrl: undefined, 
            document: jsonLdObj, 
            documentUrl: url,
        }

        contextMap.set(url, remoteDocument);
        return remoteDocument
    }



}