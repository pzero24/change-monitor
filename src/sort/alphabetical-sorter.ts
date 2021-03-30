import {ISorter} from "./sorter.interface";
import {IIdentifier} from "../change-detection/identifier.interface";

export class AlphabeticalSorter<T extends IIdentifier> implements ISorter<T> {
    sort(items: T[]) {
        items.sort((a, b) => {
            return a.getId().localeCompare(b.getId());
        });
    }
}
