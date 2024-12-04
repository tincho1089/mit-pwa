import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextWithUnitDropdownComponent } from './text-with-unit-dropdown.component';
import { InspectionResponse } from 'src/app/core/sync/entities';
import { QUESTIONTYPES } from 'src/app/core/enums/question-types.enum';
import { FormControl, FormGroup } from '@angular/forms';

describe('TextWithUnitDropdownComponent', () => {
  let component: TextWithUnitDropdownComponent;
  let fixture: ComponentFixture<TextWithUnitDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextWithUnitDropdownComponent ],
      errorOnUnknownElements: false, // enable it as required
      errorOnUnknownProperties: false // enable it as required
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextWithUnitDropdownComponent);
    component = fixture.componentInstance;
    spyOn(component,'setControl').and.callFake(()=>{});
    spyOn(component,'getEquipDetails').and.callFake(async ()=>{});
    let mockResponse  = new InspectionResponse();
    component.section='Main'
    mockResponse.questionId = 'question1';
    mockResponse.answer='1111|lb'
    mockResponse.itemType = QUESTIONTYPES.TEXT_WITH_UNIT_DROPDOWN
    component.response = mockResponse
    component.form = new FormGroup({ 
        'Main' : new FormGroup({
            'question1': new FormControl(mockResponse.answer)
        })
    });
    component.formGroup=new FormGroup({});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
