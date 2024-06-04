import type {ILoggerLike} from '@avanio/logger-like';
import {IStorageDriver} from 'tachyon-drive';

export interface QuantumCoreOptions {
	/**
	 * hide sensitive cache keys from logging
	 */
	hideKey?: boolean;
}

export abstract class QuantumCore<TStore> {
	private isInitialized = false;
	private readonly driver: IStorageDriver<TStore>;
	protected data: TStore;
	private readonly initialData: TStore;
	protected readonly logger: ILoggerLike | Console | undefined;
	protected readonly options: QuantumCoreOptions;

	private onHydrateCallbacks = new Set<() => void>();

	constructor(driver: IStorageDriver<TStore>, initialData: TStore, options: QuantumCoreOptions = {}, logger?: ILoggerLike | Console) {
		this.driver = driver;
		this.initialData = initialData;
		this.data = this.driver.clone(this.initialData);
		this.driver.on('update', this.onUpdateCallback.bind(this)); // hook into the driver to update the data when it changes
		this.logger = logger;
		this.options = options;
		this.logger?.debug(`QuantumCore: constructor()`);
	}

	/**
	 * This is called when data is replaced.
	 *
	 * - on Hydrate (init)
	 * - on Clear
	 * - on Driver update callback
	 */
	public onHydrate(callback: () => void): void {
		this.logger?.debug(`QuantumCore: onHydrate(callback)`);
		this.onHydrateCallbacks.add(callback);
	}

	/**
	 * Initialize the storage driver and hydrate the data if it exists
	 */
	protected async coreInit(): Promise<void> {
		this.logger?.debug(`QuantumCore: coreInit()`);
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
		this.logger?.debug(`QuantumCore: coreStore()`);
		await this.driver.store(this.data);
	}

	/**
	 * Reset data to initial and clear the storage driver
	 */
	protected async coreClear(): Promise<void> {
		this.logger?.debug(`QuantumCore: coreClear()`);
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
		this.logger?.debug(`QuantumCore: notifyHydrateCallbacks() = ${this.onHydrateCallbacks.size}}`);
		// call all the onHydrate callbacks
		for (const callback of this.onHydrateCallbacks) {
			callback();
		}
	}
}
