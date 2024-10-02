# Section 16 - More Practice with the E-Commerce App

## 88-001 More on Bids
## 89-002 Validating Bids
## 90-003 Updating Items with Bids
## 91-004 Issues with Bids
If we send multiple reqs to createBid endpoint very fast with the same bid amount, a couple of them will be accepted and we're gonna
have multiple bids with the same amount which is clearly wrong.

So if a bunch of people wanna bid on the same item at the same time, some of them would see success messages even if they all
put in exact same price although they don't have the winning bid. But some of them will get error.

## 92-005 Understanding Concurrency Issues
The steps of creating bid are:
- get item from redis
- deserialize
- run validations
- save the item to redis

Now when we have multiple reqs at the same time for this flow, we would have sth like:
![](img/92-1.png)
They're gonna simultaneously reach out to redis and get the **same** item hash. They all will get the same price(amount) field from redis.
So the validations for all of the reqs will pass fine because the price field of item is the same for all. Then all of them will update
the amount to the same amount simultaneously and save the hash to redis.

So the data that gets saved in redis is wrong. But we technically processed multiple reqs, so only one req should go through
and all other must fail because the curr bid is now higher than their amount.

The problem is: when we have multiple reqs simultaneously, they're gonna fetch the **SAME data** from redis and update the same data.
They might think that they are the only req that's currently working with that data. But in reality we have multiple reqs
modifying the same data. This is a concurrency issue.

Whoever makes the most recent update, wins. Now if we had sth like `likes + 1` in each req, it's gonna incremented only once and not to the
number of reqs. So if likes field is 1 and we make 10 impulsion reqs, likes will be 1 not 11.

**We run into concurrency issues in redis anytime that we attempt to get some data from redis, do some calcs or validations on it
and then save the updated data.** Assuming multiple reqs are doing the same thing simultaneously.

**In other words, anytime we fetch data and change it and then save the data, we run into concurrency issue.**

The true issue is that there's some amount of time that is passing between reading and writing the data. Because in that window of time,
we have multiple reqs reading the same copy of data, so the data they're reading is stale.

Because in between the time fetching the data and then saving it's updated version back to redis, some other req might be doing the exact
same thing. So we might be in conflict with some other req.
![](img/92-2.png)

One way to deal with this concurrency issue, is we could just remove this time gap. If there was no delay between getting
data and saving data or alternatively if we just don't fetch any data at all and only do a save op, all these concurrency issues would be
solved(so we would only have the 'save data' step).

**For this, there are some commands that allow us to update a val in place using it's current value without actually first reading it.**

---
But there are some scenarios that concurrency issues are fine. So it might be up to the application to decide if the concurrency issue
is an issue or not. In our todo app, it's not a problem. So sometimes we don't need to solve the issue.

In this example, like the prev example, every simultaneous req is gonna get the same copy of data and whoever makes the most recent
update, wins.
![](img/92-3.png)

We solve the concurrency issue in 4 ways:

### options for handling concurrency
1. use an atomic update command(like `HINCRBY` or `HSETNX`)
2. use a transaction with the `WATCH` command
3. use a lock
4. use a custom lua update script

## 93-006 Applying Atomic Updates
EX - HINCRBY:

If we wanna update a field by doing read-change-save ops, we would get concurrency issues if we have more than one req at a time. Because
the reqs will get the same copy of data and add one to it which would get incorrect result. Because let's say inStock is 0. Both reqs
will read it as 0 and add 1 to it and the result at the end of all reqs would be 1, not 2.
![](img/93-1.png)

One way to solve this is by not reading the initial val of inStock altogether. Just skip the entire read step and go directly to
writing. To do so, we can use `HINCRBY`. With this, we can process as many commands as we want simultaneously, each one is gonna send
one separate HINCRBY 1 and we're always guaranteed that the ops are atomic.

Another example - for HSETNX:

The one with concurrency issue:

Multiple reqs will get the same hash that doesn't have any color and they will all successfully attempt to set the color property and
we will violate the constraint of only set the color if it has not been set because all of those set color ops of reqs will be processed
and the last one will win.
![](img/93-2.png)

We can solve this using HSETNX. We won't read the value out of redis anymore. So the first command would win and other commands
won't set the color anymore.

These commands allow us to either eliminate the time gap between a read and write(HINCRBY) or alternatively they allow us to set
some criteria under which we do the update(HSETNX).

In a lot of cases, we can't use these commands. Because for example maybe we wanna do a rPush.

## 94-007 Transactions
- groups together one or more commands to run **sequentially**.
- similar to pipelining, but some big differences!
- trns can't be undone/rolled back/reversed! (unlike other DBs)

About 1: Usually when we have multiple clients connected to redis sending
commands to it at the same time, redis is gonna run a command from one client and then command from **another client** and ... .
So it's gonna process all different commands coming from different clients in different order. When we use a trn, we're telling
redis that there are a couple of commands we wanna run one after another and nothing else should be executed in between them.

About 2: When we use pipelining, there's no guarantee that all those pipelined commands are gonna be executed one after another without
redis running commands of some other connections in between. So the order of commands of **one client** is the same as provided, but between 
executing those commands, redis will handle commands of other clients as well. But with trns we're guaranteed redis won't handle other
clients in the middle of a trn.

The trns in redis are less useful compared to other DBs.

## 95-008 Watching a Key with Transactions
We use WATCH before starting a trn. The goal of WATCH is to tell redis watch this key and if it's val every changes **before starting**
the trn, then fail that trn. Failing happens when we run exec and it will return null which means the execution of that trn
was failed.

For example, we watch key `color` and then after executing watch, some other client updates the color property. Now color has changed.
The next trn we try to run, is gonna automatically fail.

The trn here will fail:
```redis
watch color

-- this will make the trn to fail
set color blue 

multi
set color red
set count 5
exec
```

## 96-009 Isolated Connections for Transactions
## 97-010 Solving Multiple Bids with a Transaction
## 98-011 Items by Price
## 99-012 More on Items b y Price