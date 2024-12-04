import { TmlReading } from '../models/tmlReading.model';

export interface IVisionsTML {
  inspectionId: number;
  inspectorName: string;
  isTMLGPSenabled: boolean;
  equipmentNumber: string;
  plantId: string;
  equipmentType: string;
  siteName: string;
  tmlReadings: Array<TmlReading>;
  newTMLs: string;
  tmlConfig: string;
  isChanged: string;
}

export class VisionsTML implements IVisionsTML {
  inspectionId: number;
  inspectorName: string;
  isTMLGPSenabled: boolean;
  equipmentNumber: string;
  plantId: string;
  equipmentType: string;
  siteName: string;
  tmlReadings: Array<TmlReading> = [];
  newTMLs: string;
  tmlConfig: string;
  isChanged: string;

  /**
   * 
   * @param json 
   */
  init(json: any): void {
    try {
      const tmlPoints = JSON.parse(json.TMLPoints);
      let valid =
        tmlPoints && tmlPoints["EquipData"] && tmlPoints["EquipData"][0]
          ? true
          : false;
      this.inspectionId = +json.ID;
      this.inspectorName = tmlPoints["InspectorName"]
        ? tmlPoints["InspectorName"]
        : "";
      this.equipmentNumber = valid
        ? tmlPoints["EquipData"][0]["Equipment Number"]
        : "";
      this.plantId = valid ? tmlPoints["EquipData"][0]["Plant ID"] : "";
      this.equipmentType = valid
        ? tmlPoints["EquipData"][0]["Equipment Type"]
        : "";
      this.siteName = valid ? tmlPoints["EquipData"][0]["Site Name"] : "";
      this.tmlReadings = TmlReading.toTmlReading(
        JSON.stringify(tmlPoints["TMLPoints"])
      );
      this.newTMLs = JSON.stringify(tmlPoints["NewTMLs"]);
      this.tmlConfig = tmlPoints["tmlConfig"]
        ? JSON.stringify(tmlPoints["tmlConfig"])
        : "";
      this.isTMLGPSenabled = tmlPoints["isTMLGPSenabled"]
        ? JSON.parse(tmlPoints["isTMLGPSenabled"])
        : false;
    } catch (e) {
      console.log(e);
    }
  }

}