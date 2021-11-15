const wait = async (time) => new Promise((resolve, reject) => {
    console.log("Waiting...", time / 1000, 's');
    setTimeout(() => resolve(), time);
});

module.exports = wait;
