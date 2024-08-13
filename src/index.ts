import { Counter } from "./objects/counter";
import { MyDurableObject } from "./objects/mydurableobject";

import { CounterView } from './views/counter';
import { TraceView } from "./views/trace"; 

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

export { Counter, MyDurableObject };

/**
 * Associate bindings declared in wrangler.toml with the TypeScript type system
 */
export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  MY_DURABLE_OBJECT: DurableObjectNamespace<MyDurableObject>;
  COUNTERS: DurableObjectNamespace<Counter>;

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

// Define a response for HTML content
let HTMLResponse = (view: any) => new Response(view, { headers: { "Content-Type": "text/html;charset=UTF-8" } });

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
    let id: DurableObjectId = env.MY_DURABLE_OBJECT.idFromName("counters");
    let myDurableObjectStub = env.MY_DURABLE_OBJECT.get(id);
    let names = await myDurableObjectStub.getNames();

    let url = new URL(request.url);
    
    // Get the base URL (URL without path)
    const baseUrl = url.port ? `${url.protocol}//${url.hostname}:${url.port}` : `${url.protocol}//${url.hostname}`

    let name = url.searchParams.get("name");

    let counterId: DurableObjectId
    let counterStub: DurableObjectStub<Counter>
    let count: number

    if (!name) {
      if (url.pathname === "/") {
        return HTMLResponse(CounterView(names));
      }
      return Response.redirect(baseUrl, 302);
    }

    counterId = env.COUNTERS.idFromName(name);
    counterStub = env.COUNTERS.get(counterId);

    myDurableObjectStub.addName(name);
    count = await counterStub.getCounterValue();

    switch (url.pathname) {
      case "/increment":
        await counterStub.increment();
        break;
      case "/decrement":
        await counterStub.decrement();
        break;
      case "/delete":
        await myDurableObjectStub.deleteName(name);
        await counterStub.delete();
        return Response.redirect(baseUrl, 302);
      case "/trace":
        return HTMLResponse(TraceView(await counterStub.trace()));
      case "/":
        return HTMLResponse(CounterView(names, name, count));
      default:
        return new Response("Invalid request", { status: 404 });
    }

    return Response.redirect(`${baseUrl}?name=${name}`, 302);
  },
} satisfies ExportedHandler<Env>;
