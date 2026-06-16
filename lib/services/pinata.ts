const PINATA_API = "https://api.pinata.cloud/pinning/pinFileToIPFS"
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs"

interface UploadOptions {
  groupId?: string
  metadata?: Record<string, string>
}

export async function uploadToIPFS(
  file: Blob | Buffer,
  filename: string,
  options: UploadOptions = {}
): Promise<string> {
  const jwt = process.env.PINATA_JWT
  if (!jwt) throw new Error("PINATA_JWT not configured")

  const form = new FormData()
  const blob = file instanceof Buffer ? new Blob([file]) : file
  form.append("file", blob, filename)

  form.append(
    "pinataMetadata",
    JSON.stringify({
      name: filename,
      keyvalues: options.metadata ?? {},
    })
  )

  const pinataOptions: Record<string, unknown> = { cidVersion: 1 }
  if (options.groupId) pinataOptions.groupId = options.groupId

  form.append("pinataOptions", JSON.stringify(pinataOptions))

  const res = await fetch(PINATA_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Pinata upload failed: ${err}`)
  }

  const data = await res.json()
  return data.IpfsHash as string
}

export function ipfsUrl(cid: string): string {
  return `${PINATA_GATEWAY}/${cid}`
}
