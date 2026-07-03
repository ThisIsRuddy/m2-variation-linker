const { admin } = require('../lib/magento');

// Image assignment for products. Downloads a source image, base64-encodes it,
// and POSTs it to the product's media gallery. POST is ADDITIVE (unlike the
// idempotent text PUT), so callers must guard against duplicates - see
// getExistingMedia and the FORCE guard in populateMedia.js.
//
// Uses the `admin` (all/global) scope so an image is assigned once at the default
// scope and inherited by every store view - NOT duplicated per store view.

const EXT = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

// Fetch a remote image and return it base64-encoded, with mime + a file extension.
const fetchImage = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${res.status} ${res.statusText}`);
    const mime = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!mime.startsWith('image/'))
        throw new Error(`not an image (content-type: ${mime || 'none'})`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1024) throw new Error(`suspiciously small image (${buf.length} bytes)`);
    return { base64: buf.toString('base64'), mime, bytes: buf.length, ext: EXT[mime] || 'jpg' };
};

const getExistingMedia = async (sku) => {
    const { data } = await admin.get(`/products/${encodeURIComponent(sku)}/media`);
    return Array.isArray(data) ? data : [];
};

// types: ['image','small_image','thumbnail'] for the hero, [] for extra gallery
// images. A non-empty label is required (accessibility + alt text). Returns the
// new media entry id.
const uploadImage = async (sku, { base64, mime, name, label, types, position }) => {
    if (!label || !String(label).trim()) throw new Error('image label is required');
    const entry = {
        media_type: 'image',
        label,
        position,
        disabled: false,
        types,
        content: { base64_encoded_data: base64, type: mime, name },
    };
    const { data } = await admin.post(`/products/${encodeURIComponent(sku)}/media`, { entry });
    return data;
};

module.exports = { fetchImage, getExistingMedia, uploadImage };
