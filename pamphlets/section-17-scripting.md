# Section 17 - Extending Redis with Scripting
## 100-001 Lua Scripting
Use cases:
- concurrency issues
- data over fetching: let's say there's not builtin redis command for sth that we want, we have to get **all** members of a key
then apply some logic on them. For example filter them. We don't want to fetch and load all that data on the client. We wanna
do that logic on the server and get the data that we really want.

Lua allows us to run custom logic without returning raw data back to redis client except the final result. So it's gonna solve
data over fetching issue.

## 101-002 Basics of Lua

## 102-003 Handling Arrays
## 103-004 Handling Tables
## 104-005 Loading and Executing Scripts
![](img/104-1.png)
![](img/104-2.png)

```redis
-- returns an id
script load 'return 1 + 1'

evalsha <id> 0
```

## 105-006 Providing Arguments
argv: contains all args we provide to script when we execute it.

```redis
evalsha <id> 0 '1'
```
arguments to script must always be string.

## 106-007 Providing Key lists
```lua
-- This script has a huge issue! Don't use this!
return redis.call('GET', 'color')

-- use this instead(by running evalsha <id> 0 color)
return redis.call('GET', KEYS[1])
```

So anytime you wanna run a command, you have to specify the key a head of time to evalsha command instead of putting them in the script itself.
So the issue with this command for running a script that has a key name in it(which is a wrong approach):
```redis
evalsha <id> 0
```
is that we're not telling evalsha which keys we're planning to work with in the script.

So rather than writing the keys as simple string in the script, we pass the key names when running evalsha command and access them in script
using KEYS global var.

Note: The 0 in the commands is the number of **keys** we wanna pass to the script(can be accessed using KEYS).

Note that after providing the keys, we can provide the arguments that we can access using argv. So we can have:
```redis
evalsha <id> 2 color items '4' '6' '7'
```

So another limitation is we can't have a script that generate keys dynamically that we wanna run commands with.
Every key we wanna run command with, must be provided as an arg to `evalsha` ahead of time.
Note that you can run a script where you access a key that you don't mention inside of evalsha. We won't see an error.

## 107-008 When to Use Scripts
1. limiting the amount of data exchanged between server and redis
2. solving some concurrency issues
3. minimizing the number of round trips between server and redis

About 3: We might want to get some keys and then depending on their value, we might want to fetch more keys and then depending
on those values, we wanna fetch more and ... . So there are many roundtrips here. We can use lua script and run all that code
on redis instead of multiple round trips to redis client.

Where you don't want to use lua scripts(downsides of lua scripts):
1. keys must be known ahead of time. So we can't dynamically generate keys inside of the script.
2. tough to test script(needs additional tooling)
3. loss of language features(e.g. type checking with TS)
4. another language to deal with(lua)

## 108-009 Custom Scripts with Node-Redis
Instead of using script load and get back an id and then hold onto it until using it with `evalsha`, node-redis lib has easier funcs
for this.
![](img/108-1.png)
![](img/108-2.png)

## 109-010 Lua Script Integration
## 110-011 Creating a View-Incrementing Script
### Scripting design pattern
1. identify all the keys and arguments you want to access
2. assign the keys(KEYS) and arguments(ARGV) to well-labeled variables at the top of the script
3. write your logic
4. don't forget to return a value if you need to

## 111-012 Code Cleanup