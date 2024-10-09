export interface IQuantumSequence {
	init(): Promise<void>;
	clear(): Promise<void>;
	size(): Promise<number>;
}
