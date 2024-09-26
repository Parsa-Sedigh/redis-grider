# Section 13 - From Relational Data to Redis

## 67-001 Loading Relational Data
2 strategies for loading relational data:
1. create a simple pipeline that does a bunch of `HGETALL`s(works but takes two separate requests)
2. use the `SORT` command in a very clever way

## 68-002 Relational Data with SORT
## 69-003 The Sort Command
- used on sets, sorted sets and lists
- calling this command `'SORT'` is misleading
- terminology we use with 'sort' conflicts with terms we use for sorted sets!

Why we would call sort on sorted set? It's ridiculous! Well, wait why we would do that.

## 70-004 Terminology Around Sort
**When we use SORT on a sorted set, it operates on the MEMBERS, not the scores!
SORT refers to these members as scores!!!(confusing!!!)**

SORT by default expects to be working with numbers. But we can make it to sort strings alphabetically using ALPHA opt.
```redis
SORT books:likes ALPHA

SORT books:likes LIMIT <offset - # els we wanna skip> <limit>
```

## 71-005 Specifying the BY Argument
Q: List the id of each book, sorted by year published

A:
- data we're looking for: list the id of each book
- sorting criteria: sorted by year published

```redis
sort books:likes by books:*->year
```
What does this command do?
1. `sort books:likes` : extract all the **members** from the books:likes sorted set
2. `by books:*->year`: loop through each member. Insert the member into the `BY` template(the arg we pass to `BY`) in place of the star.
Now everything before `->` is treated as a key. Now redis is gonna loop up all the different DSs that it has to find this key,
if this points to a hash, retrieve the field. So books:* points to a hash. Now `->` will look the `year` field in there.
Now that value is used as a sorting criteria(we're using the sort command!). For example: books:ok->year. Here, first redis
will find a the key books:ok and if it points to a hash, it will get the year field of it and use that val as the sorting criteria.
3. sort each member(sorted set member) based on the `BY` field.
4. discard the sorting criteria(returned from *->x) vals and return only the members of sorted set

## 72-006 Joining Data with Sort
![](img/67-1.png)

```redis
sort books:likes by books:*->year get books:*->title
```
1. extract all members from the sorted set
2. loop through each member. Insert the member into the `BY` template. If this points at a hash, retrieve the field
3. same thing we did with the field passed to by(means year in `by books:*->year`), but put the field passed to `GET` on the LEFT
side(title in `get books:*->title`). So now on the left side, we have the sorted set members alongside their respective `title` field.
4. sort each member based on the `BY` field(`year` in this case)
5. return only the fields specified in `GET`(so in this case, it returns only the title fields)

Note: we can apply multiple `GET` to a single `SORT` command. 

Note: If you wanna do multi line command, insert a tab at the beginning of the lines after the first line:
```redis
-- get # means insert whatever the original member was(sorted set member)
sort books:likes by books:*->year DESC
    get #
    get books:*->title
    get books:*->year
```

Note: If you don't want to do any sorting op, use `by nosort`. This is for when you want to use the `SORT` just for it's joining feature, 
Or you only want to rely upon however the data is naturally sorted in the sorted set without doing any further sort.

## 73-007 A Few More Arguments
Note: Putting nosort for `BY` is a convention. If you put any key that doesn't exist, then sorting will be disabled.

## 74-008 Parsing SORT Output
Note: When using `SORT` command, we have to type out all the fields we wanna get back. Also the parsing of the response is tedious.

But `SORT` is faster because it's just one command instead of `zrange` and pipelining a lot of `HGETALL`s(in case of sorted sets OFC).

## 75-009 Completed Notes