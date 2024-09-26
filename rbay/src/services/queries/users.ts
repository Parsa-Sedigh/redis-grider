import type {CreateUserAttrs} from '$services/types';
import {genId} from "$services/utils";
import {client} from "$services/redis";
import {usernamesKey, usernamesUniqueKey, usersKey} from "$services/keys";

// we could also use a hash here
export const getUserByUsername = async (username: string) => {
};

export const getUserById = async (id: string) => {
    const user = await client.hGetAll(usersKey(id))

    return deserialize(id, user)
};

export const createUser = async (attrs: CreateUserAttrs) => {
    const id = genId()

    const exists = await client.sIsMember(usernamesUniqueKey(), attrs.username)
    if (exists) {
        throw new Error('Username is taken')
    }

    // attrs.password is already salted and hashed
    await client.hSet(usersKey(id), serialize(attrs))
    await client.sAdd(usernamesUniqueKey(), attrs.username)
    await client.zAdd(usernamesKey(), {
        value: attrs.username, // in node-redis, value field is the same as member field
        score: parseInt(id, 16)
    })

    return id
};

const serialize = (user: CreateUserAttrs) => {
    return {
        username: user.username,
        password: user.password
    }
}

const deserialize = (id: string, user: { [key: string]: string }) => {
    return {
        id,
        username: user.username,
        password: user.password
    }
}