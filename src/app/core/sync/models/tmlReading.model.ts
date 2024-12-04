import * as dayjs from 'dayjs'
import { MIUtilities } from 'src/app/shared/utility';

export class TmlReading {
  ["Active"]: boolean;
  ["Activity Code"]: string;
  ["Circuit ID"]: string;
  ["Column Count"]: number;
  ["Confined Space"]: boolean;
  ["Corr Allow"]: number;
  ["Critical Thick"]: number;
  ["Equipment Number"]: string;
  ["Equipment Type"]: string;
  ["Expiration Date"]: string;
  ["Insulation Removal"]: boolean;
  ["Ladder Required"]: boolean;
  ["Last Notes Text"]: string;
  ["Last Read Avg Thick"]: number;
  ["Last Read Min Thick"]: number;
  ["Last Reading Date"]: Date;
  ["ListReadings"]: Array<string>;
  ["Location"]: any;
  ["Manlift"]: boolean;
  ["Min Long Loss"]: number;
  ["Min Short Loss"]: number;
  ["Min Thick"]: number;
  ["NewThick"]: string;
  ["Next Insp Date Calculated"]: string;
  ["Next Insp Date Due"]: string;
  ["Nominal"]: any;
  ["Other Access"]: string;
  ["Plant ID"]: string;
  ["ReadingsCSV"]: string;
  ["Row Count"]: number;
  ["Scaffold Required"]: boolean;
  ["Section ID"]: string;
  ["TML Classification"]: string;
  ["TML Description"]: string;
  ["TML ID"]: string;
  ["TML Type"]: string;
  ["Coordinate X"]: string;
  ["Coordinate Y"]: string;
  ["rfLocGUID.X_EndOrig"]: string;
  ["rfLocGUID.Y_EndOrig"]: string;
  ["rfLocGUID.Z_EndOrig"]: string;
  ["FacilityUnitCode"]: string;
  ["DatapointID"]: string;
  ["IsCorrodedArea"]: string;
  ["JointFactor"]: string;
  ["MinimumThickness"]: string;
  ["MinimumThicknessType"]: string;
  ["PipingNominalDiameterDN"]: string;
  ["NominalThickness"]: string;
  ["MinimumYieldStrength"]: string;
  ["PipingFormula"]: string;
  ["NumberofReadings"]: string;
  ["TemperatureFactor"]: string;
  ["TMLSchedule"]: string;
  ["InitialInspectionDueDate"]: string;
  ["SourceDataElementName"]: string;
  ["SourceDataElementValue"]: string;
  ["SourceSystem"]: string;
  ["FacilityName"]: string;
  ["FacilityCode"]: string;
  ["TMLStatusUpdateDate"]: string;
  ["InsulatedFlag"]: string;
  ["DesignFactor"]: string;
  ["ComponentType"]: string;
  ["CodeYearStressLookup"]: string;
  ["CodeYearTMinFormula"]: string;
  ["AnalysisRequired"]: string;
  ["AdditionalThickness"]: string;
  ["StructuralMinimumThickness"]: string;
  ["MinimumRequiredThickness"]: string;
  ["RBMIComponent"]: string;
  ["MinimumAlertThickness"]: string;
  ["PreviousThickness"]: string;
  ["LineClassStandard"]: string;
  ["LineClassification"]: string;
  ["DateLoaded"]: string;
  ["CommentsLong"]: string;
  ["ISODrawingNumber"]: string;
  ["ExcludeFromAnalysis"]: string;
  ["DatapointStatus"]: string;
  ["DatapointAccess"]: string;
  ["TMLAnalysisType"]: string;
  ["TMLGroupID"]: string;
  ["Measure TML"]: string;
  ["MeasureTML"]: boolean;
  ["Last Measurement Date"]: string;
  ["Next Inspection Date"]: string;
  ["CVXReadingDate"]: string;
  ["FollowUpRequired"]: boolean;
  corrosionRate: string;
  showTML: boolean = false;
  isValid: boolean = false;
  createdDate: string;
  createdBy: string;
  comments: string;
  minValue: number;

  constructor() {
    this["Active"] = null;
    this["Activity Code"] = null;
    this["Circuit ID"] = null;
    this["Column Count"] = null;
    this["Confined Space"] = null;
    this["Coordinate X"] = null;
    this["Coordinate Y"] = null;
    this["Coordinate Z"] = null;
    this["Corr Allow"] = null;
    this["Critical Thick"] = null;
    this["Equipment Number"] = null;
    this["Equipment Type"] = null;
    this["Expiration Date"] = null;
    this["Insulation Removal"] = null;
    this["Ladder Required"] = null;
    this["Last Notes Text"] = null;
    this["Last Read Avg Thick"] = null;
    this["Last Read Min Thick"] = null;
    this["Last Reading Date"] = null;
    this["ListReadings"] = null;
    this["Location"] = null;
    this["Manlift"] = null;
    this["Min Long Loss"] = null;
    this["Min Short Loss"] = null;
    this["Min Thick"] = null;
    this["NewThick"] = null;
    this["Next Insp Date Calculated"] = null;
    this["Next Insp Date Due"] = null;
    this["Nominal"] = null;
    this["Other Access"] = null;
    this["Plant ID"] = null;
    this["ReadingsCSV"] = null;
    this["Row Count"] = null;
    this["Scaffold Required"] = null;
    this["Section ID"] = null;
    this["TML Classification"] = null;
    this["TML Description"] = null;
    this["TML ID"] = null;
    this["TML Type"] = null;
    this["rfLocGUID.X_EndOrig"] = null;
    this["rfLocGUID.Y_EndOrig"] = null;
    this["rfLocGUID.Z_EndOrig"] = null;
    this["FacilityUnitCode"] = null;
    this["DatapointID"] = null;
    this["IsCorrodedArea"] = null;
    this["JointFactor"] = null;
    this["MinimumThickness"] = null;
    this["MinimumThicknessType"] = null;
    this["PipingNominalDiameterDN"] = null;
    this["NominalThickness"] = null;
    this["MinimumYieldStrength"] = null;
    this["PipingFormula"] = null;
    this["NumberofReadings"] = null;
    this["TemperatureFactor"] = null;
    this["TMLSchedule"] = null;
    this["InitialInspectionDueDate"] = null;
    this["SourceDataElementName"] = null;
    this["SourceDataElementValue"] = null;
    this["SourceSystem"] = null;
    this["FacilityName"] = null;
    this["FacilityCode"] = null;
    this["TMLStatusUpdateDate"] = null;
    this["InsulatedFlag"] = null;
    this["DesignFactor"] = null;
    this["ComponentType"] = null;
    this["CodeYearStressLookup"] = null;
    this["CodeYearTMinFormula"] = null;
    this["AnalysisRequired"] = null;
    this["AdditionalThickness"] = null;
    this["StructuralMinimumThickness"] = null;
    this["MinimumRequiredThickness"] = null;
    this["RBMIComponent"] = null;
    this["MinimumAlertThickness"] = null;
    this["PreviousThickness"] = null;
    this["LineClassStandard"] = null;
    this["LineClassification"] = null;
    this["DateLoaded"] = null;
    this["CommentsLong"] = null;
    this["ISODrawingNumber"] = null;
    this["ExcludeFromAnalysis"] = null;
    this["DatapointStatus"] = null;
    this["DatapointAccess"] = null;
    this["TMLAnalysisType"] = null;
    this["TMLGroupID"] = null;
    this["CVXReadingDate"] = null;
    this["Measure TML"] = "true";
    this.corrosionRate = null;
    this.comments = null;
    this["FollowUpRequired"] = false;
  }

  static toTmlString(tmlPoint: Array<TmlReading>): string {
    tmlPoint.forEach(tml => {
      Object.keys(tml).forEach(property => {
        try {
          if (typeof tml[property] !== "string" && typeof tml[property] !== "boolean") {
            tml[property] = tml[property] !== null
              ? Array.isArray(tml[property])
                ? tml[property]
                : tml[property].toString()
              : "null";
          }
        } catch (e) {
          console.log(tml[property]);
        }
      });
    });
    return JSON.stringify(tmlPoint);
  }

  static toTmlReading(tmlString: string): Array<TmlReading> {
    const parseProperties = [
      "Active",
      "Column Count",
      "Confined Space",
      "Corr Allow",
      "Critical Thick",
      "Insulation Removal",
      "Ladder Required",
      "Last Read Avg Thick",
      "Last Read Min Thick",
      "Manlift",
      "Min Long Loss",
      "Min Short Loss",
      "Min Thick",
      "ReadingsCSV",
      "Row Count",
      "Scaffold Required",
      "showTML",
      "isValid",
      "comments",
      "CVXReadingDate"
    ];
    let tmlReading = JSON.parse(tmlString);
    if (!MIUtilities.isNullOrUndefinedObject(tmlReading)) {
      tmlReading.forEach(tml => {
        Object.keys(tml).forEach(tmlKey => {
          try {
            if (
              (parseProperties.indexOf(tmlKey) >= 0 && tml[tmlKey]) ||
              tml[tmlKey] === "null"
            ) {
              if (tml[tmlKey] === "True" || tml[tmlKey] === "False") {
                tml[tmlKey] = JSON.parse(tml[tmlKey].toLowerCase());
              } else if (!MIUtilities.isNullOrUndefined(tml[tmlKey])) {
                if (["ReadingsCSV", "NewThick"].indexOf(tmlKey) > 0)
                  tml[tmlKey] = JSON.parse(tml[tmlKey]);
              }
            }
          } catch (e) {
            console.log("toTmlReading>>Exception>>tml[tmlKey]>>>" + tml[tmlKey]);
            console.log("toTmlReading>>Exception>>" + e);
          }
        });
        tml["corrosionRate"] = this.getCorrosionRate(tml);
      });
    }
    return tmlReading;
  }

  static getCorrosionRate(tml: TmlReading) {
    try {
      let lastDate = "Last Reading Date";
      let lastValue = "Last Read Min Thick";
      if (!MIUtilities.isNullOrUndefined(tml['Data Point ID'])) {
        lastDate = "Last Measurement Date"
        lastValue = "Last Measurement Value";
      }
      const lastReadingDate = MIUtilities.isNullOrUndefined(
        tml[lastDate]
      )
        ? dayjs()
        : dayjs(tml[lastDate]);

      const difference = dayjs().diff(lastReadingDate, "days", true);
      let lastThick = tml[lastValue];
      let thisThick = Number(tml.minValue);
      if (isNaN(lastThick) || lastThick == Infinity) lastThick = 0;
      if (isNaN(thisThick) || thisThick == Infinity) thisThick = 0;
      const corrosionRate = difference == 0 ? 0 : (lastThick - thisThick) / (difference / 365);
      return corrosionRate.toFixed(3);
    } catch {
      return 0;
    }
  }
}
