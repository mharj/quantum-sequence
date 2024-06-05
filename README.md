# quantum-sequence

**_quantum-sequence_** is a package that provides Map and Set implementations which use tachyon-drive drivers as a storage backend. This allows for fast and efficient storage and retrieval of key-value pairs and sets of data.

## Map and Set implementations which uses tachyon-drive drivers as storage backend

## Installation

To install quantum-sequence, run:

```bash
npm install quantum-sequence
```

## Usage

To use quantum-sequence, you can create a new QuantumMap, QuantumKeySet or QuantumSet instance with a tachyon-drive storage driver, and then use the provided methods to interact with the data.

```typescript
import {QuantumMap} from 'quantum-sequence';

// Create a new TachyonDrive instance and serializer setup
const mapDataSchema = zod.map(zod.string(), zod.number());
const bufferSerializer: IPersistSerializer<Map<string, Data>, Buffer> = {
	serialize: (data: Map<string, number>) => Buffer.from(JSON.stringify(Array.from(data))),
	deserialize: (buffer: Buffer) => new Map(JSON.parse(buffer.toString())),
	validator: (data: Map<string, number>) => mapDataSchema.safeParse(data).success,
};
const driver = new MemoryStorageDriver('QuantumMapDriver', bufferSerializer, null); // MemoryStorageDriver as example driver

// Create a new QuantumMap instance with a tachyon-drive storage driver
// ⚠️Warning⚠️: if using non-primitive types as keys, you must get actual value first from keys() method before call "delete" or "has" methods as hydrate will replace the object reference (manually or via updates) and the reference will be lost.
const map = new QuantumMap<string, number>(driver);

await map.init(); // hydrates last data from store

// Set a key-value pair in the map
await map.set('foo', 42);

// Get the value for a key
await map.get('foo'); // 42

// Check if a key exists in the map
await map.has('foo'); // true

// Delete a key-value pair from the map
await map.delete('foo');

// Get the size of the map
await map.size(); // 0
```

```typescript
import {QuantumKeySet} from 'quantum-sequence';

// Create a new TachyonDrive instance and serializer setup
const setDataSchema = zod.set(zod.object({key: zod.string(), value: zod.string()}));
const bufferSerializer: IPersistSerializer<Set<Data>, Buffer> = {
	serialize: (data: Set<Data>) => Buffer.from(JSON.stringify(Array.from(data))),
	deserialize: (buffer: Buffer) => new Set(zod.array(dataSchema).parse(JSON.parse(buffer.toString()))),
	validator: (data: Set<Data>) => setDataSchema.safeParse(data).success,
};
const driver = new MemoryStorageDriver('QuantumKeySet', bufferSerializer, null); // MemoryStorageDriver as example driver

// Create a new QuantumKeySet instance with a tachyon-drive storage driver
type Data = {key: string; value: string};
const set = new QuantumKeySet<Data, 'key'>('key', driver);

await set.init(); // hydrates last data from store

// Add a new item to the set
await set.set('foo', {key: 'foo', value: 'bar'});

// Get an item from the set
await set.get('foo'); // {key: 'foo', value: 'bar'}

// Delete an item from the set
await set.delete('foo');

// Get the size of the set
await set.size(); // 0
```

```typescript
import {QuantumSet} from 'quantum-sequence';

// Create a new TachyonDrive instance and serializer setup
const setDataSchema = zod.set(zod.string());
const bufferSerializer: IPersistSerializer<Set<Data>, Buffer> = {
	name: 'BufferSerializer',
	serialize: (data: Set<Data>) => Buffer.from(JSON.stringify(Array.from(data))),
	deserialize: (buffer: Buffer) => new Set(zod.array(dataSchema).parse(JSON.parse(buffer.toString()))),
	validator: (data: Set<Data>) => setDataSchema.safeParse(data).success,
};
const driver = new MemoryStorageDriver('QuantumSetDriver', bufferSerializer, null); // MemoryStorageDriver as example driver

// Create a new QuantumSet instance with a tachyon-drive storage driver
// ⚠️Warning⚠️: if using non-primitive types, you must get actual value first from values() method before call "delete" or "has" methods as hydrate will replace the object reference (manually or via updates) and the reference will be lost.
const set = new QuantumSet<string>(driver);

await set.init(); // hydrates last data from store

// Add a new item to the set
await set.add('foo');

// Check if an item exists in the set
await set.has('foo'); // true

// Delete an item from the set
await set.delete('foo');

// Get the size of the set
await set.size(); // 0
```
