const { api } = require('../lib/magento');

// Cache of attribute metadata keyed by attribute code, so the linker only
// fetches each attribute once per run.
const cache = new Map();

const getAttribute = async (attrCode) => {
    if (!cache.has(attrCode)) {
        const uri = `/products/attributes/${attrCode}?fields=attribute_id,attribute_code,position,options,default_frontend_label`;
        const { data } = await api.get(uri);
        cache.set(attrCode, data);
    }
    return cache.get(attrCode);
};

// Both stores get the same customer-facing label.
const buildOption = (sortNo, label, frontLabel, value) => ({
    option: {
        label,
        value,
        sort_order: sortNo,
        store_labels: [
            { store_id: 1, label: frontLabel },
            { store_id: 2, label: frontLabel },
        ],
    },
});

const createOption = async (attrCode, sortNo, label, frontLabel, value) => {
    const uri = `/products/attributes/${attrCode}/options`;
    await api.post(uri, buildOption(sortNo, label, frontLabel, value));
};

const updateOption = async (attrCode, sortNo, label, frontLabel, value, optionId) => {
    const uri = `/products/attributes/${attrCode}/options/${optionId}`;
    await api.put(uri, buildOption(sortNo, label, frontLabel, value));
};

module.exports = { getAttribute, createOption, updateOption };
