import {client} from "$services/redis";

export const incrementView = async (itemId: string, userId: string) => {
    // we can use lua script to condense these two round trips to only one roundtrip. Note that this func can happen thousand of times
    // per second depending on how many users we have

    // const inserted = await client.pfAdd(itemsViewsKey(itemId), userId)
    // if (inserted) {
    //     return Promise.all([
    //         client.hIncrBy(itemsKey(itemId), 'views', 1),
    //         client.zIncrBy(itemsByViewsKey(), 1, itemId)
    //     ])
    // }

    return client.incrementView(itemId, userId)
};
