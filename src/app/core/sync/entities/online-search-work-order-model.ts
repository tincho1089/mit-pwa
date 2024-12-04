import { WorkOrderList } from "./work-order-list";
import * as _ from "lodash-es";

export class OnlineSearchWorkOrderModel extends WorkOrderList {
    isDownloaded: boolean = false;
    isSelected:boolean = false;

    static create(source: WorkOrderList) : OnlineSearchWorkOrderModel {
        let onlineSearchWorkOrderModel = new OnlineSearchWorkOrderModel();
        _.assign(onlineSearchWorkOrderModel, source);
        return onlineSearchWorkOrderModel;

    }

    static createArray(source: WorkOrderList[]) : OnlineSearchWorkOrderModel[] {
        let result: OnlineSearchWorkOrderModel[] = source.map((x: WorkOrderList) => OnlineSearchWorkOrderModel.create(x));
        return result;
    }

    static checkDownloadableSearchResults(source: OnlineSearchWorkOrderModel[]) : boolean {
        let result: boolean = source.filter(x => !x.isDownloaded).length > 0;
        return result;
    }
}