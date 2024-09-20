# Section 07 - Powerful Design Patterns

## 19-001 App Overview
## 20-002 Reducing the Design to Queries
## 21-003 What Data Type for Each Resource
reasons to store as hash:
- the record has many attributes tied to it
- a collection of these records have to be sorted many different ways
- often need to access a single hash(record) at a time(not multiple hashes or list of them). So there's no use case where
we need to fetch a list of records.

Don't use hashes when:
- the record is only for counting or enforcing uniqueness.
- record stores only one or two attributes
- used only for creating relations between records
- the record is only used for time series data

For example, the likes is for counting and enforcing uniqueness.
Because any user can only like an item one single time(uniqueness check) and it's also being used for number of likes(counting).
So likes can't be stored as a hash. The same for views. We only increment the # of views once for a single user ignoring how many
times he refreshes the page.

About bids: yes it has many different attributes but:
- in item details page, we're gonna need a list of bids because we show the number of bids on an item
- in item details page, we're showing the changes in bid prices over time(it's used for time series data)

So we need another DS for storing bids in our app(we could store them as hashes though).

## 22-004 Create User Implementation
## 23-005 Serialization and Deserialization
Note: When storing numbers in redis, they get stored as strings. We have this problem with like dates in js which are
stored by calling .toString() .

Note: We don't store the id of the hash as a key-value pair, because it's id is already in the id of the hash, we don't need
it in the key-value pairs again. But when retrieving it, we wanna add the id inside the key-value pairs. These are done
using serialize and deserialize.

## 24-006 Adding Serialize
## 25-007 Fetching a User
## 26-008 Implementing Sessions
### For signin flow:
We wanna find a saved user with the given username. But we can't do it. Because the **only** way we can 
look up user hashes right now is by the key for the user hashes. In other words, we're storing all the user records as hashes.
But currently, only thing that we have is the username!

So we'll need another DS to relate usernames to userIds.

## 27-009 Fetching a Saved Session
## 28-010 Creating Sessions
## 29-011 Serializing Date Times
## 30-012 Storing Items
## 31-013 Fetching a Single Item