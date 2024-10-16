import type {Bid, CreateBidAttrs} from '$services/types';
import {DateTime} from "luxon";
import {client, withLock} from "$services/redis";
import {bidHistoryKey, itemsByPriceKey, itemsKey} from "$services/keys";
import {getItem} from "$services/queries/items";

export const createBid = async (attrs: CreateBidAttrs) => {
    // 1) fetching the item
    // 2) doing validation
    // 3) writing data to the item

    // Approach 1: using watch + tx

    // executeIsolated creates a new conn to redis. isolatedClient is the new conn that we're gonna use only for the trn and nothing else.
    // return client.executeIsolated(async (isolatedClient) => {
    //     await isolatedClient.watch(itemsKey(attrs.itemId))
    //
    //     const item = await getItem(attrs.itemId)
    //
    //     if (!item) {
    //         throw new Error('Item does not exist')
    //     }
    //
    //     if (item.price >= attrs.amount) {
    //         throw new Error('Bid too low')
    //     }
    //
    //     if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
    //         throw new Error('Item closed to bidding')
    //     }
    //
    //     const serialized = serializeHistory(attrs.amount, attrs.createdAt.toMillis())
    //
    //     return isolatedClient
    //         .multi()
    //         .rPush(bidHistoryKey(attrs.itemId), serialized)
    //         .hSet(itemsKey(item.id), {
    //             bids: item.bids + 1,
    //             price: attrs.amount,
    //             highestBidUserId: attrs.userId
    //         })
    //         .zAdd(itemsByPriceKey(), {
    //             value: item.id,
    //             score: attrs.amount
    //         })
    //         .exec()
    // })

    // Approach 2: using lock
    // note: lockedClient is proxied version of redis client which throws an err if someone tries to use the
    // client after the lock has expired
    return withLock(attrs.itemId, async (lockedClient: typeof client, signal: any) => {
        const item = await getItem(attrs.itemId)

        if (!item) {
            throw new Error('Item does not exist')
        }

        if (item.price >= attrs.amount) {
            throw new Error('Bid too low')
        }

        if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
            throw new Error('Item closed to bidding')
        }

        const serialized = serializeHistory(attrs.amount, attrs.createdAt.toMillis())

        // before doing any writes to the locked data, check if the lock is expired or not
        if (signal.expired) {
            throw new Error('Lock expired, cant write any more data')
        }

        // by using lockedClient, if the lock has expired before using the lockedClient, it will throw an err. This makes sure
        // nothing will be written to the data after the lock has expired.
        return Promise.all([
            lockedClient.rPush(bidHistoryKey(attrs.itemId), serialized),
            lockedClient.hSet(itemsKey(item.id), {
                bids: item.bids + 1,
                price: attrs.amount,
                highestBidUserId: attrs.userId
            }),
            lockedClient.zAdd(itemsByPriceKey(), {
                value: item.id,
                score: attrs.amount
            })
        ])
    })
};

// we wanna show the most RECENT bids. offset = 1, count = 3 means go to the end(right) of the list, skip one item(go to the left)
// and give the 3 els.
/* Note: To go from offset and count to start and end index of LRANGE, we need to say:
starting index = (-1 * offset - count)
ending index = (-1 - offset)

Instead of doing this math, we could get the length of the list, but that would be one additional command.*/
export const getBidHistory = async (itemId: string, offset = 0, count = 10): Promise<Bid[]> => {
    const startIndex = -1 * offset - count
    const endIndex = -1 - offset

    const range = await client.LRANGE(bidHistoryKey(itemId), startIndex, endIndex)

    return range.map(bid => deserializeHistory(bid))
};

const serializeHistory = (amount: number, createdAt: number) => `${amount}:${createdAt}`

const deserializeHistory = (stored: string) => {
    const [amount, createdAt] = stored.split(':')

    return {
        amount: parseFloat(amount),
        createdAt: DateTime.fromMillis(parseInt(createdAt))
    }
}