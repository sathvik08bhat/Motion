/**
 * Web Crypto API utilities for the Vault.
 * Uses PBKDF2 for key derivation and AES-GCM for encryption/decryption.
 */

// Generate a random salt/iv
function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

// Convert a string to an ArrayBuffer
function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

// Convert an ArrayBuffer to a string
function decodeText(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

// Convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer instanceof Uint8Array ? buffer.buffer : buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an AES-GCM CryptoKey from a master password and salt.
 */
export async function deriveKey(password: string, saltBase64: string): Promise<CryptoKey> {
  const salt = base64ToBuffer(saltBase64);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encodeText(password).buffer as ArrayBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, // Cannot export the key
    ["encrypt", "decrypt"]
  );
}

/**
 * Generates a new salt for key derivation.
 */
export function generateSalt(): string {
  return bufferToBase64(generateRandomBytes(16));
}

/**
 * Encrypts data using AES-GCM.
 * Returns an object containing the Base64-encoded IV and ciphertext.
 */
export async function encryptData(key: CryptoKey, plaintext: string): Promise<{ iv: string; ciphertext: string }> {
  const iv = generateRandomBytes(12);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encodeText(plaintext).buffer as ArrayBuffer
  );

  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(encryptedBuffer),
  };
}

/**
 * Decrypts data using AES-GCM.
 */
export async function decryptData(key: CryptoKey, ivBase64: string, ciphertextBase64: string): Promise<string> {
  const iv = base64ToBuffer(ivBase64);
  const ciphertext = base64ToBuffer(ciphertextBase64);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as ArrayBuffer },
    key,
    ciphertext as ArrayBuffer
  );

  return decodeText(decryptedBuffer);
}
