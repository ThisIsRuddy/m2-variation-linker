const magento = require("../lib/magento");
const wait = require("../lib/wait");

const waitForBulkRequest = async (bid, progress) => {
    console.log('Checking bulk request:', bid, progress ? progress : '');

    const {data} = await magento.get(`/bulk/${bid}/status`);

    const stillToProcess = data.operations_list.reduce((acc, operation) => {
        if (operation.status === 4) acc++;
        return acc;
    }, 0)

    if (stillToProcess > 0) {
        await wait(10000);
        return await waitForBulkRequest(bid, `[${data.operation_count - stillToProcess}/${data.operation_count}] ${(((data.operation_count - stillToProcess) / data.operation_count) * 100).toFixed(0)}%`);
    }

    return data;
}

module.exports = waitForBulkRequest;
