# Section 18 - Understanding and Solving Concurrency Issues

## 112-001 Concurrency Revisited
Review of the concurrency issue:

Let's say we have multiple reqs to create a bid at the same time with amounts of 10 and 15. At the same time, both reqs get the
item hash from redis. Let's say item amount is 5$. So both bids are valid. Let's say 15$ bid is gonna save the 15$ as the bid
amount in redis. Then 10$ bid req at the same time tries to update the amount field in redis to 10$. Now we see the problem.
Both reqs get the item hash from redis and both have valid amount field. So they can update the bid in redis although the second
req shouldn't be able to do that because it has a less amount field.

We're implementing an auction platform, the most recent which is the highest value should always be the winner. We're not seeing
a scenario where we're accidentally decreasing the current amount of money being bid on an item(from 15$ to 10$).

`Watch` command: Watches a key and if that key changes, then the next tx is gonna automatically fail.

Scenario using the watch and tx: both reqs are gonna get the item hash, first req updates the amount to 15$. Now that
redis key has changed. The first req is successful(the one with 15$). Now the second req that got the same hash of the other req,
wants to update the amount, the amount is valid, so it wanna update the amount but the amount has changed. So the watch command is
gonna cause the tx to fail. So the 10$ req fails entirely.

But we still have problem!

In this scenario, we're talking about two different scenarios.

1. first we process the req with higher bid amount. We update the item's amount to 15$ and then we process the req with smaller bid.
   Now the watch command sees that the key data has changed, so it would cancel the 10$ tx. The 10$ is invalid and it got cancelled correctly.
2. first we process the req with smaller bid amount. But now the 15$ which is a valid bid wants to update the amount, watch
   command fails the tx. So here we cancelled a bid that was completely valid! The 15$ bid was the latest and highest bid but it was failed.
   So we would lose customers.

![](img/113-1.png)

**Solution:** The obvious solution to the failing valid transactions problem, is to have retry mechanism. So whenever a tx fails due to a watch
command, we could have code that retries the watch.

There are two problems with this solution:
1. **doesn't scale well**. Using `WATCH` quite a bit, is gonna slow down the redis server compared to other alternatives
2. retrying would introduce **a lot of load on redis server**, because we're gonna also run the data fetching logic again and again

So by using `watch`, a lot of simultaneous incoming reqs would fail.

So as soon as we get some load, we're gonna see a lot of reqs get failed.

## 113-002 Issues with WATCH
We wanna make sure that every valid bid req is always gonna succeed, not some of them failing due to `watch` and `tx`.
We need a better concurrency mechanism.

## 114-003 Overview of a Lock
Our situation: we have multiple reqs that are trying to read a value out of redis and do a write based on that read value.
![](img/114-1.png)

Note: When we have one read-write and multiple reads of the same val at the same time, we don't need locks:
![](img/114-2.png)

The issue is when we have more than one read-write on the same val at the same time, because we might end up with different results
depending upon which req's write op goes first.
![](img/114-3.png)

We want a way of saying: req #1 is gonna go first and then req #2 will go second. So a serialization.

We solve it like this:
![](img/114-4.png)

**So whenever we have multiple reqs at the same time that are trying to write or a read and then a write op, we must ensure only one req
can modify a shared key at any given time, we do that using a lock.** Any other process that wanna read-write op, is gonna has to
keep on trying for sending the `SET NX` for the lock key and only when that SET op succeeds, it has the ability to do it's work on the
shared value.

At the same time, the reqs are gonna send off a `SET NX` command. The value to set doesn't matter, the only thing matters is if this
op is successful.
![](img/114-5.png)

So imagine req 1 sends off it's SET command just a little bit before req 2. So the SET command of req 1 is gonna work but the
SET command of req 2 won't work because there's a value already stored for that key. Since process 1 was successful in doing 
the set(accessing the lock) and process 2 failed, process 1 would have exclusive access to read and write to the shared value.
Note that any other process that wanna only read the shared value, can do so. What we wanna prevent is any other process doing a 
read and then a write op.

The other process that wanna write to the shared value, won't give up, they will keep on retrying that SET command. Then process #1
will finish it's work and then it will DEL the key for the lock. Now next time process 2 sends off the SET command, it's gonna 
succeed. Now process 2 has exclusive access to the shared value.
![](img/114-6.png)

## 115-004 Understanding the Goal
- our concurrency system will implement a simplified version of the readlock algo
- on any serious project, use redlock instead of what we're building here

See distributed locks in redis patterns docs.

## 116-005 Implementing WithLock

## 117-006 Using WithLock

## 118-007 It Works!
Using locks, executing takes longer than transactions, because we have retyping in locks. We could decrease the retryDelayMs as well.

## 119-008 Automatically Expiring Locks
Currently, if the process acquires the lock and crashes or do a `throw new Error()`, the lock is never released(the lock key is never deleted).
We could do error handling for errors that are thrown in createBid(), but whenever we're in a lock func, we have to assume that our
entire server might crash for some reason, because of some unrecoverable err like the power goes out or ... that we can't recover.
So at any point, the server might crash before unlocking the locks. Unless we manually delete that lock.

For this, we use PX opt. So when a process acquires the lock, it has for example 2 seconds to do whatever work is required to be done while
holding that lock and then after 2 seconds, if the lock is still held, it will be released automatically.

PX opt makes sure if entire server crashes, the lock is still released after 2 seconds and the try finally block makes sure that if the cb() has any errors,
we recover from it and we will still **immediately** release the lock.

## 120-009 Another Lock Issue
The issue is: The DEL command might take a while to reach redis and in the meantime some other stuff happens that cause issues.

Let's say p1 acquires the lock but it's logic while holding the lock takes more than the PX.

Note that when working with some server like redis, we never have any guarantee on how long it's gonna take to send a command and get back res.
This edge case happens not often but can happen.

The edge case: Let's say the DEL command of a process is issued but at the mean time, the lock expires automatically(because of PX).
Now let's say the DEL command takes a while to arrive to redis and while the DEL command is still in flight, another process might
come in and acquire the lock with the SET NX. Now since the lock was automatically expired, the lock is acquired by this process.
And then the DEL command of previous process reaches redis and it will delete the lock. This means the process 2 thought it has the lock,
but it just lost it without knowing it.
![](img/120-1.png)

This is a problem. Because a third process could come in and does a SET NX successfully. So now we have two processes that both
think that they own the lock and it's all because the DEL command of process 1 took a bit longer than we expected.
![](img/120-2.png)

To solve this, we could to add a step to p1. But this solution won't work. When a process wants to DEL the lock, first it has to make sure
that the value of lock is the same as when it acquired the lock in the first place. So we have to make sure we're not deleting 
someone else's lock. And to make sure that we correctly should issue a DEL at all and the lock is not expired or anything,
we add a GET step to get the lock's value(token) and check the response to the original token that we've SET when acquiring the lock.
If they are equal, we can go ahead and send the DEL to remove the lock.
![](img/120-3.png)

This still doesn't solve the issue. Why?

A: Let's say we did the comparison of res token with original token, it was ok and we issued the DEL. But the DEL takes a while
to reach redis and while the DEL is en route, the lock expires automatically and we hit the same issue as before.
Because now p2 can acquire the lock, but then the DEL reaches the redis and removes the lock and then p3 can acquire the lock.
So we have a concurrency issue again.
![](img/120-4.png)

The whole issue is the DEL getting delay. We definitely want to issue the DEL but we don't want to run the DEL if the lock
is already expired or for some reason, some other process has acquired the lock.

## 121-010 Solving Accidental Unlocks
Note: When redis is executing a lua script in redis, redis is not gonna process any other commands. So it doesn't matter if 50
clients start to send commands to redis, when it's executing a lua script, the script will be executed from start to finish without
redis doing anything else in between.

In the solution, when we wanna release the lock, rather than issuing a DEL call, we're gonna use a lua script.
![](img/121-1.png)

With this, we're only deleting the lock key(releasing the lock) if our process is still in control of that lock. If lock was
already automatically expired, then the lua script is not gonna delete anything. Note that when lua is executing, nothing else
will happen and also note that the lua script checks if the val of lock is the same as what the process has acquired, so if another
process acquires the lock, the val will be different and lua won't delete the lock accidentally.

The lua script we're gonna write says: is the lock token here still what it was when we set it?

## 122-011 Adding an Unlock Script

## 123-012 One Last Issue
The entire looking mechanism revolves around this idea of just setting some value at a key. There's no actual locking of data occurring here.
There's nothing that is inherently prevent a write to that item being locked.
We're just following some kind of convention for deciding when it's safe to write to that hash and when it's not.

Let's say the commands inside withLock() take a lot of time to run. The lock will be automatically released by using PX.
Now the callback(commands inside withLock()) finishes and wants to write the data back to the item that was locked.
It can do that although it has not acquired the lock anymore. Nothing is preventing it from doing that.

You see `Write data!` block is done even though the lock is released earlier.
![](img/123-1.png)

So as soon as the cb() is called, we don't have any control after that point, whoever put code into the cb(), is in control of the game.

So other process can acquire the lock, but this process is still doing work and will write some data even though the lock is
acquired by some other p.

## 124-013 Providing Expiration Signals
**Problem is: Continuing execution of commands inside withLock() even when the lock is expired.**

With this solution, we're assuming other devs are gonna use the signal obj correctly. So before writing any data to the locked data,
they're gonna check the signal. But there's no guarantee that they use it. We can solve this issue by using a js proxy to intercept
the calls made in the callback and check if the lock is expired.

## 125-014 Alternate Expiration Solution
With this solution, we don't need to rely on other devs using that manual check of the signal before any writes to data.
We throw err as soon as the lock expires.