# Section 21 - Service Communication with Streams
## 153-001 Streams
- kind of like a cross between a list and a sorted set
- used for communication between different servers
- most useful with 'consumer groups'
- TONS AND TONS of tiny details

## 153-002 Use Case of Streams
Streams are meant for communicating between some producer and consumer.

A msg is like a hash(so no nesting is allowed).

Inside of stream, each msg has an id which is the time at which this msg was added in stream.

When the consumer reads a msg, it's not deleted from the original stream.
![](./img/153-1.png)

### Primary use case of streams
**Job processing flow**

Producer sent a DS(msg) to a stream and the msgs are consumed by consumers(workers).

An app example that is not set up ideally:

Let's say there's an api on server that receives req for sending an email to someone. As server is making a req to
third party email provider api, the client is waiting for a res from server. It might take several seconds for third party
api to send back a res.
![](./img/153-2.png)

We can use redis streams(the broker) to solve when the there's a lot of reqs:

The req is sent to a server that we call `message producer`. Producer put a msg into the stream.
As soon as producer added the msg into the stream, it can **immediately** respond to the client. So the client doesn't wait any longer.

After msg is added to the stream, the msg consumer(worker) it's gonna get the msg and send it to third party api.
![](./img/153-3.png)

**Note: The `-0` is used to account when multiple msgs are added at the exact same millisecond.** To make sure each msg is distinguished,

There's one problem though: Q: How does the client know the email was actually sent successfully?

A: We need to handle the consumer crashing before sending the email scenario.

## 154-003 Adding Messages to a Stream
![](./img/154-1.png)

## 155-004 Consuming Streams with XREAD
![](./img/155-1.png)

The first 0 is the actual timestamp and the second one is those numbers that are appended for distinguishing msgs added at the same time.

```redis
-- read all msgs after(but not including) this timestamp
xread streams fruits x-0
```

![](./img/155-2.png)

## 156-005 Blocking Reads
![](./img/156-1.png)

Note: When using xread with count and block, if there is no 

## 157-006 An XREAD Shortcut
Having to figure out exactly what time to put in as the ts value to represent **now**, can be challenging, as a shortcut, we can put $.
![](./img/157-1.png)

## 158-007 A Little Gotcha Around Streams
If this runs, we get the first msg.

Now after receiving it and processing the msg, we issue the XREAD again, but from that moment(because we used $), there's no msg in stream.
So we skipped those two msgs(11, 12).
![](./img/158-1.png)

To fix this, after the first xread, any future xread has to use the id of the prev received msg as the starting point for getting the
next msg. So instead of $ in the second xread, we should use 10(id of the prev fetched msg).
![](./img/158-2.png)

So we can't always use the $ in xread.

## 159-008 Reading Streams with XRANGE
![](./img/159-1.png)

Note: Timestamps in xrange are inclusive but the one in xread is exclusive. But we can change the inclusive behavior of xrange:
![](./img/159-2.png)

We can say: get msgs at a long time ago(-), or in the very future(+)
![](./img/159-3.png)

## 160-009 Issues with Standard Streams
Two issues we would run into if we don't use consumer groups:

1. Let's say we get a lot of reqs fore sending emails and for handling the load, we use multiple consumers(workers). The big problem is
whenever workers do `xread`, the msg is gonna sent off to that worker, so a msg is processed multiple times by multiple workers!
**So we will send a ton of duplicate emails!**
![](./img/160-1.png)

2. hard to handle a consumer crashing after receiving a msg. For example, the email req msg is sent to the worker and the server
responds to the client that the email will be sent. But the consumer crashes before sending the email. The email might have been sent
or not. Because we don't know when the worker crashed.

## 161-010 Consumer Groups
The goal of a consumer group is to get workers to work together(coordinate things).

- Each msg will be sent to only one member of a consumer group not all of them.
- redis keeps track of where it sent each msg to a consumer group
![](./img/161-1.png)
- in addition to keeping track of sent msgs, redis also is gonna keep track of whether or not the worker acked the receipt of the msg.
![](./img/161-2.png)
- ![](./img/161-3.png) the benefit of this is: if a new msg arrives to redis, worker no longer needs to know what the most recent id is.
- Instead, it can ask the stream to give it the next undelivered msg.

Note: acknowledging receipt can either mean:
- consumer got the msg and that's it
- or consumer got it and processed it successfully

So consumer sends back a signal to redis.

So this handles the problem that the consumer receives the msg but failed to process it(maybe crashed).

We almost always use consumer groups.

## 162-011 Creating and Inspecting Consumer Groups
We can create a consumer group for either a new stream or an existing stream. If we make a consumer group for an existing stream,
we need to decide what we want to do about all the msgs that already exist inside of stream. We can specify an id in `xgroup create`
which means: create this group and consume all msgs from this id forward to not been processed by this group(so this group will
consume those).
![](./img/162-1.png)

To create a consumer and attach it to a group:
![](./img/162-2.png)
![](./img/162-3.png)

## 163-012 Consumer Groups in Action
## 164-013 Claiming Expired Messages