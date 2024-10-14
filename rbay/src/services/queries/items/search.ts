import {client} from "$services/redis";
import {itemsIndexKey} from "$services/keys";
import {deserialize} from "$services/queries/items/deserialize";

export const searchItems = async (term: string, size: number = 5) => {
    // pre-processing
    const cleaned = term
        .replaceAll(/[^a-zA-Z0-9 ]/g, '') // remove non-alphanumeric
        .trim()
        .split(' ')
        // if there were multiple spaces between words, they will be ' ' after split. So check for the el not being an empty str
        .map(word => word ? `%${word}%` : '')
        .join(' ')

    // look at `cleaned` and make sure it is valid
    /* For example, maybe the user gave all-symbols str. After cleaning that, the res will be empty str. It's not a valid str. */
    if (cleaned === '') {
        return []
    }

    const query = `(@name:(${cleaned}) => { $weight: 5.0 }) | (@description:(${cleaned}))`

    // use the client to do an actual search
    const results = await client.ft.search(itemsIndexKey(), query, {
        LIMIT: {
            from: 0, // behaves like OFFSET - skip this number of results
            size
        }
    })

    // deserialize and return the search results
    return results.documents.map(({id, value}) => deserialize(id, value as any))
};
