# Section 20 - Search in Action

## 139-001 Search Implementation
![](./img/139-1.png)
![](./img/139-2.png)
![](./img/139-3.png)

## 140-002 The Create Index Function

## 141-003 When to Create the Index
![](./img/141-1.png)

```redis
-- get all indexes
FT._LIST 
```

## 142-004 Parsing the Search Term
## 143-005 Executing the Search
If we use a simple string without any special syntax in it, redis will automatically search all fields 
with type `TEXT` inside of our index. So we're doing a full text search on all available TEXT fields inside of index.

Note: Fuzzy search is different from full text search. Fuzzy search allows for typos to certain number of chars. Full text search
is for finding a term in a set of strings.

## 144-006 Seeding Some Fake Data
```shell
npm run seed
```

## 145-007 RediSearch and TF-IDF(term frequency - inverse document frequency) algo
We'd want to favor items that have the word x in the `name` of the item rather than always showing items that have x in the
description only. This makes our search results a bit more relevant.

How redisearch decides which string to send back first? In other words, how redisearch decides which of these two strings is
more relevant to the search term?
![](./img/145-1.png)
![](./img/145-2.png)

Redisearch uses TF-IDF algo. This algo results in a score for each individual string given a search term.
A higher score means that string is more relevant to some given search result.
![](./img/145-3.png)

`IDF: total number of strings(number set of strings in the index) / number of strings in the index that contains the given search term`

In this ex, # of strings is 2 and # of strings containing `fruit` is 2.

In this ex. `good fruit` comes first.

Redisearch algo uses some other parameters as well like how many words occur between search term inside of strings?

Q: What happens when we have two separate search terms?

A: We would do the same calc for each individual term for each string and then add those together for each string.
![](./img/145-4.png)

Note: We can add weights to individual search terms(and also fields). 

For weight on search terms: The weight is multiplied by the res of the formula for that search. And then add them together.
![](./img/145-5.png)

## 146-008 Applying Weights to Fields
We don't want to use weight on **terms**, instead we wanna add weight on a field.
![](./img/146-1.png)
![](./img/146-2.png)
The query above wants results that have chair in their both `name` and `description`. Note: If the search term is not in the name
of any items, it will show the items that have the search term in their `description` field.
Instead, we want this:
![](./img/146-3.png)

## 147-009 Understanding Queries with EXPLAIN
Show results that have chair but not desk:
![](./img/147-1.png)

If we didn't use parentheses:
![](./img/147-2.png)

If we used parentheses:
![](./img/147-3.png)

## 148-010 Query Performance with PROFILE
![](./img/148-1.png)

## 149-011 Sorting and Searching
### Searching + sorting
- redisearch can sort search results(we don't have to use `SORT` command)
- field that you plan to sort by, need to be marked as `SORTABLE` when index is created
- sorting can only be done by one field at a time

![](./img/149-1.png)

## 150-012 Updating an Existing Index
Whenever we want to make a change to an index, we can only **add** fields to it, we can't remove or change existing fields.
To change an index, we have to manually delete and recreate it.
```redis
ft.dropindex idx:items
```

## 151-013 Executing the Search
## 152-014 Deserializing Search Results