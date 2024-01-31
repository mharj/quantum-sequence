import 'mocha';
import * as chai from 'chai';
import * as zod from 'zod';
import {IPersistSerializer, MemoryStorageDriver} from 'tachyon-drive';
import chaiAsPromised from 'chai-as-promised';
import {QuantumKeySet} from '../src/QuantumKeySet';

chai.use(chaiAsPromised);

const expect = chai.expect;

const dataSchema = zod.object({
	date: zod.coerce.date(),
});

const setDataSchema = zod.set(dataSchema);

type Data = zod.infer<typeof dataSchema>;

const bufferSerializer: IPersistSerializer<Set<Data>, Buffer> = {
	serialize: (data: Set<Data>) => Buffer.from(JSON.stringify(Array.from(data))),
	deserialize: (buffer: Buffer) => new Set(zod.array(dataSchema).parse(JSON.parse(buffer.toString()))),
	validator: (data: Set<Data>) => setDataSchema.safeParse(data).success,
};

const driver = new MemoryStorageDriver('MemoryStorageDriver', bufferSerializer, null);

let set: QuantumKeySet<Data, 'date'>;

const ts = 1677844069703;

describe('QuantumKeySet', () => {
	it('should create a new instance', async () => {
		set = new QuantumKeySet<Data, 'date'>('date', (value) => value.getTime(), driver);
		await set.init();
	});
	it('should set a value', async () => {
		await set.set(new Date(ts), {date: new Date(ts)});
	});
	it('should get a value', async () => {
		set = new QuantumKeySet<Data, 'date'>('date', (value) => value.getTime(), driver); // we should hydrate the set from the driver
		const value = await set.get(new Date(ts));
		expect(value).to.deep.equal({date: new Date(ts)});
		await expect(set.size()).to.be.eventually.equal(1);
		expect(Array.from(await set.values())).to.be.deep.equal([{date: new Date(ts)}]);
	});
	it('should have a value', async () => {
		await expect(set.has(new Date(ts))).to.be.eventually.equal(true);
	});
	it('should get all iterator values', async () => {
		expect(Array.from(await set.entries())).to.be.deep.equal([[new Date(ts), {date: new Date(ts)}]]);
		expect(Array.from(await set.keys())).to.be.deep.equal([new Date(ts)]);
		expect(Array.from(await set.values())).to.be.deep.equal([{date: new Date(ts)}]);
	});
	it('should delete a value', async () => {
		await set.delete([new Date(ts), new Date(ts)]);
		const value = await set.get(new Date(ts));
		expect(value).to.be.equal(undefined);
		await expect(set.size()).to.be.eventually.equal(0);
	});
	it('should clear values', async () => {
		await set.set(new Date(ts), {date: new Date(ts)});
		await set.clear();
		await expect(set.size()).to.be.eventually.equal(0);
	});
});
