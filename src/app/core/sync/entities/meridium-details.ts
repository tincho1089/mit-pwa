import { Fields } from '../models/fields.model'
import * as dayjs from 'dayjs';

export interface IMeridiumDetails {
  id: number; //auto generated id
  inspectionId: number;
  dateInserted: string;
}

export class MeridiumDetails implements IMeridiumDetails {
  id: number;
  inspectionId: number;
  equipmentData: EquipmentData;
  dateInserted: string;

  /**
   * 
   * @param json 
   */
  init(json: any): void {
    try {
      const eqDetails = JSON.parse(json.EquipmentDetails);
      const equipmentData = new EquipmentData(
        eqDetails["EquipmentDetail"],
        eqDetails["BasicInformation"],
        eqDetails["DamageMechanism"]
      );
      this.inspectionId = +json.ID;
      this.equipmentData = equipmentData;
      this.dateInserted = dayjs().format("YYYY-MM-DDTHH:mm:ss");
    } catch (e) {
      console.log(e);
    }
  }

}

class EquipmentData {
    constructor(
      public EquipmentDetail: Array<Fields>,
      public BasicInformation: Array<Fields>,
      public DamageMechanism: Array<Array<Fields>>
    ) {}
}