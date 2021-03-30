import {IIdentifier} from "./identifier.interface";
import {ISorter} from "../sort/sorter.interface";
import {AlphabeticalSorter} from "../sort/alphabetical-sorter";

class ItemIterator<T> implements Iterator<T> {
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

export class Collection<T extends IIdentifier> {
    protected _items: T[] = [];
    protected _indexMap = new Map<string, T>();

    protected _sorter: ISorter<T> = new AlphabeticalSorter<T>();

    [Symbol.iterator](): Iterator<T> {
        return new ItemIterator<T>(this._items);
    }

    get length() {
        return this._items.length;
    }

    withSort(sorter: ISorter<T>): this {
        this._sorter = sorter;
        return this;
    }

    addItem(item: T): boolean {
        return this.addItems([item]);
    }

    addItems(items: T[]): boolean {
        let itemsSkipped = 0;
        for (const item of items) {
            if (this.getItem(item.getId())) {
                itemsSkipped++;
                continue;
            }

            this._items.push(item);
            this._indexMap.set(item.getId(), item);
        }

        if (itemsSkipped < items.length) {
            this._sorter.sort(this._items);
            return true;
        } else {
            return false
        }
    }

    deleteItem(id: string) {
        this.deleteItems([id]);
    }

    deleteItems(ids: string[]) {
        const itemMap = new Map<T, boolean>();

        for (const id of ids) {
            const item = this.getItem(id);
            if (item !== undefined) {
                itemMap.set(item, true);
                this._indexMap.delete(id);
            }
        }

        this._items = this._items.filter(item => {
            return !itemMap.has(item);
        });
    }

    getItem(id: string) {
        return this._indexMap.get(id);
    }
}
