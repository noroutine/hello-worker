import { Session } from './objects/session';
import { Counter } from "./objects/counter";
import { MyDurableObject } from "./objects/mydurableobject";

import { convertYesToBoolean, generateRandomAlphanumeric, isAbsoluteURL } from "./utils";
import { SecureSession } from './session';
import ViewFactory from './views';
import { RBAC } from './rbac';

/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

export { Counter, MyDurableObject, Session };

/**
 * Associate bindings declared in wrangler.toml with the TypeScript type system
 */
export interface Env {
  ENVIRONMENT: string;
  DASH: any;
  GOD_MODE: string;
  TRACKER: boolean;

  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  MY_DURABLE_OBJECT: DurableObjectNamespace<MyDurableObject>;
  COUNTERS: DurableObjectNamespace<Counter>;
  SESSIONS: DurableObjectNamespace<Session>;

  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
  //
  // Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
  // MY_QUEUE: Queue;
}

export default {
  /**
   * This is the standard fetch handler for a Cloudflare Worker
   *
   * @param request - The request submitted to the Worker from the client
   * @param env - The interface to reference bindings declared in wrangler.toml
   * @param ctx - The execution context of the Worker
   * @returns The response to be sent back to the client
   */
  async fetch(request, env, ctx): Promise<Response> {
    let url = new URL(request.url);

    // Get the base URL (URL without path)
    const baseUrl = url.port ? `${url.protocol}//${url.hostname}:${url.port}` : `${url.protocol}//${url.hostname}`

    // determine if we are in dash
    let dashMode = env.DASH == url.hostname;

    // determine god mode
    let godMode = 
      (env.GOD_MODE == "never" && false) || 
      (env.GOD_MODE == "dash" && dashMode) ||
      (env.GOD_MODE == "always");

    // determine tracking pixel
    let trackerName = convertYesToBoolean(env.TRACKER) && !dashMode ? url.hostname : '';

    console.log(`God Mode: ${env.GOD_MODE},${godMode}, dash: ${env.DASH}, baseUrl: ${baseUrl}`);

    let name = url.searchParams.get("name");
    let dataUrl = "/";

    // Fuck off
    if (url.pathname === "/favicon.ico") {
      return ViewFactory.NOT_FOUND;
    }

    // object inventory
    const INVENTORY = env.MY_DURABLE_OBJECT.get(env.MY_DURABLE_OBJECT.idFromName("counters"));

    // handle session
    let session = await SecureSession.fromRequest(request, env.SESSIONS, INVENTORY);
    if (session) {
      console.log('Reconstructed session:', session.toString());
    } else {
      session = await SecureSession.createNew(env.SESSIONS, INVENTORY)
      console.log(`Created new session: ${session.toString()}`);
    }
    
    // construct view factory
    const VIEW_FACTORY = new ViewFactory(session, RBAC.setupDefaultRoles(), godMode)

    // now to business
    let names = await INVENTORY.get(Counter.INVENTORY_KEY);
    let sessions = await INVENTORY.get(Session.INVENTORY_KEY);

    if (!name) {
      if (url.pathname === "/") {
        return VIEW_FACTORY.createCounterView(names, sessions, generateRandomAlphanumeric(6, true), 0, "/", trackerName);
      } else {
        let redirectSlug = decodeURI(url.pathname).split(/\//)[1]
        if (names.includes(redirectSlug)) {
          let redirectId = env.COUNTERS.get(env.COUNTERS.idFromName(redirectSlug));
          await redirectId.increment(1)

          let redirectUrl: string = await redirectId.getDataUrl()
          if (redirectUrl == "/" || redirectUrl.length == 0 || redirectUrl == undefined) {
            return ViewFactory.PIXEL;
          } else if (isAbsoluteURL(redirectUrl)) {
            return Response.redirect(redirectUrl, 302)
          } else {
            // relative and not "/"
            return Response.redirect(baseUrl + redirectUrl, 302)
          }
        } else {
          return ViewFactory.NOT_FOUND;
        }
      }
    }

    // dash guard, only increment is allowed outside dash
    if (!godMode && !["/", "/increment"].includes(url.pathname)) {
      return Response.redirect(`https://${env.DASH}`, 302)
    }

    let counterId: DurableObjectId = env.COUNTERS.idFromName(name);
    let counterStub: DurableObjectStub<Counter> = env.COUNTERS.get(counterId);
    let count: number

    INVENTORY.add(Counter.INVENTORY_KEY, name);
    count = await counterStub.getCounterValue();
    dataUrl = await counterStub.getDataUrl();

    switch (url.pathname) {
      case "/increment":
        await counterStub.increment(1);
        break;
      case "/decrement":
        await counterStub.decrement(1);
        break;
      case "/update":
        await counterStub.updateData(url.searchParams.get("url") || "/");
        break;
      case "/delete":
        await INVENTORY.delete(Counter.INVENTORY_KEY, name);
        await counterStub.delete();
        return Response.redirect(baseUrl, 302);
      case "/trace":
        return VIEW_FACTORY.createTraceView(await counterStub.trace());
      case "/":
        return VIEW_FACTORY.createCounterView(names, sessions, name, count, dataUrl, trackerName);
      default:
        return ViewFactory.NOT_FOUND;
    }

    return Response.redirect(`${baseUrl}?name=${name}`, 302);
  },
} satisfies ExportedHandler<Env>;
