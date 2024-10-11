import {randomBytes} from "crypto";
import {client} from "$services/redis/client";

export const withLock = async (key: string, cb: () => any) => {
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
            PX: 2000
        })

        if (!acquired) {
            // ELSE, brief pause (retryDelayMs) and then retry
            await pause(retryDelayMs)

            continue
        }

        // IF the SET is successful, then run the callback
        try {
            return await cb()
        } finally {
            // if anything succeeds or goes wrong, this block is called
            // unset the locked key:
            // note: this approach by issuing a DEL, cause problems
            // await client.del(lockKey)

            await client.unlock(lockKey, token)
        }
    }
};

const buildClientProxy = () => {
};

const pause = (duration: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
};
