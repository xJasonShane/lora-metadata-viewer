/* ============================================================
   safetensors.js - Safetensors format utilities
   Provides: parseSafetensors, buildUpdatedSafetensorsBlob
   ============================================================ */

const METADATA_SIZE_OFFSET = 0;
const METADATA_CONTENT_OFFSET = 8;
const PADDING_BYTES = new Uint8Array([0, 0, 0, 0]); // Four NUL bytes for padding

// Read the JSON metadata header from a .safetensors file.
// Returns { metadata, formattedMetadata }:
//   formattedMetadata - raw __metadata__ object
//   metadata          - parsed (strings JSON-decoded where possible)
async function parseSafetensors(file) {
  const metadataSizeBuf = await file.slice(METADATA_SIZE_OFFSET, METADATA_CONTENT_OFFSET).arrayBuffer();
  const metadataSize = new DataView(metadataSizeBuf).getUint32(0, true);
  const metadataBuf = await file.slice(METADATA_CONTENT_OFFSET, METADATA_CONTENT_OFFSET + metadataSize).arrayBuffer();
  const header = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(metadataBuf)));

  const formattedMetadata = header['__metadata__'] || '';
  const metadata = {};
  if (formattedMetadata) {
    for (const key in formattedMetadata) {
      if (typeof formattedMetadata[key] === 'string') {
        try {
          metadata[key] = JSON.parse(formattedMetadata[key]);
        } catch (error) {
          metadata[key] = formattedMetadata[key];
        }
      } else {
        metadata[key] = formattedMetadata[key];
      }
    }
  }
  return { metadata, formattedMetadata };
}

// Build a new .safetensors Blob with replaced __metadata__ (or purged).
async function buildUpdatedSafetensorsBlob(file, newMetadata) {
  // Step 1: Read the initial 8 bytes to get the metadata size
  const metadataSizeBlob = file.slice(METADATA_SIZE_OFFSET, METADATA_CONTENT_OFFSET);
  const metadataSizeArrayBuffer = await metadataSizeBlob.arrayBuffer();
  const metadataSize = new DataView(metadataSizeArrayBuffer).getUint32(0, true);
  // Step 2: Read the current metadata based on the retrieved size
  const metadataBlob = file.slice(METADATA_CONTENT_OFFSET, METADATA_CONTENT_OFFSET + metadataSize);
  const metadataArrayBuffer = await metadataBlob.arrayBuffer();
  const currentMetadata = JSON.parse(new TextDecoder().decode(metadataArrayBuffer));
  // Update metadata
  currentMetadata['__metadata__'] = newMetadata;
  const newMetadataBytes = new TextEncoder().encode(JSON.stringify(currentMetadata));
  // Step 3: Ensure new metadata size and add padding
  const newMetadataSizeArray = new Uint32Array([newMetadataBytes.length]);
  // Step 4: Construct the new Blob with updated metadata and padding
  const headerBlob = new Blob([newMetadataSizeArray.buffer, PADDING_BYTES, newMetadataBytes]);
  const remainingFileBlob = file.slice(METADATA_CONTENT_OFFSET + metadataSize); // Slice remaining file data
  // Concatenate updated header with remaining file content
  return new Blob([headerBlob, remainingFileBlob], { type: "application/octet-stream" });
}
