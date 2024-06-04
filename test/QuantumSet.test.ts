import 'mocha';
import * as chai from 'chai';
import * as zod from 'zod';
import {IPersistSerializer, MemoryStorageDriver} from 'tachyon-drive';
import chaiAsPromised from 'chai-as-promised';
import {QuantumSet} from '../src/QuantumSet';

chai.use(chaiAsPromised);

const expect = chai.expect;

const dataSchema = zod.object({
	date: zod.coerce.date(),
});

const setDataSchema = zod.set(dataSchema);

type Data = zod.infer<typeof dataSchema>;

const bufferSerializer: IPersistSerializer<Set<Data>, Buffer> = {
	name: 'BufferSerializer',
	serialize: (data: Set<Data>) => Buffer.from(JSON.stringify(Array.from(data))),
	deserialize: (buffer: Buffer) => new Set(zod.array(dataSchema).parse(JSON.parse(buffer.toString()))),
	validator: (data: Set<Data>) => setDataSchema.safeParse(data).success,
};

const driver = new MemoryStorageDriver('MemoryStorageDriver', bufferSerializer, null);

let set: QuantumSet<Data>;

const data: Data = {date: new Date(1677844069703)};

describe('QuantumSet', () => {
	it('should create a new instance', async () => {
		set = new QuantumSet<Data>(driver);
		await set.init();
	});
	it('should add a value', async () => {
		await set.add(data);
	});
	it('should have a value', async () => {
		set = new QuantumSet<Data>(driver); // we should hydrate the set from the driver
		// lookup rehydrated value by date
		const hydratedValue = Array.from(await set.values()).find((value) => value.date.getTime() === data.date.getTime());
		expect(hydratedValue).to.deep.equal(data);
		if (!hydratedValue) {
			throw new Error('Value not found');
		}
		await expect(set.has(hydratedValue)).to.be.eventually.eq(true);
		await expect(set.size()).to.be.eventually.equal(1);
		expect(Array.from(await set.values())).to.be.deep.equal([data]);
	});
	it('should delete a value', async () => {
		const restoreData = Array.from(await set.values())[0];
		await set.delete([restoreData]);
		await expect(set.size()).to.be.eventually.equal(0);
	});
	it('should clear values', async () => {
		await set.add(data);
		await set.clear();
		await expect(set.size()).to.be.eventually.equal(0);
	});
});
