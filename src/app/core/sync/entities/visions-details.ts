import { VisionDetailsModel } from "../../models/local/vision-details.model";
import {v4 as uuidv4} from 'uuid';

export interface IEquipDetails {
  id: number; //auto incremented id
  inspectionId: number;
}

export class EquipDetails implements IEquipDetails {
  id: number; //auto incremented id
  inspectionId: number;
  fieldName: string | null;
  currVal: string | null;
  updatedVal: string | null;
  fieldType: string | null;
  section: string | null;
  units: string | null;
  options: string | null;
  jsonValue: string | null;
  isChanged: string | null = "N";

  /**
   * 
   * @param vision 
   */
  init(vision: VisionDetailsModel): void {
    try {
      this.fieldName = vision.DisplayName;
      this.currVal = vision.Value;
      this.updatedVal = vision.NewValue;
      this.fieldType = vision.Type;
      this.units = vision.Unit;
      this.options = JSON.stringify(vision.Options);
      this.jsonValue = JSON.stringify(vision);
      this.isChanged = "N";
      this.section = vision.Section;
    } catch (e) {
      console.log(e);
    }
  }

  public static fromVision(vision: VisionDetailsModel) : EquipDetails  {
    const equipDetails : EquipDetails = new EquipDetails();
    equipDetails.init(vision);
    equipDetails.id = uuidv4();
    return equipDetails;
  }
}