const wait = async (time) => new Promise((resolve, reject) => {
    console.log("Waiting", time / 1000, 'seconds...');
    setTimeout(() => resolve(), time);
});

module.exports = wait;
