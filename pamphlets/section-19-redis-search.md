# Section 19 - Querying Data with RediSearch

## 126-001 Redis Modules
To store nested structures, use redis json. Note that hashes don't allow nested data. They are simple key-value pairs.

## 127-002 Redis Core vs Redis Stack
redis stack:
- redis search
- redis json
- redis graph
- redis timeseries
- redis bloom

## 128-003 Using Modules in Production
Depending on how you deploy your app, you might not be able to use modules.

If you wanna use a managed redis provided by aws or ..., you can't use redis modules. You can get a vm/container and run redis
yourself there.

Another approach is using redis service of redis company. The redis server will still be hosted on a cloud provider like aws,
but we get the redis modules.

## 129-004 Overview on Search
Without redisearch, we had to create accessory data structures to answer some queries like most expensive items and ... .

## 130-005 Creating and Using an Index
```redis
FT.CREATE idx:cars ON HASH PREFIX 1 cars#
    SCHEMA name TEXT year NUMERIC color TAG
    
ft.search idx:cars '@name:(fast car)'
ft.search idx:cars '@color:{blue}'
ft.search idx:cars '@year:[1955 1980]'
```

## 131-006 Details on Indexes
### Query vs search
![](img/126-1.png)

With searching we can search for '90 blue fast' which could search for cars made in 90s with color of blue and that are fast.
With searching we can interpret some possibly flawed string to search.

![](img/126-2.png)

- ft.create
- idx:cars
- on hash: we want to build an index for searching hashes. options are `hash` or `json`.
- prefix 1 cars#
    - find all the keys that start with 'cars#' and index them
    - multiple prefixes can be used - the number indicates how many prefixes we are about to provide
- schema
    - describe the fields that should be indexed for each hash
    - don't have to list the schema of every field in a hash - only the ones we want to search

## 132-007 Index Field Types
The difference between `text` and `tag` field types is about searching vs querying.

Anytime we wanna support searching on a field, use the `text` type for that field in schema index.
![](img/132-1.png)
![](img/132-2.png)

## 133-008 Numeric Queries
![](img/133-1.png)
![](img/133-2.png)

Note: Wrap all search queries in quotes.

## 134-009 Tag Queries
![](img/134-1.png)

Note: Whenever you're trying to run a query on a **tag or text** field, there are some words that are going to automatically 
filtered out of your query by redis. We refer to these as stop words. These are words that are common in english and really don't
add a lot to any typical query.

SO if you have a tag or text query looking for 'a', 'is', the ... , those terms will be filtered out automatically.

So this query: `@cities:{ to | a | or}` will become this: `@cities:{}`. Because all three are stop words.

## 135-010 Text Queries
Note: When doing a text query, all stop words, spaces and punctuation are removed. So the query text and also the text of the
items we're searching, are gonna go through a pre-processing step. This is called stemming. So the prefix, suffix and ... are removed
and reduces word to it's base form.
![](img/135-1.png)
![](img/135-2.png)

Note: Faster is preserved as faster when going through stemming.

Stemming makes the search terms a bit flexible. Because for example suffixes and prefixes and ..., are still gonna find the word the user wants.
![](img/135-3.png)

## 136-011 Fuzzy Search
Levenshtein distance = fuzzy search

Fuzzy search mean tolerating typos to some degree.

When we wanna do fuzzy matching between what the user entered and what they're actually looking for, we can use %.

Note: % is not a wildcard in redis. Instead, **% shows the allowed number of characters mismatch between what a user typed in and
what they actually were trying to search for?**
![](img/136-1.png)

The % can be added on either side to allow for **one** char mismatch. So %dar% has the effect the same as %dar and dar%.

To take into account two char mismatch, use two percent sides on either side, so like: %%daar%%.

We can go up to 3 % signs, so up to 3 chars mismatch.

## 137-012 Prefix Search
We have to have at least two chars to do prefix search, so a* doesn't work.

![](img/137-1.png)

## 138-013 Pre-Processing Search Criteria
A search op is broken down in two steps:
1. (optional): show an autocomplete list of options to user
![](img/138-1.png)
2. ![](img/138-2.png)

1. autocomplete: when user is typing in, we wanna do prefix search for showing a list of suggestions - we do prefix search.
2. submitting(deciding) the search term: when user chooses the suggestion or enters what he entered - we do fuzzy search.

Note: When user enters sth like `fast dast dar` or `fast ca` and actually submits to search, we can't just put some percent signs and send it to redis.
So we need to do preprocessing when trying to do either prefix search(autocomplete - search is not submitted yet) or fuzzy search(submitting search).

Preprocessing is the steps we go through when we wanna build the query to send to redisearch.

autocomplete(prefix) preprocessing:
1. split on spaces and punctuations to get an arr of strings
2. append * on last term
3. maybe append * to other terms in the arr. Do you want to autocomplete on `fast ca*` or autocomplete on both `fast*` and `ca*`(possibly gives
more results)?
4. join with space(`and` op) or |

[](img/138-3.png)

fuzzy search preprocessing:
[](img/138-4.png)
In third step, we have to think: do we need % on all terms? do we need to wrap all terms with % or two percent or three?