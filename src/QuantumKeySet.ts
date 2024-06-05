import {defaultQuantumCoreLogLevels, type QuantumCoreLogMap} from '.';
import {QuantumCore, type QuantumCoreOptions} from './QuantumCore';
import type {ILoggerLike} from '@avanio/logger-like';
import {type IQuantumMap} from './IQuantumMap';
import {type IStorageDriver} from 'tachyon-drive';

type QuantumKey<TValue> = keyof TValue;
type QuantumKeyValue<TValue> = TValue[keyof TValue];
type QuantumSetStore<TValue> = Set<TValue>;

/**
 * primitive key value we can compare on lookup
 */
type QuantumPrimitiveBuildCallback<TValue> = (value: QuantumKeyValue<TValue>) => number | string | boolean;

export class QuantumKeySet<TValue, LookupKey extends QuantumKey<TValue>>
	extends QuantumCore<QuantumSetStore<TValue>>
	implements IQuantumMap<QuantumKeyValue<TValue>, TValue>
{
	private lookupKey: QuantumKey<TValue>;
	private lookupValueBuilder: QuantumPrimitiveBuildCallback<TValue>;
	constructor(
		lookupKey: LookupKey,
		lookupValueBuilder: QuantumPrimitiveBuildCallback<TValue>,
		driver: IStorageDriver<QuantumSetStore<TValue>>,
		options: QuantumCoreOptions = {},
		logger?: ILoggerLike,
		logMapping: QuantumCoreLogMap = defaultQuantumCoreLogLevels,
	) {
		super(driver, new Set(), options, logger, logMapping);
		this.lookupKey = lookupKey;
		this.lookupValueBuilder = lookupValueBuilder;
	}

	public async has(key: QuantumKeyValue<TValue>): Promise<boolean> {
		await this.coreInit();
		return Array.from(this.data).some(this.filterSetWithKey(key));
	}

	public async get(key: QuantumKeyValue<TValue>): Promise<TValue | undefined> {
		await this.coreInit();
		return Array.from(this.data).find(this.filterSetWithKey(key));
	}

	public async set(key: QuantumKeyValue<TValue>, value: TValue): Promise<void> {
		const oldValue = await this.get(key);
		if (oldValue) {
			this.data.delete(oldValue);
		}
		this.data.add(value);
		await this.coreStore();
	}

	public async delete(key: QuantumKeyValue<TValue> | QuantumKeyValue<TValue>[]): Promise<boolean> {
		let deleted = false;
		const keys = Array.isArray(key) ? key : [key];
		for (const key of keys) {
			const oldValue = await this.get(key);
			if (oldValue) {
				this.data.delete(oldValue);
				deleted = true;
			}
		}
		await this.coreStore();
		return deleted;
	}

	public async size(): Promise<number> {
		await this.coreInit();
		return this.data.size;
	}

	public async entries(): Promise<IterableIterator<[QuantumKeyValue<TValue>, TValue]>> {
		await this.coreInit();
		const entryArray = Array.from(this.data).map<[QuantumKeyValue<TValue>, TValue]>((value) => [value[this.lookupKey], value]);
		return entryArray[Symbol.iterator]();
	}

	public async values(): Promise<IterableIterator<TValue>> {
		await this.coreInit();
		return this.data.values();
	}

	public async keys(): Promise<IterableIterator<QuantumKeyValue<TValue>>> {
		await this.coreInit();
		const keyArray = Array.from(this.data).map<QuantumKeyValue<TValue>>((value) => value[this.lookupKey]);
		return keyArray[Symbol.iterator]();
	}

	public init(): Promise<void> {
		return this.coreInit();
	}

	public clear(): Promise<void> {
		return this.coreClear();
	}

	private filterSetWithKey(key: QuantumKeyValue<TValue>): (value: TValue) => boolean {
		const primitiveKey = this.buildLookupCompareValue(key);
		return (value: TValue) => this.buildLookupCompareValue(value[this.lookupKey]) === primitiveKey;
	}

	private buildLookupCompareValue(value: QuantumKeyValue<TValue>): string | number | boolean {
		const primitiveValue = this.lookupValueBuilder(value);
		if (typeof primitiveValue === 'string' || typeof primitiveValue === 'number' || typeof primitiveValue === 'boolean') {
			return primitiveValue;
		}
		throw new TypeError(`QuantumKeySet: lookupValueBuilder callback function must return key as a string, number or boolean value.`);
	}
}
