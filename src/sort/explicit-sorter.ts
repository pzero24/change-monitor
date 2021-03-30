import {ISorter} from "./sorter.interface";
import {IIdentifier} from "../change-detection/identifier.interface";

export class ExplicitSorter<T extends IIdentifier> implements ISorter<T> {
    private _order = new Map<string, string>();

    constructor(order: string[]) {
        let i = 0;
        for (const item of order) {
            this._order.set(item, (i++).toString());
        }
    }

    sort(items: T[]): void {
        items.sort((a, b) => {
            const aOrder = this._order.get(a.getId()) || '9999999';
            const bOrder = this._order.get(b.getId()) || '9999999';
            return aOrder.localeCompare(bOrder);
        });
    }
}
