# Section 04 - Local Redis Setup

## 9-001 Installing on MacOS

Below are instructions to run Redis locally on MacOS.  The next lecture has install directions for Windows

You do not need to install Redis locally. You can complete the entire course using the Redis instance we already created on Redis Labs.  These instructions are only here incase you want to run a copy on your own machine.



First, a few notes:

There are two different versions of Redis.  They are called Redis and Redis Stack

Redis contains the core Redis database

Redis Stack contains the core Redis database and some additional modules that extend the functionality of Redis.

When we created an instance on Redis Labs, we got a copy of Redis Stack - it has these extra modules already installed.

Later sections in this course will require you to run Redis Stack, because we eventually use these extra modules

Installation Guide for MacOS

These are the same install directions listed at https://redis.io/docs/stack/get-started/install/mac-os/



If you do not already have HomeBrew installed, navigate to https://brew.sh/ and run the command at the top in your terminal to install HomeBrew

At your terminal, run brew tap redis-stack/redis-stack

At your terminal, run brew install redis-stack

To start Redis, run redis-stack-server

To connect to your local Redis server and execute commands, run redis-cli



If you want to connect the RBay e-commerce app to your local copy of Redis, update the .env file in the root project directory to the following:

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PW=


If you want to connect RBook to your local copy of Redis, you will need to run RBook locally.

To run RBook locally, run npx rbook at your terminal.

Navigate to localhost:3050

Open the connection settings window

Enter a host of 'localhost'

Enter a port of 6379

Leave the password blank

When running RBook locally, any notebooks you create will be added to the folder you ran npx rbook in.

## 10-002 Installing on Windows