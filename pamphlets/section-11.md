# Section 11 - Organizing Data with Sorted Sets

## 50-001 Sorted Sets
Scores are always numbers(negative, positive, float). But when we get them back, as always with numbers in redis,
we get them back as string.

![](img/50-1.png)

## 51-002 Adding and Removing Members
## 52-003 Finding a Range of Scores
## 53-004 Removing the Highest and Lowest Members
## 54-005 Updating Scores
## 55-006 Querying a Sorted Set
In `zrange`, when using `rev` option, it is applied **before** applying the min and max.

With `limit`, we can have pagination. This option can only be used when we're comparing elements based on their score.
So we can only use limit when we have `byscore` as well.

```redis
-- limit 1 2 means skip first element then give next two elements.
zrange <sorted set key> <min index> <max index(inclusive)> rev limit 1 2
```

## 56-007 Sorted-Sets-Complete