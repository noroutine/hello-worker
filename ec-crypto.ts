// // ec-crypto.ts

// /**
//  * Generates an EC key pair using the P-256 curve.
//  * @returns A promise that resolves to a CryptoKeyPair
//  */
// export async function generateECKeyPair(): Promise<CryptoKeyPair> {
//   return await crypto.subtle.generateKey(
//     {
//       name: 'ECDH',
//       namedCurve: 'P-256',
//     },
//     true,
//     ['deriveKey', 'deriveBits']
//   ) as CryptoKeyPair;
// }

// /**
//  * Encrypts data using a hybrid encryption scheme with ECDH and AES-GCM.
//  * @param data - The string data to encrypt
//  * @param publicKey - The recipient's public key
//  * @returns A promise that resolves to an ArrayBuffer containing the encrypted data
//  */
// export async function encryptData(data: string, publicKey: CryptoKey): Promise<ArrayBuffer> {
//   // Generate a random AES key for encryption
//   const aesKey = await crypto.subtle.generateKey(
//     { name: 'AES-GCM', length: 256 },
//     true,
//     ['encrypt', 'decrypt']
//   );

//   // Encrypt the data using AES-GCM
//   const encodedData = new TextEncoder().encode(data);
//   const iv = crypto.getRandomValues(new Uint8Array(12));
//   const encryptedContent = await crypto.subtle.encrypt(
//     { name: 'AES-GCM', iv: iv },
//     aesKey,
//     encodedData
//   );

//   // Derive a shared secret using ECDH
//   const ephemeralKeyPair = await generateECKeyPair();
//   const sharedSecret = await crypto.subtle.deriveBits(
//     { name: 'ECDH', public: publicKey },
//     ephemeralKeyPair.privateKey,
//     256
//   );

//   // Wrap the AES key using the shared secret
//   const wrappedKey = await crypto.subtle.wrapKey(
//     'raw',
//     aesKey,
//     await crypto.subtle.importKey('raw', sharedSecret, { name: 'AES-GCM' }, false, ['wrapKey']),
//     { name: 'AES-GCM', iv: iv }
//   );

//   // Combine all the encrypted components
//   const ephemeralPublicKey = await crypto.subtle.exportKey('raw', ephemeralKeyPair.publicKey);
//   const encryptedData = new Uint8Array([
//     ...new Uint8Array(ephemeralPublicKey),
//     ...new Uint8Array(wrappedKey),
//     ...iv,
//     ...new Uint8Array(encryptedContent),
//   ]);

//   return encryptedData.buffer;
// }

// /**
//  * Decrypts data that was encrypted using the encryptData function.
//  * @param encryptedData - The ArrayBuffer containing the encrypted data
//  * @param privateKey - The recipient's private key
//  * @returns A promise that resolves to the decrypted string
//  */
// export async function decryptData(encryptedData: ArrayBuffer, privateKey: CryptoKey): Promise<string> {
//   const encryptedDataView = new Uint8Array(encryptedData);

//   // Extract components from the encrypted data
//   const ephemeralPublicKey = encryptedDataView.slice(0, 65);
//   const wrappedKey = encryptedDataView.slice(65, 65 + 40);
//   const iv = encryptedDataView.slice(65 + 40, 65 + 40 + 12);
//   const encryptedContent = encryptedDataView.slice(65 + 40 + 12);

//   // Import the ephemeral public key
//   const ephemeralPublicKeyImported = await crypto.subtle.importKey(
//     'raw',
//     ephemeralPublicKey,
//     { name: 'ECDH', namedCurve: 'P-256' },
//     false,
//     []
//   );

//   // Derive the shared secret
//   const sharedSecret = await crypto.subtle.deriveBits(
//     { name: 'ECDH', public: ephemeralPublicKeyImported },
//     privateKey,
//     256
//   );

//   // Unwrap the AES key
//   const aesKey = await crypto.subtle.unwrapKey(
//     'raw',
//     wrappedKey,
//     await crypto.subtle.importKey('raw', sharedSecret, { name: 'AES-GCM' }, false, ['unwrapKey']),
//     { name: 'AES-GCM', iv: iv },
//     { name: 'AES-GCM' },
//     true,
//     ['decrypt']
//   );

//   // Decrypt the content
//   const decryptedContent = await crypto.subtle.decrypt(
//     { name: 'AES-GCM', iv: iv },
//     aesKey,
//     encryptedContent
//   );

//   return new TextDecoder().decode(decryptedContent);
// }

// /**
//  * Converts an ArrayBuffer to a Base64 string.
//  * @param buffer - The ArrayBuffer to convert
//  * @returns The Base64 encoded string
//  */
// export function arrayBufferToBase64(buffer: ArrayBuffer): string {
//   const bytes = new Uint8Array(buffer);
//   let binary = '';
//   for (let i = 0; i < bytes.byteLength; i++) {
//     binary += String.fromCharCode(bytes[i]);
//   }
//   return btoa(binary);
// }

// /**
//  * Serializes a public key to a JSON string.
//  * @param publicKey - The public key to serialize
//  * @returns A promise that resolves to a JSON string representing the serialized public key
//  */
// export async function serializePublicKey(publicKey: CryptoKey): Promise<string> {
//   const jwk = await crypto.subtle.exportKey('jwk', publicKey);
//   return JSON.stringify(jwk);
// }

// /**
//  * Deserializes a JSON string back into a public key.
//  * @param serializedPublicKey - The JSON string representing the serialized public key
//  * @returns A promise that resolves to a CryptoKey (public key)
//  */
// export async function deserializePublicKey(serializedPublicKey: string): Promise<CryptoKey> {
//   const jwk = JSON.parse(serializedPublicKey);
//   return await crypto.subtle.importKey(
//     'jwk',
//     jwk,
//     {
//       name: 'ECDH',
//       namedCurve: 'P-256'
//     },
//     true,
//     []
//   );
// }

// /**
//  * Serializes a private key to a JSON string.
//  * @param privateKey - The private key to serialize
//  * @returns A promise that resolves to a JSON string representing the serialized private key
//  */
// export async function serializePrivateKey(privateKey: CryptoKey): Promise<string> {
//   const jwk = await crypto.subtle.exportKey('jwk', privateKey);
//   return JSON.stringify(jwk);
// }

// /**
//  * Deserializes a JSON string back into a private key.
//  * @param serializedPrivateKey - The JSON string representing the serialized private key
//  * @returns A promise that resolves to a CryptoKey (private key)
//  */
// export async function deserializePrivateKey(serializedPrivateKey: string): Promise<CryptoKey> {
//   const jwk = JSON.parse(serializedPrivateKey);
//   return await crypto.subtle.importKey(
//     'jwk',
//     jwk,
//     {
//       name: 'ECDH',
//       namedCurve: 'P-256'
//     },
//     true,
//     ['deriveKey', 'deriveBits']
//   );
// }

// /**
//  * Serializes a CryptoKeyPair to a JSON string.
//  * @param keyPair - The CryptoKeyPair to serialize
//  * @returns A promise that resolves to a JSON string representing the serialized key pair
//  */
// export async function serializeKeyPair(keyPair: CryptoKeyPair): Promise<string> {
//   const serializedPublicKey = await serializePublicKey(keyPair.publicKey);
//   const serializedPrivateKey = await serializePrivateKey(keyPair.privateKey);
  
//   return JSON.stringify({
//     publicKey: serializedPublicKey,
//     privateKey: serializedPrivateKey
//   });
// }

// /**
//  * Deserializes a JSON string back into a CryptoKeyPair.
//  * @param serializedKeyPair - The JSON string representing the serialized key pair
//  * @returns A promise that resolves to a CryptoKeyPair
//  */
// export async function deserializeKeyPair(serializedKeyPair: string): Promise<CryptoKeyPair> {
//   const { publicKey: serializedPublicKey, privateKey: serializedPrivateKey } = JSON.parse(serializedKeyPair);

//   const publicKey = await deserializePublicKey(serializedPublicKey);
//   const privateKey = await deserializePrivateKey(serializedPrivateKey);

//   return { publicKey, privateKey };
// }