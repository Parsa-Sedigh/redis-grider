import type {Bid, CreateBidAttrs} from '$services/types';
import {DateTime} from "luxon";
import {client} from "$services/redis";
import {bidHistoryKey} from "$services/keys";

export const createBid = async (attrs: CreateBidAttrs) => {
    const serialized = serializeHistory(attrs.amount, attrs.createdAt.toMillis())

    return client.rPush(bidHistoryKey(attrs.itemId), serialized)
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