import {LogLevel, type LogMapping} from '@avanio/logger-like';

/**
 * The default log levels for the storage driver.
 */
export const defaultQuantumCoreLogLevels = {
	clear: LogLevel.None,
	constructor: LogLevel.None,
	driver_update_event: LogLevel.None,
	init: LogLevel.Debug,
	notify_hydrate: LogLevel.None,
	register_hydrate_callback: LogLevel.None,
	store: LogLevel.Debug,
};

export type QuantumCoreLogMap = LogMapping<keyof typeof defaultQuantumCoreLogLevels>;
