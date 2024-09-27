# Section 15 - Storing Collections with Lists
## 79-001 Lists
- store an ordered list of strings
- not an array!!!
- implemented as a doubly linked list. So lists are good when we're adding els at the start or at the end. So they're
not good when we wanna add els at the middle.
- often used for time-series data
- you should probably use this less often than you think
![](img/79-1.png)

There are a couple of commands around lists that are not often used these days. Lists used to be used to implement a couple of
other important features in redis, but that was many years ago and these days redis has added new structures and commands
that made some of these list commands less useful. There are better ways to do some of these ops in redis.

Note: We can only store strings or numbers in lists. But we can get around this by encoding values as strings.
For example, storing <temperature>:<unix timestamp>. Note that instead of colon we could use any other separator.

## 80-002 Reading and Writing Data to a List
![](img/79-2.png) 

- LPUSH: add el to the left(start) of the list. Returns number of elements that are now stored in the list
- RPUSH: add el to the right(end)

## 81-003 Ranges and Searches
![](img/81-1.png)

## 82-004 Trimming Lists
Be careful with LTRIM because it can destroy potentially a lot of data.
![](img/82-1.png)

## 83-005 Removing Elements
```redis
-- from right to left, remove two copies of 25
LREM temps -2 25

-- 0 means remove all copies of 25
LREM temps 0 25
```

## 84-006 List Use Cases
- append-only or prepend-only data(temperature readings, stock values - time series data)
- when you only need the last/first N values of sth
- your data has no sort order besides the order it was inserted. Like social media posts(we just care about the insertion order there)

Don't use lists if you have many items AND:
- you need to apply some filtering criteria
- your data is sorted by some attribute other than insertion order. So for example if we wanna sort by alphabetical order, that's challenging
to do with lists

### Applications of list:
1. Showing most recent sth(we wanna have sorting by insertion order)

Q: Get the titles of the 2 most recently reviewed books
![](img/84-1.png)

A1: Use `LRANGE` on the list for the last two elements and do two `HGETALL`s inside of a pipeline. We would have 2 commands.

But we can solve this using one command with `SORT`.

A2:
```redis
-- note: the data in the reviews list is already sorted. It's sorted in the order of insertion. So we don't need any additional
-- sorting on the list, so we need to say: by nosort
sort reviews by nosort get books:*->title
```

2. we can put more data into list els by encoding values and then storing them as strings in lists like: `<val1>:<val2>:<val3>`.
The downside to this approach is when joining the list el with another DS like a hash(using SORT). We'd have to make that hash key
as the same as the list el encoded value, so the key of hash would be: `<val1>:<val2>:<val3>`

## 85-007 Using Lists in Our App
We'll use a list for history of bids.

At each el of list, we're gonna encode the amount of bid and it's createdAt. So we encode it like: <amount>:<unix timestamp>
![](img/85-1.png)

## 86-008 Serializing and Deserializing Bids
## 87-009 Retrieving Bid Histories