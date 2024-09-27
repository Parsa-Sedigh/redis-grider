# Section 14 - HyperLogLog Structures
It's a data structure.

- algorithm for approximately counting the number of unique elements
- similar to a set, but doesn't store the elements
- will seem useless at first glance

## 76-001 HyperLogsLogs
- PFADD: adds a string or num to hyperloglog. If that string or num is new, returns 1, otherwise returns 0. Note that
hyperloglog doesn't actually store that arg.
- PFCOUNT: approx count of unique els.

## 77-002 When to use HyperLogsLogs
Inside of our app we want to track number of unique views that an item has. We want each view to be unique per user.
In other words, one user can only contribute one view per item not more, even if he refreshes the page 1000 times.

One way to do this is by using a set for item:views#<itemId>.

But there's a big downside to using set here: If we're storing the usernames that have viewed the item in this set and usernames
are always the same length, each of this strings are about 40 bytes. If item has 1m different views, it would be 38MB! just to
store views for a single item!

So we want a better way to keeping track of this uniqueness. For that, we can use hyperloglog.
![](img/77-1.png)

Note: Since hyperloglog doesn't actually store the individual els that we add to it, it has a constant size. It is always
about 12Kb no matter how many els were added to it.

The downside of using hyperloglog is that `PFCOUNT` is approximate and it has 0.81% error. So if we ran PFADD 1000 times
each with a unique value and then run a `PFCOUNT`, we might see a response of 991 to 1008 instead of 1000. This is the tradeoff
we make for not actually storing the els themselves.

Note: hyperloglog is not appropriate for storing unique usernames or emails. 

## 78-003 HyperLogsLogs in Action