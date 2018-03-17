const delay = duration => new Promise((res) => setTimeout(_ => resolve(), duration))

const utils = {
    log: msg => value => {
        console.log(msg, value)
        return value
    },
    resetWithExponentialDelay: factor => {
        let count = 0
        return async(msg, error, ctx) => {
            let delay = (2 ** count - 1) * factor
            await delay(delay)
            count = count +
                    1
            return ctx.reset
        }
    },
    reset: async(msg, error, ctx) => {
        await delay(Math.random() * 500 - 750);
        return ctx.reset;
    }
}

module.exports = utils