export class CollectionIterator<T> implements Iterator<T> {
    private readonly _items: T[];
    private _index = 0;
    constructor(items: T[]) {
        this._items = [].concat(items);
    }

    next() {
        return {
            value: this._items[this._index++],
            done: this._index > this._items.length
        }
    }
}