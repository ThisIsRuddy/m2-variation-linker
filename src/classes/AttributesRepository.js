const magento = require('../lib/magento');

class AttributesRepository {
    _map = new Map();

    async get(attrCode) {
        if (!this._map.has(attrCode))
            await this._fetchAttribute(attrCode);
        return this._map.get(attrCode);
    }

    async _fetchAttribute(attrCode) {
        const uri = `/products/attributes/${attrCode}?fields=attribute_id,attribute_code,position,options,default_frontend_label`;
        const {data} = await magento.get(uri);
        this._map.set(attrCode, data);
    }

    async _createAttributeOption(attrCode, sortNo, label, frontLabel, value) {
        const uri = `/products/attributes/${attrCode}/options`;
        const {data} = await magento.post(uri, {
            option: {
                label,
                value,
                sort_order: sortNo,
                store_labels: [
                    {
                        "store_id": 1,
                        "label": frontLabel,
                    },
                    {
                        "store_id": 2,
                        "label": frontLabel,
                    }
                ]
            }
        });
        this._map.set(attrCode, data);
    }

    async _updateAttributeOption(attrCode, sortNo, label, frontLabel, value, optionId) {
        const uri = `/products/attributes/${attrCode}/options/${optionId}`;
        const {data} = await magento.put(uri, {
            option: {
                label,
                value,
                sort_order: sortNo,
                store_labels: [
                    {
                        "store_id": 1,
                        "label": frontLabel,
                    },
                    {
                        "store_id": 2,
                        "label": frontLabel,
                    }
                ]
            }
        });
        this._map.set(attrCode, data);
    }
}

module.exports = new AttributesRepository();
