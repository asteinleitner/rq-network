import { readFileSync } from "fs";
import crypto from "crypto";

// Load encrypted payload
const enc = JSON.parse(readFileSync("./enc.json", "utf8"));

// Helper: "126,104,..." -> Buffer([126,104,...])
function csvToBuf(s) {
  if (typeof s !== "string") throw new Error("Expected CSV string");
  const arr = s.split(",").map(v => {
    const n = parseInt(v.trim(), 10);
    if (Number.isNaN(n)) throw new Error("Bad CSV number: " + v);
    return n & 0xff;
  });
  return Buffer.from(arr);
}

// Pull fields
const ct = csvToBuf(enc.ciphertext);
const iv = csvToBuf(enc.iv);
const tag = csvToBuf(enc.tag);
const wrapped = csvToBuf(enc.wrappedDEK);

// Load practice private key (2048-bit RSA you generated)
const privPem = readFileSync("./secrets/practice_private.pem", "utf8");

// Unwrap DEK via RSA-OAEP(SHA-256)
const dek = crypto.privateDecrypt(
  { key: privPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
  wrapped
);

// Decrypt AES-256-GCM
const decipher = crypto.createDecipheriv("aes-256-gcm", dek, iv);
decipher.setAuthTag(tag);
const pt = Buffer.concat([decipher.update(ct), decipher.final()]);

console.log("Decrypted payload:");
console.log(pt.toString());
