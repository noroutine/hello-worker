import { DurableObject } from "cloudflare:workers";

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject {
  /**
   * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
   * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
   *
   * @param ctx - The interface for interacting with Durable Object state
   * @param env - The interface to reference bindings declared in wrangler.toml
   */
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async trace() {
    const res = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
    return await res.text();
  }

  async get(key: string): Promise<string[]> {
    return await this.ctx.storage.get(key) as string[] || [];
  }

  async contains(key: string, entry: string): Promise<boolean> {
    return (await this.get(key)).includes(entry)
  }

  async add(key: string, name: string) {
    let value: string[] = (await this.ctx.storage.get(key)) || [];
    if (!value.includes(name)) {
      value.push(name);
      // You do not have to worry about a concurrent request having modified the value in storage.
      // "input gates" will automatically protect against unwanted concurrency.
      // Read-modify-write is safe.
      await this.ctx.storage.put(key, value);
    }
    return value;
  }

  async delete(key: string, name: String) {
    let value: string[] = (await this.ctx.storage.get(key)) || [];
    value = value.filter((n) => n !== name);
    await this.ctx.storage.put(key, value);
    return value;
  }
}