# Section 06 - Redis Has Gotcha's!

## 16-001 Slightly Unpredictable HSET and HGETALL

## 17-002 Issues with HSET
In hset, we can't set null and undefined as values of the hash, because the client lib will call toString() on them and we will
get runtime error.

## 18-003 Issues with HGETALL
Calling hgetall for a key that doesn't exist, will still return {}, not a null. So we have to check for the response being an empty
object for indicating that the key doesn't exist.