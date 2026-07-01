const { api } = require('./magento');

const sleep = (ms) => {
    console.log('Waiting', ms / 1000, 'seconds...');
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Polls a bulk operation until none of its operations are still queued
 * (status 4 = "open"/pending), then resolves with the final status payload.
 */
const waitForBulkRequest = async (bulkUuid, progress) => {
    console.log('Checking bulk request:', bulkUuid, progress || '');

    const { data } = await api.get(`/bulk/${bulkUuid}/status`);

    const pending = data.operations_list.reduce(
        (count, operation) => (operation.status === 4 ? count + 1 : count),
        0,
    );

    if (pending > 0) {
        await sleep(10000);
        const done = data.operation_count - pending;
        const percent = ((done / data.operation_count) * 100).toFixed(0);
        return waitForBulkRequest(bulkUuid, `[${done}/${data.operation_count}] ${percent}%`);
    }

    return data;
};

module.exports = waitForBulkRequest;
