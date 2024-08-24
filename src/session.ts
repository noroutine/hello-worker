import { DurableObjectId } from './../node_modules/@cloudflare/workers-types/2022-01-31/index';
import { randomBytes } from 'node:crypto';
import { Session } from './objects/session';
import { deserializePublicKey } from './ec-crypto';
import { checkDurableObjectExists } from './utils';
import { MyDurableObject } from './objects/mydurableobject';

export const SESSION_COOKIE_ID = "NSESSIONID";
export const SESSION_COOKIE_KEY = "NSESSIONKEY";
export const SESSION_COOKIE_DATA = "NSESSIONDATA";

export class SecureSession {
  private readonly _id: DurableObjectId;
  private _persisted: boolean;
  private readonly _publicKey: string;
  private _encryptedData: string;
  private _sessionDO: DurableObjectNamespace<Session>;

  /**
   * Creates a new SecureSession instance.
   * @param id The session ID. If not provided, a random ID will be generated.
   * @param publicKey The public key for the session. If not provided, a placeholder value is used.
   * @param encryptedData The initial encrypted data for the session. If not provided, an empty string is used.
   */
  constructor(sessionDO: DurableObjectNamespace<Session>, id?: string, publicKey: string = '', encryptedData: string = '') {
    this._sessionDO = sessionDO
    this._id = id ? this._sessionDO.idFromString(id) : this.generateSessionId();
    this._persisted = false;
    this._publicKey = publicKey;
    this._encryptedData = encryptedData;
  }

  /**
   * Gets the session ID.
   */
  get id(): DurableObjectId {
    return this._id;
  }

  /**
  * Gets the session ID.
  */
  get persisted(): boolean {
    return this._persisted;
  }

  /**
   * Gets the session public key.
   */
  get publicKey(): string {
    return this._publicKey;
  }

  /**
   * Gets the encrypted session data.
   */
  get encryptedData(): string {
    return this._encryptedData;
  }

  /**
   * Sets new encrypted data for the session.
   * @param newData The new encrypted data to set.
   */
  set encryptedData(newData: string) {
    this._encryptedData = newData;
  }

  /**
   * Generates a random session ID.
   * @returns A random session ID.
   */
  private generateSessionId(): DurableObjectId {
    return this._sessionDO.newUniqueId();
  }

  /**
   * Returns a string representation of the SecureSession.
   * @returns A string representation of the SecureSession.
   */
  toString(): string {
    return `SecureSession(id: ${this._id}, persisted: ${this._persisted}, publicKey: ${this._publicKey}, encryptedData: ${this._encryptedData})`;
  }

  async validate(inventory: DurableObjectStub<MyDurableObject>): Promise<boolean> {
    this._persisted = await checkDurableObjectExists(inventory, Session.INVENTORY_KEY, this._id)

    console.log(`Persisted in namespace: ${this._persisted}`)
    // no pub key, no data 
    return true;
  }

  /**
     * Creates a SecureSession object from cookies in the request.
     * @param request Cloudflare Workers Request object
     * @returns A SecureSession object if all required cookies are present, null otherwise
     */
  static async fromRequest(request: Request, _sessionDO: DurableObjectNamespace<Session>, inventory: DurableObjectStub<MyDurableObject>): Promise<SecureSession | null> {
    const cookieString = request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookieString.split('; ').map(pair => pair.split('=').map(decodeURIComponent))
    );

    const sessionId = cookies[SESSION_COOKIE_ID];
    const sessionPublicKey = cookies[SESSION_COOKIE_KEY] || '';
    const sessionEncryptedData = cookies[SESSION_COOKIE_DATA] || '';

    if (sessionId) {
      const reconstructedSecureSession = new SecureSession(_sessionDO, sessionId, sessionPublicKey, sessionEncryptedData);
      if (await reconstructedSecureSession.validate(inventory)) {
        console.log(`Session ${reconstructedSecureSession._id} is valid`)
      } else {
        throw Error('Invalid session')
      }
      return reconstructedSecureSession;
    }

    return null;
  }

  /**
   * Creates a new SecureSession object from scratch
   * @param request Cloudflare Workers Request object
   * @returns A SecureSession object with unique Id
   */
  static async createNew(_sessionDO: DurableObjectNamespace<Session>, inventory: DurableObjectStub<MyDurableObject>): Promise<SecureSession> {
    return new SecureSession(_sessionDO)
  }

  /**
   * Sets the session cookies on the response.
   * @param response The Response object to set cookies on
   * @param maxAge The maximum age of the cookies in seconds
   * @returns A new Response object with the cookies set
   */
  setSessionCookies(response: Response, maxAge: number = 3600): Response {
    const cookieOptions = `HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`;
    const cookies = [
      `${SESSION_COOKIE_ID}=${encodeURIComponent(this._id.toString())}; ${cookieOptions}`
    ];

    if (this._publicKey) {
      cookies.push(`${SESSION_COOKIE_KEY}=${encodeURIComponent(this._publicKey)}; ${cookieOptions}`)
    }

    if (this._encryptedData) {
      cookies.push(`${SESSION_COOKIE_DATA}=${encodeURIComponent(this._encryptedData)}; ${cookieOptions}`)
    }

    const newHeaders = new Headers(response.headers);
    cookies.forEach(cookie => newHeaders.append('Set-Cookie', cookie));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
}