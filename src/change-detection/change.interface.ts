import {Observable} from "rxjs";

export interface IChange<T> {
    onChanged: Observable<T|T[]>;
    onReset: Observable<{persisted:boolean}>;
    lastUpdated: Date;

    getChanges(): Map<string, T>;
    persistChanges(): void;
    resetChanges(): void;
}
