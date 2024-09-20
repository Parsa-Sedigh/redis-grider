# Section 09 - Enforcing Uniqueness with Sets

## 35-001 Basics of Sets
A set is a collection of unique strings.

Note: Numbers are treated as string in redis. We can add numbers to sets as well.

comparison commands in sets:
- union: return all unique elements from all sets
- intersect: return elements that exist in all sets
- diff: return elements that exist in only one set

**Note:** In `sdiff`, the order of keys matters. Because sdiff will look at the elements that exist in the first set and not 
in all other sets. For example in: `sdiff colors:1 colors:2 colors:3`, it returns elements that exist in colors:1 but not in
colors:2 and colors:3.
In `sunion` and sinter, the order of args given to command doesn't matter.

## 36-002 Union of Sets
## 37-003 Intersection of Sets
## 38-004 Difference of Sets
## 39-005 Store Variations
We use these commands so that we don't have to rerun the intersection, union or diff commands over and over again. We store
the results of them in a new set.

sinterstore stores the result of the intersection into the given set(it's passed as the first arg):
```redis
sinterstore colors:results colors:1 colors:2 colors:3
```

## 40-006 Checking for an Element in a Set

## 41-007 Scanning a Set
`scard`: gives the cardinality(number of elements) of a set.

`sscan`: scan through the set limited by the given `count`:
```redis
sscan colors:1 0 count 2
```
this returns a cursor id and the elements. Then, we can pass the returned cursor to the next time that we run this command to
get the next elements. For example, it returns 3 as cursor id, so we run:
```redis
sscan colors:1 3 count 2
```
If the returned cursor id is 0, it means we hit the end of the set. There is no more elements to scan.

Whenever the set is very large, use `sscan` over `smembers`.

## 42-008 Completed Notes
## 43-009 Most Common Use Cases of Set
set use cases:
- enforcing uniqueness of any value
- creating a relationship between different records
- finding common attributes between different things(entities in redis)
- general list of elements where order doesn't matter

1. for example we wanna make sure that every username can only be used by one single person.
2. store item ids that each user likes for each user. So we have: users#45:likes -> 123, 555, ... . By doing this, we can do:
    - which items do user with id 45 likes? `smembers users#45:likes`
    - how many items does user with id 45 like? `scard users#45:likes`
    - do user with id 45 like the item with id 123? `sismember users#45:likes 123`
3. which items do both user 45 and 32 like? `sinter users#45:likes users#32:likes`
4. for example we wanna make sure users don't use the banned email domains as their email addresses. For this, we store a set with
the key `domains:banned`.