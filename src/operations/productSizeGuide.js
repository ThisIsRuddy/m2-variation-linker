const { api } = require('../lib/magento');

// Size guides are Magento CMS/static blocks with a `size_guide_*` identifier. The
// `size_guide` product attribute is a select whose source model lists those blocks
// (option value == block id), so a product references its guide by CMS block id.
// This module creates/updates those blocks via the standard CMS Block REST API.

// Authors leave a leading "Owner:" instruction comment in the ## size_guide block;
// strip it so only the real content (style + markup) becomes the block. The <style>
// block's own internal <!-- --> is not at the start, so it is untouched.
const cleanContent = (html) =>
    html.replace(/^\s*<!--[\s\S]*?-->\s*/, (m) => (/Owner:/i.test(m) ? '' : m)).trim();

const findBlock = async (identifier) => {
    const uri =
        `/cmsBlock/search` +
        `?searchCriteria[filterGroups][0][filters][0][field]=identifier` +
        `&searchCriteria[filterGroups][0][filters][0][value]=${encodeURIComponent(identifier)}` +
        `&searchCriteria[filterGroups][0][filters][0][conditionType]=eq` +
        `&fields=items[id,identifier]`;
    const { data } = await api.get(uri);
    return (data.items && data.items[0]) || null;
};

// Create the block, or update it in place if the identifier already exists, so
// re-runs never duplicate. Returns { id, created }.
const upsertBlock = async ({ identifier, title, content }) => {
    const block = { identifier, title, content, active: true };
    const existing = await findBlock(identifier);
    if (existing) {
        await api.put(`/cmsBlock/${existing.id}`, { block: { id: existing.id, ...block } });
        return { id: existing.id, created: false };
    }
    const { data } = await api.post('/cmsBlock', { block });
    return { id: data.id, created: true };
};

module.exports = { cleanContent, findBlock, upsertBlock };
