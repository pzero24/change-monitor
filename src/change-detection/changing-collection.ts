import {IChange} from "./change.interface";
import {Subject, Subscription} from "rxjs";
import {IIdentifier} from "./identifier.interface";
import {ISorter} from "../sort/sorter.interface";
import {AlphabeticalSorter} from "../sort/alphabetical-sorter";
import {Collection} from "./collection";

export class ChangingCollection<T extends IChange<any> & IIdentifier> extends Collection<T> implements IChange<T> {
    protected _changes = new Map<string, T>();
    onChanged = new Subject<T|T[]>();
    onReset = new Subject<{ persisted: boolean }>();
    lastUpdated = new Date();

    protected _sorter: ISorter<T> = new AlphabeticalSorter<T>();

    private _subscriptions = new Map<T, Subscription[]>();

    get length() {
        return this._items.length;
    }

    constructor() {
        super();
        const proxy = new Proxy(this, {
            get: ((target, property: any) => {
                if (typeof property === 'symbol') {
                    return Reflect.get(target, property);
                }

                if (!isNaN(property)) {
                    return this._items[property];
                }

                return Reflect.get(target, property);
            })
        });

        return proxy;
    }

    protected _removeSubscriptions(item: T) {
        for (const subscription of this._subscriptions.get(item)) {
            subscription.unsubscribe();
        }
        this._subscriptions.delete(item);
    }

    private _onChangedTimeout;
    private _itemsChanged = new Map<any, boolean>();

    private _callOnChanged(items: any) {
        if (this._onChangedTimeout !== undefined) {
            clearTimeout(this._onChangedTimeout);
        }

        if (!(items instanceof Array)) {
            items = [items];
        }

        for (const item of items) {
            this._itemsChanged.set(item, true);
        }

        this.lastUpdated = new Date();
        this._onChangedTimeout = setTimeout(() => {
            this.onChanged.next(Array.from(this._itemsChanged.keys()));
            this._itemsChanged.clear();
        }, 0);
    }

    private _onResetTimeout;
    private _callOnReset(response: {persisted: boolean}) {
        if (this._onResetTimeout !== undefined) {
            clearTimeout(this._onResetTimeout);
        }

        this.lastUpdated = new Date();
        this._onResetTimeout = setTimeout(() => {
            this.onReset.next(response);

        }, 0);
    }

    withSort(sorter: ISorter<T>): this {
        this._sorter = sorter;
        return this;
    }

    addItems(items: T[]) {
        let itemsSkipped = 0;
        for (const item of items) {
            if (this.getItem(item.getId())) {
                console.warn("Attempted to add an existing item:%o to the collection %o", item, this);
                itemsSkipped++;
                continue;
            }

            const subscriptions: Subscription[] = [];
            subscriptions.push(item.onChanged.subscribe(() => {
                this._changes.delete(item.getId());

                if (item.getChanges().size > 0) {
                    this._changes.set(item.getId(), item);
                } else {
                    this.onReset.next({persisted: false});
                }

                this._callOnChanged(item);
            }));

            subscriptions.push(item.onReset.subscribe((response) => {
                if (this._changes.delete(item.getId())) {
                    this._callOnChanged(item);
                    if (this._changes.size === 0) {
                        this._callOnReset(response);
                    }
                }
            }));

            this._subscriptions.set(item, subscriptions);
        }

        super.addItems(items);

        if (itemsSkipped < items.length) {
            this.lastUpdated = new Date();
            this.onChanged.next(items);
        }

        return true;
    }

    deleteItems(itemIds: string[]) {
        const items = [];
        for (const itemId of itemIds) {
            const item = this.getItem(itemId);
            items.push(item);

            if (item !== undefined) {
                this._removeSubscriptions(item);

                this._changes.delete(item.getId());
            }
        }

        super.deleteItems(itemIds);

        this.lastUpdated = new Date();
        this.onChanged.next(items);
        if (this._changes.size === 0) {
            this.onReset.next({persisted: false});
        }
    }

    getChanges(): Map<string, T> {
        return new Map(this._changes);
    }

    persistChanges(): void {
        for (let itemIndex = 0; itemIndex < this._items.length; itemIndex++) {
            this._items[itemIndex].persistChanges();
        }
    }

    resetChanges(): void {
        for (let itemIndex = 0; itemIndex < this._items.length; itemIndex++) {
            this._items[itemIndex].resetChanges();
        }
    }

    toArray(): T[] {
        return Array.from(this._items);
    }
}
