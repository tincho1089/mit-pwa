import { Component, Input } from '@angular/core';
import { FormArray, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import * as dayjs from 'dayjs'
import { Subscription } from 'rxjs';
import { VisionsTML } from 'src/app/core/sync/entities';
import { TmlReading } from 'src/app/core/sync/models/tmlReading.model';
import { TmlDetailModalComponent } from '../tml-detail-modal/tml-detail-modal.component';

const ITEMS = [
  { displayName: "Datapoint ID", property: "Data Point ID" },
  { displayName: "Group Name", property: "Group Name" },
  { displayName: 'Drawing:', property: 'ISO Drawing Number' },
  { displayName: "TML Type", property: "TML Type" },
  { displayName: "Remaining Life Calculator", property: "Remaining Life Calculator" },
  { displayName: "Last Measurement Date", property: "Last Measurement Date" },
  { displayName: "Last Measurement Value", property: "Last Measurement Value" },
  { displayName: "Next Inspection Date", property: "Next Inspection Date" },
];

@Component({
  selector: 'app-tml-detail-meridium',
  templateUrl: './tml-detail-meridium.component.html',
  styleUrls: ['./tml-detail-meridium.component.scss']
})
export class TmlDetailMeridiumComponent implements TmlDetailMeridiumComponent {

  @Input() tmlDetails: VisionsTML = new VisionsTML();
  readings: Array<TmlReading>;
  items = ITEMS;
  tmlDetailsForm: FormGroup;

  private subscription = new Subscription();

  constructor(private dialog: MatDialog) { }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
    this.tmlDetails = null;
    this.readings = null;
    this.items = null;
    this.tmlDetailsForm = null;
  }

  ngOnInit() {

    this.readings = this.tmlDetails.tmlReadings
    .map(vision => {
      const lastDate = dayjs(vision["Last Measurement Date"]);
      vision["Last Measurement Date"] = lastDate.isValid() ? lastDate.format('YYYY-MM-DD') : '';
      const nextDate = dayjs(vision["Next Inspection Date"]);
      vision["Next Inspection Date"] = nextDate.isValid() ? nextDate.format('YYYY-MM-DD') : '';
      return vision;
    });

    this.tmlDetailsForm = new FormGroup({
      tmlReadings: new FormArray(
        this.tmlDetails.tmlReadings.map((tmlReading: TmlReading) => this.createFormGroup(tmlReading))
      )
    });

    this.subscription.add(
      (this.tmlDetailsForm.get("tmlReadings") as FormArray).controls.forEach(
        (control: FormGroup) => {
          control.valueChanges.subscribe(values => this.onValueChanges(control, values));
        }
      )
    );
    
  }

  private createFormGroup(tmlReading: TmlReading): FormGroup {
    let ListReadings: FormArray = null;
    try {
      const columns = 1;
      ListReadings = new FormArray(new Array(Number(columns)).fill("").map((column, index) => {
        let value: string;
        try {
          value = tmlReading.ListReadings[index]
        }
        catch{
          value = null
        }
        return new FormControl(value);
      }), [this.validateThickAlert.bind(this, tmlReading)]);
      ListReadings.valueChanges.subscribe(values => this.onReadingsChange(values, tmlReading));
      this.onReadingsChange(ListReadings.value, tmlReading);
    }
    catch{ }
    let corrosionRate: number | string = tmlReading.corrosionRate;
    try {
      corrosionRate = parseFloat(tmlReading["Short Term Corrosion Rate"])
    }
    catch{ }

    return new FormGroup({
      "Data Point ID": new FormControl(tmlReading["Data Point ID"]),
      ListReadings,
      corrosionRate: new FormControl(corrosionRate),
      comments: new FormControl(tmlReading.comments === "null" ? null : tmlReading.comments)
    });
  }

  private onValueChanges(control: FormGroup, values: any) {
    let findIndex = 0;
    const reading: TmlReading = this.tmlDetails.tmlReadings.find(
      (reading, index) => {
        if (reading["Data Point ID"] == control.get("Data Point ID").value) {
          reading["ListReadings"] = values["ListReadings"];
          reading["NewThick"] = reading["ListReadings"].join(";");
          reading.comments = values["comments"];
          reading.createdDate = dayjs().format("YYYY-MM-DDTHH:mm:ss");
          reading.createdBy = localStorage.getItem("Email");
          findIndex = index;
          return true;
        }
        return false;
      }
    );
    const readingControl = this.tmlDetailsForm.get("tmlReadings." + findIndex + ".corrosionRate");
    const corrosionValue = TmlReading.getCorrosionRate(reading);
    readingControl.setValue(corrosionValue, {
      onlySelf: true,
      emitEvent: false
    });
    reading["Short Term Corrosion Rate"] = corrosionValue;
  }

  showTML(tmlReading: TmlReading) {
    tmlReading.showTML = !tmlReading.showTML;
  }

    // TO View TML
    seeDetail(reading: TmlReading) {
      this.dialog.open(TmlDetailModalComponent, {
        width: '750px',
        panelClass: 'custom-dialog',
        data : {
          Id: reading["Data Point ID"],
          data : reading,
          tableStructure : [
          { displayName: 'Data Point ID:', property: 'Data Point ID' },
          { displayName: 'Group Name:', property: 'Group Name' },
          { displayName: 'Drawing:', property: 'ISO Drawing Number' },
          { displayName: 'Group ID:', property: 'Group ID' },
          { displayName: 'TML Type:', property: 'TML Type' },
          { displayName: 'Component Type:', property: 'Component Type' },
          { displayName: 'Remaining Life Calculator:', property: 'Remaining Life Calculator' },
          { displayName: 'Nominal Thickness:', property: 'Nominal Thickness' },
          { displayName: 'Last Measurement Date:', property: 'Last Measurement Date' },
          { displayName: 'Last Measurement Value:', property: 'Last Measurement Value' },
          { displayName: 'Base Measurement Date:', property: 'Base Measurement Date' },
          { displayName: 'Base Measurement Value:', property: 'Base Measurement Value' },
          { displayName: 'Corrosion Rate:', property: 'Corrosion Rate' },
          { displayName: 'Short Term Corrosion Rate:', property: 'Short Term Corrosion Rate' },
          { displayName: 'Long Term Corrosion Rate:', property: 'Long Term Corrosion Rate' },
          { displayName: 'Long Term Loss:', property: 'Long Term Loss' },
          { displayName: 'Access:', property: 'Access' },
          { displayName: 'Min Alert Thickness:', property: 'Min Alert Thickness' },
          { displayName: 'Projected Min Date:', property: 'Projected Min Date' },
          { displayName: 'Design Pressure:', property: 'Design Pressure' },
          { displayName: 'Design Temperature:', property: 'Design Temperature' },
          { displayName: 'Material Specification:', property: 'Material Specification' },
          { displayName: 'Outside Diameter:', property: 'Outside Diameter' },
          { displayName: 'Next Inspection Date:', property: 'Next Inspection Date' }
          ]
        }
      })
    }

  private onReadingsChange(values: Array<any>, tmlReading: TmlReading): void {
    const numbers: Array<number> = values.filter(e => (parseFloat(e) == e)).map(e => {
      return Number(e);
    });
    tmlReading.isValid = numbers.length > 0;
    tmlReading.minValue = (numbers.length === 0) ? null : Math.min.apply(null, numbers);
    tmlReading['minIndex'] = [];
    values.forEach((item, index) => {
      if (tmlReading.minValue && parseFloat(item) === parseFloat(tmlReading.minValue.toString()))
        tmlReading['minIndex'].push(index);
    });
  }

  private validateThickAlert(tmlReading: TmlReading, control: FormArray): ValidationErrors {
    const values: Array<any> = control.value;
    const numbers: Array<number> = values.filter(e => (parseFloat(e) == e)).map(e => {
      return Number(e);
    });
    const someMin = numbers.some(e => (
      e < parseFloat(tmlReading["Remaining Life Calculator"].toString())
    ))
    return (someMin) ? { "thick-alert": true } : null;
  }

  numberOnlyValidation(event: any) {
    const pattern = /[0-9.]/;
    let inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      // invalid character, prevent input
      event.preventDefault();
    }
  }

}
