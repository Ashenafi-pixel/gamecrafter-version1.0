import JSZip from 'jszip';

export interface SpineImportResult {
    atlas: string;   // Base64 encoded text or data URL
    skel: string;    // Base64 encoded binary data
    texture: string; // Base64 encoded image data URL
}

/**
 * Parses a ZIP file to extract Spine assets (.atlas, .skel, .png/.webp).
 * Validates that all 3 required components exist.
 */
export const parseSpineZip = async (file: File): Promise<SpineImportResult> => {
    const zip = new JSZip();
    try {
        const contents = await zip.loadAsync(file);

        // 1. Locate required files
        const atlasFile = Object.values(contents.files).find(f => f.name.endsWith('.atlas'));
        const skelFile = Object.values(contents.files).find(f => f.name.endsWith('.skel') || f.name.endsWith('.json')); // Support .json too? plan said .skel
        const textureFile = Object.values(contents.files).find(f => f.name.endsWith('.png') || f.name.endsWith('.webp'));

        if (!atlasFile) throw new Error('Missing .atlas file in ZIP');
        if (!skelFile) throw new Error('Missing .skel (or .json) file in ZIP');
        if (!textureFile) throw new Error('Missing texture (.png or .webp) file in ZIP');

        console.log(`[SpineImport] Found files: ${atlasFile.name}, ${skelFile.name}, ${textureFile.name}`);

        // 2. Read contents as Base64

        // Atlas is text, but we store as Base64 to be consistent or just text? 
        // Plan says "Base64 encoded text". Pixi might handle Data URL "data:text/plain;base64,..." better if we treat it as a generic asset.
        // Let's stick to raw Base64 for the binary/image, but properly typed.

        const atlasB64 = await atlasFile.async('base64');
        const skelB64 = await skelFile.async('base64');
        const textureB64 = await textureFile.async('base64');

        // 3. Format as Data URLs where appropriate for easier Pixi loading
        // Texture DEFINITELY needs to be a Data URL for an Image loader
        const mimeType = textureFile.name.endsWith('.webp') ? 'image/webp' : 'image/png';
        const textureDataUrl = `data:${mimeType};base64,${textureB64}`;

        // Skel is binary, usually passed as ArrayBuffer to Pixi, but for storage in JSON config, Base64 is best.
        // We will decode it back to Uint8Array at runtime.

        // Atlas is text.
        // We can store it as raw text or Base64. Let's do Data URL to avoid encoding issues with special chars.
        const atlasDataUrl = `data:text/plain;base64,${atlasB64}`;

        return {
            atlas: atlasDataUrl,
            skel: skelB64, // Keep raw base64 for binary
            texture: textureDataUrl
        };

    } catch (error) {
        console.error("Spine ZIP Parse Error:", error);
        throw new Error(error instanceof Error ? error.message : "Invalid Spine ZIP file");
    }
};
