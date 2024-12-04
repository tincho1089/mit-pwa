export interface IActions {
    ai_id: number; //auto generated id
    inspectionId: number;
}

export class Actions implements IActions {
    ai_id: number;
    id: number | null;
    inspectionId: number;
    questionId: string | null = "";
    createdBy: string | null = "";
    createdOn: string | null = "";
    followupWOCode: string | null = "";

    constructor(
        ai_id: number,
        id: number | null, 
        inspectionId: number, 
        questionId: string | null, 
        createdBy: string | null, 
        createdOn: string | null, 
        followupWOCode: string | null
    )
    {
        this.ai_id = ai_id;
        this.id = id;
        this.inspectionId = inspectionId;
        this.questionId = questionId;
        this.createdBy = createdBy;
        this.createdOn = createdOn;
        this.followupWOCode = followupWOCode;
    }

    // static async putActions(actions: Array<ActionsModel>): Promise<void> {
    //     return new Promise<void>(async (resolve, reject) => {
    //         try {
    //             let actionRecords = actions.map(
    //                 (actionResponseRecord: ActionsModel) => {
    //                     let actions = new Actions();
    //                     actions.init(actionResponseRecord);
    //                     return actions;
    //                 }
    //             );
    //             if (actionRecords && actionRecords.length > 0) {
    //                 for (let i = 0; i < actionRecords.length;) {
    //                     let batch: Actions[] = [];
    //                     let size = 25;
    //                     if (i + size > actionRecords.length) {
    //                         batch = actionRecords.slice(i, actionRecords.length);
    //                         i = actionRecords.length;
    //                     } else {
    //                         batch = actionRecords.slice(i, i + size);
    //                         i = i + size;
    //                     }
    //                     await Actions.save(batch);
    //                 }
    //                 resolve();
    //             }
    //         } catch (e) {
    //             reject("PA>>"+e);
    //             console.log(e);
    //         }
    //     });
    // }

}