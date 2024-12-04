
// noinspection JSUnusedGlobalSymbols

export function computeIfAbsent<K, V>(map: Map<K, V>, key: K, mappingFunction: (key: K) => V): V {
    let value = map.get(key);
    if (value === undefined) {
        value = mappingFunction(key);
        map.set(key, value);
    }
    return value;
}

export function getOrDefault<K, V>(map: Map<K, V>, key: K, defaultValue: V): V {
    const value = map.get(key);
    if (value === undefined) {
        return defaultValue;
    }
    return value;
}

export class Table<TopKeyT, InnerKeyT, ValueT> {
    private readonly map = new Map<TopKeyT, Map<InnerKeyT, ValueT>>();

    clear() {
        this.map.clear();
    }

    clearInner(topKey: TopKeyT) {
        this.map.get(topKey)?.clear();
    }

    delete(topKey: TopKeyT, innerKey: InnerKeyT): boolean {
        return this.map.get(topKey)?.delete(innerKey) ?? false;
    }

    deleteInner(topKey: TopKeyT): boolean {
        return this.map.delete(topKey);
    }

    forEach(callbackfn: (value: ValueT, innerKey: InnerKeyT, topKey: TopKeyT, map: Table<TopKeyT, InnerKeyT, ValueT>) => void, thisArg?: unknown) {
        this.map.forEach((innerMap, topKey) => {
            innerMap.forEach((value, innerKey) => {
                callbackfn.call(thisArg, value, innerKey, topKey, this);
            });
        });
    }

    forEachInner(topKey: TopKeyT, callbackfn: (value: ValueT, innerKey: InnerKeyT, topKey: TopKeyT, map: Table<TopKeyT, InnerKeyT, ValueT>) => void, thisArg?: unknown) {
        this.map.get(topKey)?.forEach((value, innerKey) => {
            callbackfn.call(thisArg, value, innerKey, topKey, this);
        });
    }

    get(topKey: TopKeyT, innerKey: InnerKeyT): ValueT | undefined {
        return this.map.get(topKey)?.get(innerKey);
    }

    getInner(topKey: TopKeyT): Map<InnerKeyT, ValueT> | undefined {
        return this.map.get(topKey);
    }

    has(topKey: TopKeyT, innerKey: InnerKeyT): boolean {
        return this.map.get(topKey)?.has(innerKey) ?? false;
    }

    hasInner(topKey: TopKeyT): boolean {
        return this.map.has(topKey);
    }

    set(topKey: TopKeyT, innerKey: InnerKeyT, value: ValueT): Table<TopKeyT, InnerKeyT, ValueT> {
        computeIfAbsent(this.map, topKey, () => new Map())
            .set(innerKey, value);
        return this;
    }

    setInner(topKey: TopKeyT, innerMap: Map<InnerKeyT, ValueT>): void {
        this.map.set(topKey, innerMap);
    }

    get size() {
        return this.map.size;
    }

    sizeInner(topKey: TopKeyT) {
        return this.map.get(topKey)?.size ?? 0;
    }

    keys(): IterableIterator<TopKeyT> {
        return this.map.keys();
    }

    keysInner(topKey: TopKeyT): IterableIterator<InnerKeyT> {
        return this.map.get(topKey)?.keys() ?? [].values();
    }

    values(): IterableIterator<Map<InnerKeyT, ValueT>> {
        return this.map.values();
    }

    valuesInner(topKey: TopKeyT): IterableIterator<ValueT> {
        return this.map.get(topKey)?.values() ?? [].values();
    }

    entries(): IterableIterator<[TopKeyT, Map<InnerKeyT, ValueT>]> {
        return this.map.entries();
    }

    entriesInner(topKey: TopKeyT): IterableIterator<[InnerKeyT, ValueT]> {
        return this.map.get(topKey)?.entries() ?? [].values();
    }
}

export class MultiValueArrayMap<KeyT, ValueT> {

    private readonly map = new Map<KeyT, ValueT[]>();

    constructor(entries?: readonly (readonly [KeyT, ValueT])[] | null) {
        if (entries?.length) {
            for (const [key, value] of entries) {
                this.push(key, value);
            }
        }
    }

    clear() {
        this.map.clear();
    }

    clearValues(key: KeyT): boolean {
        return this.map.delete(key);
    }

    delete(key: KeyT, value: ValueT): boolean {
        const values = this.map.get(key);
        if (values) {
            const index = values.indexOf(value);
            if (index >= 0) {
                values.splice(index, 1);
                if (values.length === 0) {
                    this.map.delete(key);
                }
                return true;
            }
        }
        return false;
    }

    forEach(callbackfn: (values: ValueT[], key: KeyT, map: MultiValueArrayMap<KeyT, ValueT>) => void, thisArg?: unknown) {
        this.map.forEach((values, key) => {
            callbackfn.call(thisArg, values, key, this);
        }, thisArg)
    }

    forEachValue(callbackfn: (value: ValueT, key: KeyT, map: MultiValueArrayMap<KeyT, ValueT>) => void, thisArg?: unknown) {
        this.map.forEach((values, key) => {
            values.forEach(value => {
                callbackfn.call(thisArg, value, key, this);
            });
        });
    }

    get(key: KeyT): ValueT[] | undefined {
        return this.map.get(key);
    }

    initIfAbsent(key: KeyT): ValueT[] {
        return computeIfAbsent(this.map, key, () => []);
    }

    computeIfAbsent(key: KeyT, mappingFunction: (key: KeyT) => ValueT[]): ValueT[] {
        return computeIfAbsent(this.map, key, mappingFunction);
    }

    has(key: KeyT): boolean {
        return this.map.has(key);
    }

    hasValue(key: KeyT, value: ValueT): boolean {
        return this.map.get(key)?.includes(value) ?? false;
    }

    set(key: KeyT, values: ValueT[]): MultiValueArrayMap<KeyT, ValueT> {
        this.map.set(key, values);
        return this;
    }

    add(key: KeyT, value: ValueT): MultiValueArrayMap<KeyT, ValueT> {
        return this.push(key, value);
    }

    push(key: KeyT, value: ValueT): MultiValueArrayMap<KeyT, ValueT> {
        computeIfAbsent(this.map, key, () => []).push(value);
        return this;
    }

    get size() {
        return this.map.size;
    }

    valuesSize(key: KeyT) {
        return this.map.get(key)?.length ?? 0;
    }

    keys(): IterableIterator<KeyT> {
        return this.map.keys();
    }

    values(): IterableIterator<ValueT[]> {
        return this.map.values();
    }

    flattenValues(): ValueT[] {
        return Array.from(this.map.values()).flat();
    }

    entries(): IterableIterator<[KeyT, ValueT[]]> {
        return this.map.entries();
    }
}

export class MultiValueSetMap<KeyT, ValueT> {

    private readonly map = new Map<KeyT, Set<ValueT>>();

    constructor(entries?: readonly (readonly [KeyT, ValueT])[] | null) {
        if (entries?.length) {
            for (const [key, value] of entries) {
                this.push(key, value);
            }
        }
    }

    clear() {
        this.map.clear();
    }

    clearValues(key: KeyT): boolean {
        return this.map.delete(key);
    }

    delete(key: KeyT, value: ValueT): boolean {
        const values = this.map.get(key);
        if (values) {
            const deleted = values.delete(value);
            if (values.size === 0) {
                this.map.delete(key);
            }
            return deleted;
        }
        return false;
    }

    forEach(callbackfn: (values: Set<ValueT>, key: KeyT, map: MultiValueSetMap<KeyT, ValueT>) => void, thisArg?: unknown) {
        this.map.forEach((values, key) => {
            callbackfn.call(thisArg, values, key, this);
        }, thisArg)
    }

    forEachValue(callbackfn: (value: ValueT, key: KeyT, map: MultiValueSetMap<KeyT, ValueT>) => void, thisArg?: unknown) {
        this.map.forEach((values, key) => {
            values.forEach(value => {
                callbackfn.call(thisArg, value, key, this);
            });
        });
    }

    get(key: KeyT): Set<ValueT> | undefined {
        return this.map.get(key);
    }

    initIfAbsent(key: KeyT): Set<ValueT> {
        return computeIfAbsent(this.map, key, () => new Set());
    }

    computeIfAbsent(key: KeyT, mappingFunction: (key: KeyT) => Set<ValueT>): Set<ValueT> {
        return computeIfAbsent(this.map, key, mappingFunction);
    }

    has(key: KeyT): boolean {
        return this.map.has(key);
    }

    hasValue(key: KeyT, value: ValueT): boolean {
        return this.map.get(key)?.has(value) ?? false;
    }

    set(key: KeyT, values: Set<ValueT>): MultiValueSetMap<KeyT, ValueT> {
        this.map.set(key, values);
        return this;
    }

    add(key: KeyT, value: ValueT): MultiValueSetMap<KeyT, ValueT> {
        return this.push(key, value);
    }

    push(key: KeyT, value: ValueT): MultiValueSetMap<KeyT, ValueT> {
        computeIfAbsent(this.map, key, () => new Set()).add(value);
        return this;
    }

    get size() {
        return this.map.size;
    }

    valuesSize(key: KeyT) {
        return this.map.get(key)?.size ?? 0;
    }

    keys(): IterableIterator<KeyT> {
        return this.map.keys();
    }

    values(): IterableIterator<Set<ValueT>> {
        return this.map.values();
    }

    flattenValues(): Set<ValueT> {
        const result = new Set<ValueT>();
        this.map.forEach(values => values.forEach(value => result.add(value)));
        return result;
    }

    entries(): IterableIterator<[KeyT, Set<ValueT>]> {
        return this.map.entries();
    }
}