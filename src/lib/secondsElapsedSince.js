const secondsElapsedSince = (hrtime) => {
    const startTime = process.hrtime(hrtime);
    return (startTime[0] + (startTime[1] / 1e9)).toFixed(3);
}

module.exports = secondsElapsedSince;
