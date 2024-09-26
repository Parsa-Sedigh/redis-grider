import {client} from "$services/redis";
import {itemsKey} from "$services/keys";
import {itemsViewsKey} from "../../../seeds/seed-keys";

export const incrementView = async (itemId: string, userId: string) => {
    return Promise.all([
        client.hIncrBy(itemsKey(itemId), 'views', 1),
        client.zIncrBy(itemsViewsKey(itemId), 1, 'views')
    ])
};
