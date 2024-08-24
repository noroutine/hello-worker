import { RBAC } from "../rbac";
import { SecureSession } from "../session";
import { CounterView } from "./counter";
import { PixelView } from "./pixel";
import { TraceView } from "./trace";

export default class ViewFactory {
  private readonly _rbac: RBAC;
  private readonly _session: SecureSession;
  private readonly _godMode: boolean;

  /**
   * Creates a new ViewFactory instance.
   * @param session session instance
   * @param rbac rbac instance
   * @param godMode override all restrictions
   */
  constructor(session: SecureSession, rbac: RBAC, godMode: boolean = false) {
    this._session = session;
    this._rbac = rbac;
    this._godMode = godMode;
  }

  ifGod(str: string, godMode: boolean): string {
    return this._godMode ? str : "";
  }

  // Define a response for HTML content
  HTMLResponse = (view: any) => this._session.setSessionCookies(new Response(view, { headers: { "Content-Type": "text/html;charset=UTF-8" } }));

  // Define a response for PNG content
  PNGResponse = (view: any) => new Response(view, { headers: { "Content-Type": "image/png" } });

  public static readonly PIXEL = new Response(PixelView(), { headers: { "Content-Type": "image/png" } });

  public static readonly NOT_FOUND = new Response("Not found", { status: 404 });

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
    return this.HTMLResponse(CounterView(this._session, names, sessions, name, count, dataUrl, this._godMode, tracker))
  }

}