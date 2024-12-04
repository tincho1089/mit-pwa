import { ComponentFixture, inject, TestBed } from '@angular/core/testing';

import { TransmitterCalibrateTwoPointComponent } from './transmitter-calibrate-two-point.component';
import { InspectionResponse } from 'src/app/core/sync/entities';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppDB, db } from 'src/databases/db';
import { BaseInspection } from '../../../classes/base-inspection';

@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
    transform(value: string): string {
        return value;
    }
}

describe('TransmitterCalibrateTwoPointComponent', () => {
  let component: TransmitterCalibrateTwoPointComponent;
  let fixture: ComponentFixture<TransmitterCalibrateTwoPointComponent>;
  let mockEquipments:any = [
    {
      "isChanged": "N",
      "fieldName": "Set Point",
      "currVal": "0",
      "updatedVal": "0",
      "fieldType": "Not Editable",
      "jsonValue": "{\"FieldName\":\"Set Point\",\"DisplayName\":\"Set Point\",\"Type\":\"Not Editable\",\"NewValue\":\"0\"}",
      "id": "b4a9d6ef-f19b-44b8-bb84-d166a5b56f91",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Set Point Unit",
      "currVal": "in",
      "updatedVal": "in",
      "fieldType": "Not Editable",
      "jsonValue": "{\"FieldName\":\"Set Point Unit\",\"DisplayName\":\"Set Point Unit\",\"Type\":\"Not Editable\",\"NewValue\":\"in\"}",
      "id": "7ea78691-dd17-4c50-a000-900e777f0e68",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Design Opening Time",
      "currVal": null,
      "updatedVal": "10",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Design Opening Time\",\"DisplayName\":\"Design Opening Time\",\"Type\":\"Number\",\"Value\":null,\"NewValue\":\"10\"}",
      "id": "dcab2cf9-2036-48ea-bd03-78ff488abddf",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Design Closing Time",
      "currVal": null,
      "updatedVal": "20",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Design Closing Time\",\"DisplayName\":\"Design Closing Time\",\"Type\":\"Number\",\"Value\":null,\"NewValue\":\"20\"}",
      "id": "444385e9-21eb-480e-9018-a01c84e67c24",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Signal Unit",
      "updatedVal": "mA",
      "fieldType": "Text",
      "jsonValue": "{\"FieldName\":\"Signal Unit\",\"DisplayName\":\"Signal Unit\",\"Type\":\"Text\",\"NewValue\":\"mA\"}",
      "id": "aad8ec66-c469-4103-97de-ccbdcb96db8e",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Min Span",
      "currVal": "-5",
      "updatedVal": "11",
      "fieldType": "Number",
      "units": "LRV",
      "jsonValue": "{\"FieldName\":\"Min Span\",\"DisplayName\":\"Min Span\",\"Unit\":\"LRV\",\"Type\":\"Number\",\"Value\":\"-5\",\"NewValue\":\"11\"}",
      "id": "d0d10a8a-5342-435a-b00a-d31c1b9ca0c9",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Max Span",
      "currVal": "20",
      "updatedVal": "99",
      "fieldType": "Number",
      "units": "URV",
      "jsonValue": "{\"FieldName\":\"Max Span\",\"DisplayName\":\"Max Span\",\"Unit\":\"URV\",\"Type\":\"Number\",\"Value\":\"20\",\"NewValue\":\"99\"}",
      "id": "0b6fd2b0-b5fb-4d40-ae18-cd24e0068ac9",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Span Unit",
      "currVal": null,
      "updatedVal": "mA",
      "fieldType": "Text",
      "jsonValue": "{\"FieldName\":\"Span Unit\",\"DisplayName\":\"Span Unit\",\"Type\":\"Text\",\"Value\":null,\"NewValue\":\"mA\"}",
      "id": "83832676-972a-464d-90c3-6130baee105d",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Span Unit",
      "updatedVal": "",
      "fieldType": "Text",
      "jsonValue": "{\"FieldName\":\"Span Unit\",\"DisplayName\":\"Span Unit\",\"Type\":\"Text\",\"NewValue\":\"\"}",
      "id": "5a14d09f-28d0-4dd0-b9e5-59d2d842e7ff",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Eng Max",
      "currVal": null,
      "updatedVal": "20",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Eng Max\",\"DisplayName\":\"Eng Max\",\"Type\":\"Number\",\"Value\":null,\"NewValue\":\"20\"}",
      "id": "d4fca0e2-163e-47d8-baa8-c5f67c0cd9ea",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Eng Min",
      "currVal": null,
      "updatedVal": "10",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Eng Min\",\"DisplayName\":\"Eng Min\",\"Type\":\"Number\",\"Value\":null,\"NewValue\":\"10\"}",
      "id": "242ba120-1216-4691-b726-b609dbdb8324",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Eng Unit",
      "currVal": null,
      "updatedVal": "30",
      "fieldType": "Text",
      "jsonValue": "{\"FieldName\":\"Eng Unit\",\"DisplayName\":\"Eng Unit\",\"Type\":\"Text\",\"Value\":null,\"NewValue\":\"30\"}",
      "id": "c9c0342f-5f34-4ae6-9468-ee8290d9cb99",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "L Set Point",
      "currVal": "40",
      "updatedVal": "40",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"L Set Point\",\"DisplayName\":\"L Set Point\",\"Type\":\"Number\",\"Value\":null,\"NewValue\":\"40\"}",
      "id": "980ff541-4297-45b0-a12e-5419ff9989f3",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "LL Set Point",
      "currVal": "50",
      "updatedVal": "50",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"LL Set Point\",\"DisplayName\":\"LL Set Point\",\"Type\":\"Number\",\"Value\":null,\"NewValue\":\"50\"}",
      "id": "b70b811d-b388-4f63-8a72-5f6279347436",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "LLL Set Point",
      "currVal": "60",
      "updatedVal": "60",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"LLL Set Point\",\"DisplayName\":\"LLL Set Point\",\"Type\":\"Number\",\"Value\":null,\"NewValue\":\"60\"}",
      "id": "deb23092-fd49-43cf-afcc-f024711a8464",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "H Set Point",
      "currVal": "70",
      "updatedVal": "70",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"H Set Point\",\"DisplayName\":\"H Set Point\",\"Type\":\"Number\",\"Value\":null,\"NewValue\":\"70\"}",
      "id": "c000d732-8d26-4c47-b4e2-7953a5eaac12",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "HH Set Point",
      "currVal": "80",
      "updatedVal": "80",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"HH Set Point\",\"DisplayName\":\"HH Set Point\",\"Type\":\"Number\",\"Value\":null,\"NewValue\":\"80\"}",
      "id": "db423d80-e7b9-48c6-9036-c02caf581142",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "HHH Set Point",
      "currVal": "90",
      "updatedVal": "90",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"HHH Set Point\",\"DisplayName\":\"HHH Set Point\",\"Type\":\"Number\",\"Value\":null,\"NewValue\":\"90\"}",
      "id": "2585ad2a-e299-417f-839b-141474d70368",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Cal TP1",
      "currVal": "20",
      "updatedVal": "22",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Cal TP1\",\"DisplayName\":\"Cal TP1\",\"Type\":\"Number\",\"Value\":\"20\",\"NewValue\":\"22\"}",
      "id": "42e77f78-8dfc-472c-a593-d8cd3619f29f",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Cal TP2",
      "currVal": "21",
      "updatedVal": "33",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Cal TP2\",\"DisplayName\":\"Cal TP2\",\"Type\":\"Number\",\"Value\":\"21\",\"NewValue\":\"33\"}",
      "id": "bb26a81c-c83e-4ded-982b-9dfeacc1d44b",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Cal TP3",
      "currVal": "22",
      "updatedVal": "44",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Cal TP3\",\"DisplayName\":\"Cal TP3\",\"Type\":\"Number\",\"Value\":\"22\",\"NewValue\":\"44\"}",
      "id": "6d4d7376-210d-4f02-a818-0d0a7d7f950e",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Cal TP4",
      "currVal": "23",
      "updatedVal": "55",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Cal TP4\",\"DisplayName\":\"Cal TP4\",\"Type\":\"Number\",\"Value\":\"23\",\"NewValue\":\"55\"}",
      "id": "3b65b81a-2558-46af-8a0f-0dbeca3f1b9b",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Cal TP5",
      "currVal": "24",
      "updatedVal": "66",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Cal TP5\",\"DisplayName\":\"Cal TP5\",\"Type\":\"Number\",\"Value\":\"24\",\"NewValue\":\"66\"}",
      "id": "7e0a445d-7c53-4c91-8754-fb21a5084e5a",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Fail Direction",
      "updatedVal": "",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Fail Direction\",\"DisplayName\":\"Fail Direction\",\"Type\":\"Number\",\"NewValue\":\"\"}",
      "id": "8e6140f6-c419-498e-be96-d6846c45511b",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Accuracy",
      "updatedVal": "0.4",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Accuracy\",\"DisplayName\":\"Accuracy\",\"Type\":\"Number\",\"NewValue\":\"0.4\"}",
      "id": "71c15c86-6c91-444b-9f53-df8ecf3ed181",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Signal Min",
      "updatedVal": "1",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Signal Min\",\"DisplayName\":\"Signal Min\",\"Type\":\"Number\",\"NewValue\":\"1\"}",
      "id": "f505f5a3-8e1c-44f0-8c91-85df90aee72e",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Signal Max",
      "updatedVal": "5",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Signal Max\",\"DisplayName\":\"Signal Max\",\"Type\":\"Number\",\"NewValue\":\"5\"}",
      "id": "dc5a846e-00f4-4312-aebd-b7c92d880c17",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Valve Size",
      "currVal": null,
      "updatedVal": "23",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Valve Size\",\"DisplayName\":\"Valve Size\",\"Type\":\"Number\",\"Value\":null,\"NewValue\":\"23\"}",
      "id": "948e44c7-cf16-42d9-b118-9814d6a9d0d4",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Minimum Response Time",
      "updatedVal": "10",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Minimum Response Time\",\"DisplayName\":\"Minimum Response Time\",\"Type\":\"Number\",\"NewValue\":\"10\"}",
      "id": "69233997-0420-4461-a7eb-2cb8080fd0b3",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Maximum Response Time",
      "updatedVal": "20",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Maximum Response Time\",\"DisplayName\":\"Maximum Response Time\",\"Type\":\"Number\",\"NewValue\":\"20\"}",
      "id": "e07b29d4-30bd-459d-a490-b13e4c1bdb08",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Rack",
      "currVal": "100",
      "updatedVal": "200",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Rack\",\"DisplayName\":\"Rack\",\"Type\":\"Number\",\"Value\":\"100\",\"NewValue\":\"200\"}",
      "id": "84b0d94b-e101-4d15-b985-d0e81c8d3cfb",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Channel",
      "currVal": "1000",
      "updatedVal": "2000",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Channel\",\"DisplayName\":\"Channel\",\"Type\":\"Number\",\"Value\":\"1000\",\"NewValue\":\"2000\"}",
      "id": "b4f95f52-5f0a-4c77-8c61-9c059aaf6f65",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Slot",
      "currVal": "10000",
      "updatedVal": "20000",
      "fieldType": "Number",
      "jsonValue": "{\"FieldName\":\"Slot\",\"DisplayName\":\"Slot\",\"Type\":\"Number\",\"Value\":\"10000\",\"NewValue\":\"20000\"}",
      "id": "1576fe84-3692-49b3-b3bd-f6974d289f94",
      "inspectionId": 577161
    },
    {
      "isChanged": "N",
      "fieldName": "Address",
      "updatedVal": "Slot",
      "fieldType": "Text",
      "jsonValue": "{\"FieldName\":\"Address\",\"DisplayName\":\"Address\",\"Type\":\"Text\",\"NewValue\":\"Slot\"}",
      "id": "e91e4ba5-b3b3-4129-a776-f4deefcee718",
      "inspectionId": 577161
    }
  ];

  let mockIndexedDB:AppDB;
  let baseInspection:BaseInspection;

  const mockForm = jasmine.createSpyObj('Form',['get']);
  const mockFormGroup = jasmine.createSpyObj('FormGroup',['get']);
  //const mockDB = jasmine.createSpyObj('AppDB',['getEquipmentDetailsByWorkOrder']);
  //const mockBaseInspection = jasmine.createSpyObj('BaseInspection',['getEquipDetails']);

  


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        BrowserAnimationsModule
      ],
      declarations: [TransmitterCalibrateTwoPointComponent,MockTranslatePipe],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });
   
  });



  beforeEach(inject([FormBuilder], async (fb: FormBuilder ) => {
    fixture = TestBed.createComponent(TransmitterCalibrateTwoPointComponent);
    component = fixture.componentInstance;
    TestBed.inject(FormBuilder);
    let mockResponse  = new InspectionResponse();

    //mockDB.workOrderList.get.and.returnValue(Promise.resolve(mockEquipments));
    component.section='Main'
    mockResponse.questionId = 'question1';
    mockResponse.inspectionId = 1;
    component.rows = [0, 1];
    
    mockResponse.answer = '{"details":{"Accuracy":2,"AsFound":[{"Test Input":11,"Eng Unit":"10.00","Target Output":"4.00","Actual Output":"4","Error":"0.00"},{"Test Input":44,"Eng Unit":"13.75","Target Output":"10.00","Actual Output":"10","Error":"0.00"},{"Test Input":99,"Eng Unit":"20.00","Target Output":"20.00","Actual Output":"20","Error":"0.00"}],"AsLeft":[{"Test Input":11,"Eng Unit":"10.00","Target Output":"4.00","Actual Output":"","Error":""},{"Test Input":44,"Eng Unit":"13.75","Target Output":"10.00","Actual Output":"","Error":""},{"Test Input":99,"Eng Unit":"20.00","Target Output":"20.00","Actual Output":"","Error":""}]},"passFail":{"AsFPassFail":"Pass","AsLPassFail":"","FailureCode":""}}'
    component.form = new FormGroup({ 
      'Main' : new FormGroup({
          'question1': await TransmitterCalibrateTwoPointComponent.create(mockResponse,mockEquipments)
      })
  });
    component.response = mockResponse
    spyOn(component as any,'getEquipDetails').and.callThrough();
    

    //mockDB.getEquipmentDetailsByWorkOrder.and.callThrough();
    fixture.detectChanges();

  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call DB when equipment details empty', () => {

    //component.equipDetails = null

    //const mockDB2 = jasmine.createSpy('getEquipmentDetailsByWorkOrder').and.returnValue(Promise.resolve(mockEquipments));;
    //const getEquipDetailsSpy = spyOn(component as any,'getEquipDetails').and.callThrough();
    //mockDB.getEquipmentDetailsByWorkOrder.and.callThrough(async () => {return mockEquipments});

    expect(component.getEquipDetails).toHaveBeenCalled();
    //expect(mockDB.getEquipmentDetailsByWorkOrder).toHaveBeenCalled()

  });
});
