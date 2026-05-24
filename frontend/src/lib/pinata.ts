const GATEWAY = "https://gateway.pinata.cloud/ipfs";

export async function uploadFileToPinata(file: File): Promise<string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  if (!jwt) throw new Error("NEXT_PUBLIC_PINATA_JWT not set");

  const form = new FormData();
  form.append("file", file);
  form.append("pinataMetadata", JSON.stringify({ name: file.name }));
  form.append("pinataOptions",  JSON.stringify({ cidVersion: 1 }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata file upload failed: ${text}`);
  }
  const { IpfsHash } = await res.json();
  return `ipfs://${IpfsHash}`;
}

export async function uploadJSONToPinata(json: object, name: string): Promise<string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  if (!jwt) throw new Error("NEXT_PUBLIC_PINATA_JWT not set");

  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataMetadata: { name },
      pinataOptions:  { cidVersion: 1 },
      pinataContent:  json,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata JSON upload failed: ${text}`);
  }
  const { IpfsHash } = await res.json();
  return `ipfs://${IpfsHash}`;
}

/// Resolve an ipfs:// URI to a fetchable HTTPS URL
export function ipfsToHttp(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return `${GATEWAY}/${uri.slice(7)}`;
  if (uri.startsWith("https://") || uri.startsWith("http://") || uri.startsWith("/")) return uri;
  return uri;
}
