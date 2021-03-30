import {IChange} from "./change.interface";
import {Subject} from "rxjs/internal/Subject";

export class ChangeMonitor implements IChange<any> {
    onChanged = new Subject<string>();
    onReset = new Subject<{persisted:boolean}>();
    lastUpdated = new Date();

    private readonly _proxy: any;
    get proxy() {
        return this._proxy;
    }

    private readonly watchedObject: any;
    private originalValues: Map<string, any> = new Map();
    private changedValues: Map<string, any> = new Map();

    constructor(private objToWatch: any, fieldsToWatch: string[]) {
        for (const field of fieldsToWatch) {
            this.originalValues.set(field, objToWatch[field]);
        }

        this.onChanged.subscribe(() => {
            this.lastUpdated = new Date();
        });

        this.onReset.subscribe(() => {
            this.lastUpdated = new Date();
        });

        this.watchedObject = objToWatch;
        this._proxy = new Proxy(objToWatch, {
            set: (obj: any, property: string, value: any) => {
                Reflect.set(obj, property, value);
                const originalValue = this.originalValues.get(property);
                const changedValue = this.changedValues.get(property);

                if (this.changedValues.has(property) && value === originalValue) {
                    this.changedValues.delete(property);
                    this.onChanged.next(property);
                    if (this.changedValues.size === 0) {
                        this.onReset.next({persisted: false})
                    }
                } else if (this.originalValues.has(property) && this.getValueCompare(originalValue) !== this.getValueCompare(value) && (!this.changedValues.has(property) || changedValue !== value)) {
                    this.changedValues.set(property, value);
                    this.onChanged.next(property)
                }

                return true;
            }
        });
    }

    private getValueCompare(value: any) {
        if (value instanceof Date) {
            return value.getTime();
        } else {
            return value;
        }
    }

    getOriginalValue(field: string) {
        if (this.originalValues.has(field)) {
            return this.originalValues.get(field);
        }
    }

    setOriginalValue(field: string, value: any) {
        if (this.originalValues.has(field)) {
            if (this.watchedObject[field] === this.originalValues.get(field)) {
                this.watchedObject[field] = value;
            } else if (this.changedValues.has(field) && this.changedValues.get(field) === value) {
                this.changedValues.delete(field);
                this.onChanged.next(field);
                if (this.changedValues.size === 0) {
                    this.onReset.next({persisted: false});
                }
            }

            this.originalValues.set(field, value);
        }
    }

    getChanges(): Map<string, any> {
        return new Map(this.changedValues);
    }

    persistChanges(): void {
        this.changedValues.forEach((value, key) => {
            this.originalValues.set(key, value);
        });

        this.changedValues.clear();

        this.onReset.next({persisted: true});
    }

    resetChanges(): void {
        this.originalValues.forEach((value, key) => {
            this.watchedObject[key] = value;
        });

        this.changedValues.clear();

        this.onReset.next({persisted: false});
    }

}
