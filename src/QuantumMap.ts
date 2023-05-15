import {IStorageDriver} from 'tachyon-drive';
import type {ILoggerLike} from '@avanio/logger-like';
import {QuantumCore, QuantumCoreOptions} from './QuantumCore';
import {IQuantumMap} from './IQuantumMap';

type QuantumMapStore<TKey, TValue> = Map<TKey, TValue>;

/**
 * A QuantumMap is a Map that is persisted to a storage driver when data is modified.
 */
export class QuantumMap<TKey, TValue> extends QuantumCore<QuantumMapStore<TKey, TValue>> implements IQuantumMap<TKey, TValue> {
	constructor(driver: IStorageDriver<QuantumMapStore<TKey, TValue>>, options: QuantumCoreOptions = {}, logger?: ILoggerLike | Console) {
		super(driver, new Map<TKey, TValue>(), options, logger);
	}

	public init(): Promise<void> {
		return this.coreInit();
	}

	public async has(key: TKey): Promise<boolean> {
		await this.coreInit();
		return this.data.has(key);
	}

	public async get(key: TKey): Promise<TValue | undefined> {
		await this.coreInit();
		return this.data.get(key);
	}

	public async set(key: TKey, value: TValue): Promise<void> {
		this.data.set(key, value);
		return this.coreStore();
	}

	public async delete(key: TKey | TKey[]): Promise<boolean> {
		let deleted = false;
		const keys = Array.isArray(key) ? key : [key];
		for (const key of keys) {
			this.data.delete(key);
			deleted = true;
		}
		await this.coreStore();
		return deleted;
	}

	public async size(): Promise<number> {
		await this.coreInit();
		return this.data.size;
	}

	public clear(): Promise<void> {
		return this.coreClear();
	}

	public async entries(): Promise<IterableIterator<[TKey, TValue]>> {
		await this.coreInit();
		return this.data.entries();
	}

	public async values(): Promise<IterableIterator<TValue>> {
		await this.coreInit();
		return this.data.values();
	}

	public async keys(): Promise<IterableIterator<TKey>> {
		await this.coreInit();
		return this.data.keys();
	}
}
