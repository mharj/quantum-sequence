import * as zod from 'zod';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import type {ILoggerLike} from '@avanio/logger-like';
import 'mocha';
import {MemoryStorageDriver, IPersistSerializer} from 'tachyon-drive';
import {QuantumMap} from '../src/QuantumMap';
import * as sinon from 'sinon';

chai.use(chaiAsPromised);

const expect = chai.expect;

const dataSchema = zod.object({
	test: zod.string(),
});

const mapDataSchema = zod.map(zod.string(), dataSchema);

type Data = zod.infer<typeof dataSchema>;

const bufferSerializer: IPersistSerializer<Map<string, Data>, Buffer> = {
	serialize: (data: Map<string, Data>) => Buffer.from(JSON.stringify(Array.from(data))),
	deserialize: (buffer: Buffer) => new Map(JSON.parse(buffer.toString())),
	validator: (data: Map<string, Data>) => mapDataSchema.safeParse(data).success,
};

const debugSpy = sinon.spy();
const errorSpy = sinon.spy();
const warnSpy = sinon.spy();
const infoSpy = sinon.spy();

const spyLogger: ILoggerLike = {
	debug: debugSpy,
	error: errorSpy,
	warn: warnSpy,
	info: infoSpy,
};

const driver = new MemoryStorageDriver('MemoryStorageDriver', bufferSerializer, null, undefined, spyLogger);

let map: QuantumMap<string, Data>;

describe('QuantumMap', () => {
	beforeEach(() => {
		debugSpy.resetHistory();
		errorSpy.resetHistory();
		warnSpy.resetHistory();
		infoSpy.resetHistory();
	});
	it('should create a new instance', async () => {
		map = new QuantumMap<string, Data>(driver, undefined, spyLogger);
		await map.init();
		expect(debugSpy.callCount).to.be.equal(4);
		expect(debugSpy.getCall(0).firstArg).to.be.equal('QuantumCore: constructor()');
		expect(debugSpy.getCall(1).firstArg).to.be.equal('QuantumCore: coreInit()');
		expect(debugSpy.getCall(2).firstArg).to.be.equal('MemoryStorageDriver: init()');
		expect(debugSpy.getCall(3).firstArg).to.be.equal('MemoryStorageDriver: hydrate()');
	});
	it('should set a value', async () => {
		await map.set('key1', {test: 'test'});
	});
	it('should get a value', async () => {
		map = new QuantumMap<string, Data>(driver); // we should hydrate the map from the driver
		const value = await map.get('key1');
		expect(value).to.deep.equal({test: 'test'});
		await expect(map.size()).to.be.eventually.equal(1);
	});
	it('should get all iterator values', async () => {
		expect(Array.from(await map.entries())).to.be.deep.equal([['key1', {test: 'test'}]]);
		expect(Array.from(await map.keys())).to.be.deep.equal(['key1']);
		expect(Array.from(await map.values())).to.be.deep.equal([{test: 'test'}]);
	});
	it('should delete a value', async () => {
		await map.delete(['key1', 'key2']);
		const value = await map.get('key1');
		expect(value).to.be.equal(undefined);
		await expect(map.size()).to.be.eventually.equal(0);
	});
	it('should clear values', async () => {
		await map.set('key1', {test: 'test'});
		await map.clear();
		await expect(map.size()).to.be.eventually.equal(0);
	});
});
