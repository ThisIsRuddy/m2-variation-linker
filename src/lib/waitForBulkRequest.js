const magento = require("../lib/magento");
const wait = require("../lib/wait");

const waitForBulkRequest = async (bid) => {
    console.log('Checking bulk relation request:', bid);

    const uri = `/bulk/${bid}/status`;

    const {data} = await magento.get(uri);

    const isDone = !data.operations_list.some((op) => op.status === 4);
    if (!isDone) {
        await wait(10000);
        return await waitForBulkRequest(bid);
    }

    return data;
}

module.exports = waitForBulkRequest;
