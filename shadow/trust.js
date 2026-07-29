export async function signEnvelope(payload, key) {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const signature = await globalThis.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    encoded
  );
  return {
    payload,
    signature: Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  };
}

export async function verifyEnvelope(envelope, key) {
  const encoded = new TextEncoder().encode(JSON.stringify(envelope.payload));
  return globalThis.crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    Uint8Array.from(envelope.signature.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))),
    encoded
  );
}
