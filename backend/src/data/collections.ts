import { Collection, Db, MongoClient } from "mongodb";
import { UserDocument } from "@/data/users";

const getCollection = <T>(
    name: string,
): (() => Promise<Collection<T>>) => {
    let collection: Collection<T> | undefined = undefined;
    return async (): Promise<Collection<T>> => {
        if (collection === undefined) {
            const connection: MongoClient = await MongoClient.connect(
                String(process.env.MONGO_DB_URI),
            );
            const db: Db = connection.db(String(process.env.MONGO_DB_NAME));
            collection = db.collection<T>(name);
        }
        return collection;
    };
};

class DataError extends Error {
    code: number;

    constructor(code: number, message: string) {
        super(message);
        this.name = "DataError";
        this.code = code;
    }
}

const usersCollection = <T extends UserDocument>(): Promise<Collection<T>> =>
    getCollection<T>("users")();

export { DataError, usersCollection };
