declare module "connect-ioredis" {
    import * as express from "express";
    import * as session from "express-session";
    import * as Redis from "ioredis";
    // import * as redis from "redis";


    function s(options: (options?: session.SessionOptions) => express.RequestHandler): s.RedisStore;

    namespace s {
        interface RedisStore extends session.Store {
            new (options: RedisStoreOptions): session.Store;
        }
        interface RedisStoreOptions {
            client?: Redis.Redis | Redis.Cluster;
            host?: string;
            hosts?: string[];
            port?: number;
            socket?: string;
            url?: string;
            ttl?: number | string | ((store: RedisStore, sess: Express.SessionData, sid: string) => number);
            disableTTL?: boolean;
            db?: number;
            pass?: string;
            prefix?: string;
            unref?: boolean;
            serializer?: Serializer | JSON;
            logErrors?: boolean | ((error: string) => void);
            scanCount?: number;
        }
        interface Serializer {
            stringify: Function;
            parse: Function;
        }
    }

    export = s;
}
