export const pageCacheKey = (id: string) => `pageCache#${id}`

export const usersKey = (userId: string) => `users#${userId}`

export const sessionsKey = (sessionId: string) => `sessions#${sessionId}`

export const usernamesUniqueKey = () => `usernames:unique`

export const userLikesKey = (userId: string) => `users:likes#${userId}`

export const usernamesKey = () => 'usernames'

// items
export const itemsKey = (itemId: string) => `items#${itemId}`
export const itemsByViewsKey = () => `items:views`
export const itemsByEndingAtKey = () => `items:endingAt`
export const itemsViewsKey = (itemId: string) => `items:views#${itemId}` // points to hyperloglog
export const bidHistoryKey = (itemId: string) => `history#${itemId}`
export const itemsByPriceKey = () => `items:price` // points to sorted set
export const itemsIndexKey = () => `idx:items` // points to search index