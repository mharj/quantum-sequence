import {type ILoggerLike, type ISetOptionalLogger, MapLogger} from '@avanio/logger-like';
import {type IStorageDriver} from 'tachyon-drive';
import {type QuantumCoreLogMap} from '.';

export interface QuantumCoreOptions {
	/**
	 * hide sensitive cache keys from logging
	 */
	hideKey?: boolean;
}

export abstract class QuantumCore<TStore> implements ISetOptionalLogger {
	private isInitialized = false;
	private readonly driver: IStorageDriver<TStore>;
	protected data: TStore;
	private readonly initialData: TStore;
	protected logger: MapLogger<QuantumCoreLogMap>;
	protected readonly options: QuantumCoreOptions;

	private onHydrateCallbacks = new Set<() => void>();

	constructor(
		driver: IStorageDriver<TStore>,
		initialData: TStore,
		options: QuantumCoreOptions = {},
		logger: ILoggerLike | undefined,
		logMapping: QuantumCoreLogMap,
	) {
		this.driver = driver;
		this.initialData = initialData;
		this.data = this.driver.clone(this.initialData);
		this.driver.on('update', this.onUpdateCallback.bind(this)); // hook into the driver to update the data when it changes
		this.logger = new MapLogger(logger, logMapping);
		this.options = options;
		this.logger.logKey('constructor', `QuantumCore: constructor()`);
	}

	/**
	 * Set the logger
	 * @param logger - the logger to use
	 */
	public setLogger(logger: ILoggerLike | undefined): void {
		this.logger.setLogger(logger);
	}

	/**
	 * Change log levels for the storage driver.
	 * @param map - The log key mapping to use for logging messages.
	 */
	public setLogMapping(map: Partial<QuantumCoreLogMap>): void {
		this.logger.setLogMapping(map);
	}

	/**
	 * This is called when data is replaced.
	 *
	 * - on Hydrate (init)
	 * - on Clear
	 * - on Driver update callback
	 */
	public onHydrate(callback: () => void): void {
		this.logger.logKey('register_hydrate_callback', `QuantumCore: onHydrate(callback)`);
		this.onHydrateCallbacks.add(callback);
	}

	/**
	 * Initialize the storage driver and hydrate the data if it exists
	 */
	protected async coreInit(): Promise<void> {
		this.logger.logKey('init', `QuantumCore: coreInit()`);
		if (!this.isInitialized) {
			await this.driver.init();
			const data = await this.driver.hydrate();
			if (data) {
				this.data = data;
			}
			this.isInitialized = true;
			if (data) {
				// call all the onHydrate callbacks
				this.notifyHydrateCallbacks();
			}
		}
	}

	/**
	 * Store the current data to the storage driver
	 */
	protected async coreStore(): Promise<void> {
		this.logger.logKey('store', `QuantumCore: coreStore()`);
		await this.driver.store(this.data);
	}

	/**
	 * Reset data to initial and clear the storage driver
	 */
	protected async coreClear(): Promise<void> {
		this.logger.logKey('clear', `QuantumCore: coreClear()`);
		this.data = this.driver.clone(this.initialData);
		await this.driver.clear();
		this.isInitialized = false;
		// notify all the onHydrate callbacks about data changes
		this.notifyHydrateCallbacks();
	}

	private onUpdateCallback(data: TStore | undefined): void {
		if (data) {
			this.data = data;
		} else {
			this.data = this.driver.clone(this.initialData);
		}
		// notify all the onHydrate callbacks about data changes
		this.notifyHydrateCallbacks();
	}

	/**
	 * notify all the onHydrate callbacks about data changes
	 */
	private notifyHydrateCallbacks(): void {
		this.logger.logKey('notify_hydrate', `QuantumCore: notifyHydrateCallbacks() = ${this.onHydrateCallbacks.size.toString()}`);
		// call all the onHydrate callbacks
		for (const callback of this.onHydrateCallbacks) {
			callback();
		}
	}
}
