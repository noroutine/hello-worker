import { RBAC } from "../rbac/rbac";
import { SecureSession } from "../session";
import { CounterView } from "./counter";
import { TraceView } from "./trace";

export default class ViewFactory {
  private readonly _rbac: RBAC;
  private readonly _session: SecureSession;

  /**
   * Creates a new ViewFactory instance.
   * @param session session instance
   * @param rbac rbac instance
   * @param godMode override all restrictions
   */
  constructor(session: SecureSession, rbac: RBAC) {
    this._session = session;
    this._rbac = rbac;
  }

  ifGod(str: string): string {
    return this._session.god ? str : "";
  }

  // Define a response for HTML content
  HTMLResponse(view: string) {
    return this._session.setSessionCookies(new Response(view, { headers: { "Content-Type": "text/html;charset=UTF-8" } }));
  }

  // Define a response for PNG content
  PNGResponse(view: string) {
    return new Response(view, { headers: { 'Content-Type': 'image/png' } });
  }

  pixel() {
    // Base64 encoded 1x1 transparent PNG
    const transparentPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8=';
    
    // Decode the Base64 string to a Uint8Array
    const binaryString = atob(transparentPixel);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes, {
      headers: { 
        'Content-Type': 'image/png'
      },
    })
  }

  notFound = () => new Response("Not found", { status: 404 });

  /**
   * Creates a new PixelView instance
   * @param request Cloudflare Workers Request object
   * @returns A SecureSession object with unique Id
   */
  createTraceView(data: string = ""): Response {
    return this.HTMLResponse(TraceView(data));
  }

  /**
   * Creates a new CounterView instance
   * @param request Cloudflare Workers Request object
   * @returns A SecureSession object with unique Id
   */
  createCounterView(names: string[], sessions: string[], name: string = "", count: number = 0, dataUrl: string = "/", tracker: string = ''): Response  {
    return this.HTMLResponse(CounterView(this._session, names, sessions, name, count, dataUrl, this._session.god, tracker))
  }

}