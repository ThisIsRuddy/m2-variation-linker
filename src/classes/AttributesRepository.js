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

    async _createAttribute(attrCode, attrLabel, attrValue) {
        const uri = `/products/attributes/${attrCode}/options`;
        const {data} = await magento.post(uri, {
            option: {
                label: attrLabel,
                value: attrValue
            }
        });
        this._map.set(attrCode, data);
    }
}

module.exports = new AttributesRepository();
