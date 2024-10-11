import {randomBytes} from "crypto";
import {client} from "$services/redis/client";

const timeoutMs = 2000

export const withLock = async (key: string, cb: (redisClient: Client, signal: any) => any) => {
    // Initialize a few variables to control retry behavior
    const retryDelayMs = 100
    let retries = 20

    // Generate a random value to store at the lock key.
    // We could just generate a random number, but it's common to generate a hash(numbers and letters)
    const token = randomBytes(6).toString('hex')

    // create the lock key
    const lockKey = `lock:${key}`

    // set up a while loop to implement the retry behavior
    while (retries >= 0) {
        retries--

        // try to do a SET NX operation
        const acquired = await client.set(lockKey, token, {
            NX: true,
            PX: timeoutMs
        })

        if (!acquired) {
            // ELSE, brief pause (retryDelayMs) and then retry
            await pause(retryDelayMs)

            continue
        }

        // IF the SET is successful, then run the callback
        try {
            const signal = {expired: false}
            setTimeout(() => {
                signal.expired = true
            }, timeoutMs)

            const proxiedClient = buildClientProxy(timeoutMs)

            return await cb(proxiedClient, signal)
        } finally {
            // if anything succeeds or goes wrong, this block is called
            // unset the locked key:
            // note: this approach by issuing a DEL, cause problems
            // await client.del(lockKey)

            await client.unlock(lockKey, token)
        }
    }
};

type Client = typeof client

const buildClientProxy = (timeoutMs: number) => {
    const startTime = Date.now()

    /* anytime someone tries to use a method on the redis client, we check if the lock has expired. If it has, we're gonna
     throw an err. If not, call the method they wanted to call.*/
    const handler = {
        get(target: Client, prop: keyof Client) {
            // is someone trying to access any property on the redis client after the expiration time of the lock
            if (Date.now() >= startTime + timeoutMs) {
                throw new Error('Lock has expired.')
            }

            const value = target[prop]

            return typeof value == 'function' ? value.bind(target) : value
        }
    }

    return new Proxy(client, handler) as Client
};

const pause = (duration: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
};
