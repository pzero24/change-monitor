import {IIdentifier} from "../identifier.interface";

export interface ISorter<T extends IIdentifier> {
    sort(items: T[]): void;
}
