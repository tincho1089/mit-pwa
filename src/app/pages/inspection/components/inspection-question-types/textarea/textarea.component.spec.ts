import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextAreaComponent } from './textarea.component';
import { InspectionResponse } from 'src/app/core/sync/entities';

describe('TextareaComponent', () => {
  let component: TextAreaComponent;
  let fixture: ComponentFixture<TextAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextAreaComponent ],
      errorOnUnknownElements: false, // enable it as required
      errorOnUnknownProperties: false // enable it as required
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextAreaComponent);
    component = fixture.componentInstance;
    let mockResponse  = new InspectionResponse();
    mockResponse.questionId = '1';
    component.response = mockResponse
    fixture.detectChanges();
  });

  it('should create', () => {
 
    expect(component).toBeTruthy();
  });
});
