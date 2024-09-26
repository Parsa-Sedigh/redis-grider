# Section 12 - Practice Time with Sorted Sets!
## 57-001 Sorted Set Use Cases
use cases:
- tabulating `the most` or `the least` some attr of a collection of hashes
- creating relationships between records, sorted by some criteria

For example:
- we have a hash for each book. Now we want to show the books with most reviews(the key would be `books:reviews`).

Note: We don't have to store the entire key of a book in the sorted set. We could only set the id of the book as the member field.
So:

| member | score |
|--------|-------|
| 18     | 5     |
| 5      | 25    |

![](img/57-1.png)

- Let's say we wanna connect the authors to the books they're written. In the sorted set, member field is book id
that the author has written and it's score is the number of copies that that book has been sold.
With this sorted set, not only we know that author id 4 is worked on what book ids, but we also have an ordering to this
relationship(# of copies). With this DS, we can answer to questions like: `what books has author_id 4 has worked on that
are the most popular in his books?` or `books that author:4 has written, sorted by the date the book was authored?(in this case,
the score would be created_at unix timestamp)`
![](img/57-2.png)

Note: Anytime you got a relationship between different records inside of an app, you usually want it to be ordered in some way.

## 58-002 Reminder on the Auth Flow
Note: Sorted sets can be used in place of hashes and sets.

## 59-003 Storing Usernames
To implement `getUserByUsername`, create a new sorted set with the key `usernames`. The member fields are usernames and the score
is their id(we could use a hash as well).
![](img/58-1.png)

Note: In sorted sets, the score must be a number(float or ...). So how do we store an alphanumeric(string) val as score?

## 60-004 Kind of Storing Strings in Sorted Sets
Note: We know hexadecimal values are technically numbers but expressed using base 16 numbering system. These hexadecimal values
are alphanumeric. But we can turn the hexadecimal strings into their equivalent base 10 numbers.

| base 16  |  base 10 |
|---|---|
|  ab1599ac | 2870319532  |

So when storing hexadecimals(base 16 numbers) to sorted-set as score, first we convert them to base 10 and when 
reading from redis, convert it to base 16.

## 61-005 Converting User IDs
Instead of `usernames` **sorted set**, it was better to use a **hash** and the keys would be usernames and values be userIds as hexadecimal, so
we wouldn't need any conversion between base 10 and 16(which is what we're doing with sorted set because of score must be a number).

We don't need usernames:unique set because we're storing all usernames inside the usernames sorted set. So we can use sorted
set to ensure uniqueness of usernames instead of plain set. But we left it there.

## 62-006 Plan for Showing Most Viewed Items
The views field is duplicated in the items hash and also in items sorted set. That's not wasteful, because with redis
we wanna optimize for lookups(query) and we don't want to join data together from different sources.
![](img/62-1.png)

## 63-007 Initializing Views on Item Creation
## 64-008 Incrementing View Counters
## 65-009 Items by Ending Soonest
endingAt field is duplicated in both `items` and `items:endingAt`.

## 66-010 Querying for Ending Soonest
Q: Get two items ending soonest, if current time is 130

```redis
-- limit <# els to skip> <# els to return>
zrange items:endingAt 130 +inf byscore limit 0 2
```