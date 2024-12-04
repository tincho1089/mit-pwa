import { ComponentFixture, inject, TestBed } from '@angular/core/testing';

import { AsLeftAsFoundComponent } from './as-left-as-found.component';
import { InspectionResponse, WorkOrderList } from 'src/app/core/sync/entities';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { db } from 'src/databases/db';
import { QUESTIONTYPES } from 'src/app/core/enums/question-types.enum';

describe('AsLeftAsFoundComponent', () => {
  let component: AsLeftAsFoundComponent;
  let fixture: ComponentFixture<AsLeftAsFoundComponent>;
  const mockForm = jasmine.createSpyObj('Form',['get','setValue','_updateTreeValidity','_registerOnCollectionChange','addFormGroup','_setUpFormContainer']);
  const mockFormGroup = jasmine.createSpyObj('FormGroup',['get','controls','addFormGroup','setUpFormContainer','subscribe']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule
      ],
      declarations: [AsLeftAsFoundComponent],
      errorOnUnknownElements: false, // enable it as required
      errorOnUnknownProperties: false // enable it as required

    });
   
  });

  beforeEach(inject([FormBuilder], (fb: FormBuilder) => {
    fixture = TestBed.createComponent(AsLeftAsFoundComponent);
    component = fixture.componentInstance;
    spyOn(component,'setControl').and.callFake(()=>{});
    spyOn(component,'isDisabled').and.returnValue(false);
    spyOn(component,'getEquipDetails').and.callFake(async ()=>{});
    let mockResponse  = new InspectionResponse();
    component.section='Main'
    mockResponse.questionId = 'question1';
    mockResponse.answer='1111|2222'
    mockResponse.itemType = QUESTIONTYPES.ASLEFTASFOUND
    component.response = mockResponse
    component.form = new FormGroup({ 
        'Main' : new FormGroup({
            'question1': new FormControl(mockResponse.answer)
        })
    });
    component.formGroup=new FormGroup({});
    fixture.detectChanges();

  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
