import {IIdentifier} from "../change-detection/identifier.interface";

export interface ISorter<T extends IIdentifier> {
    sort(items: T[]): void;
}
