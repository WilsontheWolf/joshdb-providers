// Uncomment the the line below for tests to run.
// // @ts-nocheck
// Import the JoshProvider class.
import {
  ClearPayload,
  GetAllPayload,
  GetManyPayload,
  GetPayload,
  HasPayload,
  JoshProvider,
  Method,
  SetManyPayload,
  SetPayload,
  SizePayload
} from '@joshdb/core';
import { getFromObject, hasFromObject, setToObject } from '@realware/utilities';
import DbHandler from './DbHandler';

// Create your provider class.
export class IndexedDBProvider<StoredValue = unknown> extends JoshProvider<StoredValue> {
  private db: DbHandler;
  public constructor(options: JoshProvider.Options) {
    super(options);
    this.db = new DbHandler();
  }

  public async init(context: JoshProvider.Context<StoredValue>): Promise<JoshProvider.Context<StoredValue>> {
    context = await super.init(context);
    await this.db.init();

    return context;
  }

  public async [Method.Get]<Value = StoredValue>(payload: GetPayload<Value>): Promise<GetPayload<Value>> {
    await this.check();

    const { key, path } = payload;
    const value = await this.db.get(key);

    payload.data = path.length === 0 ? value : getFromObject(value, path);

    return payload;
  }

  public async [Method.GetAll](payload: GetAllPayload<StoredValue>): Promise<GetAllPayload<StoredValue>> {
    await this.check();

    payload.data = await this.db.getAll();

    return payload;
  }

  public async [Method.GetMany](payload: GetManyPayload<StoredValue>): Promise<GetManyPayload<StoredValue>> {
    await this.check();
    // according to old method this could be made into an index search

    const { keys } = payload;
    const data: { [key: string]: StoredValue } = await this.db.getAll();

    payload.data = {};

    Object.entries(data).forEach(([key, val]) => {
      if (keys.includes(key)) {
        payload.data[key] = val;
      }
    });

    return payload;
  }

  public async [Method.Set]<Value = StoredValue>(payload: SetPayload<Value>): Promise<SetPayload<Value>> {
    await this.check();

    const { key, value, path } = payload;
    let data = (await this.db.get(key)) || {};

    if (path.length === 0) {
      data = value;
    } else {
      setToObject(data, path, value);
    }

    await this.db.set(key, data);

    return payload;
  }

  public async [Method.SetMany](payload: SetManyPayload<StoredValue>): Promise<SetManyPayload<StoredValue>> {
    await this.check();

    const { keys, value } = payload;

    for (const key of keys) {
      await this.set({ key, value, path: [], method: Method.Set });
      // Incase overwrite is re-added.
      // const found = await this.get({ key, method: Method.Get, path: [] });

      // if (!found || (found && overwrite)) {
      //   await this.set(key, null, val);
      // }
    }

    return payload;
  }

  public async [Method.Clear](payload: ClearPayload): Promise<ClearPayload> {
    await this.check();
    await this.db.clear();

    return payload;
  }

  public async [Method.Has](payload: HasPayload): Promise<HasPayload> {
    await this.check();

    const { key, path } = payload;

    if (await this.db.has(key)) {
      payload.data = true;

      if (path.length !== 0) payload.data = hasFromObject(await this.db.get(key), path);
    }

    return payload;
  }

  public async [Method.Size](payload: SizePayload): Promise<SizePayload> {
    await this.check();
    payload.data = await this.db.count();

    return payload;
  }

  private async check(key: string | null = null, type: string[] | null = null, path: string[] = []) {
    if (!this.db) throw new Error('Database has been closed');
    if (!key || !type) return;

    const value = await this.get({ method: Method.Get, key, path });

    if (value === null) {
      throw new Error(
        `The document "${key}" of path "${path}" was not found in the database`
        // 'JoshTypeError',
      );
    }

    const valueType = value.constructor.name;

    if (!type.includes(valueType)) {
      throw new Error(
        `The property ${path ? `${path} ` : ''}in key "${key}" is not of type "${type.join('" or "')}"(key was of type "${valueType}")`
        // 'JoshTypeError',
      );
    }
  }
}
